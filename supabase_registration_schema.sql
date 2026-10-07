-- ==============================================================================
-- أكاديمية أطلس التعليمية — نظام أطلس الإداري (Atlas ERP)
-- سكريبت إنشاء جداول وقواعد الأمان للاستمارات الإلكترونية (Supabase Schema)
-- ==============================================================================
-- التعليمات:
-- 1. افتح لوحة تحكم سوبابيز (Supabase Dashboard).
-- 2. ادخل إلى مشروعك، ثم اضغط من القائمة الجانبية على "SQL Editor".
-- 3. انسخ هذا الملف بالكامل والصقه هناك ثم اضغط "RUN".
-- ==============================================================================

-- 1. جدول استمارات تسجيل وحجز الطلاب الجدد
CREATE TABLE IF NOT EXISTS public.online_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- بيانات الطالب الأساسية
    full_name TEXT NOT NULL,                                     -- اسم الطالب رباعي
    phone TEXT NOT NULL,                                         -- رقم هاتف الطالب
    gender TEXT CHECK (gender IN ('male', 'female')),             -- النوع (ذكر / أنثى)
    birth_date DATE,                                             -- تاريخ الميلاد
    national_id TEXT,                                            -- الرقم القومي (إجباري)
    photo_url TEXT,                                              -- رابط الصورة الشخصية للطالب بخلفية بيضاء (ImgBB)
    address TEXT,                                                -- العنوان / المنطقة السكنية
    
    -- بيانات التواصل مع ولي الأمر
    father_phone TEXT NOT NULL,                                  -- رقم هاتف ولي الأمر (الأب)
    mother_phone TEXT,                                           -- رقم هاتف الأم
    parent_job TEXT,                                             -- وظيفة ولي الأمر
    
    -- البيانات الدراسية والتعليمية
    academic_grade TEXT NOT NULL,                                -- الصف الدراسي (مثال: الصف الأول الثانوي)
    education_type TEXT DEFAULT 'عام',                           -- نوع التعليم (عام / لغات / أزهر)
    school_name TEXT,                                            -- اسم المدرسة المقيد بها
    desired_subjects TEXT,                                       -- المواد أو المدرسين المطلوبين
    notes TEXT,                                                  -- ملاحظات إضافية أو مواعيد مفضلة
    
    -- حقول الإدارة والمزامنة مع سيرفر السنتر الداخلي
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    assigned_student_code INTEGER,                               -- كود الطالب المعين له عند القبول (مثال: 1050)
    synced_to_local_server BOOLEAN DEFAULT false,                -- هل تم استيراده لسيرفر السنتر
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- فهارس للبحث السريع والتأكد من سرعة الاستعلامات
CREATE INDEX IF NOT EXISTS idx_online_students_phone ON public.online_students(phone);
CREATE INDEX IF NOT EXISTS idx_online_students_status ON public.online_students(status);
CREATE INDEX IF NOT EXISTS idx_online_students_created ON public.online_students(created_at DESC);


-- ==============================================================================
-- 2. جدول استمارات انضمام أعضاء هيئة التدريس (المعلمين)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.online_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- البيانات الشخصية والمهنية (إلزامية)
    full_name TEXT NOT NULL,                                     -- اسم المعلم بالكامل
    nickname TEXT NOT NULL,                                      -- اللقب / الشهرة (مثال: مستر أحمد)
    phone TEXT NOT NULL,                                         -- رقم الهاتف الشخصي
    whatsapp_phone TEXT NOT NULL,                                -- رقم الواتساب للتواصل
    national_id TEXT NOT NULL,                                   -- الرقم القومي (14 رقماً)
    photo_url TEXT NOT NULL,                                     -- رابط الصورة الشخصية للمعلم (ImgBB)
    logo_url TEXT,                                               -- رابط لوجو أو شعار المعلم (ImgBB إن وجد)
    
    -- المادة والصفوف (إلزامية)
    specialization TEXT NOT NULL,                                -- المواد التعليمية (مفصولة بفواصل)
    target_grades TEXT NOT NULL,                                 -- المراحل والصفوف الدراسية
    
    -- فريق العمل وإدارة الحجز (السكرتارية)
    assistant_name TEXT,                                         -- اسم السكرتير الرئيسي (أو إدارة شخصية)
    assistant_phone TEXT,                                        -- هاتف السكرتير الرئيسي
    assistants_data JSONB,                                       -- بيانات المساعدين كاملة (بدون حد أقصى للعدد)
    
    -- المجموعات ومواعيد الحصص المقترحة (إلزامية)
    groups_data JSONB NOT NULL,                                  -- بيانات المجموعات والأيام والأوقات
    
    -- السيرة والمنصات (النبذة إلزامية)
    bio TEXT NOT NULL,                                           -- نبذة تعريفية وخبرات سابقة
    facebook_link TEXT,                                          -- رابط صفحة الفيسبوك (اختياري)
    youtube_link TEXT,                                           -- رابط قناة اليوتيوب (اختياري)
    telegram_link TEXT,                                          -- رابط قناة التليجرام (اختياري)
    notes TEXT,                                                  -- متطلبات القاعات أو الملاحظات (اختياري)
    
    -- حقول الإدارة
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    synced_to_local_server BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تحديثات الأعمدة في حال كانت الجداول منشأة مسبقاً (Idempotent Migrations)
ALTER TABLE public.online_students ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.online_teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.online_teachers ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.online_teachers ADD COLUMN IF NOT EXISTS assistants_data JSONB;
ALTER TABLE public.online_teachers ADD COLUMN IF NOT EXISTS groups_data JSONB;
ALTER TABLE public.online_teachers ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.online_teachers ALTER COLUMN phone SET NOT NULL;
ALTER TABLE public.online_teachers ALTER COLUMN specialization SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_online_teachers_phone ON public.online_teachers(phone);
CREATE INDEX IF NOT EXISTS idx_online_teachers_status ON public.online_teachers(status);
CREATE INDEX IF NOT EXISTS idx_online_teachers_created ON public.online_teachers(created_at DESC);


-- ==============================================================================
-- 3. قواعد الحماية والخصوصية الصارمة (Row Level Security - RLS)
-- ==============================================================================
-- تفعيل جدار الحماية على مستوى الصفوف
ALTER TABLE public.online_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_teachers ENABLE ROW LEVEL SECURITY;

-- 1) السماح للزوار والطلاب بإرسال الاستمارة فقط (INSERT Only)
CREATE POLICY "Public anonymous insert for students"
ON public.online_students 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- 2) السماح للمعلمين بإرسال الاستمارة فقط (INSERT Only)
CREATE POLICY "Public anonymous insert for teachers"
ON public.online_teachers 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- ملاحظة أمنية هامة:
-- لم يتم وضع أي Policy لـ SELECT أو UPDATE للجمهور المجهول (anon).
-- هذا يعني هندسياً أنه يستحيل على أي زائر أو طالب قراءة أي رقم هاتف أو بيانات طلاب آخرين
-- حتى لو امتلك المفتاح العام (anon key)، فقاعدة البيانات ترفض قراءة أي سجل إطلاقاً!
-- القراءة والتعديل محصورة فقط لإدارة السنتر عبر لوحة سوبابيز أو السيرفر الداخلي.
