-- ==============================================================================
-- سنتر أطلس التعليمي — نظام أطلس الإداري (Atlas ERP)
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
    national_id TEXT,                                            -- الرقم القومي (اختياري)
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
    
    -- البيانات الشخصية والمهنية
    full_name TEXT NOT NULL,                                     -- اسم المعلم بالكامل
    nickname TEXT,                                               -- اللقب / الشهرة (مثال: مستر أحمد)
    phone TEXT NOT NULL,                                         -- رقم الهاتف الشخصي
    whatsapp_phone TEXT,                                         -- رقم الواتساب
    national_id TEXT,                                            -- الرقم القومي
    
    -- المادة والصفوف
    specialization TEXT NOT NULL,                                -- المادة التعليمية (لغة عربية، فيزياء...)
    target_grades TEXT,                                          -- المراحل المستهدفة (ثانوي، إعدادي...)
    expected_students_count INTEGER,                             -- العدد المتوقع للطلاب
    
    -- فريق العمل وإدارة الحجز (السكرتارية)
    assistant_name TEXT,                                         -- اسم السكرتير أو المساعد
    assistant_phone TEXT,                                        -- هاتف السكرتير
    
    -- السيرة والمنصات
    bio TEXT,                                                    -- نبذة تعريفية وخبرات سابقة
    facebook_link TEXT,                                          -- رابط صفحة الفيسبوك
    youtube_link TEXT,                                           -- رابط قناة اليوتيوب
    telegram_link TEXT,                                          -- رابط قناة التليجرام
    notes TEXT,                                                  -- متطلبات القاعات أو المواعيد المفضلة
    
    -- حقول الإدارة
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    synced_to_local_server BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
