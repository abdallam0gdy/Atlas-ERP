import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, BookOpen, Loader2, Check, Sparkles, Filter, CheckCheck } from 'lucide-react';

export default function BookletModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);

  const isEditing = Boolean(initialData?.id);

  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    sku: '',
    category: 'booklet',
    teacher_id: '',
    grade_id: '',
    subject_id: '',
    unit_cost: 0,
    selling_price: 0,
    current_stock: 0,
    low_stock_threshold: 10,
    group_ids: [],
  });

  useEffect(() => {
    if (isOpen) {
      fetchMasters();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name || '',
          name_ar: initialData.name_ar || initialData.name || '',
          sku: initialData.sku || '',
          category: initialData.category || 'booklet',
          teacher_id: initialData.teacher_id || '',
          grade_id: initialData.grade_id || '',
          subject_id: initialData.subject_id || '',
          unit_cost: initialData.unit_cost || 0,
          selling_price: initialData.selling_price || 0,
          current_stock: initialData.current_stock || 0,
          low_stock_threshold: initialData.low_stock_threshold || 10,
          group_ids: Array.isArray(initialData.groups)
            ? initialData.groups.map((g) => g.group_id || g.id)
            : (initialData.group_ids || []),
        });
      } else {
        setForm({
          name: '',
          name_ar: '',
          sku: `BK-${Date.now().toString().slice(-5)}`,
          category: 'booklet',
          teacher_id: '',
          grade_id: '',
          subject_id: '',
          unit_cost: 0,
          selling_price: 0,
          current_stock: 50,
          low_stock_threshold: 10,
          group_ids: [],
        });
      }
    }
  }, [isOpen, initialData]);

  const fetchMasters = async () => {
    try {
      const [techRes, grRes, subRes, grpRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/master/grades'),
        api.get('/master/subjects'),
        api.get('/groups'),
      ]);
      setTeachers(techRes.data?.data || []);
      setGrades(grRes.data?.data || []);
      setSubjects(subRes.data?.data || []);
      setGroups(grpRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  // Currently selected teacher object
  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => t.id === form.teacher_id) || null;
  }, [teachers, form.teacher_id]);

  // Subjects taught by the selected teacher (fallback to all subjects if none configured)
  const teacherSubjects = useMemo(() => {
    if (!selectedTeacher) return [];
    if (Array.isArray(selectedTeacher.subjects) && selectedTeacher.subjects.length > 0) {
      return selectedTeacher.subjects;
    }
    // If teacher has subject_id
    if (selectedTeacher.subject_id) {
      const found = subjects.filter((s) => s.id === selectedTeacher.subject_id);
      if (found.length > 0) return found;
    }
    return subjects;
  }, [selectedTeacher, subjects]);

  // Handle Teacher Change & Auto-select Subject if teacher only has one subject
  const handleTeacherChange = (newTeacherId) => {
    const teacher = teachers.find((t) => t.id === newTeacherId);
    let autoSubjectId = '';

    if (teacher) {
      const tSubs = Array.isArray(teacher.subjects) && teacher.subjects.length > 0
        ? teacher.subjects
        : (teacher.subject_id ? subjects.filter((s) => s.id === teacher.subject_id) : []);

      if (tSubs.length === 1) {
        autoSubjectId = tSubs[0].id;
      }
    }

    setForm((prev) => ({
      ...prev,
      teacher_id: newTeacherId,
      subject_id: autoSubjectId,
      group_ids: [], // reset groups on teacher change
    }));
  };

  // Cascading Filtered Groups
  const filteredGroups = useMemo(() => {
    if (!form.teacher_id) return [];
    return groups.filter((g) => {
      if (g.teacher_id !== form.teacher_id) return false;
      if (form.subject_id && g.subject_id !== form.subject_id) return false;
      if (form.grade_id && g.grade_id !== form.grade_id) return false;
      return true;
    });
  }, [groups, form.teacher_id, form.subject_id, form.grade_id]);

  const toggleGroup = (groupId) => {
    setForm((prev) => {
      const exists = prev.group_ids.includes(groupId);
      if (exists) {
        return { ...prev, group_ids: prev.group_ids.filter((id) => id !== groupId) };
      } else {
        return { ...prev, group_ids: [...prev.group_ids, groupId] };
      }
    });
  };

  const selectAllFilteredGroups = () => {
    const allFilteredIds = filteredGroups.map((g) => g.id);
    setForm((prev) => ({
      ...prev,
      group_ids: Array.from(new Set([...prev.group_ids, ...allFilteredIds])),
    }));
  };

  const deselectAllFilteredGroups = () => {
    const filteredSet = new Set(filteredGroups.map((g) => g.id));
    setForm((prev) => ({
      ...prev,
      group_ids: prev.group_ids.filter((id) => !filteredSet.has(id)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('يرجى إدخال اسم الملزمة أو الكتاب');
      return;
    }
    if (!form.teacher_id) {
      toast.error('يرجى اختيار المدرس الخاص بهذه الملزمة');
      return;
    }
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) {
      toast.error('يرجى تحديد سعر البيع للطلاب');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        name_ar: form.name_ar || form.name,
        unit_cost: parseFloat(form.unit_cost) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        current_stock: parseInt(form.current_stock, 10) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 10,
        teacher_id: form.teacher_id || null,
        grade_id: form.grade_id || null,
        subject_id: form.subject_id || null,
      };

      if (isEditing) {
        await api.put(`/booklets/${initialData.id}`, payload);
        toast.success('تم تعديل بيانات الملزمة بنجاح');
      } else {
        await api.post('/booklets', payload);
        toast.success('تمت إضافة الملزمة للمخزن وتعيين المجموعات بنجاح');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#0C3C82' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing ? 'تعديل ملزمة / كتاب' : 'إضافة ملزمة أو كتاب جديد'}
              </h2>
              <p className="text-xs text-slate-500">تخصيص المدرس والمادة والمجموعات والأسعار والمخزون</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title / Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                اسم الملزمة / الكتاب <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, name_ar: e.target.value })}
                placeholder="مثال: مذكرة مراجعة ليلة الامتحان - فيزياء 3 ث"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            {/* SKU / Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                كود الملزمة (SKU / Barcode)
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="BK-00123"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left"
                dir="ltr"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                النوع
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="booklet">ملزمة دراسية</option>
                <option value="book">كتاب خارجي / مدرسي</option>
              </select>
            </div>

            {/* STEP 1: Teacher Selection (Mandatory) */}
            <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>1. المدرس الخاص بالملزمة <span className="text-red-500">*</span></span>
                {form.teacher_id && (
                  <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    تم اختيار المدرس
                  </span>
                )}
              </label>
              <select
                value={form.teacher_id}
                onChange={(e) => handleTeacherChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                required
              >
                <option value="">-- اختر المدرس أولاً --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name_ar || t.full_name} ({t.phone || 'بدون هاتف'})
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 2: Subject Selection (Filtered by Teacher) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>2. المادة الدراسية</span>
                {teacherSubjects.length === 1 && form.subject_id && (
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Sparkles size={11} /> محددة تلقائياً
                  </span>
                )}
              </label>
              <select
                value={form.subject_id}
                disabled={!form.teacher_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 font-medium"
              >
                <option value="">
                  {!form.teacher_id
                    ? '-- اختر مدرساً أولاً --'
                    : teacherSubjects.length === 0
                    ? '-- عامة لكافة المواد --'
                    : '-- اختر المادة من مواد المدرس --'}
                </option>
                {teacherSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar} {s.name_en ? `(${s.name_en})` : ''}
                  </option>
                ))}
              </select>
              {teacherSubjects.length > 0 && form.teacher_id && (
                <p className="text-[11px] text-slate-500 mt-1">
                  المواد المتاحة للمدرس: {teacherSubjects.map((s) => s.name_ar).join(' ، ')}
                </p>
              )}
            </div>

            {/* STEP 3: Grade Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                3. المرحلة الدراسية
              </label>
              <select
                value={form.grade_id}
                onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- عامة لجميع المراحل --</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name_ar}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                تصفية المجموعات بحسب الصف الدراسي
              </p>
            </div>

            {/* Pricing */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  سعر البيع للطلاب (ج.م) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">ج.م</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  سعر التكلفة / الطباعة (ج.م)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-2 text-xs text-slate-500">ج.م</span>
                </div>
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                الكمية المتوفرة بالمخزن
              </label>
              <input
                type="number"
                min="0"
                value={form.current_stock}
                onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                حد انخفاض المخزون للتحذير
              </label>
              <input
                type="number"
                min="1"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* STEP 4: Cascading Filtered Groups */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Filter size={14} className="text-sky-600" />
                  4. المجموعات المتاحة لهذه الملزمة (مفلترة تلقائياً)
                </label>
                <span className="text-[11px] text-slate-500">
                  {filteredGroups.length} مجموعة مطابقة للشروط — تم تحديد {form.group_ids.length}
                </span>
              </div>

              {filteredGroups.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllFilteredGroups}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFilteredGroups}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded transition-colors"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              )}
            </div>

            {!form.teacher_id ? (
              <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                👆 يرجى اختيار المدرس أولاً لعرض مجموعاته المتاحة
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-4 text-center bg-amber-50/60 rounded-xl border border-dashed border-amber-200 text-xs text-amber-700">
                لا توجد مجموعات مطابقة للمدرس مع الفلاتر المحددة (المادة / المرحلة). يمكنك تغيير الفلاتر أعلاه.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2.5 bg-slate-50/70 rounded-xl border border-slate-200">
                {filteredGroups.map((grp) => {
                  const isChecked = form.group_ids.includes(grp.id);
                  return (
                    <div
                      key={grp.id}
                      onClick={() => toggleGroup(grp.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border ${
                        isChecked
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm ring-1 ring-blue-400/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border text-white text-[10px] transition-colors ${
                          isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{grp.name_ar || grp.name}</p>
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: grp.subject_color || '#0C3C82' }}
                          />
                          <span>{grp.subject_name || 'عام'}</span>
                          <span>•</span>
                          <span>{grp.grade_name || ''}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-bold text-white rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              style={{ background: '#0C3C82' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>{isEditing ? 'حفظ التعديلات' : 'إضافة الملزمة'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
