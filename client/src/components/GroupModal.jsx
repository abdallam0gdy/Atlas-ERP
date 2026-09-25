import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import TimePicker12h from './TimePicker12h';
import {
  X, BookOpen, Calendar, Clock, Plus,
  Trash2, Loader2, Receipt, Users, MapPin, PieChart, Percent
} from 'lucide-react';

const DAYS = [
  { value: 'saturday', label: 'السبت' },
  { value: 'sunday', label: 'الأحد' },
  { value: 'monday', label: 'الاثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' },
];

export default function GroupModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    teacher_id: '',
    subject_id: '',
    grade_id: '',
    classroom_id: '',
    price_per_month: 0,
    price_per_session: 0,
    max_students: 9999,
    package_teacher_ratio: 0,
    package_center_ratio: 100,
    private_teacher_ratio: 75,
    private_center_ratio: 25,
    schedule: [{ day: 'saturday', start_time: '17:00', end_time: '18:30' }],
  });

  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      api.get('/teachers', { params: { is_active: true } }),
      api.get('/master/subjects'),
      api.get('/master/grades'),
      api.get('/master/classrooms'),
    ]).then(([t, s, g, c]) => {
      setTeachers(t.data.data || []);
      setSubjects(s.data.data || []);
      setGrades(g.data.data || []);
      setClassrooms(c.data.data || []);
    });
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        name_ar: initialData.name_ar || '',
        teacher_id: initialData.teacher_id || '',
        subject_id: initialData.subject_id || '',
        grade_id: initialData.grade_id || '',
        classroom_id: initialData.classroom_id || '',
        price_per_month: initialData.price_per_month || 0,
        price_per_session: initialData.price_per_session || 0,
        max_students: initialData.max_students || 9999,
        package_teacher_ratio: initialData.package_teacher_ratio !== undefined ? Number(initialData.package_teacher_ratio) : 0,
        package_center_ratio: initialData.package_center_ratio !== undefined ? Number(initialData.package_center_ratio) : 100,
        private_teacher_ratio: initialData.private_teacher_ratio !== undefined ? Number(initialData.private_teacher_ratio) : 75,
        private_center_ratio: initialData.private_center_ratio !== undefined ? Number(initialData.private_center_ratio) : 25,
        schedule: initialData.schedule?.length
          ? initialData.schedule
          : [{ day: 'saturday', start_time: '17:00', end_time: '18:30' }],
      });
    } else {
      setFormData({
        name: '',
        name_ar: '',
        teacher_id: '',
        subject_id: '',
        grade_id: '',
        classroom_id: '',
        price_per_month: 0,
        price_per_session: 0,
        max_students: 9999,
        package_teacher_ratio: 0,
        package_center_ratio: 100,
        private_teacher_ratio: 75,
        private_center_ratio: 25,
        schedule: [{ day: 'saturday', start_time: '17:00', end_time: '18:30' }],
      });
    }
  }, [initialData, isOpen]);

  // Auto-generate group name
  useEffect(() => {
    if (!isOpen || isEdit) return;
    const teacher = teachers.find(t => t.id === formData.teacher_id);
    const subject = subjects.find(s => s.id === formData.subject_id);
    const grade = grades.find(g => g.id === formData.grade_id);
    if (teacher && subject && grade) {
      const autoName = `${subject.name_ar} - ${teacher.full_name}`;
      setFormData(prev => ({ ...prev, name: autoName, name_ar: autoName }));
    }
  }, [formData.teacher_id, formData.subject_id, formData.grade_id, teachers, subjects, grades, isOpen]);

  // Teacher change handler with auto-subject selection
  const handleTeacherChange = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    let newSubjectId = '';
    if (teacher) {
      const teacherSubjectIds = (teacher.subjects || []).map(s => s.id);
      if (teacher.subject_id && !teacherSubjectIds.includes(teacher.subject_id)) {
        teacherSubjectIds.push(teacher.subject_id);
      }

      if (teacherSubjectIds.length === 1) {
        newSubjectId = teacherSubjectIds[0];
      } else if (teacherSubjectIds.length > 1 && teacherSubjectIds.includes(formData.subject_id)) {
        newSubjectId = formData.subject_id;
      }
    }
    setFormData(prev => ({
      ...prev,
      teacher_id: teacherId,
      subject_id: newSubjectId,
    }));
  };

  const selectedTeacher = teachers.find(t => t.id === formData.teacher_id);
  const teacherSubjectIds = selectedTeacher
    ? [
        ...(selectedTeacher.subjects || []).map(s => s.id),
        ...(selectedTeacher.subject_id ? [selectedTeacher.subject_id] : []),
      ]
    : [];

  const filteredSubjects = selectedTeacher && teacherSubjectIds.length > 0
    ? subjects.filter(s => teacherSubjectIds.includes(s.id))
    : subjects;

  if (!isOpen) return null;


  const addScheduleSlot = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { day: 'sunday', start_time: '17:00', end_time: '18:30' }],
    }));
  };

  const removeScheduleSlot = (index) => {
    if (formData.schedule.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const updateScheduleSlot = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teacher_id) {
      toast.error('يرجى اختيار المدرس');
      return;
    }
    if (!formData.subject_id) {
      toast.error('يرجى اختيار المادة');
      return;
    }
    if (!formData.grade_id) {
      toast.error('يرجى اختيار المرحلة الدراسية');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المجموعة');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/groups/${initialData.id}`, formData);
        toast.success(data.message || 'تم تحديث بيانات المجموعة بنجاح');
      } else {
        const { data } = await api.post('/groups', formData);
        toast.success(data.message || 'تم إنشاء المجموعة بنجاح');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ المجموعة';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ background: '#0C3C82' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? 'تعديل المجموعة' : 'إنشاء مجموعة جديدة'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {isEdit ? 'تحديث بيانات المجموعة والمواعيد' : 'ربط المدرس بالمادة والمرحلة وتحديد المواعيد'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Core Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-sky-500" />
              بيانات المجموعة الأساسية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Teacher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المدرس <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.teacher_id}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  className="atlas-input"
                >
                  <option value="">اختر المدرس...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} — {t.specialization || 'بدون تخصص'}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المادة <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="atlas-input"
                >
                  <option value="">اختر المادة...</option>
                  {filteredSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name_ar}</option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المرحلة <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.grade_id}
                  onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
                  className="atlas-input"
                >
                  <option value="">اختر المرحلة...</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name_ar}</option>
                  ))}
                </select>
              </div>

              {/* Classroom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  القاعة
                </label>
                <select
                  value={formData.classroom_id}
                  onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value || null })}
                  className="atlas-input"
                >
                  <option value="">بدون قاعة</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name_ar || c.name}</option>
                  ))}
                </select>
              </div>

              {/* Group Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المجموعة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="يتم توليده تلقائياً عند اختيار المدرس والمادة"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, name_ar: e.target.value })}
                  className="atlas-input"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Schedule Builder */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={16} className="text-sky-500" />
                مواعيد الحصص الأسبوعية
              </h3>
              <button
                type="button"
                onClick={addScheduleSlot}
                className="atlas-btn atlas-btn-ghost text-xs"
              >
                <Plus size={14} />
                إضافة موعد
              </button>
            </div>

            <div className="space-y-3">
              {formData.schedule.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: '#0C3C82' }}>
                    {index + 1}
                  </div>

                  {/* Day */}
                  <select
                    value={slot.day}
                    onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                    className="atlas-input text-sm"
                    style={{ flex: '1.2' }}
                  >
                    {DAYS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>

                  {/* Start Time (12-hour AM/PM) */}
                  <div className="flex items-center gap-1.5" style={{ flex: '1.2' }}>
                    <Clock size={14} className="text-slate-400 flex-shrink-0" />
                    <TimePicker12h
                      value={slot.start_time}
                      onChange={(val) => updateScheduleSlot(index, 'start_time', val)}
                    />
                  </div>

                  <span className="text-xs text-slate-400 font-medium flex-shrink-0">إلى</span>

                  {/* End Time (12-hour AM/PM) */}
                  <div style={{ flex: '1.2' }}>
                    <TimePicker12h
                      value={slot.end_time}
                      onChange={(val) => updateScheduleSlot(index, 'end_time', val)}
                    />
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeScheduleSlot(index)}
                    disabled={formData.schedule.length <= 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Pricing */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Receipt size={16} className="text-sky-500" />
              الأسعار والاشتراكات
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  سعر الاشتراك الشهري (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.price_per_month}
                  onChange={(e) => setFormData({ ...formData, price_per_month: Number(e.target.value) })}
                  className="atlas-input font-mono text-center"
                  placeholder="350"
                />
              </div>

              {/* Per Session Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  سعر الحصة المنفردة (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.price_per_session}
                  onChange={(e) => setFormData({ ...formData, price_per_session: Number(e.target.value) })}
                  className="atlas-input font-mono text-center"
                  placeholder="50"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Revenue Splits (باكدج vs برايفت) */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <PieChart size={16} className="text-sky-500" />
              نسب توزيع الإيرادات داخل المجموعة
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              تحديد نسبة كل من السنتر والمدرس لطالب الباكدج العادي وطالب البرايفت (المسجل باسم المستر)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Package Split Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    📦 نظام الباكدج (Package)
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    الافتراضي 100% سنتر
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">نسبة السنتر (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.package_center_ratio}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setFormData({
                          ...formData,
                          package_center_ratio: val,
                          package_teacher_ratio: 100 - val,
                        });
                      }}
                      className="atlas-input font-mono text-center font-bold text-amber-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">نسبة المدرس (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.package_teacher_ratio}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setFormData({
                          ...formData,
                          package_teacher_ratio: val,
                          package_center_ratio: 100 - val,
                        });
                      }}
                      className="atlas-input font-mono text-center font-bold text-slate-700 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Private Split Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    👨‍🏫 نظام البرايفت (Private)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    طالب تبع المستر
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">نسبة المدرس (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.private_teacher_ratio}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setFormData({
                          ...formData,
                          private_teacher_ratio: val,
                          private_center_ratio: 100 - val,
                        });
                      }}
                      className="atlas-input font-mono text-center font-bold text-emerald-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">نسبة السنتر (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.private_center_ratio}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setFormData({
                          ...formData,
                          private_center_ratio: val,
                          private_teacher_ratio: 100 - val,
                        });
                      }}
                      className="atlas-input font-mono text-center font-bold text-slate-700 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button type="button" onClick={onClose} className="atlas-btn atlas-btn-ghost text-sm">
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="atlas-btn atlas-btn-primary text-sm px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : isEdit ? (
              'حفظ التعديلات'
            ) : (
              'إنشاء المجموعة'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
