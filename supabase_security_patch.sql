-- =================================================================================
-- 🔒 ATLAS ERP - SUPABASE SECURITY LOCKDOWN, DEDUPLICATION & SYNC PATCH
-- =================================================================================
-- نفّذ هذا الملف مرة واحدة في Supabase -> SQL Editor -> New Query -> Run
--
-- ماذا يفعل هذا السكريبت؟
-- 1. يغلق ثغرة سحب أو تعديل أو حذف بيانات الطلاب والمعلمين نهائياً عن أي شخص خارج صفحة الأدمن.
-- 2. يبقي باب التسجيل (INSERT) مفتوحاً للطلاب والمعلمين بدون أي توقف.
-- 3. ينظف ويمسح أي أسماء طلاب مكررة بنفس الرقم القومي أو (نفس الاسم + رقم ولي الأمر) ويبقي نسخة واحدة فقط.
-- 4. يمنع تكرار الرقم القومي مستقبلاً في قاعدة بيانات سوبابيز.
-- 5. ينشئ دوال محمية بالرمز السري في الخلفية (Abd#01224385098) لصفحة الأدمن ونقل وتكويد الطلاب للسيستم.
-- =================================================================================

-- 1. التأكد من وجود أعمدة التكويد والنقل للسيستم في جدول الطلاب
ALTER TABLE public.online_students
  ADD COLUMN IF NOT EXISTS assigned_student_code INTEGER,
  ADD COLUMN IF NOT EXISTS synced_to_local_server BOOLEAN DEFAULT false;

-- 2. مسح التكرارات الحالية في جدول online_students تلقائياً (الاحتفاظ بأكمل وأحدث نسخة فقط)
-- 2.أ: مسح التكرار بناءً على الرقم القومي (national_id)
WITH ranked_nid AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY trim(national_id)
      ORDER BY
        COALESCE(synced_to_local_server, false) DESC,
        (assigned_student_code IS NOT NULL) DESC,
        (status = 'approved') DESC,
        (photo_url IS NOT NULL AND photo_url <> '') DESC,
        created_at DESC
    ) AS rn
  FROM public.online_students
  WHERE national_id IS NOT NULL AND length(trim(national_id)) > 0
)
DELETE FROM public.online_students
WHERE id IN (SELECT id FROM ranked_nid WHERE rn > 1);

-- 2.ب: مسح التكرار بناءً على (اسم الطالب + رقم هاتف الأب)
WITH ranked_name_father AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY trim(full_name), trim(father_phone)
      ORDER BY
        COALESCE(synced_to_local_server, false) DESC,
        (assigned_student_code IS NOT NULL) DESC,
        (status = 'approved') DESC,
        (photo_url IS NOT NULL AND photo_url <> '') DESC,
        created_at DESC
    ) AS rn
  FROM public.online_students
  WHERE full_name IS NOT NULL AND father_phone IS NOT NULL
)
DELETE FROM public.online_students
WHERE id IN (SELECT id FROM ranked_name_father WHERE rn > 1);

-- 3. إنشاء فهرس فريد (Unique Index) لمنع تكرار الرقم القومي مستقبلاً في سوبابيز
CREATE UNIQUE INDEX IF NOT EXISTS idx_online_students_unique_national_id
  ON public.online_students (trim(national_id))
  WHERE national_id IS NOT NULL AND length(trim(national_id)) = 14;

-- =================================================================================
-- 4. دوال فحص التكرار الآمنة لبوابة التسجيل (لا تكشف أسماء أو بيانات الطلاب إطلاقاً)
-- =================================================================================
CREATE OR REPLACE FUNCTION public.check_student_exists(
  p_national_id TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nid_exists BOOLEAN := FALSE;
  v_phone_exists BOOLEAN := FALSE;
BEGIN
  IF p_national_id IS NOT NULL AND length(trim(p_national_id)) = 14 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.online_students WHERE trim(national_id) = trim(p_national_id)
    ) INTO v_nid_exists;

    IF v_nid_exists THEN
      RETURN jsonb_build_object('exists', true, 'reason', 'national_id');
    END IF;
  END IF;

  IF p_phone IS NOT NULL AND length(trim(p_phone)) >= 11 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.online_students WHERE trim(phone) = trim(p_phone)
    ) INTO v_phone_exists;

    IF v_phone_exists THEN
      RETURN jsonb_build_object('exists', true, 'reason', 'phone');
    END IF;
  END IF;

  RETURN jsonb_build_object('exists', false, 'reason', null);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_teacher_exists(
  p_national_id TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nid_exists BOOLEAN := FALSE;
  v_phone_exists BOOLEAN := FALSE;
BEGIN
  IF p_national_id IS NOT NULL AND length(trim(p_national_id)) = 14 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.online_teachers WHERE trim(national_id) = trim(p_national_id)
    ) INTO v_nid_exists;

    IF v_nid_exists THEN
      RETURN jsonb_build_object('exists', true, 'reason', 'national_id');
    END IF;
  END IF;

  IF p_phone IS NOT NULL AND length(trim(p_phone)) >= 11 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.online_teachers WHERE trim(phone) = trim(p_phone)
    ) INTO v_phone_exists;

    IF v_phone_exists THEN
      RETURN jsonb_build_object('exists', true, 'reason', 'phone');
    END IF;
  END IF;

  RETURN jsonb_build_object('exists', false, 'reason', null);
