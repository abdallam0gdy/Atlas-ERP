-- =================================================================================
-- 🪪 ATLAS ERP - PUBLIC ONLINE STUDENT CARD LOOKUP BY NATIONAL ID (SUPABASE PATCH)
-- =================================================================================
-- نفّذ هذا الملف مرة واحدة في: Supabase Dashboard -> SQL Editor -> New Query -> Run
--
-- ماذا يفعل هذا السكريبت؟
-- 1. يضيف أعمدة الباركود الكامل ونوع الاشتراك ولقطة جدول المجموعات في جدول online_students.
-- 2. ينشئ دالة عامة آمنة (SECURITY DEFINER) باسم lookup_student_by_national_id
--    تسمح لأي طالب بالاستعلام أونلاين بدون تسجيل دخول باستخدام الرقم القومي فقط (14 رقماً)،
--    مع إخفاء أرقام الهواتف والعنوان والملاحظات الداخلية تماماً لحماية الخصوصية.
-- 3. يحدّث دالة المزامنة admin_sync_and_clean_students لحفظ الباركود الكامل بجانب الكود.
-- 4. ينشئ دالة admin_upsert_student_cards لنشر وتحديث كارنيهات وجداول كل طلاب السنتر
--    (بمن فيهم الطلاب المضافون يدوياً داخل السنتر) أونلاين بضغطة زر.
-- =================================================================================

-- 1. التأكد من وجود الأعمدة المطلوبة في جدول online_students
ALTER TABLE public.online_students
  ADD COLUMN IF NOT EXISTS assigned_student_code INTEGER,
  ADD COLUMN IF NOT EXISTS assigned_barcode_id TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'PACKAGE',
  ADD COLUMN IF NOT EXISTS groups_snapshot JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS local_student_id UUID,
  ADD COLUMN IF NOT EXISTS synced_to_local_server BOOLEAN DEFAULT false;

-- فهرس سريع للبحث الفوري بالرقم القومي المنظف
CREATE INDEX IF NOT EXISTS idx_online_students_clean_national_id
  ON public.online_students ((regexp_replace(trim(national_id), '\D', '', 'g')))
  WHERE national_id IS NOT NULL AND length(trim(national_id)) >= 14;

-- =================================================================================
-- 2. الدالة العامة الآمنة للاستعلام عن كارنيه وبيانات الطالب بالرقم القومي (بدون تسجيل دخول)
-- =================================================================================
CREATE OR REPLACE FUNCTION public.lookup_student_by_national_id(p_national_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT;
  v_rec RECORD;
BEGIN
  IF p_national_id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'invalid_national_id');
  END IF;

  -- تحويل الأرقام العربية (٠-٩) إلى إنجليزية وتنظيف أي رموز أو مسافات
  v_clean := translate(trim(p_national_id), '٠١٢٣٤٥٦٧٨٩', '0123456789');
  v_clean := regexp_replace(v_clean, '\D', '', 'g');

  IF length(v_clean) <> 14 THEN
    RETURN jsonb_build_object('found', false, 'reason', 'invalid_national_id');
  END IF;

  -- اختيار أحدث وأكمل سجل مطابق للرقم القومي (مع أولوية السجل المكوّد والمنقول للسيستم)
  SELECT
    id,
    full_name,
    photo_url,
    academic_grade,
    education_type,
    enrollment_type,
    school_name,
    gender,
    birth_date,
    status,
    synced_to_local_server,
    assigned_student_code,
    assigned_barcode_id,
    groups_snapshot,
    created_at
  INTO v_rec
  FROM public.online_students
  WHERE regexp_replace(translate(trim(COALESCE(national_id, '')), '٠١٢٣٤٥٦٧٨٩', '0123456789'), '\D', '', 'g') = v_clean
  ORDER BY
    COALESCE(synced_to_local_server, false) DESC,
    (assigned_student_code IS NOT NULL) DESC,
    (status = 'approved') DESC,
    (photo_url IS NOT NULL AND photo_url <> '') DESC,
    created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'reason', 'not_found');
  END IF;

  -- إرجاع بيانات الكارنيه الآمنة فقط (بدون أرقام الهواتف أو العنوان أو الملاحظات الداخلية)
  RETURN jsonb_build_object(
    'found', true,
    'source', 'cloud',
    'student', jsonb_build_object(
      'full_name', v_rec.full_name,
      'photo_url', v_rec.photo_url,
      'academic_grade', v_rec.academic_grade,
      'education_type', COALESCE(v_rec.education_type, 'عام'),
      'enrollment_type', COALESCE(v_rec.enrollment_type, 'PACKAGE'),
      'school_name', v_rec.school_name,
      'gender', COALESCE(v_rec.gender, 'male'),
      'birth_date', v_rec.birth_date,
      'status', COALESCE(v_rec.status, 'pending'),
      'synced_to_local_server', COALESCE(v_rec.synced_to_local_server, false),
      'student_code', v_rec.assigned_student_code,
      'barcode_id', v_rec.assigned_barcode_id,
      'groups', COALESCE(v_rec.groups_snapshot, '[]'::jsonb),
      'registered_at', v_rec.created_at
    )
  );
END;
$$;

