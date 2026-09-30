import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  GraduationCap, 
  User, 
  Phone, 
  MapPin, 
  School, 
  BookOpen, 
  Calendar, 
  Send, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileText,
  Printer,
  Sparkles
} from 'lucide-react';

const ACADEMIC_GRADES = [
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
];

export default function StudentRegistrationPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    father_phone: '',
    mother_phone: '',
    parent_job: '',
    academic_grade: 'الصف الأول الثانوي',
    education_type: 'عام',
    school_name: '',
    gender: 'male',
    national_id: '',
    birth_date: '',
    address: '',
    desired_subjects: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation: Name length
    if (formData.full_name.trim().split(' ').length < 2) {
      setErrorMessage('يرجى كتابة اسم الطالب ثلاثي أو رباعي على الأقل');
      return;
    }

    // Validation: Phone numbers
    const cleanPhone = formData.phone.trim();
    const cleanFatherPhone = formData.father_phone.trim();
    if (cleanPhone.length < 10) {
      setErrorMessage('يرجى التأكد من كتابة رقم هاتف الطالب بشكل صحيح');
      return;
    }
    if (cleanFatherPhone.length < 10) {
      setErrorMessage('يرجى كتابة رقم هاتف ولي الأمر بشكل صحيح');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: cleanPhone,
        father_phone: cleanFatherPhone,
        mother_phone: formData.mother_phone.trim() || null,
        parent_job: formData.parent_job.trim() || null,
        academic_grade: formData.academic_grade,
        education_type: formData.education_type,
        school_name: formData.school_name.trim() || null,
        gender: formData.gender,
        national_id: formData.national_id.trim() || null,
        birth_date: formData.birth_date || null,
        address: formData.address.trim() || null,
        desired_subjects: formData.desired_subjects.trim() || null,
        notes: formData.notes.trim() || null,
        status: 'pending',
        synced_to_local_server: false,
      };

      const { data, error } = await supabase
        .from('online_students')
        .insert([payload])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      setSubmittedData({
        ...payload,
        id: data?.[0]?.id || `ATL-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toLocaleDateString('ar-EG'),
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || 'حدث خطأ أثناء إرسال البيانات — تأكد من الاتصال بالإنترنت وحاول مرة أخرى'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================
  if (submittedData) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 size={44} />
        </div>

        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 mb-3">
          <Sparkles size={13} />
          تم استلام استمارة التسجيل بنجاح
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
          أهلاً بك في سنتر أطلس التعليمي! 🎉
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto mb-8">
          تم تسجيل بياناتك بنجاح على النظام، وسيتم مراجعة الطلب من إدارة السنتر والتواصل معك فوراً لتأكيد المواعيد وتسليم كود الطالب.
        </p>

        {/* Registration Summary Card */}
        <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-5 border border-slate-200 text-right mb-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <span className="text-xs text-slate-500 font-medium">رقم الطلب المرجعي:</span>
            <span className="font-mono font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded text-xs">
              {submittedData.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">اسم الطالب:</span>
              <span className="font-bold text-slate-800">{submittedData.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الصف الدراسي:</span>
              <span className="font-bold text-slate-800">{submittedData.academic_grade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">رقم هاتف الطالب:</span>
              <span className="font-mono text-slate-800">{submittedData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">هاتف ولي الأمر:</span>
              <span className="font-mono text-slate-800">{submittedData.father_phone}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span>طباعة إيصال التقديم</span>
          </button>

          <button
            onClick={() => {
              setSubmittedData(null);
              setFormData({
                full_name: '',
                phone: '',
                father_phone: '',
                mother_phone: '',
                parent_job: '',
                academic_grade: 'الصف الأول الثانوي',
                education_type: 'عام',
                school_name: '',
                gender: 'male',
                national_id: '',
                birth_date: '',
                address: '',
                desired_subjects: '',
                notes: '',
              });
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/30 cursor-pointer"
          >
            <GraduationCap size={16} />
            <span>تسجيل طالب آخر</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORM SCREEN
  // ============================================================
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100">
      
      {/* Form Title & Introduction */}
      <div className="text-center pb-6 mb-8 border-b border-slate-100">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 mb-3">
          <GraduationCap size={28} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
          استمارة تسجيل وحجز طالب جديد
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto">
          يرجى إدخال البيانات بدقة لضمان تسجيلك في المجموعات وحفظ مقعدك الدراسي في سنتر أطلس التعليمي
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ============================================================
            SECTION 1: STUDENT BASIC INFO
            ============================================================ */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <User size={18} className="text-sky-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">1. بيانات الطالب الأساسية</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                اسم الطالب رباعي <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="مثال: محمد أحمد إبراهيم علي"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Student Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                رقم هاتف الطالب (موبايل) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="010xxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                النوع <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="male">ذكر (طالب)</option>
                <option value="female">أنثى (طالبة)</option>
              </select>
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              />
            </div>

            {/* National ID */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                الرقم القومي (اختياري)
              </label>
              <input
                type="text"
                name="national_id"
                value={formData.national_id}
                onChange={handleChange}
                placeholder="14 رقم من شهادة الميلاد أو البطاقة"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                العنوان أو المنطقة السكنية
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="مثال: مدينة نصر - الحي السابع"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 2: GUARDIAN INFO
            ============================================================ */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Phone size={18} className="text-emerald-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">2. بيانات ولي الأمر والتواصل</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Father Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                هاتف ولي الأمر (الأب) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="father_phone"
                value={formData.father_phone}
                onChange={handleChange}
                required
                placeholder="011xxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Mother Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                هاتف الأم (اختياري)
              </label>
              <input
                type="tel"
                name="mother_phone"
                value={formData.mother_phone}
                onChange={handleChange}
                placeholder="012xxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Parent Job */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                وظيفة ولي الأمر
              </label>
              <input
                type="text"
                name="parent_job"
                value={formData.parent_job}
                onChange={handleChange}
                placeholder="مثال: مهندس / طبيب / معلم / أعمال حرة"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 3: ACADEMIC INFO
            ============================================================ */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <School size={18} className="text-amber-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">3. المسار الدراسي والتعليمي</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Academic Grade */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                الصف الدراسي المقيد به <span className="text-rose-500">*</span>
              </label>
              <select
                name="academic_grade"
                value={formData.academic_grade}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white font-medium"
              >
                {ACADEMIC_GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            {/* Education Type */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                نوع التعليم <span className="text-rose-500">*</span>
              </label>
              <select
                name="education_type"
                value={formData.education_type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="عام">تعليم عام (حكومي / خاص عربي)</option>
                <option value="لغات">تجريبي / لغات (Languages)</option>
                <option value="أزهر">أزهر شريف</option>
              </select>
            </div>

            {/* School Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                اسم المدرسة الحالية
              </label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={handleChange}
                placeholder="مثال: مدرسة الحرية الثانوية بنين"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Desired Subjects / Teachers */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                المواد أو المدرسين المطلوب الحجز معهم
              </label>
              <input
                type="text"
                name="desired_subjects"
                value={formData.desired_subjects}
                onChange={handleChange}
                placeholder="مثال: فيزياء (مستر محمد)، لغة عربية، رياضيات..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                ملاحظات أو مواعيد مفضلة
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="أي رغبات إضافية تخص المواعيد أو ظروف خاصة..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-sky-600/30 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>جاري إرسال الاستمارة وتسجيل البيانات...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>تأكيد وإرسال استمارة التسجيل</span>
              </>
            )}
          </button>
          
          <p className="text-center text-slate-400 text-xs mt-3">
            بالضغط على إرسال، تؤكد صحة البيانات المسجلة لتسليم كود الحضور الخاص بك
          </p>
        </div>

      </form>

    </div>
  );
}
