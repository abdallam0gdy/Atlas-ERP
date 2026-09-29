import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Settings, Clock, DoorOpen, Plus, Edit2, Trash2,
  CheckCircle2, AlertTriangle, X, Loader2, Save,
  ShieldAlert, RefreshCw, Layers
} from 'lucide-react';

export default function GroupSettingsModal({ isOpen, onClose, onSettingsSaved }) {
  const [activeTab, setActiveTab] = useState('timing'); // 'timing' | 'classrooms'
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Timing settings state
  const [timingSettings, setTimingSettings] = useState({
    multi_session_gap_minutes: '60',
    attendance_early_allowance_minutes: '30',
    attendance_late_allowance_minutes: '30',
    session_duration_minutes: '90',
  });

  // Classrooms state
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomFormData, setRoomFormData] = useState({ name: '', name_ar: '', capacity: 9999 });
  const [savingRoom, setSavingRoom] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadClassrooms();
      setDeleteWarning(null);
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/master/settings');
      if (data.settings) {
        setTimingSettings({
          multi_session_gap_minutes: data.settings.multi_session_gap_minutes || '60',
          attendance_early_allowance_minutes: data.settings.attendance_early_allowance_minutes || '30',
          attendance_late_allowance_minutes: data.settings.attendance_late_allowance_minutes || '30',
          session_duration_minutes: data.settings.session_duration_minutes || '90',
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('فشل تحميل إعدادات الحضور');
    } finally {
      setLoading(false);
    }
  };

  const loadClassrooms = async () => {
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

  const handleSaveTimingSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/master/settings', {
        settings: {
          multi_session_gap_minutes: timingSettings.multi_session_gap_minutes,
          attendance_early_allowance_minutes: timingSettings.attendance_early_allowance_minutes,
          attendance_late_allowance_minutes: timingSettings.attendance_late_allowance_minutes,
          session_duration_minutes: timingSettings.session_duration_minutes,
        },
      });
      toast.success('تم حفظ إعدادات الحضور والمواعيد بنجاح');
      if (onSettingsSaved) onSettingsSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  // Classroom CRUD
  const handleOpenAddRoom = () => {
    const nextIndex = classrooms.length + 1;
    setEditingRoom(null);
    setRoomFormData({
      name: `Room ${nextIndex}`,
      name_ar: `قاعة ${nextIndex}`,
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
        toast.success('تمت إضافة القاعة بنجاح');
      }
      setRoomModalOpen(false);
      await loadClassrooms();
      if (onSettingsSaved) onSettingsSaved();
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
      await loadClassrooms();
      if (onSettingsSaved) onSettingsSaved();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shadow-xs">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">إعدادات الحصص والقاعات</h2>
              <p className="text-xs text-slate-500">التحكم في فترات السماح بالحضور والقاعات الدراسية بالسنتر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-4">
          <button
            onClick={() => setActiveTab('timing')}
            className={`py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'timing'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={16} />
            <span>مواعيد وفترات تسجيل الحضور</span>
          </button>
          <button
            onClick={() => setActiveTab('classrooms')}
            className={`py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'classrooms'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DoorOpen size={16} />
            <span>إدارة القاعات الدراسية ({classrooms.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: TIMING & ATTENDANCE SETTINGS */}
          {activeTab === 'timing' && (
            <form onSubmit={handleSaveTimingSettings} className="space-y-5">
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-start gap-3 text-xs text-sky-900 leading-relaxed">
                <Clock size={18} className="text-sky-600 shrink-0 mt-0.5" />
                <p>
                  يتم تطبيق هذه القواعد آلياً على <strong>بوابة الحضور</strong> وماكينات المسح، لمنع التسجيل المبكر أو المتأخر خارج أوقات الحصص المحددة، ودمج الحصص المتتالية للطالب تلقائياً.
                </p>
              </div>

              {/* Setting 1: Multi-session gap */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-sm font-bold text-slate-800 block">
                      الحد الأقصى للفاصل بين الحصص المتتالية (لتسجيلها معاً)
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      إذا كان لدى الطالب أكثر من حصة في اليوم وكان الفارق بين نهاية الحصة الأولى وبداية الثانية أقل من أو يساوي هذه القيمة، يتم تسجيل الحصتين معاً بمجرد مسح الكود عند البوابة (لا حاجة للخروج للمسح مرة ثانية).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={timingSettings.multi_session_gap_minutes}
                      onChange={(e) =>
                        setTimingSettings({ ...timingSettings, multi_session_gap_minutes: e.target.value })
                      }
                      className="atlas-input w-24 text-center font-mono font-bold text-base"
                    />
                    <span className="text-xs text-slate-500 font-semibold">دقيقة</span>
                  </div>
                </div>
              </div>

              {/* Setting 2: Early Allowance */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-sm font-bold text-slate-800 block">
                      فترة السماح بالحضور قبل بداية الحصة
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      يُمنع تسجيل دخول الطالب في أي حصة قبل موعد بدايتها بأكثر من هذا الوقت (يظهر تنبيه بالبوابة أن التسجيل لم يفتح بعد).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={timingSettings.attendance_early_allowance_minutes}
                      onChange={(e) =>
                        setTimingSettings({ ...timingSettings, attendance_early_allowance_minutes: e.target.value })
                      }
                      className="atlas-input w-24 text-center font-mono font-bold text-base"
                    />
                    <span className="text-xs text-slate-500 font-semibold">دقيقة</span>
                  </div>
                </div>
              </div>

              {/* Setting 3: Late Allowance */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-sm font-bold text-slate-800 block">
                      فترة السماح بالحضور بعد انتهاء موعد الحصة
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      بعد انتهاء الحصة بهذا الوقت، يُغلق باب تسجيل الحضور تماماً وتُحتسب الحصة غياباً على الطالب ويتم خصمها من الرصيد.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={timingSettings.attendance_late_allowance_minutes}
                      onChange={(e) =>
                        setTimingSettings({ ...timingSettings, attendance_late_allowance_minutes: e.target.value })
                      }
                      className="atlas-input w-24 text-center font-mono font-bold text-base"
                    />
                    <span className="text-xs text-slate-500 font-semibold">دقيقة</span>
                  </div>
                </div>
              </div>

              {/* Setting 4: Default Session Duration */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-sm font-bold text-slate-800 block">
                      مدة الحصة الدراسية الافتراضية
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      تُستخدم لحساب موعد انتهاء الحصة في حال لم يتم تحديد وقت الانتهاء صراحةً في جدول المجموعة.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="30"
                      max="240"
                      value={timingSettings.session_duration_minutes}
                      onChange={(e) =>
                        setTimingSettings({ ...timingSettings, session_duration_minutes: e.target.value })
                      }
                      className="atlas-input w-24 text-center font-mono font-bold text-base"
                    />
                    <span className="text-xs text-slate-500 font-semibold">دقيقة</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings || loading}
                  className="atlas-btn atlas-btn-primary flex items-center gap-2 px-6 py-2.5 font-bold shadow-md cursor-pointer"
                >
                  {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CLASSROOMS MANAGEMENT */}
          {activeTab === 'classrooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">قاعات السنتر الدراسية</h3>
                  <p className="text-xs text-slate-500">إجمالي {classrooms.length} قاعة مسجلة بالنظام</p>
                </div>
                <button
                  onClick={handleOpenAddRoom}
                  className="atlas-btn atlas-btn-primary text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={15} />
                  <span>إضافة قاعة جديدة</span>
                </button>
              </div>

              {/* Active Groups Deletion Warning Alert */}
              {deleteWarning && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 animate-shake space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                    <ShieldAlert size={18} className="text-rose-600" />
                    <span>تنبيه أمان: لا يمكن حذف القاعة</span>
                  </div>
                  <p className="text-xs leading-relaxed">{deleteWarning.message}</p>
                  {deleteWarning.assignedGroups?.length > 0 && (
                    <div className="mt-2 text-xs bg-white/80 p-2.5 rounded-xl border border-rose-100">
                      <p className="font-semibold text-rose-950 mb-1">المجموعات المسكنة بهذه القاعة:</p>
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

              {/* Classrooms List */}
              {loadingClassrooms ? (
                <div className="text-center py-12">
                  <Loader2 size={24} className="animate-spin text-sky-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">جاري تحميل القاعات...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {classrooms.map((room) => {
                    const activeCount = parseInt(room.active_groups_count || 0, 10);
                    return (
                      <div
                        key={room.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            activeCount > 0 ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <DoorOpen size={18} />
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="تعديل القاعة"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={activeCount > 0 ? 'لا يمكن الحذف لوجود مجموعات مسكنة' : 'حذف القاعة'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Classroom Sub-Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fade-in">
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
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={16} />
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
                  placeholder="مثال: قاعة 16 أو قاعة المحاضرات الكبرى"
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
