import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Package, BookOpen, User, Calendar, Clock, CheckCircle2,
  AlertCircle, DollarSign, Wallet, Percent, Coins, X,
  Layers, Lock, Sparkles, Loader2, ArrowRight, ChevronDown,
  GraduationCap, Edit3
} from 'lucide-react';

export default function EnrollPackageModal({ isOpen, onClose, student, onSuccess }) {
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Student Education Type (PUBLIC = عربي / حكومي, LANGUAGES = لغات / تجريبي)
  const [studentEduType, setStudentEduType] = useState(student?.education_type || 'PUBLIC');
  const [isChangingEduType, setIsChangingEduType] = useState(false);
  const [updatingEduType, setUpdatingEduType] = useState(false);

  // Sync education_type whenever student prop updates
  useEffect(() => {
    if (student?.education_type) {
      setStudentEduType(student.education_type);
    }
  }, [student]);

  // Groups linked to selected package
  const [packageGroups, setPackageGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Selected group per subject: { [subject_id]: group_id }
  const [selectedGroups, setSelectedGroups] = useState({});

  // Financial & Duration inputs (Package by Full Month Day 1-30 or custom days: 10, 15, 30)
  const [discountType, setDiscountType] = useState('FIXED'); // 'FIXED' or 'PERCENT'
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [durationDays, setDurationDays] = useState(30);
  const [durationMode, setDurationMode] = useState('MONTH_1_30'); // 'MONTH_1_30' | '30_DAYS' | '15_DAYS' | '10_DAYS' | 'CUSTOM'
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState(() => {
    const ym = new Date().toISOString().slice(0, 7);
    return `${ym}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const ym = now.toISOString().slice(0, 7);
    return `${ym}-${String(Math.min(30, lastDay)).padStart(2, '0')}`;
  });
  const [customGrossPrice, setCustomGrossPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const computeEndDateFromStart = (startStr, days) => {
    if (!startStr) return '';
    const d = new Date(`${startStr}T12:00:00Z`);
    if (isNaN(d.getTime())) return '';
    d.setUTCDate(d.getUTCDate() + Math.max(0, (parseInt(days, 10) || 30) - 1));
    return d.toISOString().slice(0, 10);
  };

  const applyDurationPreset = (mode, customDaysVal = 30, targetMonth = billingMonth) => {
    setDurationMode(mode);
    setCustomGrossPrice('');
    const todayStr = new Date().toISOString().slice(0, 10);
    if (mode === 'MONTH_1_30') {
      const ym = targetMonth || new Date().toISOString().slice(0, 7);
      const [y, m] = ym.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      setDurationDays(30);
      setStartDate(`${ym}-01`);
      setEndDate(`${ym}-${String(Math.min(30, lastDay)).padStart(2, '0')}`);
    } else if (mode === '30_DAYS') {
      setDurationDays(30);
      setStartDate(todayStr);
      setEndDate(computeEndDateFromStart(todayStr, 30));
    } else if (mode === '15_DAYS') {
      setDurationDays(15);
      setStartDate(todayStr);
      setEndDate(computeEndDateFromStart(todayStr, 15));
    } else if (mode === '10_DAYS') {
      setDurationDays(10);
      setStartDate(todayStr);
      setEndDate(computeEndDateFromStart(todayStr, 10));
    } else {
      const d = Math.max(1, parseInt(customDaysVal, 10) || 10);
      setDurationDays(d);
      setEndDate(computeEndDateFromStart(startDate || todayStr, d));
    }
  };

  // Switch student education type and persist to DB
  const handleSwitchEducationType = async (newType) => {
    if (newType === studentEduType) {
      setIsChangingEduType(false);
      return;
    }
    setUpdatingEduType(true);
    try {
      await api.put(`/students/${student.id}`, { education_type: newType });
      setStudentEduType(newType);
      setIsChangingEduType(false);
      toast.success(`تم تحديث مسار الطالب إلى: ${newType === 'LANGUAGES' ? '🌐 لغات / تجريبي' : '🏛️ حكومي / عربي'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تعديل نوع التعليم للطالب');
    } finally {
      setUpdatingEduType(false);
    }
  };

  // Load packages matching student's grade AND education_type
  useEffect(() => {
    if (!isOpen || !student?.grade_id) return;
    const fetchPackages = async () => {
      setLoadingPackages(true);
      try {
        const { data } = await api.get('/packages');
        const matchingPkgs = (data.data || []).filter(
          (p) => p.grade_id === student.grade_id &&
                 p.is_active !== false &&
                 (p.education_type === studentEduType || (!p.education_type && studentEduType === 'PUBLIC'))
        );
        setPackages(matchingPkgs);
        if (matchingPkgs.length > 0) {
          setSelectedPackageId(matchingPkgs[0].id);
        } else {
          setSelectedPackageId('');
        }
      } catch (err) {
        console.error('Failed to load packages:', err);
        toast.error('تعذر تحميل باكدجات المرحلة');
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, [isOpen, student?.grade_id, studentEduType]);

  // Load package groups when selectedPackageId changes
  useEffect(() => {
    if (!selectedPackageId) {
      setPackageGroups([]);
      setSelectedGroups({});
      return;
    }
    const fetchPackageGroups = async () => {
      setLoadingGroups(true);
      try {
        const { data } = await api.get(`/packages/${selectedPackageId}/groups`);
        const groups = data.data || [];
        setPackageGroups(groups);

        // Pre-select group if a subject only has 1 group
        const initialSelected = {};
        const subjectMap = {};
        groups.forEach((g) => {
          if (!subjectMap[g.subject_id]) subjectMap[g.subject_id] = [];
          subjectMap[g.subject_id].push(g);
        });

        Object.entries(subjectMap).forEach(([subId, grpList]) => {
          if (grpList.length === 1) {
            initialSelected[subId] = grpList[0].id;
          }
        });
        setSelectedGroups(initialSelected);
      } catch (err) {
        console.error('Failed to load package groups:', err);
        toast.error('تعذر تحميل مجموعات الباكدج');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchPackageGroups();
  }, [selectedPackageId]);

  // Selected package object
  const currentPackage = useMemo(() => {
    return packages.find((p) => p.id === selectedPackageId) || null;
  }, [packages, selectedPackageId]);

  // Group package groups by subject
  const subjectsMap = useMemo(() => {
    const map = {};
    packageGroups.forEach((g) => {
      const subId = g.subject_id || 'unknown';
      if (!map[subId]) {
        map[subId] = {
          subject_id: subId,
          subject_name: g.subject_name || 'مادة بدون اسم',
          subject_color: g.subject_color || '#0C3C82',
          groups: [],
        };
      }
      map[subId].groups.push(g);
    });
    return map;
  }, [packageGroups]);

  const subjectList = useMemo(() => Object.values(subjectsMap), [subjectsMap]);
  const totalSubjectsCount = subjectList.length;

  // Selected groups count
  const selectedGroupIds = useMemo(() => {
    return Object.values(selectedGroups).filter(Boolean);
  }, [selectedGroups]);

  const selectedCount = selectedGroupIds.length;
  const isFullPackage = selectedCount === totalSubjectsCount && totalSubjectsCount > 0;

  // Pricing calculations (Monthly base price scaled proportionally by durationDays)
  const packagePrice = parseFloat(currentPackage?.package_price) || 0;
  const singleSubjectPrice = parseFloat(currentPackage?.single_subject_price) || 0;

  const monthlyBasePrice = useMemo(() => {
    if (selectedCount === 0) return 0;
    if (isFullPackage) return packagePrice;
    return singleSubjectPrice * selectedCount;
  }, [selectedCount, isFullPackage, packagePrice, singleSubjectPrice]);

  const grossPrice = useMemo(() => {
    if (selectedCount === 0) return 0;
    if (customGrossPrice !== '' && customGrossPrice !== null && !isNaN(parseFloat(customGrossPrice))) {
      return Math.max(0, parseFloat(customGrossPrice));
    }
    const days = Math.max(1, parseInt(durationDays, 10) || 30);
    if (days === 30) return monthlyBasePrice;
    return Math.round((monthlyBasePrice / 30) * days);
  }, [selectedCount, monthlyBasePrice, durationDays, customGrossPrice]);

  const discountAmount = useMemo(() => {
    const val = Math.max(0, parseFloat(discountValue) || 0);
    if (discountType === 'PERCENT') {
      return Math.min(grossPrice, Math.round((grossPrice * val) / 100));
    }
    return Math.min(grossPrice, val);
  }, [grossPrice, discountType, discountValue]);

  const netPrice = Math.max(0, grossPrice - discountAmount);
  const paidNum = Math.min(netPrice, Math.max(0, parseFloat(amountPaid) || 0));
  const remainingDebt = Math.max(0, netPrice - paidNum);

  // Auto-sync amount paid when netPrice changes if user hasn't typed a custom amount
  useEffect(() => {
    setAmountPaid(netPrice);
  }, [netPrice]);

  const handleGroupSelect = (subjectId, groupId) => {
    setSelectedGroups((prev) => {
      const updated = { ...prev };
      if (!groupId) {
        delete updated[subjectId];
      } else {
        updated[subjectId] = groupId;
      }
      return updated;
    });
  };

  const formatSchedule = (schedule) => {
    if (!schedule) return 'ميعاد غير محدد';
    let slots = [];
    try {
      slots = Array.isArray(schedule) ? schedule : JSON.parse(schedule);
    } catch {
      return 'ميعاد غير محدد';
    }
    const dayMap = {
      saturday: 'السبت',
      sunday: 'الأحد',
      monday: 'الاثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة',
    };
    return slots
      .map((s) => `${dayMap[s.day] || s.day} (${s.start_time} - ${s.end_time}${s.frequency === 'biweekly' ? ' • أسبوع اه وأسبوع لا' : ''})`)
      .join(' ، ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackageId) {
      toast.error('يرجى اختيار الباكدج');
      return;
    }
    if (selectedGroupIds.length === 0) {
      toast.error('يرجى اختيار مجموعة واحدة على الأقل للاشتراك');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(`/packages/${selectedPackageId}/enroll`, {
        student_id: student.id,
        selected_group_ids: selectedGroupIds,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        amount_paid: paidNum,
        duration_days: Math.max(1, parseInt(durationDays, 10) || 30),
        start_date: startDate,
        end_date: endDate,
        custom_gross_price: customGrossPrice !== '' ? parseFloat(customGrossPrice) : undefined,
        billing_month: billingMonth,
        notes: notes.trim() || undefined,
      });

      toast.success(data.message || 'تم تسكين الطالب وتفعيل الحساب بنجاح');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Enroll error:', err);
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تسكين الطالب في الباكدج');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 text-white flex items-center justify-between" style={{ background: '#0C3C82' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl shadow-inner">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                إضافة الطالب لباكدج ومواد السنتر
              </h3>
              <p className="text-xs text-white/80 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>الطالب: <strong>{student?.full_name_ar || student?.full_name}</strong> {student?.student_code ? `(#${student.student_code})` : ''}</span>
                {student?.grade_name && <span>• <strong>{student.grade_name}</strong></span>}
                <span className="px-2 py-0.5 rounded-lg bg-white/20 text-white font-bold text-[11px] border border-white/20">
                  {studentEduType === 'LANGUAGES' ? '🌐 لغات / تجريبي' : '🏛️ حكومي / عربي'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Top Row: Locked Grade, Locked Education Type, and Matched Package */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              {/* 1. Locked Grade */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <GraduationCap size={13} className="text-[#0C3C82]" />
                  <span>المرحلة الدراسية للطالب:</span>
                </label>
                <div className="atlas-input text-xs py-2 bg-blue-50/70 border-blue-200 text-slate-800 font-bold flex items-center justify-between cursor-not-allowed select-none">
                  <span className="truncate text-[#0C3C82]">{student?.grade_name || 'مرحلة الطالب'}</span>
                  <span className="text-[10px] bg-white border border-blue-200 text-slate-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shadow-2xs">
                    <Lock size={10} className="text-amber-600" />
                    <span>مثبت</span>
                  </span>
                </div>
              </div>

              {/* 2. Locked Education Type (عربي / لغات) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <BookOpen size={13} className="text-emerald-700" />
                    <span>نوع التعليم / المسار:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsChangingEduType(!isChangingEduType)}
                    className="text-[10px] text-blue-700 hover:text-blue-900 font-bold underline flex items-center gap-0.5"
                    title="تعديل مسار الطالب بين عربي ولغات"
                  >
                    <Edit3 size={10} />
                    <span>{isChangingEduType ? 'إلغاء' : 'تعديل؟'}</span>
                  </button>
                </div>

                {isChangingEduType ? (
                  <div className="flex items-center gap-1.5 animate-fade-in">
                    <button
                      type="button"
                      disabled={updatingEduType}
                      onClick={() => handleSwitchEducationType('PUBLIC')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        studentEduType === 'PUBLIC'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      🏛️ عربي / حكومي
                    </button>
                    <button
                      type="button"
                      disabled={updatingEduType}
                      onClick={() => handleSwitchEducationType('LANGUAGES')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        studentEduType === 'LANGUAGES'
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      🌐 لغات / تجريبي
                    </button>
                  </div>
                ) : (
                  <div className="atlas-input text-xs py-2 bg-emerald-50/70 border-emerald-200 text-slate-800 font-bold flex items-center justify-between cursor-not-allowed select-none">
                    <span className="truncate text-emerald-900 font-black flex items-center gap-1">
                      {studentEduType === 'LANGUAGES' ? '🌐 لغات / تجريبي' : '🏛️ حكومي / عربي'}
                    </span>
                    <span className="text-[10px] bg-white border border-emerald-300 text-emerald-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shadow-2xs">
                      <Lock size={10} className="text-emerald-600" />
                      <span>مثبت</span>
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Matched Package */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Package size={13} className="text-[#0C3C82]" />
                  <span>الباكدج المطابق للطالب:</span>
                </label>
                {loadingPackages ? (
                  <div className="atlas-input text-xs py-2 flex items-center justify-center text-slate-400">
                    <Loader2 size={14} className="animate-spin ml-2" />
                    جاري جلب الباكدج...
                  </div>
                ) : packages.length === 0 ? (
                  <div className="atlas-input text-xs py-2 text-rose-500 bg-rose-50 border-rose-200 font-bold">
                    لا يوجد باكدج مسجل لمسار ({studentEduType === 'LANGUAGES' ? 'لغات' : 'عربي'}) لهذه المرحلة
                  </div>
                ) : packages.length === 1 ? (
                  <div className="atlas-input text-xs py-2 bg-amber-50/80 border-amber-300 text-slate-900 font-bold flex items-center justify-between cursor-not-allowed select-none shadow-2xs">
                    <span className="truncate text-amber-950 font-black">
                      {packages[0].name} ({packages[0].package_price} ج.م)
                    </span>
                    <span className="text-[10px] bg-white border border-amber-300 text-amber-900 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 whitespace-nowrap shadow-2xs">
                      <Lock size={10} className="text-amber-600" />
                      <span>مثبت تلقائياً</span>
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className="atlas-input text-xs py-2 font-bold bg-white"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — باكدج: {pkg.package_price} ج.م | مادة السنتر: {pkg.single_subject_price} ج.م
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Subject Sections & Group Dropdowns */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                  <Layers size={16} className="text-[#0C3C82]" />
                  <span>أقسام المواد والمجموعات المرشحة ({totalSubjectsCount} مادة)</span>
                </h4>
                <div className="text-[11px] font-bold">
                  {isFullPackage ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                      <Sparkles size={12} className="text-emerald-600" />
                      <span>باكدج كامل (جميع المواد مختارة)</span>
                    </span>
                  ) : selectedCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-2xs">
                      <span>محسوب كمواد سنتر منفردة ({selectedCount} من {totalSubjectsCount})</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">اختر المجموعات المراد قيد الطالب بها</span>
                  )}
                </div>
              </div>

              {loadingGroups ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 size={32} className="animate-spin text-[#0C3C82] mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">جاري تحميل مجموعات الباكدج...</p>
                </div>
              ) : subjectList.length === 0 ? (
                <div className="atlas-card p-8 text-center border-dashed border-slate-300">
                  <AlertCircle size={36} className="mx-auto mb-2 text-amber-500 opacity-80" />
                  <p className="text-xs font-bold text-slate-600">لا توجد مجموعات مرتبطة بهذا الباكدج حالياً</p>
                  <p className="text-[11px] text-slate-400 mt-1">يمكنك إضافة مجموعات للباكدج من صفحة "الباكدجات".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {subjectList.map((subject) => {
                    const chosenGroupId = selectedGroups[subject.subject_id] || '';
                    const isChosen = Boolean(chosenGroupId);
                    const chosenGroup = subject.groups.find((g) => g.id === chosenGroupId);

                    return (
                      <div
                        key={subject.subject_id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isChosen
                            ? 'bg-blue-50/40 border-[#0C3C82]/40 shadow-xs ring-1 ring-[#0C3C82]/15'
                            : 'bg-white border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        {/* Subject Title Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5"
                            style={{
                              backgroundColor: `${subject.subject_color}15`,
                              color: subject.subject_color,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: subject.subject_color }}
                            />
                            <span>{subject.subject_name}</span>
                          </span>

                          <span className="text-[11px] text-slate-400 font-medium">
                            {subject.groups.length} مجموعات متاحة
                          </span>
                        </div>

                        {/* Select Box for Groups */}
                        <div className="relative mt-1">
                          <select
                            value={chosenGroupId}
                            onChange={(e) => handleGroupSelect(subject.subject_id, e.target.value)}
                            className={`w-full text-xs py-2.5 px-3 rounded-xl border transition-all appearance-none outline-none cursor-pointer ${
                              isChosen
                                ? 'bg-white font-bold text-slate-900 border-[#0C3C82] shadow-sm ring-2 ring-[#0C3C82]/10'
                                : 'bg-slate-50 text-slate-600 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#0C3C82]'
                            }`}
                          >
                            <option value="">-- بدون اشتراك في هذه المادة --</option>
                            {subject.groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name} — أ/ {group.teacher_name || 'غير محدد'} ({formatSchedule(group.schedule)})
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown size={14} />
                          </div>
                        </div>

                        {/* Schedule & Teacher preview if chosen */}
                        {chosenGroup && (
                          <div className="mt-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-blue-200/60 shadow-xs flex items-center justify-between">
                            <span className="flex items-center gap-1.5 truncate font-bold text-slate-800">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0C3C82] flex items-center justify-center text-[10px]">
                                <User size={12} />
                              </span>
                              <span>أ/ {chosenGroup.teacher_name}</span>
                            </span>
                            <span className="flex items-center gap-1 text-slate-600 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                              <Clock size={12} className="text-amber-600" />
                              <span>{formatSchedule(chosenGroup.schedule)}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Financial Summary & Calculation Strip */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-xl border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-black flex items-center gap-2">
                    <Wallet size={18} className="text-amber-400" />
                    <span>ملخص الحسابات والماليات وخزينة السنتر</span>
                  </h4>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    الاحتساب الآلي (باكدج كامل أم مادة سنتر) وفق عدد المواد المختارة
                  </p>
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-white/50 block">نوع القيد والاشتراك</span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full inline-block mt-0.5 shadow-sm ${
                      isFullPackage
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : selectedCount > 0
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {isFullPackage
                      ? '✨ الباكدج الكامل'
                      : selectedCount > 0
                      ? `🏷️ مواد سنتر منفردة (${selectedCount} مواد)`
                      : 'لم يتم اختيار مواد'}
                  </span>
                </div>
              </div>

              {/* Financial Inputs & Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
                {/* Gross Price (Editable or Proportional by Days) */}
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-[11px] text-white/60 block">
                    السعر المطلوب ({durationDays === 30 ? 'شهر كامل 30 يوم' : `${durationDays} يوم`})
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      min="0"
                      value={customGrossPrice !== '' ? customGrossPrice : grossPrice}
                      onChange={(e) => setCustomGrossPrice(e.target.value)}
                      className="w-full bg-white/10 text-white text-sm font-black py-1 px-2 rounded-lg border border-white/15 text-center"
                    />
                    <span className="text-xs font-normal text-white/70">ج.م</span>
                  </div>
                  <span className="text-[10px] text-white/40 block mt-1">
                    {isFullPackage ? `سعر الشهر: ${packagePrice} ج.م` : `${selectedCount} × ${singleSubjectPrice} ج.م / شهر`}
                  </span>
                </div>

                {/* Persistent Discount with Segmented Toggle */}
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-[11px] text-white/60 block mb-1.5 font-bold">الخصم الدائم</span>
                  <div className="flex bg-black/30 p-0.5 rounded-xl border border-white/10 mb-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('FIXED')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        discountType === 'FIXED'
                          ? 'bg-amber-400 text-slate-900 shadow-sm'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      💵 مبلغ (ج.م)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENT')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        discountType === 'PERCENT'
                          ? 'bg-amber-400 text-slate-900 shadow-sm'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      ٪ نسبة (%)
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white/10 text-white text-xs font-bold py-1.5 px-2 rounded-xl border border-white/15 text-center focus:border-amber-400 outline-none"
                    />
                    <span className="text-xs font-bold text-amber-300 shrink-0">
                      {discountType === 'FIXED' ? 'ج.م' : '%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-amber-300 mt-1.5">
                    <span>خصم: {discountAmount} ج.م</span>
                    {discountValue > 0 && (
                      <button
                        type="button"
                        onClick={() => setDiscountValue(0)}
                        className="text-white/40 hover:text-rose-400 underline"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>

                {/* Net Price */}
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-[11px] text-white/60 block">الصافي بعد الخصم</span>
                  <p className="text-lg font-black text-emerald-400 mt-1">
                    {netPrice} <span className="text-xs font-normal text-white/70">ج.م</span>
                  </p>
                  <span className="text-[10px] text-emerald-400/70 block mt-0.5 font-bold">المستحق للدفع</span>
                </div>

                {/* Amount Paid Now */}
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-[11px] text-white/60 block mb-1">المدفوع الآن نقدياً</span>
                  <input
                    type="number"
                    min="0"
                    max={netPrice}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-white/10 text-white text-xs font-bold py-1 px-2 rounded-lg border border-white/10 text-center"
                  />
                  <span
                    className={`text-[10px] block mt-1 ${
                      remainingDebt > 0 ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {remainingDebt > 0 ? `مديونية: ${remainingDebt} ج.م` : 'مسدد بالكامل'}
                  </span>
                </div>
              </div>

              {/* Package Duration by Month (Day 1 to 30) or Custom Days (10, 15, etc.) */}
              <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-white/80 font-bold">مدة شحن اشتراك الباكدج (بالشهر أو بعدد الأيام):</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { mode: 'MONTH_1_30', label: '📅 شهر كامل (يوم 1 لـ 30)', days: 30 },
                      { mode: '30_DAYS', label: '🗓️ 30 يوم من اليوم', days: 30 },
                      { mode: '15_DAYS', label: '⏱️ 15 يوم (نصف شهر)', days: 15 },
                      { mode: '10_DAYS', label: '⏱️ 10 أيام', days: 10 },
                    ].map((preset) => (
                      <button
                        key={preset.mode}
                        type="button"
                        onClick={() => applyDurationPreset(preset.mode, preset.days)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          durationMode === preset.mode
                            ? 'bg-amber-400 text-slate-900 shadow-sm'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-white/60 block mb-1">عدد الأيام المشحونة:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={durationDays}
                        onChange={(e) => {
                          const d = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setDurationMode('CUSTOM');
                          setDurationDays(d);
                          setCustomGrossPrice('');
                          setEndDate(computeEndDateFromStart(startDate, d));
                        }}
                        className="w-full bg-white/10 text-amber-300 text-xs font-black py-1 px-2 rounded-lg border border-white/15 text-center"
                      />
                      <span className="text-[11px] text-white/70">يوم</span>
                    </div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-white/60 block mb-1">من تاريخ (بداية الاشتراك):</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        const s = e.target.value;
                        setStartDate(s);
                        setEndDate(computeEndDateFromStart(s, durationDays));
                      }}
                      className="w-full bg-white/10 text-white text-xs font-mono font-bold py-1 px-2 rounded-lg border border-white/15 text-center"
                    />
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-white/60 block mb-1">إلى تاريخ (نهاية الاشتراك):</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        const endStr = e.target.value;
                        setEndDate(endStr);
                        if (startDate && endStr) {
                          const sMs = new Date(`${startDate}T00:00:00Z`).getTime();
                          const eMs = new Date(`${endStr}T00:00:00Z`).getTime();
                          const diffDays = Math.max(1, Math.round((eMs - sMs) / (1000 * 60 * 60 * 24)) + 1);
                          setDurationMode('CUSTOM');
                          setDurationDays(diffDays);
                          setCustomGrossPrice('');
                        }
                      }}
                      className="w-full bg-white/10 text-white text-xs font-mono font-bold py-1 px-2 rounded-lg border border-white/15 text-center"
                    />
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-white/60 block mb-1">شهر الفاتورة:</span>
                    <input
                      type="month"
                      value={billingMonth}
                      onChange={(e) => {
                        const ym = e.target.value;
                        setBillingMonth(ym);
                        if (durationMode === 'MONTH_1_30' && ym) {
                          applyDurationPreset('MONTH_1_30', 30, ym);
                        }
                      }}
                      className="w-full bg-white/10 text-white text-xs font-mono font-bold py-1 px-2 rounded-lg border border-white/15 text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="atlas-btn atlas-btn-outline text-xs px-5 py-2.5"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={submitting || selectedCount === 0}
              className="atlas-btn-primary text-xs px-6 py-2.5 flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جاري تسكين الطالب والماليات...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>
                    تأكيد قيد الطالب في ({selectedCount} مواد) - الصافي {netPrice} ج.م
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
