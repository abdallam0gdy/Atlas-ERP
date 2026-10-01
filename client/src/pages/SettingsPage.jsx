import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Settings, Clock, DoorOpen, Building, QrCode,
  Save, Plus, Edit2, Trash2, ShieldAlert,
  Loader2, CheckCircle2, AlertTriangle, Layers,
  RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'attendance' | 'classrooms' | 'barcode'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings form
  const [settings, setSettings] = useState({
    center_name: 'أكاديمية أطلس التعليمية',
    center_name_en: 'Atlas Educational Academy',
    currency: 'EGP',
    default_package_sessions: '8',
    multi_session_gap_minutes: '60',
    attendance_early_allowance_minutes: '30',
    attendance_late_allowance_minutes: '30',
    session_duration_minutes: '90',
    attendance_debounce_ms: '300',
    barcode_prefix: 'ATL',
    barcode_pattern: 'ATL-G{grade}-{seq}',
    thermal_sticker_width_mm: '50',
    thermal_sticker_height_mm: '25',
  });

  // Classrooms
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomFormData, setRoomFormData] = useState({ name: '', name_ar: '', capacity: 9999 });
  const [savingRoom, setSavingRoom] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchClassrooms();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/master/settings');
      if (data.settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('فشل تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    setLoadingClassrooms(true);
    try {
      const { data } = await api.get('/master/classrooms?all=true');
      setClassrooms(data.data || []);
    } catch (err) {
      console.error('Failed to load classrooms:', err);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.put('/master/settings', { settings });
      toast.success('تم حفظ إعدادات النظام بنجاح');
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  // Classroom CRUD
  const handleOpenAddRoom = () => {
    const nextIdx = classrooms.length + 1;
    setEditingRoom(null);
    setRoomFormData({
      name: `Room ${nextIdx}`,
      name_ar: `قاعة ${nextIdx}`,
      capacity: 9999,
    });
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      name: room.name || '',
      name_ar: room.name_ar || '',
      capacity: room.capacity || 9999,
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomFormData.name_ar && !roomFormData.name) {
      toast.error('يرجى إدخال اسم القاعة');
      return;
    }

    setSavingRoom(true);
    try {
      if (editingRoom) {
        await api.put(`/master/classrooms/${editingRoom.id}`, roomFormData);
        toast.success('تم تحديث بيانات القاعة بنجاح');
      } else {
        await api.post('/master/classrooms', roomFormData);
        toast.success('تم إضافة القاعة بنجاح');
      }
      setRoomModalOpen(false);
      await fetchClassrooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ القاعة');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (room) => {
    setDeleteWarning(null);
    const activeCount = parseInt(room.active_groups_count || 0, 10);

    if (activeCount > 0) {
      setDeleteWarning({
        roomId: room.id,
        roomName: room.name_ar || room.name,
        activeCount,
        message: `⚠️ لا يمكن حذف (${room.name_ar || room.name}) لوجود ${activeCount} مجموعات دراسية نشطة مسكنة بها حالياً. يجب نقل المجموعات لقاعة بديلة قبل الحذف.`,
      });
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف (${room.name_ar || room.name})؟`)) {
      return;
    }

    try {
      await api.delete(`/master/classrooms/${room.id}`);
      toast.success('تم حذف القاعة بنجاح');
      await fetchClassrooms();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'ROOM_HAS_ACTIVE_GROUPS') {
        setDeleteWarning({
          roomId: room.id,
          roomName: room.name_ar || room.name,
          activeCount: errData.activeGroupsCount,
          message: errData.message,
          assignedGroups: errData.assignedGroups,
        });
      } else {
        toast.error(errData?.message || 'فشل حذف القاعة');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: '#0C3C82' }}>
            <Settings size={26} className="text-sky-600" />
            <span>إعدادات السنتر والنظام العام</span>
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-slate-500">
            التحكم في مواعيد وفترات تسجيل الحضور، إدارة القاعات الدراسية، وإعدادات النظام
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving || loading}
          className="atlas-btn atlas-btn-primary flex items-center gap-2 px-5 py-2.5 shadow-md cursor-pointer shrink-0"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>حفظ جميع الإعدادات</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 sm:gap-4 pb-px">
        <button
          onClick={() => setActiveTab('general')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building size={16} />
          <span>بيانات السنتر العامة</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock size={16} />
          <span>مواعيد الحضور وفترات السماح</span>
        </button>

        <button
          onClick={() => setActiveTab('classrooms')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'classrooms'
              ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DoorOpen size={16} />
          <span>إدارة القاعات الدراسية ({classrooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('barcode')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'barcode'
              ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode size={16} />
          <span>إعدادات الباركود وكروت الـ QR</span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="atlas-card p-12 text-center">
          <Loader2 size={32} className="animate-spin text-sky-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">جاري تحميل إعدادات النظام...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="atlas-card p-6 space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building size={18} className="text-sky-600" />
                <span>البيانات الأساسية لسنتر التعليم</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">اسم السنتر (بالعربي)</label>
                  <input
                    type="text"
                    value={settings.center_name}
                    onChange={(e) => setSettings({ ...settings, center_name: e.target.value })}
                    className="atlas-input"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">اسم السنتر (بالإنجليزية)</label>
                  <input
                    type="text"
                    value={settings.center_name_en}
                    onChange={(e) => setSettings({ ...settings, center_name_en: e.target.value })}
                    className="atlas-input font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">العملة الأساسية للنظام</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="atlas-input font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">عدد الحصص الافتراضي في باقة الشهر</label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={settings.default_package_sessions}
                    onChange={(e) => setSettings({ ...settings, default_package_sessions: e.target.value })}
                    className="atlas-input font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. ATTENDANCE & SCHEDULE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-start gap-3 text-xs sm:text-sm text-sky-900 leading-relaxed">
                <Clock size={20} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">قواعد النطاق الزمني الذكي لبوابة الحضور:</p>
                  <p className="mt-1 text-xs">
                    تضمن هذه الإعدادات منع دخول الطلاب مبكراً أو متأخراً عن مواعيد الحصص المجدولة، وتجمع الحصص المتتابعة في مسحة باركود واحدة آلياً.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Setting 1: multi-session gap */}
                <div className="atlas-card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">
                      الحد الأقصى للفاصل بين الحصص المتتالية
                    </label>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      دقيقة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    عندما يكون للطالب حصتان في نفس اليوم والفارق بينهما يقل عن أو يساوي هذه القيمة (افتراضياً 60 دقيقة - ساعة)، يقوم النظام بإثبات حضور الحصتين معاً تلقائياً.
                  </p>
                  <div className="pt-2">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={settings.multi_session_gap_minutes}
                      onChange={(e) => setSettings({ ...settings, multi_session_gap_minutes: e.target.value })}
                      className="atlas-input font-mono font-bold text-lg text-center sm:w-36"
                    />
                  </div>
                </div>

                {/* Setting 2: Early Allowance */}
                <div className="atlas-card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">
                      وقت السماح بالحضور قبل بداية الحصة
                    </label>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      دقيقة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    يُمنع تسجيل دخول الطالب قبل موعد بدء الحصة بأكثر من هذه المدة (افتراضياً 30 دقيقة). وتظهر رسالة واضحة بموعد فتح البوابة.
                  </p>
                  <div className="pt-2">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={settings.attendance_early_allowance_minutes}
                      onChange={(e) => setSettings({ ...settings, attendance_early_allowance_minutes: e.target.value })}
                      className="atlas-input font-mono font-bold text-lg text-center sm:w-36"
                    />
                  </div>
                </div>

                {/* Setting 3: Late Allowance */}
                <div className="atlas-card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">
                      وقت السماح بالحضور بعد انتهاء الحصة
                    </label>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      دقيقة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    بعد انتهاء الحصة بهذه المدة (افتراضياً 30 دقيقة)، يُغلق التسجيل نهائياً وتُحتسب الحصة غياباً على الطالب ويتم خصمها من الرصيد.
                  </p>
                  <div className="pt-2">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={settings.attendance_late_allowance_minutes}
                      onChange={(e) => setSettings({ ...settings, attendance_late_allowance_minutes: e.target.value })}
                      className="atlas-input font-mono font-bold text-lg text-center sm:w-36"
                    />
                  </div>
                </div>

                {/* Setting 4: Default Session Duration */}
                <div className="atlas-card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">
                      مدة الحصة الافتراضية بالسنتر
                    </label>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      دقيقة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    المدة المعتمدة لحساب انتهاء الحصص التي لم يتم تحديد وقت انتهائها صراحةً في جدول المجموعات (افتراضياً 90 دقيقة).
                  </p>
                  <div className="pt-2">
                    <input
                      type="number"
                      min="30"
                      max="240"
                      value={settings.session_duration_minutes}
                      onChange={(e) => setSettings({ ...settings, session_duration_minutes: e.target.value })}
                      className="atlas-input font-mono font-bold text-lg text-center sm:w-36"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. CLASSROOMS TAB */}
          {activeTab === 'classrooms' && (
            <div className="atlas-card p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <DoorOpen size={18} className="text-sky-600" />
                    <span>إدارة القاعات الدراسية بالسنتر</span>
                    <span className="atlas-badge bg-sky-100 text-sky-800 text-xs">
                      {classrooms.length} قاعة
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    التحكم في أسماء القاعات وسعتها، وتفادي حذف القاعات التي تحتوي على مجموعات مسكنة نشطة
                  </p>
                </div>

                <button
                  onClick={handleOpenAddRoom}
                  className="atlas-btn atlas-btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={16} />
                  <span>إضافة قاعة جديدة</span>
                </button>
              </div>

              {/* Warning on active group deletion */}
              {deleteWarning && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                    <ShieldAlert size={18} className="text-rose-600" />
                    <span>تنبيه أمان: لا يمكن حذف القاعة لوجود مجموعات مسكنة</span>
                  </div>
                  <p className="text-xs leading-relaxed">{deleteWarning.message}</p>
                  {deleteWarning.assignedGroups?.length > 0 && (
                    <div className="mt-2 text-xs bg-white/90 p-3 rounded-xl border border-rose-100">
                      <p className="font-semibold text-rose-950 mb-1">المجموعات المرتبطة بهذه القاعة:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {deleteWarning.assignedGroups.map((g, i) => (
                          <li key={i}>
                            <strong>{g.name}</strong> {g.subjectName ? `(${g.subjectName})` : ''} {g.teacherName ? `• ${g.teacherName}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="pt-1 text-left">
                    <button
                      onClick={() => setDeleteWarning(null)}
                      className="text-xs text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                    >
                      إغلاق التنبيه
                    </button>
                  </div>
                </div>
              )}

              {/* Classrooms Grid */}
              {loadingClassrooms ? (
                <div className="text-center py-12">
                  <Loader2 size={24} className="animate-spin text-sky-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">جاري تحميل القاعات...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {classrooms.map((room) => {
                    const activeCount = parseInt(room.active_groups_count || 0, 10);
                    return (
                      <div
                        key={room.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                            activeCount > 0 ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <DoorOpen size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate">
                              {room.name_ar || room.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {room.name !== room.name_ar ? room.name : ''}
                              {room.capacity ? ` • سعة ${room.capacity === 9999 ? 'مفتوحة' : room.capacity}` : ''}
                            </p>
                            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              activeCount > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {activeCount > 0 ? `${activeCount} مجموعة مسكنة` : 'لا توجد مجموعات مسكنة'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditRoom(room)}
                            className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="تعديل القاعة"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={activeCount > 0 ? 'لا يمكن الحذف لوجود مجموعات مسكنة' : 'حذف القاعة'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. BARCODE & PRINTING TAB */}
          {activeTab === 'barcode' && (
            <div className="atlas-card p-6 space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <QrCode size={18} className="text-sky-600" />
                <span>إعدادات الباركود وكروت الـ QR والطباعة الحرارية</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">بادئة الباركود (Prefix)</label>
                  <input
                    type="text"
                    value={settings.barcode_prefix}
                    onChange={(e) => setSettings({ ...settings, barcode_prefix: e.target.value })}
                    className="atlas-input font-mono font-bold uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">تظهر في بداية كود الباركود مثل ATL-G1-001</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">نمط ترقيم الباركود</label>
                  <input
                    type="text"
                    value={settings.barcode_pattern}
                    onChange={(e) => setSettings({ ...settings, barcode_pattern: e.target.value })}
                    className="atlas-input font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">مثال: ATL-G{'{grade}'}-{'{seq}'}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">عرض ملصق الطباعة الحرارية (مم)</label>
                  <input
                    type="number"
                    min="20"
                    max="100"
                    value={settings.thermal_sticker_width_mm}
                    onChange={(e) => setSettings({ ...settings, thermal_sticker_width_mm: e.target.value })}
                    className="atlas-input font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ارتفاع ملصق الطباعة الحرارية (مم)</label>
                  <input
                    type="number"
                    min="15"
                    max="100"
                    value={settings.thermal_sticker_height_mm}
                    onChange={(e) => setSettings({ ...settings, thermal_sticker_height_mm: e.target.value })}
                    className="atlas-input font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Classroom Sub-Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fade-in">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-scale-up space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <DoorOpen size={18} className="text-sky-600" />
                <span>{editingRoom ? 'تعديل بيانات القاعة' : 'إضافة قاعة جديدة'}</span>
              </h3>
              <button
                onClick={() => setRoomModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم القاعة (بالعربي) *</label>
                <input
                  type="text"
                  required
                  value={roomFormData.name_ar}
                  onChange={(e) => setRoomFormData({ ...roomFormData, name_ar: e.target.value })}
                  placeholder="مثال: قاعة 16 أو قاعة المحاضرات"
                  className="atlas-input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم القاعة (بالإنجليزية / الرمز)</label>
                <input
                  type="text"
                  value={roomFormData.name}
                  onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                  placeholder="مثال: Room 16"
                  className="atlas-input font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">سعة القاعة القصوى</label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={roomFormData.capacity}
                  onChange={(e) => setRoomFormData({ ...roomFormData, capacity: e.target.value })}
                  placeholder="9999 = سعة غير محدودة"
                  className="atlas-input font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">القيمة 9999 تعني أن سعة القاعة مفتوحة بالكامل بدون قيود.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingRoom}
                  className="flex-1 atlas-btn atlas-btn-primary py-2.5 font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingRoom ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{editingRoom ? 'تحديث القاعة' : 'إضافة القاعة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="atlas-btn atlas-btn-secondary py-2.5 px-4 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
