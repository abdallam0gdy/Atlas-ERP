import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Wallet, TrendingUp, TrendingDown, Users, CheckCircle2,
  DollarSign, ArrowUpRight, ArrowDownLeft, Search, Filter,
  RefreshCw, FileText, AlertTriangle, ArrowUpDown, Loader2,
  Lock, Calendar, Plus, X, GraduationCap, Clock, Check, CreditCard, ArrowLeft
} from 'lucide-react';
import { formatTime12h, formatEGP, formatCount } from '../lib/formatters';

export default function FinancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' | 'ledger'
  const [loading, setLoading] = useState(true);

  // Stats & Treasury Data
  const [periodScope, setPeriodScope] = useState('today'); // 'today' | 'month'
  const [stats, setStats] = useState({
    currentCash: 0,
    today: { inflows: 0, outflows: 0, subscriptions: 0, cashIn: 0, cashOut: 0, netToday: 0, teacherDues: 0, centerShare: 0, centerNetProfit: 0 },
    month: { subscriptions: 0, totalTeacherDues: 0, centerNetProfit: 0 },
    teachers: [],
  });

  // Teachers Tab Filter & View Mode
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherViewMode, setTeacherViewMode] = useState('today'); // 'today' | 'month'

  // Debts Tab Data
  const [debts, setDebts] = useState([]);
  const [debtsLoading, setDebtsLoading] = useState(false);
  const [searchDebt, setSearchDebt] = useState('');

  // Transactions Ledger Data & Filters
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerDateFilter, setLedgerDateFilter] = useState('today'); // 'today' | 'yesterday' | 'all'
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all'); // 'all' | 'inflow' | 'outflow' | 'subscription' | 'petty_cash'

  // Modals
  const [isPettyCashModalOpen, setIsPettyCashModalOpen] = useState(false);
  const [pettyCashForm, setPettyCashForm] = useState({
    type: 'out', // 'out' | 'in'
    amount: '',
    reason: '',
    person_name: '',
  });
  const [pettyCashLoading, setPettyCashLoading] = useState(false);

  // Settle Debt Modal
  const [settlingDebt, setSettlingDebt] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleLoading, setSettleLoading] = useState(false);

  // Shift Close Modal
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [actualCashInput, setActualCashInput] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [closingLoading, setClosingLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchDebts(),
        fetchTransactions(),
        fetchSettlements(),
      ]);
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/finance/treasury-stats');
      setStats(res.data?.data || {});
    } catch (err) {
      console.error('Error loading treasury stats:', err);
    }
  };

  const fetchDebts = async () => {
    setDebtsLoading(true);
    try {
      if (searchDebt) params.search = searchDebt;

      const res = await api.get('/finance/debts', { params });
      setDebts(res.data?.data?.debts || []);
    } catch (err) {
      console.error('Error loading debts report:', err);
    } finally {
      setDebtsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/finance/transactions');
      setTransactions(res.data?.data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const fetchSettlements = async () => {
    try {
      const res = await api.get('/finance/settlements');
      setSettlements(res.data?.data || []);
    } catch (err) {
      console.error('Error loading settlements:', err);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // Handle Petty Cash (Cash In / Out)
  const handlePettyCashSubmit = async (e) => {
    e.preventDefault();
    if (!pettyCashForm.amount || parseFloat(pettyCashForm.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!pettyCashForm.reason.trim()) {
      toast.error('يرجى كتابة سبب حركة النقدية (مثل: تصوير ورق، شراء أقلام)');
      return;
    }

    setPettyCashLoading(true);
    try {
      const res = await api.post('/finance/petty-cash', {
        type: pettyCashForm.type,
        amount: parseFloat(pettyCashForm.amount),
        reason: pettyCashForm.reason,
        person_name: pettyCashForm.person_name,
      });

      toast.success(res.data?.message || 'تم تسجيل حركة النقدية بالدرج بنجاح');
      setIsPettyCashModalOpen(false);
      setPettyCashForm({ type: 'out', amount: '', reason: '', person_name: '' });
      fetchStats();
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تسجيل حركة النقدية');
    } finally {
      setPettyCashLoading(false);
    }
  };

  // Handle Settle Debt
  const handleOpenSettleModal = (debtItem) => {
    setSettlingDebt(debtItem);
    setSettleAmount(debtItem.amount_due || '');
    setSettleNotes('');
  };

  const handleSettleAmountChange = (e) => {
    const maxDue = Math.max(0, parseFloat(settlingDebt?.amount_due) || 0);
    const valStr = e.target.value;
    if (valStr === '') {
      setSettleAmount('');
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (val > maxDue) {
        setSettleAmount(maxDue);
        toast.error(`⚠️ لا يمكن سداد أكثر من قيمة المديونية المستحقة (${formatEGP(maxDue)})`);
        return;
      }
      if (val < 0) {
        setSettleAmount(0);
        return;
      }
    }
    setSettleAmount(valStr);
  };

  const handleSettleAmountBlur = () => {
    const maxDue = Math.max(0, parseFloat(settlingDebt?.amount_due) || 0);
    const val = parseFloat(settleAmount);
    if (isNaN(val) || val < 0) {
      setSettleAmount(0);
    } else if (val > maxDue) {
      setSettleAmount(maxDue);
      toast.error(`⚠️ تم ضبط المبلغ على قيمة المديونية المستحقة (${formatEGP(maxDue)})`);
    }
  };

  const confirmSettleDebt = async (e) => {
    e.preventDefault();
    if (!settlingDebt || !settleAmount || parseFloat(settleAmount) <= 0) {
      toast.error('يرجى تحديد المبلغ المسدد');
      return;
    }

    const maxDue = parseFloat(settlingDebt?.amount_due) || 0;
    const paidVal = parseFloat(settleAmount);

    if (paidVal > maxDue) {
      toast.error(`المبلغ المطلوب سداده هو ${maxDue} ج.م فقط، لا يمكن سداد أكثر من المديونية`);
      return;
    }

    setSettleLoading(true);
    try {
      const res = await api.post('/finance/settle-debt', {
        student_id: settlingDebt.student_id,
        group_id: settlingDebt.group_id,
        amount: paidVal,
        amount_paid: paidVal,
        billing_month: settlingDebt.billing_month,
        notes: settleNotes.trim() || null,
      });

      toast.success(res.data?.message || 'تم تسجيل سداد الاشتراك بنجاح');
      setSettlingDebt(null);
      fetchDebts();
      fetchStats();
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تسجيل السداد');
    } finally {
      setSettleLoading(false);
    }
  };

  // Handle Shift Close
  const handleCloseShift = async (e) => {
    e.preventDefault();
    setClosingLoading(true);
    try {
      const res = await api.post('/finance/settlements', {
        actual_cash: parseFloat(actualCashInput) || 0,
        notes: shiftNotes.trim() || null,
      });

      toast.success(res.data?.message || 'تم تقفيل الوردية وإقفال اليومية بنجاح');
      setIsCloseShiftModalOpen(false);
      setActualCashInput('');
      setShiftNotes('');
      fetchStats();
      fetchSettlements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تقفيل الوردية');
    } finally {
      setClosingLoading(false);
    }
  };

  const totalOverdueDebts = debts.reduce((sum, d) => sum + parseFloat(d.amount_due || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold" style={{ color: '#0C3C82' }}>
              مكتب الاستقبال والخزينة الرئيسية
            </h1>
            <span className="atlas-badge atlas-badge-info">الخزينة الرئيسية</span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            تحصيل وتجديد اشتراكات الطلاب، نسب ومستحقات المدرسين، وسحب وتوريد النقدية بالدرج
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsPettyCashModalOpen(true)}
            className="atlas-btn atlas-btn-primary text-sm shadow-sm"
          >
            <ArrowUpDown size={18} />
            <span>حركة نقدية بالدرج (داخلة / خارجة)</span>
          </button>

          <button
            onClick={() => {
              setActualCashInput(stats.currentCash || '');
              setIsCloseShiftModalOpen(true);
            }}
            className="atlas-btn atlas-btn-secondary text-sm"
          >
            <Lock size={16} />
            <span>تقفيل الوردية واليومية</span>
          </button>

          <button
            onClick={fetchInitialData}
            title="تحديث البيانات"
            className="atlas-btn atlas-btn-ghost p-2 text-slate-500 hover:text-slate-800"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Scope Selector Bar (اليومية الافتراضية vs التراكمي للشهر) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setPeriodScope('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              periodScope === 'today'
                ? 'bg-white text-[#0C3C82] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>☀️ حسابات اليوم والدرج (اليومية)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-[#0C3C82] font-bold">تلقائي</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriodScope('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              periodScope === 'month'
                ? 'bg-white text-[#0C3C82] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📅 الحساب التراكمي للشهر</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {periodScope === 'today' ? (
            <span>عرض حي لحسابات اليومية والدرج ليوم: <strong className="text-slate-800">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
          ) : (
            <span>عرض تراكمي لإجمالي الحسابات والاشتراكات للشهر الجاري</span>
          )}
        </div>
      </div>

      {/* Financial KPIs Grid */}
      {periodScope === 'today' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          {/* Card 1: Live Drawer Cash */}
          <div className="atlas-card p-4.5 flex items-center justify-between border-blue-200 bg-gradient-to-br from-white to-blue-50/40">
            <div>
              <p className="text-xs font-bold text-slate-500">نقدية الدرج الحية (الفلوس)</p>
              <h3 className="text-xl font-black text-[#0C3C82] mt-1">
                {formatEGP(stats.currentCash || 0)}
              </h3>
              <span className="text-[11px] text-slate-400">
                حركة اليوم: {stats.today?.netToday >= 0 ? '+' : ''}{formatEGP(stats.today?.netToday || 0)}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-[#0C3C82] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Wallet size={22} />
            </div>
          </div>

          {/* Card 2: Today's Inflows */}
          <div className="atlas-card p-4.5 flex items-center justify-between border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40">
            <div>
              <p className="text-xs font-bold text-slate-500">تحصيلات ووارد اليوم</p>
              <h3 className="text-xl font-black text-emerald-700 mt-1">
                {formatEGP(stats.today?.inflows || 0)}
              </h3>
              <span className="text-[11px] text-slate-400">
                اشتراكات: {formatEGP(stats.today?.subscriptions || 0)}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ArrowDownLeft size={22} />
            </div>
          </div>

          {/* Card 3: Today's Outflows */}
          <div className="atlas-card p-4.5 flex items-center justify-between border-rose-200 bg-gradient-to-br from-white to-rose-50/40">
            <div>
              <p className="text-xs font-bold text-slate-500">منصرفات ومسحوبات اليوم</p>
              <h3 className="text-xl font-black text-rose-700 mt-1">
                {formatEGP(stats.today?.outflows || 0)}
              </h3>
              <span className="text-[11px] text-slate-400">
                مسحوبات نقدية واسترداد
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ArrowUpRight size={22} />
            </div>
          </div>

          {/* Card 4: Today's Teacher Dues */}
          <div className="atlas-card p-4.5 flex items-center justify-between border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40">
            <div>
              <p className="text-xs font-bold text-slate-500">مستحقات المدرسين اليوم</p>
              <h3 className="text-xl font-black text-indigo-700 mt-1">
                {formatEGP(stats.today?.teacherDues || 0)}
              </h3>
              <span className="text-[11px] text-slate-400">
                حساب يومية المدرسين
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <GraduationCap size={22} />
            </div>
          </div>

          {/* Card 5: Today's Center Net Profit */}
          <div className="atlas-card p-4.5 flex items-center justify-between border-emerald-300 bg-gradient-to-br from-white to-emerald-50/70">
            <div>
              <p className="text-xs font-bold text-slate-500">صافي مكسب السنتر اليوم</p>
              <h3 className="text-xl font-black text-emerald-800 mt-1">
                {formatEGP(stats.today?.centerNetProfit || 0)}
              </h3>
              <span className="text-[11px] text-emerald-600 font-medium">
                حصة اليوم بعد المصروفات
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          {/* Card 1: Live Drawer Cash */}
          <div className="atlas-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">رصيد الخزينة الحي في الدرج</p>
              <h3 className="text-2xl font-black text-[#0C3C82] mt-1">
                {formatEGP(stats.currentCash || 0)}
              </h3>
              <span className="text-[11px] text-slate-400">
                حركة اليوم: {stats.today?.netToday >= 0 ? '+' : ''}{formatEGP(stats.today?.netToday || 0)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0C3C82] flex items-center justify-center flex-shrink-0">
              <Wallet size={24} />
            </div>
          </div>

          {/* Card 2: Center Clean Net Share (Month) */}
          <div className="atlas-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">حصة السنتر من الاشتراكات</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {formatEGP(stats.month?.centerNetProfit || 0)}
              </h3>
              <span className="text-[11px] text-slate-400">صافي ربح السنتر هذا الشهر</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Card 3: Total Teacher Dues (Month) */}
          <div className="atlas-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">مستحقات المدرسين هذا الشهر</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">
                {formatEGP(stats.month?.totalTeacherDues || 0)}
              </h3>
              <span className="text-[11px] text-slate-400">حسب نسب الحصص والاشتراكات</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={24} />
            </div>
          </div>

          {/* Card 4: Quick Link to Student Subscriptions & Accounts */}
          <div
            onClick={() => navigate('/subscriptions')}
            className="atlas-card p-5 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group bg-gradient-to-br from-white to-blue-50/50"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">اشتراكات وحصص الطلاب</p>
              <h3 className="text-base font-black text-[#0C3C82] mt-1 group-hover:text-blue-700 flex items-center gap-1.5">
                <span>صفحة الحسابات المستقلة</span>
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              </h3>
              <span className="text-[11px] text-slate-400">
                بحث بالكود، متابعة الحصص، والمديونيات
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-[#0C3C82] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Info Banner: Page Separation notice */}
      <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-sky-950 font-bold">
          <CreditCard size={18} className="text-[#0C3C82] flex-shrink-0" />
          <span>تم تخصيص صفحة مستقلة لإدارة اشتراكات الطلاب، شحن الحصص، ومتابعة المديونيات.</span>
        </div>
        <Link
          to="/subscriptions"
          className="atlas-btn atlas-btn-primary text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0 shadow-xs"
        >
          <span>فتح صفحة اشتراكات وحسابات الطلاب</span>
          <ArrowLeft size={14} />
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'teachers'
              ? 'text-[#0C3C82] border-b-2 border-[#0C3C82]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>كشف حساب ونسب المدرسين</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#0C3C82] font-bold">
            {formatCount(stats.teachers?.length || 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'ledger'
              ? 'text-[#0C3C82] border-b-2 border-[#0C3C82]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          حركة الخزينة والوردية (دفتر اليومية)
        </button>
      </div>

      {/* TAB 2: TEACHERS BREAKDOWN */}
      {activeTab === 'teachers' && (() => {
        const displayedTeachers = (stats.teachers || []).filter((t) => {
          if (!teacherSearch) return true;
          const q = teacherSearch.toLowerCase();
          return (
            (t.teacherName || '').toLowerCase().includes(q) ||
            (t.subjectName || '').toLowerCase().includes(q) ||
            (t.phone || '').includes(q)
          );
        });

        const totalCollectedSum = displayedTeachers.reduce(
          (sum, t) => sum + (teacherViewMode === 'today' ? parseFloat(t.todayCollected || 0) : parseFloat(t.totalCollected || 0)),
          0
        );
        const totalTeacherShareSum = displayedTeachers.reduce(
          (sum, t) => sum + (teacherViewMode === 'today' ? parseFloat(t.todayTeacherShare || 0) : parseFloat(t.teacherShare || 0)),
          0
        );
        const totalCenterShareSum = displayedTeachers.reduce(
          (sum, t) => sum + (teacherViewMode === 'today' ? parseFloat(t.todayCenterShare || 0) : parseFloat(t.centerShare || 0)),
          0
        );

        return (
          <div className="space-y-4">
            <div className="atlas-card p-6 space-y-4">
              {/* Header with Search & Mode Toggle */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    كشف حساب ومستحقات المدرسين وتوزيع أرباح السنتر
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    حساب دقيق لنسب المدرسين وحصة إدارة السنتر من الحصص والاشتراكات (يومية وتراكمي)
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTeacherViewMode('today')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        teacherViewMode === 'today'
                          ? 'bg-white text-[#0C3C82] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ☀️ حساب اليومية (اليوم)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherViewMode('month')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        teacherViewMode === 'month'
                          ? 'bg-white text-[#0C3C82] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📅 إجمالي الشهر
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="بحث بالمدرس أو المادة..."
                      className="atlas-input pr-8 py-1.5 text-xs w-48"
                    />
                  </div>
                </div>
              </div>

              {/* Summary KPIs Banner for Filtered Teachers */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 text-xs flex-wrap font-medium">
                <span className="text-slate-700 font-bold">
                  إجمالي كشف حساب المدرسين ({displayedTeachers.length} مدرس):
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <span>
                    إجمالي المحصل ({teacherViewMode === 'today' ? 'اليوم' : 'الشهر'}): <strong className="text-slate-900 font-bold font-mono">{formatEGP(totalCollectedSum)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    مستحقات المدرسين: <strong className="text-indigo-700 font-bold font-mono">{formatEGP(totalTeacherShareSum)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    حصة إدارة السنتر: <strong className="text-emerald-700 font-bold font-mono">{formatEGP(totalCenterShareSum)}</strong>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="atlas-table w-full">
                  <thead>
                    <tr>
                      <th>اسم المدرس</th>
                      <th>المادة</th>
                      <th>نظام التوزيع</th>
                      <th>المجموعات والطلاب</th>
                      {teacherViewMode === 'today' ? (
                        <>
                          <th>تحصيلات اليوم</th>
                          <th>مستحقات المدرس اليوم</th>
                          <th>حصة السنتر اليوم</th>
                          <th>إجمالي مستحقات الشهر</th>
                        </>
                      ) : (
                        <>
                          <th>إجمالي المحصل بالشهر</th>
                          <th>مستحقات المدرس بالشهر</th>
                          <th>حصة السنتر بالشهر</th>
                          <th>مستحقات اليوم</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                          لا يوجد مدرسين يطابقون شروط البحث
                        </td>
                      </tr>
                    ) : (
                      displayedTeachers.map((t) => (
                        <tr key={t.teacherId}>
                          <td>
                            <p className="font-bold text-slate-800 text-sm">{t.teacherName}</p>
                            <span className="text-[11px] text-slate-400 font-mono">{t.phone || ''}</span>
                          </td>
                          <td className="text-xs font-semibold text-slate-700">
                            {t.subjectName}
                          </td>
                          <td>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0C3C82]">
                              {t.financialModel === 'PERCENTAGE' 
                                ? `${t.financialValue}% مدرس / ${100 - t.financialValue}% سنتر` 
                                : `${formatEGP(t.financialValue)} / طالب`}
                            </span>
                          </td>
                          <td>
                            <p className="text-xs text-slate-700">{formatCount(t.groupsCount)} مجموعات</p>
                            <span className="text-[11px] text-slate-500">{formatCount(t.enrolledStudents)} طالب مسجل</span>
                          </td>
                          {teacherViewMode === 'today' ? (
                            <>
                              <td className="font-bold text-xs text-slate-900 font-mono">
                                {formatEGP(t.todayCollected || 0)}
                              </td>
                              <td className="font-bold text-xs text-indigo-700 font-mono">
                                {formatEGP(t.todayTeacherShare || 0)}
                              </td>
                              <td className="font-bold text-xs text-emerald-700 font-mono">
                                {formatEGP(t.todayCenterShare || 0)}
                              </td>
                              <td className="text-xs text-slate-500 font-mono">
                                {formatEGP(t.teacherShare || 0)}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="font-bold text-xs text-slate-900 font-mono">
                                {formatEGP(t.totalCollected || 0)}
                              </td>
                              <td className="font-bold text-xs text-indigo-700 font-mono">
                                {formatEGP(t.teacherShare || 0)}
                              </td>
                              <td className="font-bold text-xs text-emerald-700 font-mono">
                                {formatEGP(t.centerShare || 0)}
                              </td>
                              <td className="text-xs text-slate-500 font-mono">
                                {formatEGP(t.todayTeacherShare || 0)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: TREASURY LEDGER & SHIFTS */}
      {activeTab === 'ledger' && (() => {
        const displayedTransactions = (transactions || []).filter((tx) => {
          // Date Filter
          if (ledgerDateFilter === 'today') {
            const txDate = new Date(tx.created_at).toDateString();
            const today = new Date().toDateString();
            if (txDate !== today) return false;
          } else if (ledgerDateFilter === 'yesterday') {
            const txDate = new Date(tx.created_at).toDateString();
            const yest = new Date(Date.now() - 86400000).toDateString();
            if (txDate !== yest) return false;
          }

          // Type Filter
          const isPos = parseFloat(tx.amount) > 0;
          if (ledgerTypeFilter === 'inflow' && !isPos) return false;
          if (ledgerTypeFilter === 'outflow' && isPos) return false;
          if (ledgerTypeFilter === 'subscription' && tx.transaction_type !== 'subscription_fee') return false;
          if (ledgerTypeFilter === 'petty_cash' && !['cash_in', 'cash_out'].includes(tx.transaction_type)) return false;

          // Search Filter
          if (ledgerSearch) {
            const q = ledgerSearch.toLowerCase();
            const matchesNotes = (tx.notes || '').toLowerCase().includes(q);
            const matchesUser = (tx.recorded_by_name || '').toLowerCase().includes(q);
            if (!matchesNotes && !matchesUser) return false;
          }

          return true;
        });

        const ledgerInflow = displayedTransactions.reduce(
          (sum, tx) => sum + (parseFloat(tx.amount) > 0 ? parseFloat(tx.amount) : 0),
          0
        );
        const ledgerOutflow = displayedTransactions.reduce(
          (sum, tx) => sum + (parseFloat(tx.amount) < 0 ? Math.abs(parseFloat(tx.amount)) : 0),
          0
        );
        const ledgerNet = ledgerInflow - ledgerOutflow;

        return (
          <div className="space-y-6">
            {/* Live Drawer & Transactions */}
            <div className="atlas-card p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    حركة الخزينة والدرج الحية (دفتر اليومية)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    سجل بجميع العمليات المالية وحركات الدرج الواردة والصادرة
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Date Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setLedgerDateFilter('today')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerDateFilter === 'today'
                          ? 'bg-white text-[#0C3C82] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ☀️ اليوم
                    </button>
                    <button
                      type="button"
                      onClick={() => setLedgerDateFilter('yesterday')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerDateFilter === 'yesterday'
                          ? 'bg-white text-[#0C3C82] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📆 أمس
                    </button>
                    <button
                      type="button"
                      onClick={() => setLedgerDateFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerDateFilter === 'all'
                          ? 'bg-white text-[#0C3C82] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📋 الكل
                    </button>
                  </div>

                  {/* Type Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setLedgerTypeFilter('all')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setLedgerTypeFilter('inflow')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerTypeFilter === 'inflow' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      وارد (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLedgerTypeFilter('outflow')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerTypeFilter === 'outflow' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      منصرف (-)
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="بحث في البيان أو الموظف..."
                      className="atlas-input pr-8 py-1.5 text-xs w-44"
                    />
                  </div>
                </div>
              </div>

              {/* Ledger Summary Bar */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs flex-wrap font-medium">
                <span className="text-slate-700 font-bold">
                  العمليات المعروضة: <strong>{displayedTransactions.length} حركة</strong>
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-emerald-700 font-bold">
                    إجمالي الوارد: +{formatEGP(ledgerInflow)}
                  </span>
                  <span>•</span>
                  <span className="text-rose-700 font-bold">
                    إجمالي المنصرف: -{formatEGP(ledgerOutflow)}
                  </span>
                  <span>•</span>
                  <span className="text-[#0C3C82] font-black">
                    الصافي: {ledgerNet >= 0 ? '+' : ''}{formatEGP(ledgerNet)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="atlas-table w-full">
                  <thead>
                    <tr>
                      <th>الوقت والتاريخ</th>
                      <th>نوع الحركة</th>
                      <th>المبلغ</th>
                      <th>البيان والملاحظات</th>
                      <th>المسؤول</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                          لا توجد حركات نقدية تطابق الفلاتر المحددة
                        </td>
                      </tr>
                    ) : (
                      displayedTransactions.slice(0, 50).map((tx) => {
                        const isPositive = parseFloat(tx.amount) > 0;
                        return (
                          <tr key={tx.id}>
                            <td className="text-xs text-slate-500 font-mono">
                              {tx.created_at ? new Date(tx.created_at).toLocaleString('ar-EG') : '—'}
                            </td>
                            <td>
                              <span className={`atlas-badge ${isPositive ? 'atlas-badge-success' : 'atlas-badge-error'}`}>
                                {tx.transaction_type === 'cash_in' && 'دخول نقدية للدرج'}
                                {tx.transaction_type === 'cash_out' && 'خروج نقدية من الدرج'}
                                {tx.transaction_type === 'subscription_fee' && 'اشتراك طالب'}
                                {(tx.transaction_type === 'booklet_advance' || tx.transaction_type === 'booklet_reservation_deposit') && 'عربون حجز ملزمة'}
                                {(tx.transaction_type === 'booklet_handover' || tx.transaction_type === 'booklet_delivery_payment') && 'تحصيل تسليم ملزمة'}
                                {tx.transaction_type === 'pos_sale' && 'مبيعات كاشير'}
                                {tx.transaction_type === 'expense' && 'مصروفات'}
                                {tx.transaction_type === 'manual_deposit' && 'إيداع يدوي'}
                                {!['cash_in', 'cash_out', 'subscription_fee', 'booklet_advance', 'booklet_handover', 'booklet_reservation_deposit', 'booklet_delivery_payment', 'pos_sale', 'expense', 'manual_deposit'].includes(tx.transaction_type) && tx.transaction_type}
                              </span>
                            </td>
                            <td className={`font-mono font-bold text-xs ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isPositive ? '+' : ''}{formatEGP(Math.abs(parseFloat(tx.amount)))}
                            </td>
                            <td className="text-xs text-slate-700 max-w-md truncate">
                              {tx.notes || '—'}
                            </td>
                            <td className="text-xs text-slate-500">
                              {tx.recorded_by_name || 'الاستقبال'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shift Closings History */}
            <div className="atlas-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">سجل تقفيل الورديات وإقفال اليومية السابق</h3>
              {settlements.length === 0 ? (
                <p className="text-xs text-slate-400">لم يتم تقفيل ورديات سابقة بعد.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="atlas-table w-full">
                    <thead>
                      <tr>
                        <th>تاريخ وتوقيت التقفيل</th>
                        <th>المسؤول</th>
                        <th>النقدية المحسوبة</th>
                        <th>النقدية الفعلية المسلمة</th>
                        <th>العجز / الزيادة</th>
                        <th>ملاحظات التقفيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((s) => (
                        <tr key={s.id}>
                          <td className="text-xs font-mono text-slate-600">
                            {new Date(s.closed_at).toLocaleString('ar-EG')}
                          </td>
                          <td className="text-xs font-semibold text-slate-800">{s.user_name}</td>
                          <td className="text-xs font-mono">{formatEGP(s.expected_cash)}</td>
                          <td className="text-xs font-mono font-bold text-[#0C3C82]">{formatEGP(s.actual_cash)}</td>
                          <td>
                            {parseFloat(s.difference) === 0 ? (
                              <span className="atlas-badge atlas-badge-success">مطابق 100%</span>
                            ) : (
                              <span className={`atlas-badge ${parseFloat(s.difference) > 0 ? 'atlas-badge-info' : 'atlas-badge-error'}`}>
                                {parseFloat(s.difference) > 0 ? `+${formatEGP(s.difference)} زيادة` : `${formatEGP(s.difference)} عجز`}
                              </span>
                            )}
                          </td>
                          <td className="text-xs text-slate-500">{s.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL 1: Petty Cash Movement (فلوس داخلة / خارجة) */}
      {isPettyCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0C3C82] flex items-center justify-center">
                  <ArrowUpDown size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">حركة نقدية بالدرج</h3>
                  <p className="text-xs text-slate-500">تسجيل فلوس داخلة أو خارجة من عهدة الاستقبال</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPettyCashModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePettyCashSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPettyCashForm({ ...pettyCashForm, type: 'out' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    pettyCashForm.type === 'out'
                      ? 'bg-white text-rose-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <ArrowDownLeft size={15} />
                  <span>خروج نقدية (مصروف / شراء)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPettyCashForm({ ...pettyCashForm, type: 'in' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    pettyCashForm.type === 'in'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <ArrowUpRight size={15} />
                  <span>دخول نقدية (تصوير ورق / فكة)</span>
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  المبلغ (ج.م) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={pettyCashForm.amount}
                    onChange={(e) => setPettyCashForm({ ...pettyCashForm, amount: e.target.value })}
                    placeholder="مثال: 50"
                    className="atlas-input pl-10 text-sm font-bold"
                    autoFocus
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">ج.م</span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  السبب والبيان <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pettyCashForm.reason}
                  onChange={(e) => setPettyCashForm({ ...pettyCashForm, reason: e.target.value })}
                  placeholder="مثال: تصوير ورق امتحان، شراء أدوات نظافة، فكة درج..."
                  className="atlas-input text-sm"
                  required
                />
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المستلم أو المورد (اختياري)
                </label>
                <input
                  type="text"
                  value={pettyCashForm.person_name}
                  onChange={(e) => setPettyCashForm({ ...pettyCashForm, person_name: e.target.value })}
                  placeholder="مثال: اسم المستلم، المورد، أو الجهة..."
                  className="atlas-input text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPettyCashModalOpen(false)}
                  className="atlas-btn atlas-btn-ghost text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pettyCashLoading}
                  className={`atlas-btn text-xs font-bold text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 ${
                    pettyCashForm.type === 'out' ? 'bg-rose-600 hover:bg-rose-700 border-rose-600' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'
                  }`}
                >
                  {pettyCashLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>جاري التسجيل...</span>
                    </>
                  ) : (
                    <span>تأكيد حركة النقدية بالدرج</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Settle Student Debt */}
      {settlingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-800">سداد اشتراك طالب</h3>
              </div>
              <button 
                onClick={() => setSettlingDebt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">الطالب:</span>
                <span className="font-bold text-slate-800">{settlingDebt.student_name} (#{settlingDebt.student_code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المجموعة:</span>
                <span className="font-bold text-slate-800">{settlingDebt.group_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المبلغ المتأخر المطلوب:</span>
                <span className="font-bold text-rose-700">{formatEGP(settlingDebt.amount_due)}</span>
              </div>
            </div>

            <form onSubmit={confirmSettleDebt} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  المبلغ المسدد الآن (ج.م)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={settlingDebt ? Math.max(0, parseFloat(settlingDebt.amount_due) || 0) : undefined}
                    step="1"
                    value={settleAmount}
                    onChange={handleSettleAmountChange}
                    onBlur={handleSettleAmountBlur}
                    className={`atlas-input pl-10 text-sm font-bold ${
                      parseFloat(settleAmount) > (parseFloat(settlingDebt?.amount_due) || 0)
                        ? 'border-rose-500 bg-rose-50 text-rose-800'
                        : ''
                    }`}
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">ج.م</span>
                </div>
                {parseFloat(settleAmount) > (parseFloat(settlingDebt?.amount_due) || 0) && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    ⚠️ لا يمكن سداد أكثر من قيمة المديونية ({formatEGP(settlingDebt?.amount_due)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملاحظات السداد (اختياري)
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="سداد نقدي عند الباب..."
                  className="atlas-input text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettlingDebt(null)}
                  className="atlas-btn atlas-btn-ghost text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={
                    settleLoading ||
                    !settleAmount ||
                    parseFloat(settleAmount) <= 0 ||
                    parseFloat(settleAmount) > (parseFloat(settlingDebt?.amount_due) || 0)
                  }
                  className="atlas-btn atlas-btn-primary text-xs"
                >
                  {settleLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>جاري السداد...</span>
                    </>
                  ) : (
                    <span>تأكيد سداد الاشتراك</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Close Shift & Daily Settlement */}
      {isCloseShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">تقفيل الوردية وإقفال اليومية</h3>
                  <p className="text-xs text-slate-500">جرد النقدية بالدرج وتأكيد تقفيل الحساب</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">النقدية المحسوبة بالسيستم:</span>
                <span className="font-bold text-[#0C3C82]">{formatEGP(stats.currentCash || 0)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  النقدية الفعلية المحصية بالدرج (ج.م)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    className="atlas-input pl-10 text-sm font-bold"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">ج.م</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملاحظات التقفيل (اختياري)
                </label>
                <textarea
                  rows="2"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="ملاحظات على الدرج أو الفكة..."
                  className="atlas-input text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="atlas-btn atlas-btn-ghost text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={closingLoading}
                  className="atlas-btn atlas-btn-primary text-xs"
                >
                  {closingLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>جاري التقفيل...</span>
                    </>
                  ) : (
                    <span>تأكيد إقفال الوردية</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
