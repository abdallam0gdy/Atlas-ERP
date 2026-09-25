import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Package, Loader2, Sparkles, Coins, Barcode } from 'lucide-react';

const CATEGORIES = [
  { id: 'booklet', label: 'ملزمة دراسية' },
  { id: 'book', label: 'كتاب خارجي / مدرسي' },
  { id: 'card', label: 'كارت / كارنيه حضور' },
  { id: 'supply', label: 'أدوات مكتبية وكشاكيل' },
  { id: 'other', label: 'أخرى' },
];

export default function ItemModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    name: '',
    category: 'booklet',
    barcode: '',
    subject_id: '',
    grade_id: '',
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    min_stock_alert: 5,
  });

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.get('/master/grades'), api.get('/master/subjects')])
        .then(([gRes, sRes]) => {
          setGrades(gRes.data.data || []);
          setSubjects(sRes.data.data || []);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'booklet',
        barcode: initialData.barcode || '',
        subject_id: initialData.subject_id || '',
        grade_id: initialData.grade_id || '',
        cost_price: initialData.cost_price || 0,
        selling_price: initialData.selling_price || 0,
        current_stock: initialData.current_stock || 0,
        min_stock_alert: initialData.min_stock_alert || 5,
      });
    } else {
      setFormData({
        name: '',
        category: 'booklet',
        barcode: 'ITM-' + Date.now().toString().slice(-6),
        subject_id: '',
        grade_id: '',
        cost_price: 0,
        selling_price: 0,
        current_stock: 0,
        min_stock_alert: 5,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.selling_price === '') {
      toast.error('يرجى ملء اسم الصنف وسعر البيع');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/pos/inventory/${initialData.id}`, formData);
        toast.success('تم تحديث بيانات الصنف بالمخزن');
      } else {
        await api.post('/pos/inventory', formData);
        toast.success('تمت إضافة الصنف للمخزن بنجاح');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'فشل حفظ الصنف');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="atlas-card w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-scale-up border border-slate-200">
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0C3C82 0%, #082a5c 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? 'تعديل صنف بالمخزن' : 'إضافة صنف جديد للمخزن'}
              </h2>
              <p className="text-xs text-white/70">
                إدارة الملازم، الكتب، الكروت، والأدوات المكتبية
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم الصنف <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: ملزمة الفيزياء - الفصل الأول، كشكول سلك..."
              className="atlas-input text-sm w-full"
            />
          </div>

          {/* Category & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تصنيف الصنف
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="atlas-input text-xs w-full"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Barcode size={13} />
                كود الباركود / الصنف
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="كود الباركود"
                className="atlas-input text-xs font-mono w-full"
              />
            </div>
          </div>

          {/* Linked Subject & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                المادة المرتبطة (اختياري)
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="atlas-input text-xs w-full"
              >
                <option value="">— غير مرتبط بمادة —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar} {s.education_type === 'azhar' ? '(أزهري)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الصف الدراسي (اختياري)
              </label>
              <select
                value={formData.grade_id}
                onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
                className="atlas-input text-xs w-full"
              >
                <option value="">— غير مرتبط بصف —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing: Cost vs Selling */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
              <Coins size={14} className="text-[#0C3C82]" />
              التسعير والأرباح (ج.م)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  سعر الشراء / التكلفة (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                  className="atlas-input text-sm font-bold text-slate-700 w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  سعر البيع للطالب (ج.م) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                  className="atlas-input text-sm font-bold text-[#0C3C82] w-full"
                />
              </div>
            </div>

            {formData.selling_price > 0 && (
              <div className="mt-2 text-left flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500">هامش الربح المتوقع للقطعة:</span>
                <span className="font-bold text-emerald-600">
                  +{(formData.selling_price - formData.cost_price).toFixed(2)} ج.م
                </span>
              </div>
            )}
          </div>

          {/* Stock & Reorder Alert */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الكمية الحالية في المخزن
              </label>
              <input
                type="number"
                min="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value, 10) || 0 })}
                className="atlas-input text-sm font-bold text-slate-800 w-full text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                حد التنبيه لنقص المخزون
              </label>
              <input
                type="number"
                min="1"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: parseInt(e.target.value, 10) || 1 })}
                className="atlas-input text-sm font-bold text-amber-600 w-full text-center"
              />
            </div>
          </div>

          {/* Actions */}
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
              {isEdit ? 'حفظ التعديلات' : 'إضافة الصنف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
