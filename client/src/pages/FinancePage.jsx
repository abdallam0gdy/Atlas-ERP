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
  const [stats, setStats] = useState({
    currentCash: 0,
    today: { inflows: 0, outflows: 0, subscriptions: 0, cashIn: 0, cashOut: 0, netToday: 0 },
    month: { subscriptions: 0, totalTeacherDues: 0, centerNetProfit: 0 },
    teachers: [],
  });

  // Debts Tab Data
  const [debts, setDebts] = useState([]);
  const [debtsLoading, setDebtsLoading] = useState(false);
  const [searchDebt, setSearchDebt] = useState('');

  // Transactions Ledger Data
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);

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

      {/* Financial KPIs Grid */}
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

        {/* Card 2: Center Clean Net Share */}
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

        {/* Card 3: Total Teacher Dues */}
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
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="atlas-card p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                كشف حساب مستحقات المدرسين وتوزيع أرباح السنتر
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                حساب دقيق لنسب المدرسين وحصة إدارة السنتر من الاشتراكات الشهرية المحصلة
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="atlas-table w-full">
                <thead>
                  <tr>
                    <th>اسم المدرس</th>
                    <th>المادة</th>
                    <th>نظام التوزيع</th>
                    <th>المجموعات والطلاب</th>
                    <th>إجمالي المحصل</th>
                    <th>مستحقات المدرس</th>
                    <th>حصة السنتر</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.teachers || []).map((t) => (
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
                      <td className="font-bold text-xs text-slate-900">
                        {formatEGP(t.totalCollected || 0)}
                      </td>
                      <td className="font-bold text-xs text-indigo-700">
                        {formatEGP(t.teacherShare || 0)}
                      </td>
                      <td className="font-bold text-xs text-emerald-700">
                        {formatEGP(t.centerShare || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TREASURY LEDGER & SHIFTS */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Today's Transactions */}
          <div className="atlas-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  حركة الخزينة والدرج الحية (اليومية)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">سجل بجميع العمليات المالية وحركات الدرج الواردة والصادرة</p>
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
                  {transactions.slice(0, 25).map((tx) => {
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
                  })}
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
      )}

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
