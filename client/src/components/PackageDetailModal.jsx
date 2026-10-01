import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Package, Users, BookOpen, GraduationCap, Check, Plus, Trash2,
  Calendar, Clock, AlertCircle, Sparkles, Search, CheckCircle2,
  UserPlus, Phone, X, Loader2, Layers, AlertTriangle, ChevronRight
} from 'lucide-react';

export default function PackageDetailModal({ isOpen, onClose, pkg, onUpdated }) {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'enroll' | 'students'
  const [loading, setLoading] = useState(true);
  const [pkgGroups, setPkgGroups] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  // Add Groups sub-modal
  const [addGroupsModalOpen, setAddGroupsModalOpen] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Enroll Student State
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchedStudents, setSearchedStudents] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedGroupPerSubject, setSelectedGroupPerSubject] = useState({}); // subject_id -> group_id
  const [enrollNotes, setEnrollNotes] = useState('');
  const [submittingEnroll, setSubmittingEnroll] = useState(false);

  useEffect(() => {
    if (!isOpen || !pkg) return;
    loadPackageData();
  }, [isOpen, pkg]);

  const loadPackageData = async () => {
    setLoading(true);
    try {
      const [groupsRes, studentsRes] = await Promise.all([
        api.get(`/packages/${pkg.id}/groups`),
        api.get(`/packages/${pkg.id}/students`),
      ]);
      setPkgGroups(groupsRes.data.data || []);
      setEnrolledStudents(studentsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load package details:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات الباكدج');
    } finally {
      setLoading(false);
    }
  };

  // Group package groups by Subject
  const groupsBySubject = useMemo(() => {
    const map = new Map();
    for (const g of pkgGroups) {
      const subId = g.subject_id;
      if (!map.has(subId)) {
        map.set(subId, {
          subject_id: subId,
          subject_name: g.subject_name || 'بدون مادة',
          subject_color: g.subject_color || '#0EA5E9',
          groups: [],
        });
      }
      map.get(subId).groups.push(g);
    }
    return Array.from(map.values());
  }, [pkgGroups]);

  // Open Add Groups selector
  const handleOpenAddGroups = async () => {
    setAddGroupsModalOpen(true);
    setLoadingAvailable(true);
    setSelectedToAdd([]);
    try {
      const { data } = await api.get(`/packages/${pkg.id}/available-groups`);
      setAvailableGroups(data.data || []);
    } catch (err) {
      toast.error('فشل تحميل المجموعات المتاحة للمرحلة');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleConfirmAddGroups = async () => {
    if (selectedToAdd.length === 0) {
      toast.error('يرجى تحديد مجموعة واحدة على الأقل');
      return;
    }
    try {
      await api.post(`/packages/${pkg.id}/groups`, { group_ids: selectedToAdd });
      toast.success(`تم إضافة ${selectedToAdd.length} مجموعة للباكدج بنجاح`);
      setAddGroupsModalOpen(false);
      loadPackageData();
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إضافة المجموعات');
    }
  };

  const handleRemoveGroup = async (groupId, groupName) => {
    if (!window.confirm(`هل أنت متأكد من إزالة مجموعة (${groupName}) من هذا الباكدج؟`)) return;
    try {
      await api.delete(`/packages/${pkg.id}/groups/${groupId}`);
      toast.success('تم إزالة المجموعة من الباكدج');
      loadPackageData();
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error('فشل إزالة المجموعة من الباكدج');
    }
  };

  // Student Search for Enrollment
  useEffect(() => {
    if (!searchStudentQuery.trim() || searchStudentQuery.length < 2) {
      setSearchedStudents([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const { data } = await api.get('/students', {
          params: { search: searchStudentQuery.trim(), limit: 5, grade_id: pkg.grade_id },
        });
        setSearchedStudents(data.data || []);
      } catch (err) {
        console.error('Student search error:', err);
      } finally {
        setSearchingStudents(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchStudentQuery, pkg]);

  // Handle radio select group for a subject
  const handleSelectGroupForSubject = (subjectId, groupId) => {
    setSelectedGroupPerSubject((prev) => ({
      ...prev,
      [subjectId]: groupId,
    }));
  };

  // Verification: student has selected 1 group for EACH required subject
  const allSubjectsCovered = useMemo(() => {
    if (groupsBySubject.length === 0) return false;
    return groupsBySubject.every((s) => Boolean(selectedGroupPerSubject[s.subject_id]));
  }, [groupsBySubject, selectedGroupPerSubject]);

  const selectedCount = useMemo(() => {
    return Object.values(selectedGroupPerSubject).filter(Boolean).length;
  }, [selectedGroupPerSubject]);

  // Submit Package Enrollment
  const handleEnrollSubmit = async () => {
    if (!selectedStudent) {
      toast.error('يرجى اختيار الطالب أولاً');
      return;
    }
    if (!allSubjectsCovered) {
      toast.error(`يجب اختيار مجموعة واحدة لكل مادة من مواد الباكدج (${selectedCount} من ${groupsBySubject.length} مختار)`);
      return;
    }

    const selectedGroupIds = Object.values(selectedGroupPerSubject);

    setSubmittingEnroll(true);
    try {
      const { data } = await api.post(`/packages/${pkg.id}/enroll`, {
        student_id: selectedStudent.id,
        selected_group_ids: selectedGroupIds,
        notes: enrollNotes,
      });

      toast.success(data.message || 'تم تسكين الطالب بنجاح في مجموعات الباكدج');
      // Reset form
      setSelectedStudent(null);
      setSelectedGroupPerSubject({});
      setEnrollNotes('');
      setSearchStudentQuery('');
      setActiveTab('students');
      loadPackageData();
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل الطالب في الباكدج');
    } finally {
      setSubmittingEnroll(false);
    }
  };

  if (!isOpen || !pkg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-white" style={{ background: '#0C3C82' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white flex-shrink-0">
              <Package size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">{pkg.name}</h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                  {pkg.education_type === 'LANGUAGES' ? '🌐 لغات' : '🏛️ حكومي'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-mono">
                  {parseFloat(pkg.package_price).toFixed(0)} ج.م/شهر
                </span>
              </div>
              <p className="text-white/70 text-xs mt-0.5">
                {pkg.grade_name} • إدارة المجموعات المؤهلة للباكدج وقواعد التسكين الإلزامية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50/80">
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'groups'
                ? 'border-[#0C3C82] text-[#0C3C82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers size={16} />
            <span>المجموعات والمواد المتاحة ({pkgGroups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('enroll')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'enroll'
                ? 'border-[#0C3C82] text-[#0C3C82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus size={16} />
            <span>تسجيل وتسكين طالب بالباكدج</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'students'
                ? 'border-[#0C3C82] text-[#0C3C82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={16} />
            <span>الطلاب المشتركون ({enrolledStudents.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="p-16 text-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-[#0C3C82] mx-auto mb-2" />
              <p className="text-xs font-bold">جاري تحميل بيانات الباكدج والمجموعات...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: GROUPS BY SUBJECT */}
              {activeTab === 'groups' && (
                <div className="space-y-6">
                  {/* Top Bar Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">
                        مجموعات باكدج {pkg.grade_name} ({groupsBySubject.length} مواد دراسية)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        يمكنك إضافة عدة مجموعات لنفس المادة (بمواعيد أو مدرسين مختلفين). عند اشتراك الطالب يختار مجموعة واحدة فقط لكل مادة.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddGroups}
                      className="atlas-btn atlas-btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Plus size={15} />
                      <span>إضافة مجموعات للباكدج</span>
                    </button>
                  </div>

                  {groupsBySubject.length === 0 ? (
                    <div className="atlas-card p-12 text-center border-dashed border-2 border-slate-300">
                      <BookOpen size={40} className="mx-auto mb-3 text-slate-400 opacity-60" />
                      <h4 className="text-sm font-bold text-slate-700">لم يتم ربط أي مجموعات بهذا الباكدج بعد</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        قم بالضغط على زر "إضافة مجموعات للباكدج" أعلاه لتحديد مجموعات الصف الدراسي المتاحة للطلاب.
                      </p>
                      <button
                        onClick={handleOpenAddGroups}
                        className="mt-4 atlas-btn atlas-btn-primary text-xs inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>إضافة مجموعات الآن</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {groupsBySubject.map((sub) => (
                        <div key={sub.subject_id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                          {/* Subject Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                                style={{ background: sub.subject_color }}
                              />
                              <h4 className="text-sm font-black text-slate-900">{sub.subject_name}</h4>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {sub.groups.length} مجموعات متاحة
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              (يختار الطالب مجموعة واحدة من هذه المجموعات)
                            </span>
                          </div>

                          {/* Groups List in this Subject */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sub.groups.map((grp) => (
                              <div
                                key={grp.id}
                                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-1 mb-2">
                                    <h5 className="font-bold text-xs text-slate-800 leading-tight">
                                      {grp.name}
                                    </h5>
                                    <button
                                      onClick={() => handleRemoveGroup(grp.id, grp.name)}
                                      title="إزالة من الباكدج"
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>

                                  <p className="text-xs text-slate-600 font-medium mb-2 flex items-center gap-1.5">
                                    <span>👨‍🏫 {grp.teacher_name || 'بدون مدرس'}</span>
                                  </p>

                                  {/* Schedule */}
                                  {Array.isArray(grp.schedule) && grp.schedule.length > 0 && (
                                    <div className="space-y-1 mb-2">
                                      {grp.schedule.map((slot, idx) => (
                                        <div key={idx} className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                          <Clock size={10} className="text-slate-400" />
                                          <span>{slot.day}: {slot.start_time} - {slot.end_time}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                                  <span>{grp.student_count || 0} طالب مسجل</span>
                                  {grp.classroom_name && <span className="text-[10px]">قاعة: {grp.classroom_name}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ENROLL STUDENT WIZARD */}
              {activeTab === 'enroll' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Step 1: Select Student */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0C3C82] text-white text-xs flex items-center justify-center font-bold">1</span>
                      اختيار الطالب المراد تسكينه في باكدج {pkg.grade_name}
                    </h3>

                    {!selectedStudent ? (
                      <div className="relative">
                        <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="ابحث باسم الطالب أو رقم الهاتف أو كود الطالب..."
                          value={searchStudentQuery}
                          onChange={(e) => setSearchStudentQuery(e.target.value)}
                          className="atlas-input pr-10 text-xs"
                        />
                        {searchingStudents && (
                          <Loader2 size={16} className="animate-spin absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        )}

                        {searchedStudents.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                            {searchedStudents.map((st) => (
                              <div
                                key={st.id}
                                onClick={() => {
                                  setSelectedStudent(st);
                                  setSearchStudentQuery('');
                                  setSearchedStudents([]);
                                }}
                                className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{st.full_name}</p>
                                  <p className="text-[11px] text-slate-500 font-mono">
                                    كود: #{st.student_code} • هاتف: {st.phone || '—'}
                                  </p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                                  {st.grade_name || 'طالب'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0C3C82] text-white flex items-center justify-center font-bold text-sm">
                            {selectedStudent.full_name?.[0] || 'ط'}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{selectedStudent.full_name}</h4>
                            <p className="text-[11px] text-slate-600 font-mono">
                              كود: #{selectedStudent.student_code} • باركود: {selectedStudent.barcode_id || '—'} • تليفون: {selectedStudent.phone || '—'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedStudent(null)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline"
                        >
                          تغيير الطالب
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Step 2: 1-Group-per-Subject Selection */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#0C3C82] text-white text-xs flex items-center justify-center font-bold">2</span>
                        تحديد مجموعات المواد (مجموعة واحدة فقط لكل مادة)
                      </h3>

                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        allSubjectsCovered
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        تم تحديد {selectedCount} من {groupsBySubject.length} مادة
                      </span>
                    </div>

                    {groupsBySubject.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        لا توجد مجموعات مسجلة في هذا الباكدج. يرجى إضافة مجموعات أولاً من التبويب السابق.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {groupsBySubject.map((sub, sIdx) => {
                          const currentSelectedGroup = selectedGroupPerSubject[sub.subject_id];
                          return (
                            <div
                              key={sub.subject_id}
                              className={`p-4 rounded-xl border transition-all ${
                                currentSelectedGroup
                                  ? 'bg-white border-blue-300 shadow-2xs'
                                  : 'bg-slate-50/80 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ background: sub.subject_color }} />
                                  <h4 className="text-xs font-black text-slate-900">{sub.subject_name}</h4>
                                </div>
                                {currentSelectedGroup ? (
                                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 size={13} />
                                    تم اختيار المجموعة
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                                    <AlertCircle size={13} />
                                    مطلوب اختيار مجموعة
                                  </span>
                                )}
                              </div>

                              {/* Radio cards for groups of this subject */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {sub.groups.map((grp) => {
                                  const isSelected = currentSelectedGroup === grp.id;
                                  return (
                                    <div
                                      key={grp.id}
                                      onClick={() => handleSelectGroupForSubject(sub.subject_id, grp.id)}
                                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                                        isSelected
                                          ? 'bg-blue-50/70 border-[#0C3C82] text-slate-900 shadow-xs'
                                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                      }`}
                                    >
                                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? 'border-[#0C3C82] bg-[#0C3C82] text-white' : 'border-slate-300 bg-white'
                                      }`}>
                                        {isSelected && <Check size={10} />}
                                      </div>
                                      <div className="text-xs flex-1">
                                        <p className="font-bold">{grp.name}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          👨‍🏫 {grp.teacher_name || 'بدون مدرس'}
                                        </p>
                                        {Array.isArray(grp.schedule) && grp.schedule.length > 0 && (
                                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                            {grp.schedule.map(s => `${s.day} ${s.start_time}`).join(' • ')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 3: Confirmation Box & Submit */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">إجمالي رسوم الباكدج الشهرية:</p>
                      <p className="text-xl font-black text-[#0C3C82] font-mono mt-0.5">
                        {parseFloat(pkg.package_price).toFixed(0)} ج.م <small className="text-xs font-normal text-slate-500">لجميع المواد الـ {groupsBySubject.length}</small>
                      </p>
                    </div>

                    <button
                      disabled={!selectedStudent || !allSubjectsCovered || submittingEnroll}
                      onClick={handleEnrollSubmit}
                      className="atlas-btn atlas-btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {submittingEnroll ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>جاري التسكين...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>تأكيد الاشتراك وتسكين الطالب</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: ENROLLED STUDENTS LIST */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800">
                      قائمة الطلاب المشتركين في باكدج {pkg.grade_name} ({enrolledStudents.length} طالب)
                    </h3>
                  </div>

                  {enrolledStudents.length === 0 ? (
                    <div className="atlas-card p-12 text-center border-dashed border-2 border-slate-300">
                      <Users size={36} className="mx-auto mb-2 text-slate-400 opacity-60" />
                      <p className="text-xs font-bold text-slate-700">لم يتم تسكين أي طلاب في هذا الباكدج بعد</p>
                      <button
                        onClick={() => setActiveTab('enroll')}
                        className="mt-3 atlas-btn atlas-btn-outline text-xs inline-flex items-center gap-1.5"
                      >
                        <UserPlus size={13} />
                        <span>تسجيل أول طالب في الباكدج</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr style={{ background: '#0C3C82' }}>
                              <th className="text-white py-3 px-4 font-semibold">الطالب</th>
                              <th className="text-white py-3 px-4 font-semibold">الهاتف</th>
                              <th className="text-white py-3 px-4 font-semibold">المجموعات المسجل بها</th>
                              <th className="text-white py-3 px-4 font-semibold">تاريخ الاشتراك</th>
                              <th className="text-white py-3 px-4 font-semibold">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {enrolledStudents.map((st) => (
                              <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0C3C82] flex items-center justify-center font-bold text-xs">
                                      {st.student_name?.[0] || 'ط'}
                                    </div>
                                    <div>
                                      <p>{st.student_name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">#{st.student_code}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600">{st.student_phone || '—'}</td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {Array.isArray(st.selected_groups) ? (
                                      st.selected_groups.map((g, idx) => (
                                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                          {g.subject_name}: {g.name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-500">
                                  {new Date(st.enrolled_at).toLocaleDateString('ar-EG')}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    نشط
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
          <span className="text-slate-500">
            📦 نظام باكدجات المراحل التعليمية • أكاديمية أطلس التعليمية
          </span>
          <button
            onClick={onClose}
            className="atlas-btn atlas-btn-secondary px-4 py-1.5"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Submodal: Add Available Groups to Package */}
      {addGroupsModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-800">
                إضافة مجموعات إلى باكدج {pkg.grade_name}
              </h4>
              <button onClick={() => setAddGroupsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingAvailable ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 size={24} className="animate-spin text-[#0C3C82] mx-auto mb-2" />
                  <p className="text-xs">جاري البحث عن مجموعات المرحلة...</p>
                </div>
              ) : availableGroups.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  لا توجد مجموعات أخرى متاحة في هذه المرحلة لم يتم إضافتها بالفعل.
                </p>
              ) : (
                availableGroups.map((grp) => {
                  const isChecked = selectedToAdd.includes(grp.id);
                  return (
                    <div
                      key={grp.id}
                      onClick={() => {
                        setSelectedToAdd(prev =>
                          isChecked ? prev.filter(id => id !== grp.id) : [...prev, grp.id]
                        );
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked ? 'bg-blue-50/70 border-[#0C3C82]' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'bg-[#0C3C82] border-[#0C3C82] text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check size={12} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{grp.name}</p>
                          <p className="text-[11px] text-slate-500">
                            مادة: {grp.subject_name} • مدرس: {grp.teacher_name || 'بدون'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {grp.student_count || 0} طالب
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">
                تم تحديد {selectedToAdd.length} مجموعة
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddGroupsModalOpen(false)}
                  className="atlas-btn atlas-btn-ghost text-xs"
                >
                  إلغاء
                </button>
                <button
                  disabled={selectedToAdd.length === 0}
                  onClick={handleConfirmAddGroups}
                  className="atlas-btn atlas-btn-primary text-xs disabled:opacity-50"
                >
                  إضافة المجموعات المحددة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
