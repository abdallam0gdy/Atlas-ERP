import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, BookOpen, Loader2, Sparkles } from 'lucide-react';

const PRESET_COLORS = [
  '#0C3C82', // Atlas Royal Blue
  '#0EA5E9', // Sky Cyan
  '#059669', // Emerald (Azhari)
  '#10B981', // Green
  '#D8232A', // Crimson Red
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
];

export default function SubjectModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    code: '',
    color: '#0C3C82',
    education_type: 'general',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name_ar: initialData.name_ar || '',
        name_en: initialData.name_en || '',
        code: initialData.code || '',
        color: initialData.color || '#0C3C82',
        education_type: initialData.education_type || 'general',
      });
    } else {
      setFormData({
        name_ar: '',
        name_en: '',
        code: '',
        color: '#0C3C82',
        education_type: 'general',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name_ar.trim()) {
      toast.error('يرجى إدخال اسم المادة بالعربية');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/master/subjects/${initialData.id}`, formData);
        toast.success('تم تحديث بيانات المادة بنجاح');
      } else {
        await api.post('/master/subjects', formData);
        toast.success('تمت إضافة المادة بنجاح');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ المادة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="atlas-card w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-scale-up"
        style={{ border: '1px solid rgba(12, 60, 130, 0.15)' }}
      >
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0C3C82 0%, #082a5c 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? 'تعديل بيانات المادة الدراسية' : 'إضافة مادة دراسية جديدة'}
              </h2>
              <p className="text-xs text-white/70">
                إدارة المواد وتحديد نوع التعليم (عام / أزهري)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject Name Arabic */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المادة (بالعربية) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              placeholder="مثال: الفقه، الفيزياء، اللغة الإنجليزية..."
              className="atlas-input text-sm w-full"
            />
          </div>

          {/* Subject Name English */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المادة (بالإنجليزية) <span className="text-slate-400 font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              placeholder="e.g. Physics, Fiqh, English..."
              className="atlas-input text-sm w-full font-mono text-left"
              dir="ltr"
            />
          </div>

          {/* Education Type (أزهري ولا عام) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نوع التعليم <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, education_type: 'general' })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.education_type === 'general'
                    ? 'border-[#0C3C82] bg-blue-50/60 text-[#0C3C82] font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <p className="text-sm">عام</p>
                <p className="text-[10px] text-slate-400 mt-0.5">تعليم عام</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, education_type: 'azhar' })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.education_type === 'azhar'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <p className="text-sm">أزهري 🕌</p>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">تعليم أزهري</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, education_type: 'both' })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.education_type === 'both'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-800 font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <p className="text-sm">مشترك</p>
                <p className="text-[10px] text-purple-600/80 mt-0.5">عام وأزهري</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Subject Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كود المادة المختصر
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="مثال: PHY, ARA"
                className="atlas-input text-sm font-mono text-center w-full uppercase"
                maxLength={8}
              />
            </div>

            {/* Subject Color */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                لون التمييز
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      formData.color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="atlas-btn-primary text-xs px-5 py-2"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin ml-1.5 inline" />
              ) : (
                <Sparkles size={14} className="ml-1.5 inline" />
              )}
              {isEdit ? 'حفظ التعديلات' : 'إضافة المادة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