-- =================================================================================
-- 3. تحديث دالة المزامنة لحفظ الباركود الكامل + نوع الاشتراك مع الكود
-- =================================================================================
CREATE OR REPLACE FUNCTION public.admin_sync_and_clean_students(
  pin TEXT,
  p_synced JSONB DEFAULT '[]'::jsonb,
  p_delete_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
BEGIN
  IF pin IS DISTINCT FROM 'Abd#01224385098' THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  -- حذف النسخ المكررة أولاً
  IF p_delete_ids IS NOT NULL AND array_length(p_delete_ids, 1) > 0 THEN
    DELETE FROM public.online_students
    WHERE id = ANY(p_delete_ids);
  END IF;

  -- تحديث حالة الطلاب المنقولين للسيستم وتثبيت الكود والباركود أمامهم
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_synced, '[]'::jsonb))
  LOOP
    UPDATE public.online_students
    SET
      status = 'approved',
      synced_to_local_server = true,
      assigned_student_code = COALESCE((v_item->>'student_code')::INTEGER, assigned_student_code),
      assigned_barcode_id = COALESCE(NULLIF(v_item->>'barcode_id', ''), assigned_barcode_id),
      enrollment_type = COALESCE(NULLIF(v_item->>'enrollment_type', ''), enrollment_type),
      local_student_id = COALESCE(NULLIF(v_item->>'local_id', '')::UUID, local_student_id),
      updated_at = NOW()
    WHERE id = (v_item->>'id')::UUID;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- =================================================================================
-- 4. دالة نشر وتحديث كارنيهات طلاب السنتر المحلي أونلاين (تعمل للطلاب المضافين يدوياً وأونلاين)
-- =================================================================================
CREATE OR REPLACE FUNCTION public.admin_upsert_student_cards(
  pin TEXT,
  p_students JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_nid TEXT;
  v_existing_id UUID;
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  IF pin IS DISTINCT FROM 'Abd#01224385098' THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_students, '[]'::jsonb))
  LOOP
    v_nid := regexp_replace(translate(trim(COALESCE(v_item->>'national_id', '')), '٠١٢٣٤٥٦٧٨٩', '0123456789'), '\D', '', 'g');

    IF length(v_nid) <> 14 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    SELECT id INTO v_existing_id
    FROM public.online_students
    WHERE regexp_replace(translate(trim(COALESCE(national_id, '')), '٠١٢٣٤٥٦٧٨٩', '0123456789'), '\D', '', 'g') = v_nid
    ORDER BY
      COALESCE(synced_to_local_server, false) DESC,
      created_at DESC
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      UPDATE public.online_students
      SET
        full_name = COALESCE(NULLIF(trim(v_item->>'full_name'), ''), full_name),
        photo_url = COALESCE(NULLIF(trim(v_item->>'photo_url'), ''), photo_url),
        academic_grade = COALESCE(NULLIF(trim(v_item->>'academic_grade'), ''), academic_grade),
        education_type = COALESCE(NULLIF(trim(v_item->>'education_type'), ''), education_type),
        enrollment_type = COALESCE(NULLIF(trim(v_item->>'enrollment_type'), ''), enrollment_type),
        school_name = COALESCE(NULLIF(trim(v_item->>'school_name'), ''), school_name),
        gender = COALESCE(NULLIF(trim(v_item->>'gender'), ''), gender),
        assigned_student_code = COALESCE((v_item->>'student_code')::INTEGER, assigned_student_code),
        assigned_barcode_id = COALESCE(NULLIF(trim(v_item->>'barcode_id'), ''), assigned_barcode_id),
        groups_snapshot = COALESCE(v_item->'groups', groups_snapshot, '[]'::jsonb),
        local_student_id = COALESCE(NULLIF(v_item->>'local_id', '')::UUID, local_student_id),
        status = 'approved',
        synced_to_local_server = true,
        updated_at = NOW()
      WHERE id = v_existing_id;

      v_updated := v_updated + 1;
    ELSE
      INSERT INTO public.online_students (
        full_name,
        phone,
        father_phone,
        gender,
        birth_date,
        national_id,
        photo_url,
        academic_grade,
        education_type,
        enrollment_type,
        school_name,
        status,
        assigned_student_code,
        assigned_barcode_id,
        groups_snapshot,
        local_student_id,
        synced_to_local_server
      ) VALUES (
        COALESCE(NULLIF(trim(v_item->>'full_name'), ''), 'طالب أكاديمية أطلس'),
        NULLIF(trim(v_item->>'phone'), ''),
        COALESCE(NULLIF(trim(v_item->>'father_phone'), ''), '01000000000'),
        CASE WHEN (v_item->>'gender') = 'female' THEN 'female' ELSE 'male' END,
        NULLIF(trim(v_item->>'birth_date'), '')::DATE,
        v_nid,
        NULLIF(trim(v_item->>'photo_url'), ''),
        COALESCE(NULLIF(trim(v_item->>'academic_grade'), ''), 'غير محدد'),
        COALESCE(NULLIF(trim(v_item->>'education_type'), ''), 'عام'),
        COALESCE(NULLIF(trim(v_item->>'enrollment_type'), ''), 'PACKAGE'),
        NULLIF(trim(v_item->>'school_name'), ''),
        'approved',
        (v_item->>'student_code')::INTEGER,
        NULLIF(trim(v_item->>'barcode_id'), ''),
        COALESCE(v_item->'groups', '[]'::jsonb),
        NULLIF(v_item->>'local_id', '')::UUID,
        true
      );

      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'skipped', v_skipped
  );
END;
$$;

-- منح صلاحيات التنفيذ (RLS يظل مغلقاً تماماً ولا يكشف أي بيانات إلا عبر الدالة الآمنة)
GRANT EXECUTE ON FUNCTION public.lookup_student_by_national_id(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sync_and_clean_students(TEXT, JSONB, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_student_cards(TEXT, JSONB) TO anon, authenticated;
