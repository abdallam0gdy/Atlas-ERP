import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Search, CheckCircle2, XCircle,
  Clock, DollarSign, UserCheck, AlertTriangle,
  Loader2, RefreshCw, Layers, Check, Edit2
} from 'lucide-react';
import BookletModal from '../components/BookletModal';
import BookletReservationModal from '../components/BookletReservationModal';
import { formatEGP, formatCount } from '../lib/formatters';

export default function BookletsPage() {
  const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' | 'catalog' | 'treasury'
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    todayCollected: 0,
    monthCollected: 0,
    pendingReservationsCount: 0,
    deliveredReservationsCount: 0,
    pendingReceivables: 0,
    totalStockCount: 0,
  });

  // Reservations Tab
  const [reservations, setReservations] = useState([]);
  const [searchRes, setSearchRes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Catalog Tab
  const [booklets, setBooklets] = useState([]);
  const [searchCatalog, setSearchCatalog] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [teachers, setTeachers] = useState([]);

  // Modals
  const [isBookletModalOpen, setIsBookletModalOpen] = useState(false);
  const [editingBooklet, setEditingBooklet] = useState(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  // Handover (Delivery) Modal State
  const [deliveringRes, setDeliveringRes] = useState(null);
  const [collectedAtHandover, setCollectedAtHandover] = useState(0);
  const [deliveringLoading, setDeliveringLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReservations(),
        fetchBooklets(),
        fetchStats(),
        fetchTeachers(),
      ]);
    } catch (err) {
      console.error('Error fetching booklet page data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/booklets/treasury-stats');
      setStats(res.data?.data || {});
    } catch (err) {
      console.error('Error loading booklet stats:', err);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await api.get('/booklets/reservations');
      setReservations(res.data?.data || []);
    } catch (err) {
      console.error('Error loading reservations:', err);
    }
  };

  const fetchBooklets = async () => {
    try {
      const res = await api.get('/booklets');
      setBooklets(res.data?.data || []);
    } catch (err) {
      console.error('Error loading booklets:', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data?.data || []);
    } catch (err) {
      console.error('Error loading teachers:', err);
    }
  };

  // Deliver Handler
  const handleOpenDeliverModal = (resItem) => {
    const remaining = Math.max(0, parseFloat(resItem.total_price || 0) - parseFloat(resItem.paid_amount || 0));
    setDeliveringRes(resItem);
    setCollectedAtHandover(remaining);
  };

  const handleCollectedChange = (e) => {
    const maxRemaining = Math.max(0, parseFloat(deliveringRes?.total_price || 0) - parseFloat(deliveringRes?.paid_amount || 0));
    const valStr = e.target.value;
    if (valStr === '') {
      setCollectedAtHandover('');
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (val > maxRemaining) {
        setCollectedAtHandover(maxRemaining);
        toast.error(`⚠️ لا يمكن تحصيل أكثر من المبلغ المتبقي (${formatEGP(maxRemaining)})`);
        return;
      }
      if (val < 0) {
        setCollectedAtHandover(0);
        return;
      }
    }
    setCollectedAtHandover(valStr);
  };

  const handleCollectedBlur = () => {
    const maxRemaining = Math.max(0, parseFloat(deliveringRes?.total_price || 0) - parseFloat(deliveringRes?.paid_amount || 0));
    const val = parseFloat(collectedAtHandover);
    if (isNaN(val) || val < 0) {
      setCollectedAtHandover(0);
    } else if (val > maxRemaining) {
      setCollectedAtHandover(maxRemaining);
      toast.error(`⚠️ تم ضبط المبلغ على المتبقي (${formatEGP(maxRemaining)})`);
    }
  };

  const confirmDeliver = async () => {
    if (!deliveringRes) return;
    const maxRemaining = Math.max(0, parseFloat(deliveringRes.total_price || 0) - parseFloat(deliveringRes.paid_amount || 0));
    const amountVal = parseFloat(collectedAtHandover) || 0;

    if (amountVal < 0) {
      toast.error('المبلغ المحصل لا يمكن أن يكون سالباً');
      return;
    }
    if (amountVal > maxRemaining) {
      toast.error(`المبلغ المتبقي هو ${maxRemaining} ج.م فقط، لا يمكن تحصيل مبلغ أكبر`);
      return;
    }

    setDeliveringLoading(true);
    try {
      await api.put(`/booklets/reservations/${deliveringRes.id}/deliver`, {
        collect_amount: amountVal,
        collected_remaining: amountVal,
      });
      toast.success('تم تسليم الملزمة وتسجيل التحصيل في الخزينة بنجاح');
      setDeliveringRes(null);
      fetchReservations();
      fetchBooklets();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تسليم الملزمة');
    } finally {
      setDeliveringLoading(false);
    }
  };

  const handleCancelReservation = async (resId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟')) return;
    try {
      await api.delete(`/booklets/reservations/${resId}/cancel`);
      toast.success('تم إلغاء الحجز بنجاح');
      fetchReservations();
      fetchBooklets();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء إلغاء الحجز');
    }
  };

  // Filtered Reservations
  const filteredReservations = reservations.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.delivery_status === statusFilter;
    const matchSearch =
      !searchRes ||
      r.student_name?.toLowerCase().includes(searchRes.toLowerCase()) ||
      String(r.student_code || '').includes(searchRes) ||
      String(r.reservation_number || '').includes(searchRes) ||
      r.item_name?.toLowerCase().includes(searchRes.toLowerCase()) ||
      r.student_phone?.includes(searchRes);
    return matchStatus && matchSearch;
  });

  // Filtered Booklets
  const filteredBooklets = booklets.filter((b) => {
    const matchTeacher = !teacherFilter || b.teacher_id === teacherFilter;
    const matchSearch =
      !searchCatalog ||
      b.name?.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      b.sku?.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      b.teacher_name?.toLowerCase().includes(searchCatalog.toLowerCase());
    return matchTeacher && matchSearch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold" style={{ color: '#0C3C82' }}>
              مكتب الملازم والكتب المدرسية
            </h1>
            <span className="atlas-badge atlas-badge-info">مكتب مستقل</span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            حجز واستلام الملازم الدراسية، إدارة المخزون والمجموعات، وعهدة الخزينة النقدية
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="atlas-btn atlas-btn-primary text-sm shadow-sm"
          >
            <Plus size={18} />
            <span>حجز ملزمة لطالب</span>
          </button>

          <button
            onClick={() => {
              setEditingBooklet(null);
              setIsBookletModalOpen(true);
            }}
            className="atlas-btn atlas-btn-secondary text-sm"
          >
            <Layers size={18} />
            <span>إضافة ملزمة / كتاب</span>
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

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        {/* Card 1: Pending Reservations */}
        <div className="atlas-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">ملازم معلقة بانتظار التسليم</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              {formatCount(stats.pendingReservationsCount || 0)}
            </h3>
            <span className="text-[11px] text-slate-400">حجز مؤكد ينتظر الحضور</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock size={24} />
          </div>
        </div>

        {/* Card 2: Delivered Count */}
        <div className="atlas-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي الملازم المسلمة</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {formatCount(stats.deliveredReservationsCount || 0)}
            </h3>
            <span className="text-[11px] text-slate-400">تم تسليمها للطلاب</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserCheck size={24} />
          </div>
        </div>

        {/* Card 3: Today's Collected Cash */}
        <div className="atlas-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">المحصل الفعلي اليوم (الدرج)</p>
            <h3 className="text-2xl font-black text-[#0C3C82] mt-1">
              {formatEGP(stats.todayCollected || 0)}
            </h3>
            <span className="text-[11px] text-slate-400">
              {formatEGP(stats.monthCollected || 0)} هذا الشهر
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0C3C82] flex items-center justify-center flex-shrink-0">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Card 4: Pending Receivables */}
        <div className="atlas-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">متبقي للتحصيل عند الاستلام</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              {formatEGP(stats.pendingReceivables || 0)}
            </h3>
            <span className="text-[11px] text-slate-400">مستحقات مع الطلاب المحجوز لهم</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'reservations'
              ? 'text-[#0C3C82] border-b-2 border-[#0C3C82]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>سجل الحجوزات والاستلام</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#0C3C82] font-bold">
            {reservations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'text-[#0C3C82] border-b-2 border-[#0C3C82]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>دليل الملازم والمخزون</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {booklets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('treasury')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'treasury'
              ? 'text-[#0C3C82] border-b-2 border-[#0C3C82]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          خزينة عهدة الكتب والتقارير
        </button>
      </div>

      {/* TAB 1: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="atlas-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchRes}
                onChange={(e) => setSearchRes(e.target.value)}
                placeholder="بحث باسم الطالب، كوده، أو رقم الحجز..."
                className="atlas-input pr-10 text-sm"
              />
              <Search size={18} className="absolute right-3 top-3 text-slate-400" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="atlas-input text-xs py-2 w-full sm:w-auto"
              >
                <option value="all">جميع الحالات</option>
                <option value="reserved">معلق (بانتظار الاستلام)</option>
                <option value="delivered">تم التسليم</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>

          {/* Reservations Table */}
          <div className="atlas-card overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Loader2 size={30} className="animate-spin text-[#0C3C82]" />
                <p className="text-sm font-medium">جاري تحميل سجل الحجوزات...</p>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <BookOpen size={42} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">لا توجد حجوزات مطابقة</p>
                <p className="text-xs text-slate-400">انقر على "حجز ملزمة لطالب" لتسجيل حجز جديد فوراً</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="atlas-table w-full">
                  <thead>
                    <tr>
                      <th>رقم الحجز</th>
                      <th>الطالب</th>
                      <th>الملزمة / الكتاب</th>
                      <th>المدرس والمجموعة</th>
                      <th>السعر / الكمية</th>
                      <th>المدفوع والمتبقي</th>
                      <th>حالة الاستلام</th>
                      <th>تاريخ الحجز</th>
                      <th className="text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((r) => {
                      const remaining = Math.max(0, parseFloat(r.total_price || 0) - parseFloat(r.paid_amount || 0));
                      const isDelivered = r.delivery_status === 'delivered';
                      const isCancelled = r.delivery_status === 'cancelled';

                      return (
                        <tr key={r.id}>
                          <td className="font-mono font-bold text-xs text-[#0C3C82]">
                            #{r.reservation_number || r.id.slice(0, 6)}
                          </td>
                          <td>
                            <p className="font-bold text-slate-800 text-sm">{r.student_name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                              <span>كود: #{r.student_code}</span>
                              {r.student_phone && <span>• {r.student_phone}</span>}
                            </div>
                          </td>
                          <td>
                            <p className="font-semibold text-slate-800 text-sm">{r.item_name}</p>
                            <span className="text-[11px] text-slate-500 font-mono">{r.sku}</span>
                          </td>
                          <td>
                            <p className="text-xs font-semibold text-slate-700">{r.teacher_name || 'عام'}</p>
                            <span className="text-[11px] text-slate-500">{r.group_name || 'بدون مجموعة محددة'}</span>
                          </td>
                          <td>
                            <p className="font-bold text-xs text-slate-800">{formatEGP(r.total_price)}</p>
                            <span className="text-[11px] text-slate-500">الكمية: {r.quantity}</span>
                          </td>
                          <td>
                            <p className="text-xs font-semibold text-emerald-700">مدفوع: {formatEGP(r.paid_amount)}</p>
                            {remaining > 0 ? (
                              <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                متبقي: {formatEGP(remaining)}
                              </span>
                            ) : (
                              <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                خالص بالكامل
                              </span>
                            )}
                          </td>
                          <td>
                            {isDelivered ? (
                              <span className="atlas-badge atlas-badge-success flex items-center gap-1 w-fit">
                                <Check size={12} />
                                <span>تم التسليم</span>
                              </span>
                            ) : isCancelled ? (
                              <span className="atlas-badge atlas-badge-error">ملغي</span>
                            ) : (
                              <span className="atlas-badge atlas-badge-warning flex items-center gap-1 w-fit">
                                <Clock size={12} />
                                <span>بانتظار الاستلام</span>
                              </span>
                            )}
                          </td>
                          <td className="text-xs text-slate-500">
                            {r.reserved_at ? new Date(r.reserved_at).toLocaleDateString('ar-EG') : '—'}
                          </td>
                          <td className="text-center">
                            {!isDelivered && !isCancelled && (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenDeliverModal(r)}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1 shadow-sm"
                                  title="تسليم الملزمة وتحصيل الباقي"
                                >
                                  <CheckCircle2 size={14} />
                                  <span>تسليم</span>
                                </button>
                                <button
                                  onClick={() => handleCancelReservation(r.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="إلغاء الحجز"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            )}
                            {isDelivered && (
                              <span className="atlas-badge atlas-badge-success text-[11px] font-bold">
                                تم الاستلام
                              </span>
                            )}
                            {isCancelled && (
                              <span className="atlas-badge atlas-badge-error text-[11px] font-bold">
                                ملغي
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* TAB 2: CATALOG & STOCK */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="atlas-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchCatalog}
                onChange={(e) => setSearchCatalog(e.target.value)}
                placeholder="ابحث باسم الملزمة أو الكود..."
                className="atlas-input pr-10 text-sm"
              />
              <Search size={18} className="absolute right-3 top-3 text-slate-400" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">المدرس:</span>
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="atlas-input text-xs py-2 w-full sm:w-auto"
              >
                <option value="">جميع المدرسين</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Booklets Table */}
          <div className="atlas-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="atlas-table w-full">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>اسم الملزمة / الكتاب</th>
                    <th>المدرس الخاص</th>
                    <th>المرحلة والمادة</th>
                    <th>سعر البيع</th>
                    <th>سعر التكلفة</th>
                    <th>المخزون المتوفر</th>
                    <th>المجموعات المتاحة</th>
                    <th className="text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooklets.map((b) => {
                    const isLowStock = b.current_stock <= (b.low_stock_threshold || 10);
                    return (
                      <tr key={b.id}>
                        <td className="font-mono font-bold text-xs text-[#0C3C82]">{b.sku}</td>
                        <td>
                          <p className="font-bold text-slate-800 text-sm">{b.name}</p>
                          <span className="text-[11px] text-slate-500">
                            {b.category === 'booklet' ? 'ملزمة دراسية' : 'كتاب خارجي'}
                          </span>
                        </td>
                        <td>
                          <p className="font-semibold text-slate-800 text-xs">{b.teacher_name || 'عام'}</p>
                          <span className="text-[11px] text-slate-500">{b.teacher_phone || ''}</span>
                        </td>
                        <td>
                          <p className="text-xs text-slate-700">{b.grade_name || 'جميع المراحل'}</p>
                          <span className="text-[11px] text-slate-500">{b.subject_name || ''}</span>
                        </td>
                        <td className="font-bold text-slate-900 text-xs">
                          {formatEGP(b.selling_price)}
                        </td>
                        <td className="text-slate-500 text-xs">
                          {formatEGP(b.unit_cost)}
                        </td>
                        <td>
                          <span className={`atlas-badge ${isLowStock ? 'atlas-badge-error' : 'atlas-badge-success'}`}>
                            {formatCount(b.current_stock)} نسخة
                          </span>
                        </td>
                        <td>
                          {b.groups && b.groups.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {b.groups.map(grp => (
                                <span key={grp.group_id} className="text-[10px] bg-blue-50 text-[#0C3C82] font-semibold px-2 py-0.5 rounded">
                                  {grp.group_name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">متاحة للجميع</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => {
                              setEditingBooklet(b);
                              setIsBookletModalOpen(true);
                            }}
                            className="p-1.5 text-[#0C3C82] hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل بيانات الملزمة"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TREASURY & FINANCIAL LEDGER */}
      {activeTab === 'treasury' && (
        <div className="space-y-4">
          <div className="atlas-card p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                خزينة عهدة الكتب والملازم
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                كشف حساب عهدة الكتب المستقلة - حركة الإيرادات والمبالغ المحصلة عند حجز وتسليم الملازم
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200">
                <p className="text-xs text-slate-600 font-semibold">المحصل الفعلي اليوم</p>
                <h3 className="text-2xl font-black text-[#0C3C82] mt-1">
                  {formatEGP(stats.todayCollected || 0)}
                </h3>
                <p className="text-[11px] text-[#0C3C82] mt-1">في درج عهدة الملازم اليوم</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <p className="text-xs text-slate-600 font-semibold">إجمالي إيراد الشهر</p>
                <h3 className="text-2xl font-black text-emerald-700 mt-1">
                  {formatEGP(stats.monthCollected || 0)}
                </h3>
                <p className="text-[11px] text-emerald-700 mt-1">من مبيعات وحجوزات الملازم</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <p className="text-xs text-slate-600 font-semibold">مستحقات معلقة مع الطلاب</p>
                <h3 className="text-2xl font-black text-amber-700 mt-1">
                  {formatEGP(stats.pendingReceivables || 0)}
                </h3>
                <p className="text-[11px] text-amber-700 mt-1">يتم تحصيلها فور استلام الملازم</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2">تعليمات دورة العمل بمكتب الملازم:</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>عند حجز الملزمة للطالب: يتم اختيار الطالب من قاعدة البيانات، وتسجيل العربون أو المبلغ المدفوع.</li>
                <li>عند حضور الطالب للاستلام: يتم الضغط على زر "تسليم"، وتحصيل باقي المبلغ تلقائياً ليُضاف في الخزينة.</li>
                <li>يتم تخصيص حساب وصلاحية مستقلة لمسؤول الملازم من لوحة الإدارة لمتابعة هذا المكتب فقط.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Handover & Delivery Modal */}
      {deliveringRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-800">تسليم الملزمة للطالب</h3>
              </div>
              <button 
                onClick={() => setDeliveringRes(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">الطالب:</span>
                <span className="font-bold text-slate-800">{deliveringRes.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الملزمة:</span>
                <span className="font-bold text-slate-800">{deliveringRes.item_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الإجمالي:</span>
                <span className="font-bold text-slate-800">{formatEGP(deliveringRes.total_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المسدد سابقاً (العربون):</span>
                <span className="font-bold text-emerald-700">{formatEGP(deliveringRes.paid_amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                المبلغ المحصل الآن عند الاستلام (ج.م)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, parseFloat(deliveringRes?.total_price || 0) - parseFloat(deliveringRes?.paid_amount || 0))}
                  step="0.5"
                  value={collectedAtHandover}
                  onChange={handleCollectedChange}
                  onBlur={handleCollectedBlur}
                  className={`atlas-input pl-10 text-sm font-bold ${
                    parseFloat(collectedAtHandover) > Math.max(0, parseFloat(deliveringRes?.total_price || 0) - parseFloat(deliveringRes?.paid_amount || 0))
                      ? 'border-rose-500 bg-rose-50 text-rose-800'
                      : ''
                  }`}
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">ج.م</span>
              </div>
              {parseFloat(collectedAtHandover) > Math.max(0, parseFloat(deliveringRes?.total_price || 0) - parseFloat(deliveringRes?.paid_amount || 0)) && (
                <p className="text-[11px] text-rose-600 font-bold mt-1">
                  ⚠️ لا يمكن تحصيل أكثر من المبلغ المتبقي ({formatEGP(Math.max(0, parseFloat(deliveringRes?.total_price || 0) - parseFloat(deliveringRes?.paid_amount || 0)))})
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeliveringRes(null)}
                className="atlas-btn atlas-btn-ghost text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeliver}
                disabled={
                  deliveringLoading ||
                  parseFloat(collectedAtHandover) > Math.max(0, parseFloat(deliveringRes?.total_price || 0) - parseFloat(deliveringRes?.paid_amount || 0)) ||
                  parseFloat(collectedAtHandover) < 0
                }
                className="atlas-btn atlas-btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
              >
                {deliveringLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>جاري التسليم...</span>
                  </>
                ) : (
                  <span>تأكيد الاستلام وتسجيل التحصيل</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booklet Add / Edit Modal */}
      <BookletModal
        isOpen={isBookletModalOpen}
        initialData={editingBooklet}
        onClose={() => {
          setIsBookletModalOpen(false);
          setEditingBooklet(null);
        }}
        onSuccess={() => {
          fetchBooklets();
          fetchStats();
        }}
      />

      {/* Booklet Reservation Modal */}
      <BookletReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onSuccess={() => {
          fetchReservations();
          fetchBooklets();
          fetchStats();
        }}
      />
    </div>
  );
}
