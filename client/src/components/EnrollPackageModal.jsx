import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Package, BookOpen, User, Calendar, Clock, CheckCircle2,
  AlertCircle, DollarSign, Wallet, Percent, Coins, X,
  Layers, Lock, Sparkles, Loader2, ArrowRight, ChevronDown
} from 'lucide-react';

export default function EnrollPackageModal({ isOpen, onClose, student, onSuccess }) {
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Groups linked to selected package
  const [packageGroups, setPackageGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Selected group per subject: { [subject_id]: group_id }
  const [selectedGroups, setSelectedGroups] = useState({});

  // Financial inputs
  const [discountType, setDiscountType] = useState('FIXED'); // 'FIXED' or 'PERCENT'
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(4);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load packages for student's grade when modal opens
  useEffect(() => {
    if (!isOpen || !student?.grade_id) return;
    const fetchPackages = async () => {
      setLoadingPackages(true);
      try {
        const { data } = await api.get('/packages');
        const gradePkgs = (data.data || []).filter(
          (p) => p.grade_id === student.grade_id && p.is_active !== false
        );
        setPackages(gradePkgs);
        if (gradePkgs.length > 0) {
          setSelectedPackageId(gradePkgs[0].id);
        }
      } catch (err) {
        console.error('Failed to load packages:', err);
        toast.error('تعذر تحميل باكدجات المرحلة');
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, [isOpen, student?.grade_id]);

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

  // Pricing calculations
  const packagePrice = parseFloat(currentPackage?.package_price) || 0;
  const singleSubjectPrice = parseFloat(currentPackage?.single_subject_price) || 0;

  const grossPrice = useMemo(() => {
    if (selectedCount === 0) return 0;
    if (isFullPackage) return packagePrice;
    return singleSubjectPrice * selectedCount;
  }, [selectedCount, isFullPackage, packagePrice, singleSubjectPrice]);

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
      .map((s) => `${dayMap[s.day] || s.day} (${s.start_time} - ${s.end_time})`)
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
        sessions_count: parseInt(sessionsCount, 10) || 4,
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
        <div className="p-5 text-white flex items-center justify-between" style={{ background: '#0C3C82' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl shadow-inner">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                إضافة الطالب لباكدج ومواد السنتر
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                الطالب: <strong>{student?.full_name_ar || student?.full_name}</strong> {student?.student_code ? `(#${student.student_code})` : ''}
                {student?.grade_name && <span className="mr-2 text-white/90">• {student.grade_name}</span>}
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
            {/* Top Row: Package Select & Locked Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              {/* Locked Grade */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>المرحلة الدراسية للطالب:</span>
                </label>
                <div className="atlas-input text-xs py-2 bg-blue-50/70 border-blue-200 text-slate-800 font-bold flex items-center justify-between cursor-not-allowed select-none">
                  <span className="truncate text-[#0C3C82]">{student?.grade_name || 'مرحلة الطالب'}</span>
                  <span className="text-[10px] bg-white border border-blue-200 text-slate-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                    <Lock size={10} className="text-amber-600" />
                    <span>مثبت</span>
                  </span>
                </div>
              </div>

              {/* Package Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Package size={13} className="text-[#0C3C82]" />
                  <span>اختر الباكدج التابع للمرحلة:</span>
                </label>
                {loadingPackages ? (
                  <div className="atlas-input text-xs py-2 flex items-center justify-center text-slate-400">
                    <Loader2 size={14} className="animate-spin ml-2" />
                    جاري جلب الباكدجات...
                  </div>
                ) : packages.length === 0 ? (
                  <div className="atlas-input text-xs py-2 text-rose-500 bg-rose-50 border-rose-200 font-bold">
                    لا توجد باكدجات مسجلة لهذه المرحلة
                  </div>
                ) : (
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className="atlas-input text-xs py-2 font-bold bg-white"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.education_type === 'PUBLIC' ? 'عربي / حكومي' : 'لغات / تجريبي'}) — باكدج: {pkg.package_price} ج.م | مادة السنتر: {pkg.single_subject_price} ج.م
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
                {/* Gross Price */}
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-[11px] text-white/60 block">السعر الأساسي</span>
                  <p className="text-lg font-black text-white mt-1">
                    {grossPrice} <span className="text-xs font-normal text-white/70">ج.م</span>
                  </p>
                  <span className="text-[10px] text-white/40 block mt-0.5">
                    {isFullPackage ? 'سعر الباكدج الرسمي' : `${selectedCount} × ${singleSubjectPrice} ج.م`}
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

              {/* Sessions Count & Billing Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10 text-xs">
                <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="text-white/70">عدد الحصص المشحونة لكل مادة:</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 4, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSessionsCount(num)}
                        className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
                          sessionsCount === num
                            ? 'bg-amber-400 text-slate-900 shadow-sm'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {num} حصص
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="text-white/70">شهر الفاتورة والاشتراك:</span>
                  <input
                    type="month"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="bg-white/10 text-white text-xs font-bold py-1 px-2 rounded-lg border border-white/10 text-center"
                  />
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
