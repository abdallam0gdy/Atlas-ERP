import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  CreditCard, Search, User, BookOpen, Clock, Calendar, CheckCircle2,
  AlertCircle, Plus, ChevronLeft, ArrowRight, Wallet, History,
  Sparkles, RefreshCw, X, ShieldAlert, Check, Coins, Layers,
  LogOut, AlertTriangle, ArrowUpRight, Filter, GraduationCap, Users,
  Lock, Loader2, Package, CheckSquare
} from 'lucide-react';
import EnrollPackageModal from '../components/EnrollPackageModal';
import ClearPackageRefundModal from '../components/ClearPackageRefundModal';

export default function StudentSubscriptionsPage() {
  // Navigation & view states
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'debts'

  // Student search & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentAccount, setStudentAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Modals state
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedGroupForRenew, setSelectedGroupForRenew] = useState(null);
  const [payDebtModalOpen, setPayDebtModalOpen] = useState(false);
  const [selectedGroupForPayDebt, setSelectedGroupForPayDebt] = useState(null);
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [selectedGroupForClearance, setSelectedGroupForClearance] = useState(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false); // Private group enrollment
  const [enrollPackageModalOpen, setEnrollPackageModalOpen] = useState(false); // Package bundle enrollment
  const [clearPackageModalOpen, setClearPackageModalOpen] = useState(false); // Whole package clearance
  const [selectedPackageForClearance, setSelectedPackageForClearance] = useState(null);

  // Group filter state
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'package' | 'private' | 'debt' | 'zero'

  // Masters
  const [allGroups, setAllGroups] = useState([]);
  const [allGrades, setAllGrades] = useState([]);

  // Debts report state
  const [debtsList, setDebtsList] = useState([]);
  const [totalDebtAmount, setTotalDebtAmount] = useState(0);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [debtSearch, setDebtSearch] = useState('');
  const [debtGradeFilter, setDebtGradeFilter] = useState('');

  // Initial load
  useEffect(() => {
    fetchMasters();
    fetchDebts();
  }, []);

  // Fetch student search results on typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const { data } = await api.get('/students', {
          params: { search: searchQuery.trim(), limit: 8 }
        });
        setSearchResults(data.data?.students || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load selected student account
  useEffect(() => {
    if (selectedStudentId) {
      loadStudentAccount(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchMasters = async () => {
    try {
      const [grpRes, grdRes] = await Promise.all([
        api.get('/groups'),
        api.get('/master/grades'),
      ]);
      setAllGroups(grpRes.data?.data || []);
      setAllGrades(grdRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load masters:', err);
    }
  };

  const loadStudentAccount = async (studentIdOrCode) => {
    try {
      setLoadingAccount(true);
      const { data } = await api.get(`/subscriptions/student-account/${studentIdOrCode}`);
      setStudentAccount(data.data);
      setSelectedStudentId(data.data.student.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحميل بيانات حساب الطالب');
    } finally {
      setLoadingAccount(false);
    }
  };

  const fetchDebts = async () => {
    try {
      setLoadingDebts(true);
      const { data } = await api.get('/subscriptions/debts', {
        params: {
          search: debtSearch || undefined,
          grade_id: debtGradeFilter || undefined,
        }
      });
      setDebtsList(data.data?.debts || []);
      setTotalDebtAmount(data.data?.totalDebt || 0);
    } catch (err) {
      console.error('Failed to fetch debts:', err);
    } finally {
      setLoadingDebts(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudentId(student.id);
    setSearchQuery('');
    setSearchResults([]);
    setActiveTab('account');
  };

  // Open renew modal for a specific group
  const handleOpenRenew = (group) => {
    setSelectedGroupForRenew(group);
    setRenewModalOpen(true);
  };

  // Open pay debt modal
  const handleOpenPayDebt = (group) => {
    setSelectedGroupForPayDebt(group);
    setPayDebtModalOpen(true);
  };

  // Open clearance / refund modal
  const handleOpenClearance = (group) => {
    if (group.enrollment_type === 'PACKAGE') {
      toast.error('⚠️ لا يمكن تصفية مادة منفردة من الباكدج، يتم تصفية اشتراك الباكدج بالكامل من بطاقة الباكدج المجمعة بالأعلى.');
      return;
    }
    setSelectedGroupForClearance(group);
    setClearanceModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in max-w-7xl mx-auto" dir="rtl">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <CreditCard size={28} className="text-[#0C3C82]" />
            اشتراكات وحسابات الطلاب والحصص
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            البحث بكود الطالب، متابعة رصيد الحصص المتبقي في كل مجموعة، وشحن وتجديد الاشتراكات والمديونيات
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'account'
                ? 'bg-white text-[#0C3C82] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={15} />
            حساب واشتراكات الطالب
          </button>
          <button
            onClick={() => {
              setActiveTab('debts');
              fetchDebts();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'debts'
                ? 'bg-white text-[#0C3C82] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert size={15} className="text-amber-500" />
            كشف المديونيات ({debtsList.length})
          </button>
        </div>
      </div>

      {/* SEARCH BAR (Prominent & Fast) */}
      <div className="relative">
        <div className="atlas-card p-3 shadow-md border-slate-200 focus-within:border-sky-500 transition-all flex items-center gap-3">
          <div className="p-2.5 rounded-xl text-white flex-shrink-0" style={{ background: '#0C3C82' }}>
            <Search size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">
              ابحث بكود الطالب (مثال: 1005) أو الباركود (ATL-G01-1005) أو الاسم أو رقم الهاتف:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اكتب كود الطالب أو اسمه هنا للبحث السريع..."
              className="w-full bg-transparent border-none text-slate-800 font-bold placeholder-slate-400 focus:outline-none text-sm sm:text-base"
              autoFocus
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Live Search Suggestions Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 animate-fade-in-up">
            <div className="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span>نتائج البحث ({searchResults.length}) — اضغط على الطالب لفتح حسابه</span>
              <span>كود الطالب</span>
            </div>
            {searchResults.map((student) => (
              <div
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className="p-3.5 hover:bg-sky-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#0C3C82] flex items-center justify-center font-black text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                    {student.full_name_ar?.[0] || student.full_name?.[0] || 'ط'}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 group-hover:text-sky-700">
                      {student.full_name_ar || student.full_name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{student.grade_name || 'بدون مرحلة'}</span>
                      <span>•</span>
                      <span className="font-mono">{student.phone || student.parent_phone || 'بدون هاتف'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-left">
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200">
                      #{student.student_code}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{student.barcode_id}</p>
                  </div>
                  <ChevronLeft size={18} className="text-slate-400 group-hover:text-sky-600 transition-transform group-hover:-translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: STUDENT ACCOUNT & SESSIONS */}
      {activeTab === 'account' && (
        <>
          {!studentAccount ? (
            <div className="atlas-card p-12 text-center border-dashed border-2 border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0C3C82] flex items-center justify-center mx-auto mb-3">
                <Search size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">ابحث عن طالب لعرض رصيده واشتراكاته</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                اكتب كود الطالب في حقل البحث أعلاه أو اسمه، وسيتم فتح حسابه الكامل مع المجموعات المسجل بها ورصيد الحصص المتبقي في كل مجموعة وإمكانية شحن الحصص فورياً.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Header Card */}
              <div className="atlas-card p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-[#0C3C82] text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black shadow-inner flex-shrink-0">
                      {studentAccount.student.full_name_ar?.[0] || studentAccount.student.full_name?.[0] || 'ط'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-black text-white">
                          {studentAccount.student.full_name_ar || studentAccount.student.full_name}
                        </h2>
                        <span className="px-3 py-1 rounded-xl bg-white/20 text-white font-mono font-black text-xs border border-white/30">
                          كود: #{studentAccount.student.student_code}
                        </span>
                        {studentAccount.student.status_name && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-900 font-bold text-[11px]">
                            {studentAccount.student.status_name}
                          </span>
                        )}
                        {studentAccount.student.education_type === 'LANGUAGES' ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-[11px]">
                            🌐 لغات / تجريبي
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-sky-400 text-slate-950 font-bold text-[11px]">
                            🏛️ حكومي / عربي
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/70 mt-1.5 flex items-center gap-3 flex-wrap font-medium">
                        <span>الصف: <strong>{studentAccount.student.grade_name || 'عام'}</strong></span>
                        <span>•</span>
                        <span>الموبايل: <strong className="font-mono">{studentAccount.student.phone || '—'}</strong></span>
                        <span>•</span>
                        <span>ولي الأمر: <strong className="font-mono">{studentAccount.student.parent_phone || '—'}</strong></span>
                        <span>•</span>
                        <span>الباركود: <strong className="font-mono">{studentAccount.student.barcode_id}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
                    <button
                      onClick={() => setEnrollPackageModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs flex items-center gap-2 shadow-lg transition-all"
                    >
                      <Package size={16} />
                      <span>إضافة الطالب لباكدج</span>
                    </button>
                    <button
                      onClick={() => setEnrollModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all backdrop-blur-sm"
                    >
                      <Users size={16} />
                      <span>إضافة لمجموعة (برايفت)</span>
                    </button>
                    <button
                      onClick={() => loadStudentAccount(selectedStudentId)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                      title="تحديث البيانات"
                    >
                      <RefreshCw size={16} className={loadingAccount ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Bottom Quick Stats Strip */}
                <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <p className="text-[11px] text-white/60">المجموعات المقيد بها</p>
                    <p className="text-lg font-black text-white mt-0.5">{studentAccount.summary.totalGroups} مجموعة</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <p className="text-[11px] text-white/60">إجمالي الحصص المتبقية</p>
                    <p className={`text-lg font-black mt-0.5 ${studentAccount.summary.totalRemainingSessions > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {studentAccount.summary.totalRemainingSessions} حصة
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <p className="text-[11px] text-white/60">إجمالي المسدد</p>
                    <p className="text-lg font-black text-white mt-0.5">{studentAccount.summary.totalPaid} ج.م</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <p className="text-[11px] text-white/60">المديونية المتبقية</p>
                    <p className={`text-lg font-black mt-0.5 ${studentAccount.summary.totalDue > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {studentAccount.summary.totalDue} ج.م
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. ACTIVE PACKAGE BUNDLES (اشتراكات الباكدج المجمعة) */}
              {studentAccount.packageEnrollments && studentAccount.packageEnrollments.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <Package size={20} className="text-amber-600" />
                      <span>اشتراكات الباكدج الدراسية المجمعة ({studentAccount.packageEnrollments.length})</span>
                    </h3>
                    <span className="text-xs text-amber-800 bg-amber-100/80 px-3 py-1 rounded-xl border border-amber-300 font-bold flex items-center gap-1.5 shadow-2xs">
                      <span>✨ اشتراك باكدج متكامل</span>
                      <span>•</span>
                      <span>حساب واسترداد عادل بسعر الباكدج</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {studentAccount.packageEnrollments.map((pkg) => {
                      const totalPkgSessions = parseInt(pkg.total_sessions || 0, 10);
                      const usedPkgSessions = parseInt(pkg.used_sessions || 0, 10);
                      const remPkgSessions = Math.max(0, parseInt(pkg.remaining_sessions || 0, 10));
                      const effectiveRate = parseFloat(pkg.effective_session_price || 0);
                      const pkgPrice = parseFloat(pkg.total_price || 0);
                      const pkgDue = parseFloat(pkg.total_amount_due || 0);
                      const pkgPaid = parseFloat(pkg.total_amount_paid || 0);
                      const refundEst = Math.max(0, parseInt(pkg.refundable_amount || 0, 10));

                      return (
                        <div
                          key={pkg.id}
                          className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-500/10 border-2 border-amber-300/80 shadow-md relative overflow-hidden"
                        >
                          {/* Package Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
                                <Package size={26} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-lg font-black text-slate-900 tracking-tight">
                                    {pkg.package_name}
                                  </h4>
                                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-200 text-amber-950 border border-amber-300">
                                    {pkg.grade_name}
                                  </span>
                                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    باكدج نشط
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                                  <span>تاريخ التسجيل: <strong>{new Date(pkg.enrolled_at).toLocaleDateString('ar-EG')}</strong></span>
                                  <span>•</span>
                                  <span>إجمالي قيمة الباكدج: <strong className="text-[#0C3C82]">{pkgPrice} ج.م</strong></span>
                                  <span>•</span>
                                  <span>المسدد: <strong className="text-emerald-700">{pkgPaid} ج.م</strong></span>
                                  {pkgDue > 0 && (
                                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                      مديونية: {pkgDue} ج.م
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* One-Click Full Package Clearance Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPackageForClearance(pkg);
                                setClearPackageModalOpen(true);
                              }}
                              className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start md:self-auto hover:shadow-lg"
                              title="تصفية اشتراك الباكدج بالكامل واسترداد الرصيد المتبقي بسعر الباكدج"
                            >
                              <LogOut size={16} />
                              <span>تصفية واسترداد الباكدج بالكامل</span>
                            </button>
                          </div>

                          {/* Sessions Aggregated Math Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                            <div className="bg-white/90 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                              <span className="text-[11px] font-bold text-slate-500 block">إجمالي حصص الباكدج</span>
                              <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalPkgSessions} حصة</span>
                            </div>
                            <div className="bg-white/90 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                              <span className="text-[11px] font-bold text-slate-500 block">الحصص المستهلكة (حضور)</span>
                              <span className="text-xl font-black text-blue-700 mt-0.5 block">{usedPkgSessions} حصة</span>
                            </div>
                            <div className="bg-emerald-50/90 p-3 rounded-2xl border border-emerald-300 shadow-2xs">
                              <span className="text-[11px] font-bold text-emerald-800 block">الرصيد المتبقي الإجمالي</span>
                              <span className="text-xl font-black text-emerald-700 mt-0.5 block">{remPkgSessions} حصة</span>
                            </div>
                            <div className="bg-white/90 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                              <span className="text-[11px] font-bold text-slate-500 block">سعر الحصة الفعلي بالباكدج</span>
                              <span className="text-xl font-black text-indigo-700 mt-0.5 block">{effectiveRate.toFixed(2)} ج.م</span>
                            </div>
                          </div>

                          {/* Sessions Progress Bar */}
                          <div className="space-y-1.5 mb-3 bg-white/70 p-3 rounded-2xl border border-amber-200/70">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span>استهلاك حصص الباكدج:</span>
                              <span className="font-mono text-[#0C3C82]">
                                مستهلك {usedPkgSessions} من {totalPkgSessions} حصة ({totalPkgSessions > 0 ? Math.round((usedPkgSessions / totalPkgSessions) * 100) : 0}%)
                              </span>
                            </div>
                            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                              <div
                                className="bg-blue-600 h-full transition-all"
                                style={{ width: `${totalPkgSessions > 0 ? (usedPkgSessions / totalPkgSessions) * 100 : 0}%` }}
                                title={`مستهلك: ${usedPkgSessions}`}
                              />
                              <div
                                className="bg-emerald-500 h-full transition-all"
                                style={{ width: `${totalPkgSessions > 0 ? (remPkgSessions / totalPkgSessions) * 100 : 0}%` }}
                                title={`متبقي: ${remPkgSessions}`}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                              <span>قيمة الرصيد المتبقي: <strong className="text-emerald-700">{refundEst} ج.م</strong></span>
                              <span className="text-slate-400">محسوب بسعر الباكدج العادل وليس البرايفت</span>
                            </div>
                          </div>

                          {/* Included Groups & Teachers Pills */}
                          {pkg.groups && pkg.groups.length > 0 && (
                            <div className="pt-2 border-t border-amber-200/80">
                              <span className="text-xs font-bold text-slate-700 mb-2 block">
                                المواد والمجموعات المقيد بها الطالب ضمن هذا الباكدج ({pkg.groups.length}):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {pkg.groups.map((g) => (
                                  <div
                                    key={g.group_id}
                                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-slate-800 text-xs font-medium flex items-center gap-2 shadow-2xs"
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: g.subject_color || '#0C3C82' }}
                                    />
                                    <strong>{g.subject_name}:</strong>
                                    <span>{g.teacher_name || '—'}</span>
                                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                      {g.remaining_sessions || 0} حصة متبقية
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. GROUP ACCOUNTS & SESSIONS DETAILS (المجموعات المستقلة والتفصيلية) */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <Layers size={18} className="text-[#0C3C82]" />
                      <span>رصيد الحصص والاشتراكات لكل مجموعة ({studentAccount.groups.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      متابعة استهلاك الحصص، شحن الرصيد، أو تصفية مجموعة محددة وسحب الطالب منها
                    </p>
                  </div>

                  {/* Filter Pills */}
                  {studentAccount.groups.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setGroupFilter('all')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          groupFilter === 'all'
                            ? 'bg-white text-[#0C3C82] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        الكل ({studentAccount.groups.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupFilter('package')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          groupFilter === 'package'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📦 باكدج ({studentAccount.groups.filter((g) => g.enrollment_type === 'PACKAGE').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupFilter('private')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          groupFilter === 'private'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        👨‍🏫 عادي / برايفت ({studentAccount.groups.filter((g) => g.enrollment_type === 'PRIVATE').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupFilter('debt')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          groupFilter === 'debt'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⚠️ مديونيات ({studentAccount.groups.filter((g) => parseFloat(g.amount_due || 0) > 0).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupFilter('zero')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          groupFilter === 'zero'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🔴 رصيد 0 ({studentAccount.groups.filter((g) => parseInt(g.remaining_sessions || 0, 10) <= 0).length})
                      </button>
                    </div>
                  )}
                </div>

                {studentAccount.groups.length === 0 ? (
                  <div className="atlas-card p-8 text-center border-dashed border-slate-300">
                    <p className="text-sm font-bold text-slate-600 mb-2">الطالب غير مقيد في أي مجموعة حالياً</p>
                    <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                      <button
                        onClick={() => setEnrollPackageModalOpen(true)}
                        className="atlas-btn-primary text-xs px-4 py-2.5 inline-flex items-center gap-2 shadow-md"
                      >
                        <Package size={15} />
                        <span>إضافة الطالب لباكدج</span>
                      </button>
                      <button
                        onClick={() => setEnrollModalOpen(true)}
                        className="atlas-btn atlas-btn-outline text-xs px-4 py-2.5 inline-flex items-center gap-2"
                      >
                        <Users size={15} />
                        <span>إضافة لمجموعة خاصة (برايفت)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {studentAccount.groups
                      .filter((group) => {
                        if (groupFilter === 'package') return group.enrollment_type === 'PACKAGE';
                        if (groupFilter === 'private') return group.enrollment_type === 'PRIVATE';
                        if (groupFilter === 'debt') return parseFloat(group.amount_due || 0) > 0;
                        if (groupFilter === 'zero') return parseInt(group.remaining_sessions || 0, 10) <= 0;
                        return true;
                      })
                      .map((group) => {
                        const remaining = parseInt(group.remaining_sessions || 0, 10);
                        const total = parseInt(group.total_sessions || 0, 10);
                        const used = parseInt(group.used_sessions || 0, 10);
                        const isOutOfSessions = remaining <= 0;
                        const hasDebt = parseFloat(group.amount_due || 0) > 0;
                        const nominalSessionRate = parseFloat(group.price_per_session || 0);
                        const amountPaid = parseFloat(group.amount_paid || 0);
                        const actualSessionRate = (total > 0 && amountPaid > 0) ? (amountPaid / total) : nominalSessionRate;
                        const isDiscountedRate = actualSessionRate > 0 && actualSessionRate < nominalSessionRate;

                        return (
                          <div
                            key={group.group_id}
                            className={`atlas-card p-5 border transition-all flex flex-col justify-between ${
                              isOutOfSessions
                                ? 'border-rose-200 bg-rose-50/20 shadow-xs'
                                : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                          >
                            {/* Group Info Header */}
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-2.5">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                    <span
                                      className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white inline-block"
                                      style={{ backgroundColor: group.subject_color || '#0C3C82' }}
                                    >
                                      {group.subject_name || 'مادة'}
                                    </span>
                                    {group.enrollment_type === 'PRIVATE' ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        👨‍🏫 طالب برايفت
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                        📦 طالب باكدج
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-base font-black text-slate-900">
                                    {group.group_name_ar || group.group_name}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    المدرس: <strong>{group.teacher_name || '—'}</strong> {group.classroom_name ? `• ${group.classroom_name}` : ''}
                                  </p>
                                </div>

                                {/* Remaining Sessions Highlight Badge */}
                                <div className="text-center">
                                  <div
                                    className={`px-3.5 py-2 rounded-2xl border text-center shadow-xs ${
                                      remaining > 2
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                        : remaining > 0
                                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                                        : 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                                    }`}
                                  >
                                    <p className="text-[10px] font-bold opacity-80">الرصيد المتبقي</p>
                                    <p className="text-xl font-black">{remaining} حصة</p>
                                  </div>
                                </div>
                              </div>

                              {/* Session Balance Progress Meter */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 my-3">
                                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                  <span className="text-slate-600">
                                    إجمالي الحصص المشحونة: <strong className="text-slate-900">{total}</strong>
                                  </span>
                                  <span className="text-slate-600">
                                    الحصص المستهلكة: <strong className="text-slate-900">{used}</strong>
                                  </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                                  <div
                                    className="bg-blue-600 h-full transition-all"
                                    style={{ width: `${total > 0 ? (used / total) * 100 : 0}%` }}
                                    title={`مستهلك: ${used}`}
                                  />
                                  <div
                                    className="bg-emerald-500 h-full transition-all"
                                    style={{ width: `${total > 0 ? (remaining / total) * 100 : 0}%` }}
                                    title={`متبقي: ${remaining}`}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                                  <span>
                                    سعر الحصة: <strong className="text-[#0C3C82]">{actualSessionRate.toFixed(2)} ج.م</strong>
                                    {isDiscountedRate && (
                                      <span className="text-[10px] text-amber-800 font-bold mr-1 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                        سعر باكدج مخفض
                                      </span>
                                    )}
                                  </span>
                                  <span>سعر الشهر: <strong>{group.price_per_month || 0} ج.م</strong></span>
                                </div>
                              </div>

                              {/* Financial status for this group */}
                              <div className="flex items-center justify-between text-xs font-semibold px-1 py-1 text-slate-600">
                                <span>المسدد: <strong className="text-emerald-700">{group.amount_paid || 0} ج.م</strong></span>
                                {hasDebt ? (
                                  <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    مديونية متبقية: {group.amount_due} ج.م
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <Check size={14} /> لا توجد مديونية
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons: Recharge, Pay Debt, Clearance */}
                            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[11px] text-slate-400">
                                آخر تجديد: {group.billing_month || '—'}
                              </span>

                              <div className="flex items-center gap-2 flex-wrap">
                                {hasDebt && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPayDebt(group)}
                                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                                    title="سداد مديونية الاشتراك بدون إضافة حصص إضافية"
                                  >
                                    <Wallet size={14} />
                                    سداد مديونية ({group.amount_due} ج.م)
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenRenew(group)}
                                  className="atlas-btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm"
                                >
                                  <Coins size={14} />
                                  شحن وتجديد
                                </button>

                                {group.enrollment_type === 'PRIVATE' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenClearance(group)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all flex items-center gap-1.5 shadow-xs"
                                    title="تصفية رصيد الحصص المتبقي للطالب في هذه المجموعة وإلغاء قيده منها"
                                  >
                                    <LogOut size={13} />
                                    تصفية واسترداد
                                  </button>
                                ) : (
                                  <span
                                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-200 flex items-center gap-1 shadow-2xs"
                                    title="هذه المجموعة تابعة للباكدج، وتتم تصفيتها حصراً مع الباكدج بالكامل من بطاقة الباكدج بالأعلى"
                                  >
                                    📦 تصفية مع الباكدج بالأعلى
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Recent Payment History */}
              {studentAccount.history && studentAccount.history.length > 0 && (
                <div className="atlas-card p-5 border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <History size={16} className="text-[#0C3C82]" />
                    سجل آخر عمليات شحن ودفع الاشتراكات للطالب
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">التاريخ</th>
                          <th className="p-2.5">المجموعة والمادة</th>
                          <th className="p-2.5">الحصص المضافة</th>
                          <th className="p-2.5">المبلغ المدفوع</th>
                          <th className="p-2.5">المتبقي كدين</th>
                          <th className="p-2.5">الشهر</th>
                          <th className="p-2.5">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentAccount.history.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50/70">
                            <td className="p-2.5 font-mono text-slate-500">
                              {new Date(h.created_at).toLocaleDateString('ar-EG')}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800">
                              {h.group_name_ar || h.group_name} ({h.subject_name || 'عام'})
                            </td>
                            <td className="p-2.5 font-bold text-emerald-700 font-mono">
                              +{h.total_sessions} حصص
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 font-mono">
                              {h.amount_paid} ج.م
                            </td>
                            <td className="p-2.5 font-mono">
                              {parseFloat(h.amount_due) > 0 ? (
                                <span className="text-rose-600 font-bold">{h.amount_due} ج.م</span>
                              ) : (
                                <span className="text-slate-400">0 ج.م</span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-600 font-mono">{h.billing_month}</td>
                            <td className="p-2.5 text-slate-500 truncate max-w-xs">{h.notes || '—'}</td>
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

      {/* TAB 2: OVERDUE DEBTS REPORT */}
      {activeTab === 'debts' && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Banner */}
          <div className="atlas-card p-5 bg-gradient-to-r from-amber-500 to-rose-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <ShieldAlert size={20} />
                كشف مديونيات اشتراكات الطلاب للشهر الحالي
              </h3>
              <p className="text-xs text-white/80 mt-1">
                الطلاب المسجلين في مجموعات ولم يسددوا كامل اشتراك الشهر أو انتهى رصيد حصصهم
              </p>
            </div>
            <div className="bg-white/15 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/20 text-center sm:text-left">
              <p className="text-[11px] text-white/80">إجمالي المديونيات المستحقة</p>
              <p className="text-2xl font-black">{totalDebtAmount.toLocaleString()} ج.م</p>
            </div>
          </div>

          {/* Filters */}
          <div className="atlas-card p-4 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={debtSearch}
                onChange={(e) => setDebtSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDebts()}
                placeholder="ابحث بالاسم أو الكود أو الهاتف في كشف المديونيات..."
                className="atlas-input pr-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={debtGradeFilter}
                onChange={(e) => {
                  setDebtGradeFilter(e.target.value);
                  setTimeout(fetchDebts, 50);
                }}
                className="atlas-input text-xs w-full sm:w-48"
              >
                <option value="">جميع المراحل الدراسية</option>
                {allGrades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name_ar}</option>
                ))}
              </select>

              <button
                onClick={fetchDebts}
                className="atlas-btn-primary text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0"
              >
                <RefreshCw size={14} className={loadingDebts ? 'animate-spin' : ''} />
                تصفية
              </button>
            </div>
          </div>

          {/* Debts Table */}
          <div className="atlas-card overflow-hidden border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود الطالب</th>
                    <th className="p-3">اسم الطالب</th>
                    <th className="p-3">المرحلة</th>
                    <th className="p-3">المجموعة والمدرس</th>
                    <th className="p-3 text-center">الرصيد المتبقي</th>
                    <th className="p-3">سعر الشهر</th>
                    <th className="p-3">المسدد</th>
                    <th className="p-3 text-rose-600">المتبقي (دين)</th>
                    <th className="p-3 text-center">إجراء سريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingDebts ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        جاري تحميل كشف المديونيات...
                      </td>
                    </tr>
                  ) : debtsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-emerald-600 font-bold">
                        🎉 ممتاز! لا توجد مديونيات متأخرة مطابقة للشروط المحددة.
                      </td>
                    </tr>
                  ) : (
                    debtsList.map((row) => (
                      <tr key={`${row.student_id}-${row.group_id}`} className="hover:bg-amber-50/40">
                        <td className="p-3 font-mono font-bold text-slate-800">
                          #{row.student_code}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {row.student_name}
                          <p className="text-[10px] text-slate-400 font-mono">{row.student_phone || row.parent_phone}</p>
                        </td>
                        <td className="p-3 text-slate-600">{row.grade_name || '—'}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800">{row.group_name_ar || row.group_name}</span>
                          <p className="text-[10px] text-slate-500">{row.teacher_name} • {row.subject_name}</p>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              row.remaining_sessions > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800 font-mono'
                            }`}
                          >
                            {row.remaining_sessions} حصة
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{row.price_per_month} ج.م</td>
                        <td className="p-3 font-mono text-emerald-700 font-bold">{row.amount_paid} ج.م</td>
                        <td className="p-3 font-mono text-rose-600 font-black text-sm">
                          {row.amount_due} ج.م
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {parseFloat(row.amount_due || 0) > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedStudentId(row.student_id);
                                  setSelectedGroupForPayDebt(row);
                                  setPayDebtModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                                title="سداد مديونية الاشتراك"
                              >
                                <Wallet size={12} />
                                سداد دين
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedStudentId(row.student_id);
                                setSelectedGroupForRenew(row);
                                setRenewModalOpen(true);
                              }}
                              className="atlas-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1"
                              title="شحن حصص جديدة"
                            >
                              <Coins size={12} />
                              شحن
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENEW / CREDIT SESSIONS MODAL */}
      {renewModalOpen && selectedGroupForRenew && (
        <RenewSessionsModal
          isOpen={renewModalOpen}
          onClose={() => setRenewModalOpen(false)}
          student={studentAccount?.student}
          group={selectedGroupForRenew}
          onSuccess={() => {
            setRenewModalOpen(false);
            if (selectedStudentId) loadStudentAccount(selectedStudentId);
            fetchDebts();
          }}
        />
      )}

      {/* ENROLL STUDENT IN PACKAGE MODAL */}
      {enrollPackageModalOpen && studentAccount && (
        <EnrollPackageModal
          isOpen={enrollPackageModalOpen}
          onClose={() => setEnrollPackageModalOpen(false)}
          student={studentAccount.student}
          onSuccess={() => {
            setEnrollPackageModalOpen(false);
            loadStudentAccount(studentAccount.student.id);
            fetchDebts();
          }}
        />
      )}

      {/* ENROLL STUDENT IN PRIVATE GROUP MODAL */}
      {enrollModalOpen && studentAccount && (
        <EnrollGroupModal
          isOpen={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          student={studentAccount.student}
          existingGroupIds={studentAccount.groups.map((g) => g.group_id)}
          allGroups={allGroups}
          allGrades={allGrades}
          onSuccess={() => {
            setEnrollModalOpen(false);
            loadStudentAccount(studentAccount.student.id);
            fetchDebts();
          }}
        />
      )}

      {/* PAY DEBT MODAL */}
      {payDebtModalOpen && selectedGroupForPayDebt && (
        <PayDebtModal
          isOpen={payDebtModalOpen}
          onClose={() => setPayDebtModalOpen(false)}
          student={studentAccount?.student || { id: selectedStudentId }}
          group={selectedGroupForPayDebt}
          onSuccess={() => {
            setPayDebtModalOpen(false);
            if (selectedStudentId) loadStudentAccount(selectedStudentId);
            fetchDebts();
          }}
        />
      )}

      {/* CLEARANCE & REFUND SESSIONS MODAL */}
      {clearanceModalOpen && selectedGroupForClearance && (
        <ClearanceRefundModal
          isOpen={clearanceModalOpen}
          onClose={() => setClearanceModalOpen(false)}
          student={studentAccount?.student}
          group={selectedGroupForClearance}
          onSuccess={() => {
            setClearanceModalOpen(false);
            if (selectedStudentId) loadStudentAccount(selectedStudentId);
            fetchDebts();
          }}
        />
      )}

      {/* CLEAR PACKAGE REFUND MODAL */}
      {clearPackageModalOpen && selectedPackageForClearance && (
        <ClearPackageRefundModal
          isOpen={clearPackageModalOpen}
          onClose={() => setClearPackageModalOpen(false)}
          student={studentAccount?.student}
          packageEnrollment={selectedPackageForClearance}
          onSuccess={() => {
            setClearPackageModalOpen(false);
            if (selectedStudentId) loadStudentAccount(selectedStudentId);
            fetchDebts();
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODAL: RENEW / CREDIT SESSIONS
// -------------------------------------------------------------
function RenewSessionsModal({ isOpen, onClose, student, group, onSuccess }) {
  const [sessionsCount, setSessionsCount] = useState(4); // default 4 sessions (month)
  const [amountPaid, setAmountPaid] = useState(0);
  const [totalCharge, setTotalCharge] = useState(0);
  const [enrollmentType, setEnrollmentType] = useState(group.enrollment_type || 'PACKAGE');
  const [discountType, setDiscountType] = useState(group.discount_type || 'FIXED'); // 'FIXED' or 'PERCENT'
  const [discountValue, setDiscountValue] = useState(group.discount_value || 0);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const pricePerSession = parseFloat(group.price_per_session) || 0;
  const pricePerMonth = parseFloat(group.price_per_month) || 0;
  const currentDebt = Math.max(0, parseFloat(group.amount_due) || 0);

  // Discount calculation
  const grossCharge = Math.max(0, parseFloat(totalCharge) || 0);
  const discountValNum = Math.max(0, parseFloat(discountValue) || 0);
  const discountAmount = discountType === 'PERCENT'
    ? Math.min(grossCharge, Math.round((grossCharge * discountValNum) / 100))
    : Math.min(grossCharge, discountValNum);
  const netCharge = Math.max(0, grossCharge - discountAmount);
  const totalLiability = netCharge + currentDebt;

  // Presets definition
  const presets = [
    { label: 'حصة واحدة (1)', sessions: 1, calculate: () => pricePerSession || 50 },
    { label: 'حصتين (2)', sessions: 2, calculate: () => (pricePerSession ? pricePerSession * 2 : 100) },
    { label: '3 حصص (3)', sessions: 3, calculate: () => (pricePerSession ? pricePerSession * 3 : 150) },
    { label: 'شهر كامل (4 حصص)', sessions: 4, calculate: () => pricePerMonth || (pricePerSession * 4) || 200 },
    { label: 'شهر كامل (8 حصص)', sessions: 8, calculate: () => pricePerMonth || (pricePerSession * 8) || 350 },
  ];

  // Set initial preset with student's persistent discount
  useEffect(() => {
    const initDiscType = group.discount_type || 'FIXED';
    const initDiscVal = parseFloat(group.discount_value) || 0;
    setDiscountType(initDiscType);
    setDiscountValue(initDiscVal);
    setEnrollmentType(group.enrollment_type || 'PACKAGE');

    // Preset 4 sessions
    setSessionsCount(presets[3].sessions);
    const charge = presets[3].calculate();
    setTotalCharge(charge);
    const disc = initDiscType === 'PERCENT'
      ? Math.min(charge, Math.round((charge * initDiscVal) / 100))
      : Math.min(charge, initDiscVal);
    const net = Math.max(0, charge - disc);
    setAmountPaid(net + currentDebt);
  }, [group]);

  const applyPreset = (preset) => {
    setSessionsCount(preset.sessions);
    const charge = preset.calculate();
    setTotalCharge(charge);
    const disc = discountType === 'PERCENT'
      ? Math.min(charge, Math.round((charge * discountValNum) / 100))
      : Math.min(charge, discountValNum);
    const net = Math.max(0, charge - disc);
    setAmountPaid(net + currentDebt); // default to paying full including previous debt
  };

  const handleCustomSessionsChange = (val) => {
    const s = Math.max(1, parseInt(val, 10) || 1);
    setSessionsCount(s);
    let charge = 0;
    if (s === 4 || s === 8) {
      charge = pricePerMonth;
    } else {
      charge = pricePerSession ? pricePerSession * s : (pricePerMonth / 4) * s;
    }
    const roundedCharge = Math.round(charge);
    setTotalCharge(roundedCharge);
    const disc = discountType === 'PERCENT'
      ? Math.min(roundedCharge, Math.round((roundedCharge * discountValNum) / 100))
      : Math.min(roundedCharge, discountValNum);
    const net = Math.max(0, roundedCharge - disc);
    setAmountPaid(net + currentDebt);
  };

  // Strictly clamp amountPaid to totalLiability whenever totalLiability changes
  useEffect(() => {
    const paid = parseFloat(amountPaid);
    if (!isNaN(paid) && paid > totalLiability) {
      setAmountPaid(totalLiability);
    }
  }, [totalLiability]);

  const handleAmountPaidChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setAmountPaid('');
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (val > totalLiability) {
        setAmountPaid(totalLiability);
        toast.error(`⚠️ الحد الأقصى للمبلغ المطلوب دفعه هو ${totalLiability} ج.م`);
        return;
      }
      if (val < 0) {
        setAmountPaid(0);
        return;
      }
    }
    setAmountPaid(valStr);
  };

  const handleAmountPaidBlur = () => {
    const val = parseFloat(amountPaid);
    if (isNaN(val) || val < 0) {
      setAmountPaid(0);
    } else if (val > totalLiability) {
      setAmountPaid(totalLiability);
      toast.error(`⚠️ تم ضبط المبلغ على الحد الأقصى المطلوب (${totalLiability} ج.م)`);
    }
  };

  const remainingDebt = Math.max(0, totalLiability - parseFloat(amountPaid || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionsCount || sessionsCount <= 0) {
      toast.error('يرجى تحديد عدد الحصص');
      return;
    }
    const paidNum = parseFloat(amountPaid) || 0;
    if (paidNum > totalLiability) {
      toast.error(`المبلغ المدفوع (${paidNum} ج.م) لا يمكن أن يتجاوز إجمالي المطلوب (${totalLiability} ج.م)`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        student_id: student.id,
        group_id: group.group_id,
        sessions_count: sessionsCount,
        amount_paid: paidNum,
        total_charge: netCharge,
        billing_month: billingMonth,
        enrollment_type: enrollmentType,
        discount_type: discountType,
        discount_value: discountValNum,
        notes: notes.trim() || `تجديد ${sessionsCount} حصص (${enrollmentType === 'PRIVATE' ? 'برايفت' : 'باكدج'}) لمجموعة ${group.group_name_ar || group.group_name}`,
      };

      const { data } = await api.post('/subscriptions/renew', payload);
      toast.success(data.message || 'تم شحن الحصص وإيداع المبلغ بالخزينة بنجاح');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تجديد الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 text-white flex items-center justify-between" style={{ background: '#0C3C82' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Coins size={22} />
            </div>
            <div>
              <h3 className="text-base font-black">شحن وتجديد رصيد الحصص</h3>
              <p className="text-xs text-white/70">
                الطالب: <strong>{student?.full_name_ar || student?.full_name}</strong> (#{student?.student_code})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[85vh]">
          {/* Group details box */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400">المجموعة المختارة</span>
              <h4 className="text-sm font-black text-slate-900">{group.group_name_ar || group.group_name}</h4>
              <p className="text-xs text-slate-500">{group.teacher_name} • {group.subject_name}</p>
            </div>
            <div className="text-left text-xs font-semibold text-slate-600">
              <p>سعر الحصة: <strong className="text-slate-900">{pricePerSession} ج.م</strong></p>
              <p>سعر الشهر: <strong className="text-slate-900">{pricePerMonth} ج.م</strong></p>
            </div>
          </div>

          {/* Alert if current debt exists */}
          {currentDebt > 0 && (
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
                <span className="font-bold">توجد مديونية سابقة مسجلة على الطالب:</span>
              </div>
              <span className="font-mono font-black text-rose-700 text-sm">{currentDebt} ج.م</span>
            </div>
          )}

          {/* STEP 1: Fast Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر باقة الحصص السريعة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((preset) => {
                const isSelected = sessionsCount === preset.sessions;
                return (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-[#0C3C82] text-[#0C3C82] shadow-sm ring-1 ring-[#0C3C82]/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p>{preset.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{preset.calculate()} ج.م</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Sessions & Month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                عدد الحصص المطلوب شحنها
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={sessionsCount}
                onChange={(e) => handleCustomSessionsChange(e.target.value)}
                className="atlas-input font-bold text-center text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                شهر الاشتراك (Billing Month)
              </label>
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="atlas-input text-xs font-mono text-center"
                required
              />
            </div>
          </div>

          {/* STEP 1.5: Enrollment Type Selection */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              نوع تسجيل الطالب في المجموعة:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEnrollmentType('PACKAGE')}
                className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                  enrollmentType === 'PACKAGE'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm ring-1 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                📦 طالب باكدج عادي
              </button>
              <button
                type="button"
                onClick={() => setEnrollmentType('PRIVATE')}
                className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                  enrollmentType === 'PRIVATE'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm ring-1 ring-emerald-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                👨‍🏫 طالب برايفت (تبع المستر)
              </button>
            </div>
          </div>

          {/* STEP 2: Financial Calculation & Manual Discount Box */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">قيمة الحصص الأساسية ({sessionsCount} حصة):</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={totalCharge}
                  onChange={(e) => {
                    const newCharge = parseFloat(e.target.value) || 0;
                    setTotalCharge(newCharge);
                  }}
                  className="w-24 text-center font-bold py-1 px-2 border rounded-lg bg-white border-slate-200 text-sm"
                />
                <span>ج.م</span>
              </div>
            </div>

            {/* Manual Discount Row */}
            <div className="pt-2 border-t border-blue-200/50">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-purple-900 flex items-center gap-1">
                  <span>🏷️ خصم يدوي إضافي:</span>
                </span>
                <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setDiscountType('FIXED')}
                    className={`px-2 py-0.5 text-[11px] rounded font-bold transition-all ${
                      discountType === 'FIXED'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-purple-700'
                    }`}
                  >
                    مبلغ (ج.م)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={`px-2 py-0.5 text-[11px] rounded font-bold transition-all ${
                      discountType === 'PERCENT'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-purple-700'
                    }`}
                  >
                    نسبة (%)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'PERCENT' ? 100 : grossCharge}
                    value={discountValue}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      const maxAllowed = discountType === 'PERCENT' ? 100 : grossCharge;
                      setDiscountValue(Math.min(maxAllowed, val));
                    }}
                    className="w-24 text-center font-bold py-1 px-2 border rounded-lg bg-white border-purple-300 text-purple-950 text-sm"
                    placeholder="0"
                  />
                  <span className="text-xs text-purple-800 font-bold">
                    {discountType === 'PERCENT' ? '%' : 'ج.م'}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <span className="text-xs font-bold text-purple-700 font-mono">
                    خصم: -{discountAmount} ج.م (صافي الحصص: {netCharge} ج.م)
                  </span>
                )}
              </div>
            </div>

            {currentDebt > 0 && (
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 pt-2 border-t border-blue-200/50">
                <span>+ مديونية سابقة مسجلة:</span>
                <span className="font-mono font-black">+{currentDebt} ج.م</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-black text-[#0C3C82] pt-2 border-t border-blue-200/60">
              <span>إجمالي المطلوب دفعه:</span>
              <span className="font-mono text-sm">{totalLiability} ج.م</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-blue-200/60">
              <span className="text-slate-800">المبلغ المدفوع نقداً بالخزينة:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max={totalLiability}
                  value={amountPaid}
                  onChange={handleAmountPaidChange}
                  onBlur={handleAmountPaidBlur}
                  className={`w-24 text-center font-black py-1.5 px-2 border rounded-lg bg-white text-sm ring-2 transition-colors ${
                    parseFloat(amountPaid) > totalLiability
                      ? 'border-rose-500 text-rose-800 ring-rose-200 bg-rose-50'
                      : 'border-emerald-400 text-emerald-800 ring-emerald-200'
                  }`}
                  required
                />
                <span>ج.م</span>
              </div>
            </div>

            {/* Quick action buttons if debt exists */}
            {currentDebt > 0 && (
              <div className="flex items-center gap-2 pt-1 text-[11px] flex-wrap">
                <span className="text-slate-500 font-medium">سداد سريع:</span>
                <button
                  type="button"
                  onClick={() => setAmountPaid(totalCharge)}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  الحصص فقط ({totalCharge} ج.م)
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaid(totalLiability)}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 hover:bg-emerald-200 text-emerald-800 font-bold"
                >
                  شامل الدين ({totalLiability} ج.م)
                </button>
              </div>
            )}

            {/* Remaining Debt notification */}
            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span className="text-slate-600">المتبقي كدين على الطالب:</span>
              {parseFloat(amountPaid) > totalLiability ? (
                <span className="font-mono text-rose-600 font-black">
                  ⚠️ المبلغ المدفوع يتجاوز المطلوب بـ {(parseFloat(amountPaid) - totalLiability).toFixed(0)} ج.م
                </span>
              ) : (
                <span className={`font-mono ${remainingDebt > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'}`}>
                  {remainingDebt > 0 ? `${remainingDebt} ج.م (دين متبقي)` : 'مسدد بالكامل (0 ج.م)'}
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات التحصيل (اختياري)
            </label>
            <input
              type="text"
              placeholder="مثال: تم دفع الحصص نقداً بالسنتر"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="atlas-input text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="atlas-btn-ghost text-xs">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || parseFloat(amountPaid) > totalLiability || isNaN(parseFloat(amountPaid))}
              className={`text-xs px-6 py-2.5 flex items-center gap-2 shadow-md transition-all rounded-xl font-bold ${
                parseFloat(amountPaid) > totalLiability || isNaN(parseFloat(amountPaid))
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                  : 'atlas-btn-primary'
              }`}
            >
              {loading ? 'جاري الشحن والتسجيل...' : `تأكيد شحن ${sessionsCount} حصص`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper to format group schedule in Arabic
const dayNamesArabicMap = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

function formatModalSchedule(schedule) {
  if (!schedule) return 'مواعيد غير محددة';
  let slots = [];
  try {
    slots = Array.isArray(schedule) ? schedule : (typeof schedule === 'string' ? JSON.parse(schedule) : []);
  } catch {
    slots = [];
  }
  if (!slots || !slots.length) return 'مواعيد غير محددة';
  return slots.map(s => {
    const day = dayNamesArabicMap[s.day?.toLowerCase()] || s.day;
    return `${day} (${s.start_time || ''})`;
  }).join(' ، ');
}

// -------------------------------------------------------------
// MODAL: ENROLL IN NEW GROUP (مع فلاتر متقدمة بالمدرس والمرحلة والمادة)
// -------------------------------------------------------------
function EnrollGroupModal({ isOpen, onClose, student, existingGroupIds, allGroups, allGrades = [], onSuccess }) {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [enrollmentType, setEnrollmentType] = useState('PRIVATE');
  const [loading, setLoading] = useState(false);
  const [freshGroups, setFreshGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Financial & Discount States
  const [discountType, setDiscountType] = useState('FIXED');
  const [discountValue, setDiscountValue] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(4);
  const [amountPaid, setAmountPaid] = useState(0);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));

  // Filters State (Grade is strictly locked to student.grade_id)
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch fresh active groups whenever modal opens so it never freezes or displays stale data
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const { data } = await api.get('/groups?status=active&is_private=true');
        if (isMounted && Array.isArray(data?.data)) {
          setFreshGroups(data.data);
        }
      } catch (err) {
        console.error('Failed to load fresh groups:', err);
      } finally {
        if (isMounted) setLoadingGroups(false);
      }
    };
    fetchGroups();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Reset local filters & selection on student/modal change
  useEffect(() => {
    setSubjectFilter('');
    setTeacherFilter('');
    setSearchQuery('');
    setSelectedGroupId('');
    setDiscountValue(0);
    setAmountPaid(0);
  }, [student?.id, isOpen]);

  const activeGroupSource = freshGroups.length > 0 ? freshGroups : allGroups;

  // Filter groups STRICTLY by student's grade, private only (not in any package), and not already enrolled
  const availableGroups = useMemo(() => {
    if (!student?.grade_id) return [];
    return activeGroupSource.filter(
      (g) => g.grade_id === student.grade_id && (g.is_private === true || !g.is_in_package) && !existingGroupIds.includes(g.id)
    );
  }, [activeGroupSource, student?.grade_id, existingGroupIds]);

  // All groups belonging to this grade in the system
  const totalGradeGroups = useMemo(() => {
    if (!student?.grade_id) return [];
    return activeGroupSource.filter((g) => g.grade_id === student.grade_id);
  }, [activeGroupSource, student?.grade_id]);

  // Auto-select if there is exactly 1 group available for this grade
  useEffect(() => {
    if (availableGroups.length === 1 && !selectedGroupId) {
      setSelectedGroupId(availableGroups[0].id);
    }
  }, [availableGroups, selectedGroupId]);

  // Extract distinct subjects only for this student's grade
  const subjectsList = useMemo(() => {
    const set = new Set();
    availableGroups.forEach((g) => {
      if (g.subject_name) set.add(g.subject_name);
    });
    return Array.from(set).sort();
  }, [availableGroups]);

  // Extract distinct teachers only for this student's grade
  const teachersList = useMemo(() => {
    const set = new Set();
    availableGroups.forEach((g) => {
      if (g.teacher_name) set.add(g.teacher_name);
    });
    return Array.from(set).sort();
  }, [availableGroups]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    return availableGroups.filter((g) => {
      if (subjectFilter && g.subject_name !== subjectFilter) return false;
      if (teacherFilter && g.teacher_name !== teacherFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (g.name || '').toLowerCase().includes(q) || (g.name_ar || '').toLowerCase().includes(q);
        const matchTeacher = (g.teacher_name || '').toLowerCase().includes(q);
        const matchSubject = (g.subject_name || '').toLowerCase().includes(q);
        const matchSchedule = formatModalSchedule(g.schedule).toLowerCase().includes(q);
        if (!matchName && !matchTeacher && !matchSubject && !matchSchedule) return false;
      }
      return true;
    });
  }, [availableGroups, subjectFilter, teacherFilter, searchQuery]);

  const selectedGroup = useMemo(() => {
    return availableGroups.find((g) => g.id === selectedGroupId) || null;
  }, [availableGroups, selectedGroupId]);

  const hasActiveFilters = Boolean(subjectFilter || teacherFilter || searchQuery);

  const resetFilters = () => {
    setSubjectFilter('');
    setTeacherFilter('');
    setSearchQuery('');
  };

  const grossPrice = selectedGroup ? (parseFloat(selectedGroup.price_per_month) || 0) : 0;
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

  useEffect(() => {
    if (selectedGroup) {
      setAmountPaid(netPrice);
    }
  }, [selectedGroupId, netPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      toast.error('يرجى اختيار المجموعة أولاً');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/subscriptions/enroll', {
        student_id: student.id,
        group_id: selectedGroupId,
        enrollment_type: 'PRIVATE',
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        sessions_count: parseInt(sessionsCount, 10) || 4,
        amount_paid: paidNum,
        billing_month: billingMonth,
      });
      toast.success(data.message || 'تم قيد الطالب في المجموعة الخاصة بنجاح وتحديث الحساب');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء القيد');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 text-white flex items-center justify-between" style={{ background: '#0C3C82' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-base font-black">تسجيل وقيد الطالب في مجموعة خاصة (برايفت)</h3>
              <p className="text-xs text-white/80 mt-0.5">
                الطالب: <strong>{student?.full_name_ar || student?.full_name}</strong> {student?.student_code ? `(#${student.student_code})` : ''} 
                {student?.grade_name && <span className="mr-2 text-white/90">• {student.grade_name}</span>}
                <span className="mr-2 text-amber-300 font-bold">• مجموعات مستقلة خارج الباكدجات</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          {/* Quick Search */}
          <div className="relative">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم المجموعة، المدرس، المادة، أو مواعيد الحصص..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="atlas-input pr-10 text-xs py-2 bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Filters Selects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Locked Mandatory Grade */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap size={13} className="text-[#0C3C82]" />
                <span>المرحلة الدراسية للطالب:</span>
              </label>
              <div className="atlas-input text-xs py-1.5 bg-blue-50/70 border-blue-200 text-slate-800 font-bold flex items-center justify-between cursor-not-allowed select-none">
                <span className="truncate text-[#0C3C82]">{student?.grade_name || 'مرحلة الطالب'}</span>
                <span className="text-[10px] bg-white border border-blue-200 text-slate-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shadow-2xs">
                  <Lock size={10} className="text-amber-600" />
                  <span>إجباري</span>
                </span>
              </div>
            </div>

            {/* Filter: Subject */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <BookOpen size={13} className="text-emerald-600" />
                <span>المادة الدراسية:</span>
              </label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="atlas-input text-xs py-1.5 bg-white font-medium"
              >
                <option value="">-- كل المواد ({subjectsList.length}) --</option>
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Teacher */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User size={13} className="text-amber-600" />
                <span>المدرس:</span>
              </label>
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="atlas-input text-xs py-1.5 bg-white font-medium"
              >
                <option value="">-- كل المدرسين ({teachersList.length}) --</option>
                {teachersList.map((t) => (
                  <option key={t} value={t}>
                    م/ {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters status & Reset */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="font-bold text-slate-500">
              المجموعات المتاحة لمرحلة ({student?.grade_name || 'الطالب'}): <strong className="text-slate-800 font-mono">{filteredGroups.length}</strong> من أصل <strong className="text-slate-800 font-mono">{availableGroups.length}</strong>
            </span>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-rose-600 hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw size={11} />
                  <span>إعادة تعيين الفلاتر</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Groups Cards List */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 overflow-y-auto flex-1 max-h-[50vh] space-y-2">
            {loadingGroups && availableGroups.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-[#0C3C82] mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">جاري تحميل مجموعات المرحلة تلقائياً...</p>
              </div>
            ) : totalGradeGroups.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <AlertCircle size={40} className="mx-auto mb-2 text-amber-500 opacity-80" />
                <p className="text-sm font-bold text-slate-700">لا توجد مجموعات مسجلة حالياً في السنتر لمرحلة {student?.grade_name || ''}</p>
                <p className="text-xs text-slate-400 mt-1">يجب أولاً إضافة مجموعة لهذه المرحلة من صفحة "المجموعات".</p>
              </div>
            ) : availableGroups.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                <p className="text-sm font-bold text-slate-700">الطالب مقيد بالفعل في جميع مجموعات مرحلة {student?.grade_name || ''}</p>
                <p className="text-xs text-slate-400 mt-1">لا توجد مجموعات أخرى إضافية لتسجيله بها في هذه المرحلة.</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Filter size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">لا توجد مجموعات مطابقة للفلاتر المحددة</p>
                <p className="text-xs text-slate-400 mt-1">يرجى تغيير خيارات البحث أو المدرس أو المادة لعرض المجموعات.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="atlas-btn atlas-btn-outline text-xs mt-3 inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>إعادة ضبط الفلاتر</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredGroups.map((group) => {
                  const isSelected = selectedGroupId === group.id;
                  return (
                    <div
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between text-right relative select-none ${
                        isSelected
                          ? 'border-[#0C3C82] bg-blue-50/70 shadow-md ring-2 ring-[#0C3C82]/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1.5"
                          style={{
                            backgroundColor: `${group.subject_color || '#0C3C82'}15`,
                            color: group.subject_color || '#0C3C82',
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.subject_color || '#0C3C82' }}
                          />
                          <span>{group.subject_name || 'عام'}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {group.grade_name || 'عام'}
                        </span>
                      </div>

                      {/* Group Name & Teacher */}
                      <div className="pr-1">
                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {group.name_ar || group.name}
                        </h4>
                        <p className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1.5">
                          <User size={13} className="text-[#0C3C82]" />
                          <span>م/ {group.teacher_name || 'بدون مدرس'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{formatModalSchedule(group.schedule)}</span>
                        </p>
                      </div>

                      {/* Pricing & Capacity */}
                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
                        <div className="font-mono">
                          <span className="font-black text-[#0C3C82] text-sm">{group.price_per_month} ج.م</span>
                          <span className="text-[10px] text-slate-400 font-normal mr-1">/ شهر</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <Users size={12} />
                          <span>{group.student_count || 0} طالب</span>
                        </div>
                      </div>

                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-3 left-3 w-6 h-6 bg-[#0C3C82] text-white rounded-full flex items-center justify-center shadow-sm">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Calculation & Pricing Strip when group selected */}
          {selectedGroup && (
            <div className="p-4 bg-slate-900 text-white border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">المجموعة المختارة:</span>
                  <span className="text-amber-300 font-black">{selectedGroup.name_ar || selectedGroup.name}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/80">م/ {selectedGroup.teacher_name}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  سعر الشهر: {grossPrice} ج.م
                </span>
              </div>

              {/* Financial Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-right">
                {/* Gross Price */}
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-white/60 block">سعر الشهر</span>
                  <p className="text-base font-black text-white mt-0.5">{grossPrice} ج.م</p>
                </div>

                {/* Persistent Discount */}
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/60">الخصم</span>
                    <button
                      type="button"
                      onClick={() => setDiscountType(t => t === 'FIXED' ? 'PERCENT' : 'FIXED')}
                      className="text-[9px] bg-white/10 hover:bg-white/20 text-amber-300 px-1 py-0.2 rounded font-bold"
                    >
                      {discountType === 'FIXED' ? 'ج.م' : '%'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-white/10 text-white text-xs font-bold py-1 px-1.5 rounded border border-white/10 text-center"
                  />
                  <span className="text-[9px] text-amber-300 block mt-0.5">خصم: {discountAmount} ج.م</span>
                </div>

                {/* Net Price */}
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-white/60 block">الصافي المطلوب</span>
                  <p className="text-base font-black text-emerald-400 mt-0.5">{netPrice} ج.م</p>
                </div>

                {/* Amount Paid Now */}
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-white/60 block mb-1">المدفوع نقداً</span>
                  <input
                    type="number"
                    min="0"
                    max={netPrice}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-white/10 text-white text-xs font-bold py-1 px-1.5 rounded border border-white/10 text-center"
                  />
                  <span className={`text-[9px] block mt-0.5 ${remainingDebt > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {remainingDebt > 0 ? `مديونية: ${remainingDebt} ج.م` : 'مسدد'}
                  </span>
                </div>
              </div>

              {/* Sessions Count & Month */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/10 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">الحصص المشحونة:</span>
                  {[1, 2, 4, 8].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSessionsCount(num)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        sessionsCount === num ? 'bg-amber-400 text-slate-900' : 'bg-white/10 text-white'
                      }`}
                    >
                      {num} حصص
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-white/60">الشهر:</span>
                  <input
                    type="month"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="bg-white/10 text-white text-xs font-bold py-0.5 px-2 rounded border border-white/10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selected Preview & Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-700 w-full sm:w-auto">
              {!selectedGroup && (
                <span className="text-amber-700 font-medium">
                  👈 يرجى الضغط على إحدى المجموعات أعلاه لاختيارها
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <button type="button" onClick={onClose} className="atlas-btn-ghost text-xs px-4 py-2">
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading || !selectedGroupId}
                className="atlas-btn-primary text-xs px-6 py-2.5 flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? 'جاري القيد والماليات...' : `تأكيد قيد الطالب وشحن الحصص (${netPrice} ج.م)`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODAL: PAY SUBSCRIPTION DEBT (WITHOUT ADDING SESSIONS)
// -------------------------------------------------------------
function PayDebtModal({ isOpen, onClose, student, group, onSuccess }) {
  const initialDebt = Math.max(0, parseFloat(group.amount_due) || 0);
  const [amountPaid, setAmountPaid] = useState(initialDebt);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAmountPaid(Math.max(0, parseFloat(group.amount_due) || 0));
  }, [group]);

  const handleAmountChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setAmountPaid('');
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (val > initialDebt) {
        setAmountPaid(initialDebt);
        toast.error(`⚠️ لا يمكن إدخال مبلغ أكبر من قيمة المديونية المستحقة (${initialDebt} ج.م)`);
        return;
      }
      if (val < 0) {
        setAmountPaid(0);
        return;
      }
    }
    setAmountPaid(valStr);
  };

  const handleAmountBlur = () => {
    const val = parseFloat(amountPaid);
    if (isNaN(val) || val < 0) {
      setAmountPaid(0);
    } else if (val > initialDebt) {
      setAmountPaid(initialDebt);
      toast.error(`⚠️ تم ضبط المبلغ على قيمة المديونية المستحقة (${initialDebt} ج.م)`);
    }
  };

  const paidNum = parseFloat(amountPaid) || 0;
  const remainingDue = Math.max(0, initialDebt - paidNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (initialDebt <= 0) {
      toast.error('لا توجد مديونية مسجلة على هذا الطالب في هذه المجموعة');
      return;
    }
    if (paidNum <= 0) {
      toast.error('يرجى إدخال مبلغ أكبر من الصفر لسداد المديونية');
      return;
    }
    if (paidNum > initialDebt) {
      toast.error(`المبلغ المدفوع (${paidNum} ج.م) أكبر من المديونية المستحقة (${initialDebt} ج.م)`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        student_id: student?.id,
        group_id: group.group_id || group.id,
        amount_paid: paidNum,
        notes: notes.trim() || `سداد مديونية اشتراك: ${paidNum} ج.م لمجموعة ${group.group_name_ar || group.group_name}`,
      };

      const { data } = await api.post('/subscriptions/pay-debt', payload);
      toast.success(data.message || 'تم سداد المديونية وإيداع المبلغ بالخزينة بنجاح');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء سداد المديونية');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-5 text-white flex items-center justify-between bg-gradient-to-r from-amber-600 to-amber-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet size={22} />
            </div>
            <div>
              <h3 className="text-base font-black">سداد مديونية اشتراك</h3>
              <p className="text-xs text-white/80">
                {student?.full_name_ar || student?.full_name || 'الطالب'} {student?.student_code ? `(#${student.student_code})` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">المجموعة:</span>
              <span className="text-xs font-black text-slate-800">{group.group_name_ar || group.group_name}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/60">
              <span className="text-xs font-bold text-amber-900">إجمالي المديونية المستحقة:</span>
              <span className="text-base font-black text-rose-600 font-mono">{initialDebt} ج.م</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                المبلغ المراد سداده نقداً بالخزينة (ج.م):
              </label>
              <button
                type="button"
                onClick={() => setAmountPaid(initialDebt)}
                className="text-[11px] text-[#0C3C82] hover:underline font-bold"
              >
                سداد كامل الدين ({initialDebt} ج.م)
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={initialDebt}
              value={amountPaid}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              className={`atlas-input text-base font-black text-center ${
                paidNum > initialDebt
                  ? 'border-rose-400 bg-rose-50 text-rose-800'
                  : 'text-emerald-800 bg-emerald-50/50 border-emerald-300'
              }`}
              required
              autoFocus
            />
            {paidNum > initialDebt && (
              <p className="text-[11px] text-rose-600 font-bold mt-1">
                ⚠️ لا يمكن إدخال مبلغ أكبر من قيمة المديونية ({initialDebt} ج.م)
              </p>
            )}
          </div>

          {/* Debt balance preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">المتبقي من الدين بعد السداد:</span>
            <span className={`font-mono text-sm ${remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600 font-black'}`}>
              {remainingDue > 0 ? `${remainingDue} ج.م` : 'خالص بالكامل (0 ج.م)'}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
            ℹ️ تنبيه: يتم تسجيل المبلغ كإيراد بالخزينة العامة لسداد الدين دون تعديل رصيد الحصص المشحونة.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات السداد (اختياري):
            </label>
            <input
              type="text"
              placeholder="مثال: سداد قسط المديونية نقداً"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="atlas-input text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="atlas-btn-ghost text-xs">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || paidNum <= 0 || paidNum > initialDebt || initialDebt <= 0}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'جاري السداد...' : `تأكيد سداد ${paidNum} ج.م`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODAL: CLEARANCE & SESSIONS REFUND (تصفية الحساب واسترداد الحصص)
// -------------------------------------------------------------
function ClearanceRefundModal({ isOpen, onClose, student, group, onSuccess }) {
  const remaining = parseInt(group.remaining_sessions || 0, 10);
  const basePricePerSession = parseFloat(group.price_per_session) || 
                              (parseFloat(group.price_per_month) ? Math.round(parseFloat(group.price_per_month) / 4) : 50);

  const totalSessions = parseInt(group.total_sessions || 0, 10);
  const amountPaid = parseFloat(group.amount_paid || 0);
  const actualPaidRate = (totalSessions > 0 && amountPaid > 0) ? (amountPaid / totalSessions) : basePricePerSession;

  let sessionDiscount = 0;
  // Use actual paid session rate if lower than standard group price (e.g. package or discounted center rate)
  let effectivePricePerSession = basePricePerSession;
  if (actualPaidRate > 0 && actualPaidRate < basePricePerSession) {
    effectivePricePerSession = Math.round(actualPaidRate);
  } else {
    // Apply student's persistent discount
    const dType = group.discount_type || 'FIXED';
    const dVal = parseFloat(group.discount_value) || 0;
    if (dType === 'PERCENT' && dVal > 0) {
      sessionDiscount = (basePricePerSession * Math.min(100, dVal)) / 100;
    } else if (dType === 'FIXED' && dVal > 0) {
      sessionDiscount = dVal / 4;
    }
    effectivePricePerSession = Math.max(0, basePricePerSession - sessionDiscount);
  }

  const grossSessionsValue = Math.max(0, Math.round(remaining * effectivePricePerSession));
  const currentDebt = Math.max(0, parseFloat(group.amount_due) || 0);
  const netRefund = Math.max(0, grossSessionsValue - currentDebt);

  const [refundAmount, setRefundAmount] = useState(netRefund);
  const [dropGroup, setDropGroup] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRefundAmount(netRefund);
  }, [group, netRefund]);

  const handleRefundAmountChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setRefundAmount('');
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (val > netRefund) {
        setRefundAmount(netRefund);
        toast.error(`⚠️ لا يمكن استرداد مبلغ أكبر من صافي المستحق (${netRefund} ج.م)`);
        return;
      }
      if (val < 0) {
        setRefundAmount(0);
        return;
      }
    }
    setRefundAmount(valStr);
  };

  const handleRefundAmountBlur = () => {
    const val = parseFloat(refundAmount);
    if (isNaN(val) || val < 0) {
      setRefundAmount(0);
    } else if (val > netRefund) {
      setRefundAmount(netRefund);
      toast.error(`⚠️ تم ضبط المبلغ على صافي المستحق (${netRefund} ج.م)`);
    }
  };

  const refundNum = parseFloat(refundAmount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (remaining === 0 && currentDebt === 0) {
      toast.error('لا توجد حصص متبقية أو مديونية مستحقة لتصفية الحساب في هذه المجموعة');
      return;
    }

    if (refundNum > netRefund) {
      toast.error(`مبلغ الاسترداد (${refundNum} ج.م) لا يمكن أن يتجاوز صافي المستحق للطالب (${netRefund} ج.م) بعد خصم المديونية (${currentDebt} ج.م)`);
      return;
    }

    if (refundNum < 0) {
      toast.error('مبلغ الاسترداد لا يمكن أن يكون سالباً');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        student_id: student.id,
        group_id: group.group_id || group.id,
        refund_amount: refundNum,
        drop_group: dropGroup,
        notes: notes.trim(),
      };

      const { data } = await api.post('/subscriptions/refund-clearance', payload);
      toast.success(data.message || 'تمت تصفية الحساب بنجاح');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء التصفية');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-5 text-white flex items-center justify-between bg-gradient-to-r from-rose-700 to-rose-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <LogOut size={22} />
            </div>
            <div>
              <h3 className="text-base font-black">تصفية حساب الطالب واسترداد الحصص</h3>
              <p className="text-xs text-white/80">
                {student?.full_name_ar || student?.full_name} (#{student?.student_code})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">المجموعة:</span>
              <span className="text-xs font-black text-slate-900">{group.group_name_ar || group.group_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">المدرس والمادة:</span>
              <span className="text-xs text-slate-700">{group.teacher_name} • {group.subject_name}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-600">رصيد الحصص المتبقي للطالب:</span>
              <span className="px-3 py-1 rounded-xl bg-blue-100 text-[#0C3C82] font-mono font-black text-sm border border-blue-200">
                {remaining} حصة متبقية
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>سعر الحصة التقديري: <strong>{basePricePerSession} ج.م</strong></span>
              <span>إجمالي قيمة الحصص: <strong className="font-mono">{grossSessionsValue} ج.م</strong></span>
            </div>
            {sessionDiscount > 0 && (
              <div className="flex items-center justify-between text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-200 font-bold">
                <span>🏷️ تم تطبيق الخصم الدائم للطالب (-{sessionDiscount} ج.م/حصة):</span>
                <span>السعر الفعلي للحصة: {effectivePricePerSession} ج.م</span>
              </div>
            )}

            {/* Debt deduction details */}
            {currentDebt > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-700 pt-1.5 border-t border-slate-200 font-bold">
                <span>- مديونية سابقة مستحقة على الطالب:</span>
                <span className="font-mono font-black">-{currentDebt} ج.م</span>
              </div>
            )}

            {/* Net formula */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs font-black text-emerald-800">
              <span>صافي المستحق للاسترداد (بعد خصم الدين):</span>
              <span className="font-mono text-sm">{netRefund} ج.م</span>
            </div>

            {currentDebt > grossSessionsValue && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
                ⚠️ تنبيه: قيمة الحصص المتبقية ({grossSessionsValue} ج.م) أقل من المديونية ({currentDebt} ج.م). سيتم استهلاك الحصص لتخفيض المديونية إلى {currentDebt - grossSessionsValue} ج.م ولن يتم صرف نقدية.
              </p>
            )}
          </div>

          {/* Refund Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المبلغ المسترد نقداً للطالب من الخزينة (ج.م):
            </label>
            <input
              type="number"
              min="0"
              max={netRefund}
              value={refundAmount}
              onChange={handleRefundAmountChange}
              onBlur={handleRefundAmountBlur}
              className={`atlas-input text-base font-black text-center ${
                refundNum > netRefund
                  ? 'border-rose-500 bg-rose-50 text-rose-800'
                  : 'text-rose-700 bg-rose-50/40 border-rose-300'
              }`}
              required
            />
            {refundNum > netRefund && (
              <p className="text-[11px] text-rose-600 font-bold mt-1">
                ⚠️ لا يمكن صرف مبلغ يتجاوز صافي المستحق ({netRefund} ج.م)
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              محسوب تلقائياً: (قيمة الحصص المتبقية - المديونية)، والحد الأقصى هو {netRefund} ج.م.
            </p>
          </div>

          {/* Drop group checkbox */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 cursor-pointer select-none" onClick={() => setDropGroup(!dropGroup)}>
            <input
              type="checkbox"
              id="dropGroup"
              checked={dropGroup}
              onChange={(e) => setDropGroup(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <label htmlFor="dropGroup" className="text-xs font-bold text-slate-700 cursor-pointer">
              إلغاء قيد الطالب من المجموعة تلقائياً (إسقاط الطالب من كشف المجموعة)
            </label>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              سبب التصفية / ملاحظات الإدارة:
            </label>
            <input
              type="text"
              placeholder="مثال: رغبة ولي الأمر في الانسحاب لظروف السفر"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="atlas-input text-xs"
            />
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle size={18} className="flex-shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">تنبيه عند التأكيد:</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                سيتم تصفية رصيد الحصص المتبقي ({remaining} حصة) ليصبح 0، {refundNum > 0 ? `ويتم تسجيل إذن صرف نقدية من الخزينة بمبلغ ${refundNum} ج.م.` : 'دون صرف نقدية من الخزينة.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="atlas-btn-ghost text-xs">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || (remaining === 0 && currentDebt === 0) || refundNum > netRefund || refundNum < 0}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'جاري التصفية...' : (refundNum > 0 ? `تأكيد التصفية وصرف ${refundNum} ج.م` : 'تأكيد التصفية (0 ج.م)')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