END;
$$;

-- =================================================================================
-- 5. دوال صفحة الأدمن المحمية بالرمز السري في الخلفية (Abd#01224385098)
-- =================================================================================

-- 5.1: جلب كل الطلاب لصفحة الأدمن
CREATE OR REPLACE FUNCTION public.admin_get_students(pin TEXT)
RETURNS SETOF public.online_students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin IS DISTINCT FROM 'Abd#01224385098' THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  RETURN QUERY
  SELECT * FROM public.online_students
  ORDER BY created_at DESC;
END;
$$;

-- 5.2: جلب كل المعلمين لصفحة الأدمن
CREATE OR REPLACE FUNCTION public.admin_get_teachers(pin TEXT)
RETURNS SETOF public.online_teachers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin IS DISTINCT FROM 'Abd#01224385098' THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  RETURN QUERY
  SELECT * FROM public.online_teachers
  ORDER BY created_at DESC;
END;
$$;

-- 5.3: تحديث حالة استمارة (طالب أو معلم)
CREATE OR REPLACE FUNCTION public.admin_update_status(
  pin TEXT,
  p_table TEXT,
  p_id UUID,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin IS DISTINCT FROM 'Abd#01224385098' THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  IF p_table = 'online_students' THEN
    UPDATE public.online_students
    SET status = p_status, updated_at = NOW()
    WHERE id = p_id;
  ELSIF p_table = 'online_teachers' THEN
    UPDATE public.online_teachers
    SET status = p_status, updated_at = NOW()
    WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Invalid table name';
  END IF;

  RETURN TRUE;
END;
$$;

-- 5.4: تحديث جماعي للحالة
CREATE OR REPLACE FUNCTION public.admin_batch_update_status(
  pin TEXT,
  p_table TEXT,
  p_ids UUID[],
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin IS DISTINCT FROM 'Abd#01224385098' THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  IF p_table = 'online_students' THEN
    UPDATE public.online_students
    SET status = p_status, updated_at = NOW()
    WHERE id = ANY(p_ids);
  ELSIF p_table = 'online_teachers' THEN
    UPDATE public.online_teachers
    SET status = p_status, updated_at = NOW()
    WHERE id = ANY(p_ids);
  ELSE
    RAISE EXCEPTION 'Invalid table name';
  END IF;

  RETURN TRUE;
END;
$$;

-- 5.5: حذف استمارة
CREATE OR REPLACE FUNCTION public.admin_delete_record(
  pin TEXT,
  p_table TEXT,
  p_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin IS DISTINCT FROM 'Abd#01224385098' THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  IF p_table = 'online_students' THEN
    DELETE FROM public.online_students WHERE id = p_id;
  ELSIF p_table = 'online_teachers' THEN
    DELETE FROM public.online_teachers WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Invalid table name';
  END IF;

  RETURN TRUE;
END;
$$;

-- 5.6: تعليم الطلاب بأنه تم نقلهم وتكويدهم في السيستم + مسح أي تكرارات من سوبابيز
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

  -- تحديث حالة الطلاب المنقولين للسيستم وتثبيت الكود أمامهم
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_synced, '[]'::jsonb))
  LOOP
    UPDATE public.online_students
    SET
      status = 'approved',
      synced_to_local_server = true,
      assigned_student_code = (v_item->>'student_code')::INTEGER,
      updated_at = NOW()
    WHERE id = (v_item->>'id')::UUID;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- =================================================================================
-- 6. إغلاق الصلاحيات العامة (RLS Lockdown) - السماح بالإضافة فقط (INSERT ONLY)
-- =================================================================================
ALTER TABLE public.online_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_teachers ENABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات القديمة على الجدولين مهما كان اسمها لضمان عدم بقاء أي ثغرة قراءة أو تعديل أو حذف
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('online_students', 'online_teachers')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END
$$;

-- الإبقاء فقط على سياسة التسجيل (INSERT) مفتوحة للطلاب والمعلمين
CREATE POLICY "Public anonymous insert for students"
  ON public.online_students
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public anonymous insert for teachers"
  ON public.online_teachers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- منح صلاحية تنفيذ الدوال الآمنة
GRANT EXECUTE ON FUNCTION public.check_student_exists(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_teacher_exists(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_students(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_teachers(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_status(TEXT, TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_batch_update_status(TEXT, TEXT, UUID[], TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_record(TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sync_and_clean_students(TEXT, JSONB, UUID[]) TO anon, authenticated;
