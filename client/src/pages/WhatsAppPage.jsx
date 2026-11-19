import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  Send,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Search,
  PauseCircle,
  PlayCircle,
  LogOut,
  Eye,
  Check,
  X,
  UserCheck,
  Phone,
  Filter,
  Loader2,
  Plus,
  ExternalLink,
  Sliders,
  FlaskConical,
  Users,
  Link2,
} from 'lucide-react';

const CATEGORY_LABELS = {
  CHAT_REPLY: { label: 'رد شات مباشر', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  INCOMING_CHAT: { label: 'رسالة واردة', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  DAILY_SCHEDULE: { label: 'جدول باكدج يومي', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  INTRO_HANDSHAKE: { label: 'رسالة تعريفية أولى', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  ABSENCE: { label: 'إشعار غياب', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  CANCELLATION: { label: 'إلغاء حصة', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  EXAM_GRADE: { label: 'درجة امتحان', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PHONE_DIRECT: { label: 'من هاتف الواتساب', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const CONSENT_BADGES = {
  OPTED_IN: {
    label: 'مفعّل للمحادثة ✅',
    short: 'مفعّل ✅',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  INTRO_SENT_WAITING: {
    label: 'أُرسلت رسالة أولى ⏳',
    short: 'بانتظار رد ⏳',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  NEW: {
    label: 'مسجل بدليل الطلاب',
    short: 'دليل الطلاب',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  OPTED_OUT: {
    label: 'أوقف الإشعارات 🚫',
    short: 'موقوف 🚫',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

function isValidDisplayPhone(p) {
  if (!p) return false;
  const digits = String(p).replace(/\D/g, '');
  // Valid Egyptian phone is 10-12 digits (01xxxxxxxxx or 201xxxxxxxxx), never a 14-16 digit LID!
  return digits.length >= 10 && digits.length <= 12;
}

export default function WhatsAppPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('chats');

  const [statusData, setStatusData] = useState({
    connection: {
      status: 'connecting',
      qrDataUrl: null,
      connectedPhone: null,
      connectedName: null,
      liveGroups: [],
    },
    settings: {},
    stats: {
      total_chats: 0,
      total_directory: 0,
      unread_messages: 0,
      opted_in_contacts: 0,
      sent_today: 0,
      total_logs: 0,
    },
  });

  // Tab 1: Live Chats state
  const [chats, setChats] = useState([]);
  const [chatsSearch, setChatsSearch] = useState('');
  const [chatsFilter, setChatsFilter] = useState('active'); // 'active' | 'unread' | 'students' | 'groups' | 'all'
  const [selectedChatJid, setSelectedChatJid] = useState(null);
  const [activeChatInfo, setActiveChatInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [syncingChats, setSyncingChats] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [linkLidModalOpen, setLinkLidModalOpen] = useState(false);
  const [linkLidPhone, setLinkLidPhone] = useState('');
  const messagesEndRef = useRef(null);

  // Tab 2: Staff Audit Log state
  const [auditLogs, setAuditLogs] = useState([]);
  const [staffSummary, setStaffSummary] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStaffFilter, setAuditStaffFilter] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('');
  const [auditDirectionFilter, setAuditDirectionFilter] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  // Tab 3: Official 12 Groups, Test Groups & Daily Schedule state
  const [availablePackageGroups, setAvailablePackageGroups] = useState([]);
  const [liveWaGroups, setLiveWaGroups] = useState([]);
  const [scheduleTarget, setScheduleTarget] = useState('today');
  const [scheduleSendMode, setScheduleSendMode] = useState('test'); // 'test' | 'live'
  const [testPartnerPhone, setTestPartnerPhone] = useState('01224385098');
  const [creatingTestGroup, setCreatingTestGroup] = useState(false);
  const [schedulePreviews, setSchedulePreviews] = useState([]);
  const [scheduleDateInfo, setScheduleDateInfo] = useState(null);
  const [syncingLiveGroups, setSyncingLiveGroups] = useState(false);
  const [sendingScheduleId, setSendingScheduleId] = useState(null);
  const [previewModalGroup, setPreviewModalGroup] = useState(null);
  const [filterModalGroup, setFilterModalGroup] = useState(null);
  const [tempSelectedGroupIds, setTempSelectedGroupIds] = useState([]);

  // Tab 4: Templates state
  const [templates, setTemplates] = useState([]);
  const [savingTemplateKey, setSavingTemplateKey] = useState(null);

  // Tab 5: Settings state
  const [settingsForm, setSettingsForm] = useState({
    is_enabled: true,
    is_paused: false,
    auto_send_daily_schedule: false,
    daily_schedule_send_time: '20:00',
    daily_schedule_target: 'tomorrow',
    schedule_send_mode: 'test',
    test_partner_phone: '01224385098',
    strict_opt_in_only: true,
    allow_single_intro_message: true,
    min_delay_seconds: 8,
    max_delay_seconds: 18,
    group_delay_seconds: 5,
    batch_size: 25,
    batch_cooldown_seconds: 120,
    daily_limit: 0, // 0 = Unlimited (مفتوح بلا حد أقصى)
    quiet_hours_enabled: true,
    quiet_hours_start: '23:00',
    quiet_hours_end: '07:30',
    center_whatsapp_phone: '201288817183',
    center_support_phone: '01288817183',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/status');
      if (res.data?.success) {
        setStatusData(res.data.data);
        const s = res.data.data.settings;
        if (s && Object.keys(s).length > 0) {
          setSettingsForm((prev) => ({ ...prev, ...s }));
          if (s.schedule_send_mode) setScheduleSendMode(s.schedule_send_mode);
          if (s.test_partner_phone) setTestPartnerPhone(s.test_partner_phone);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/chats', {
        params: { search: chatsSearch, filter: chatsFilter },
      });
      if (res.data?.success) {
        setChats(res.data.data || []);
      }
    } catch {
      // ignore
    }
  }, [chatsSearch, chatsFilter]);

  const fetchChatMessages = useCallback(async (jid, silent = false) => {
    if (!jid) return;
    if (!silent) setMessagesLoading(true);
    try {
      const res = await api.get(`/whatsapp/chats/${encodeURIComponent(jid)}/messages`);
      if (res.data?.success) {
        setActiveChatInfo(res.data.data.chat);
        setChatMessages(res.data.data.messages || []);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await api.get('/whatsapp/audit-logs', {
        params: {
          search: auditSearch,
          staffName: auditStaffFilter,
          category: auditCategoryFilter,
          direction: auditDirectionFilter,
        },
      });
      if (res.data?.success) {
        setAuditLogs(res.data.data.logs || []);
        setStaffSummary(res.data.data.staffSummary || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر جلب سجل الرسائل');
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch, auditStaffFilter, auditCategoryFilter, auditDirectionFilter]);

  const fetchGroupsAndSchedules = useCallback(
    async (targetDay = scheduleTarget) => {
      try {
        const [cfgRes, prevRes] = await Promise.all([
          api.get('/whatsapp/groups-config'),
          api.get('/whatsapp/schedules/preview', { params: { target: targetDay } }),
        ]);
        if (cfgRes.data?.success) {
          setAvailablePackageGroups(cfgRes.data.data.availablePackageGroups || []);
          setLiveWaGroups(cfgRes.data.data.liveWhatsAppGroups || []);
        }
        if (prevRes.data?.success) {
          setSchedulePreviews(prevRes.data.data.groups || []);
          setScheduleDateInfo(prevRes.data.data.date_info || null);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'تعذر جلب إعدادات الجروبات');
      }
    },
    [scheduleTarget]
  );

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/templates');
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 6000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchChats();
      const t = setInterval(() => {
        fetchChats();
        if (selectedChatJid) fetchChatMessages(selectedChatJid, true);
      }, 4500);
      return () => clearInterval(t);
    }
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
    if (activeTab === 'groups') {
      fetchGroupsAndSchedules(scheduleTarget);
    }
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [
    activeTab,
    fetchChats,
    selectedChatJid,
    fetchChatMessages,
    fetchAuditLogs,
    fetchGroupsAndSchedules,
    scheduleTarget,
    fetchTemplates,
  ]);

  useEffect(() => {
    if (selectedChatJid) {
      fetchChatMessages(selectedChatJid);
    }
  }, [selectedChatJid, fetchChatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, selectedChatJid]);

  // Handlers
  const handleSyncAllChatsAndStudents = async () => {
    setSyncingChats(true);
    try {
      const res = await api.post('/whatsapp/chats/sync-all');
      if (res.data?.success) {
        toast.success(res.data.message);
        await fetchChats();
        await fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر المزامنة');
    } finally {
      setSyncingChats(false);
    }
  };

  const handleLinkLidToPhone = async (e) => {
    e.preventDefault();
    if (!selectedChatJid || !linkLidPhone.trim()) return;
    try {
      const res = await api.post('/whatsapp/chats/link-lid', {
        lidJid: selectedChatJid,
        phone: linkLidPhone.trim(),
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setLinkLidModalOpen(false);
        setLinkLidPhone('');
        const newCanonicalJid = res.data.data?.canonicalJid;
        await fetchChats();
        if (newCanonicalJid) {
          setSelectedChatJid(newCanonicalJid);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل ربط الرقم');
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedChatJid || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await api.post('/whatsapp/chats/send', {
        targetPhoneOrJid: selectedChatJid,
        messageText: replyText.trim(),
        category: 'CHAT_REPLY',
        recipientName:
          activeChatInfo?.student_name ||
          activeChatInfo?.contact_name ||
          activeChatInfo?.phone,
        studentId: activeChatInfo?.student_id || null,
      });

      if (res.data?.success) {
        setReplyText('');
        toast.success(res.data.message || 'تم إرسال الرد بنجاح');
        const loggedChatJid = res.data.data?.log?.chat_jid || selectedChatJid;
        if (loggedChatJid !== selectedChatJid) {
          setSelectedChatJid(loggedChatJid);
        } else {
          await fetchChatMessages(selectedChatJid, true);
        }
        await fetchChats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إرسال الرسالة');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStartNewChat = async (e) => {
    e.preventDefault();
    if (!newChatPhone.trim() || !newChatMessage.trim()) {
      toast.error('يرجى إدخال رقم الهاتف ونص الرسالة');
      return;
    }
    setSendingReply(true);
    try {
      const res = await api.post('/whatsapp/chats/send', {
        targetPhoneOrJid: newChatPhone.trim(),
        messageText: newChatMessage.trim(),
        category: 'CHAT_REPLY',
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setNewChatModalOpen(false);
        setNewChatPhone('');
        setNewChatMessage('');
        await fetchChats();
        if (res.data.data?.log?.chat_jid) {
          setSelectedChatJid(res.data.data.log.chat_jid);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر الإرسال');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSyncLiveGroups = async () => {
    setSyncingLiveGroups(true);
    try {
      const res = await api.post('/whatsapp/groups-config/sync-live');
      if (res.data?.success) {
        toast.success(res.data.message);
        await fetchGroupsAndSchedules(scheduleTarget);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'تأكد من اتصال الواتساب أولاً');
    } finally {
      setSyncingLiveGroups(false);
    }
  };

  const handleCreateTestGroup = async (mode = 'unified', configId = null) => {
    setCreatingTestGroup(true);
    try {
      const res = await api.post('/whatsapp/groups-config/create-test-group', {
        partnerPhone: testPartnerPhone || '01224385098',
        mode,
        configId,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setScheduleSendMode('test');
        await fetchGroupsAndSchedules(scheduleTarget);
        await fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إنشاء جروب الاختبار');
    } finally {
      setCreatingTestGroup(false);
    }
  };

  const handleSwitchScheduleMode = async (newMode) => {
    setScheduleSendMode(newMode);
    try {
      await api.put('/whatsapp/settings', {
        ...settingsForm,
        schedule_send_mode: newMode,
      });
      toast.success(
        newMode === 'test'
          ? '🧪 تم التبديل إلى وضع الاختبار الآمن (يرسل لجروب الاختبار مع عبد الله فقط)'
          : '📢 تم التبديل إلى الوضع الرسمي (يرسل لجروبات أولياء الأمور الفعلية)'
      );
    } catch {
      // ignore
    }
  };

  const handleUpdateGroupConfig = async (configId, patch) => {
    try {
      const res = await api.put(`/whatsapp/groups-config/${configId}`, patch);
      if (res.data?.success) {
        toast.success('تم تحديث إعدادات الجروب');
        await fetchGroupsAndSchedules(scheduleTarget);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تحديث الجروب');
    }
  };

  const handleSendSchedule = async (configId = null) => {
    const modeLabel =
      scheduleSendMode === 'test'
        ? `جروب الاختبار المشترك مع عبد الله (${testPartnerPhone})`
        : 'جروبات أولياء الأمور الرسمية الفعلية';

    const confirmMsg = configId
      ? `هل تريد إرسال جدول هذه المرحلة الآن إلى [${modeLabel}]؟`
      : `هل تريد إرسال جداول جميع المراحل المفعّلة الآن إلى [${modeLabel}]؟`;
    if (!window.confirm(confirmMsg)) return;

    setSendingScheduleId(configId || 'ALL');
    try {
      const res = await api.post('/whatsapp/schedules/send', {
        target: scheduleTarget,
        configId,
        sendMode: scheduleSendMode,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        await fetchGroupsAndSchedules(scheduleTarget);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إرسال الجدول');
    } finally {
      setSendingScheduleId(null);
    }
  };

  const handleSaveTemplate = async (tpl, overridePatch = {}) => {
    setSavingTemplateKey(tpl.key);
    try {
      const payload = {
        title_ar: tpl.title_ar,
        body_template: tpl.body_template,
        is_approved: tpl.is_approved,
        is_enabled: tpl.is_enabled,
        ...overridePatch,
      };
      const res = await api.put(`/whatsapp/templates/${tpl.key}`, payload);
      if (res.data?.success) {
        toast.success('تم حفظ القالب بنجاح');
        await fetchTemplates();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ القالب');
    } finally {
      setSavingTemplateKey(null);
    }
  };

  const handleSaveSettings = async (e, customPatch = null) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = customPatch ? { ...settingsForm, ...customPatch } : settingsForm;
      const res = await api.put('/whatsapp/settings', payload);
      if (res.data?.success) {
        setSettingsForm(res.data.data);
        toast.success(res.data.message || 'تم حفظ الإعدادات');
        await fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReconnect = async () => {
    try {
      const res = await api.post('/whatsapp/connection/reconnect');
      toast.success(res.data?.message || 'جاري تحديث الاتصال...');
      setTimeout(fetchStatus, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر الاتصال بخدمة الواتساب');
    }
  };

  const handleLogoutWhatsApp = async () => {
    if (!window.confirm('هل تريد فصل رقم الواتساب الحالي ومسح الجلسة لربط رقم آخر؟')) return;
    try {
      const res = await api.post('/whatsapp/connection/logout');
      toast.success(res.data?.message || 'تم تسجيل الخروج');
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل الخروج');
    }
  };

  const conn = statusData.connection || {};
  const stats = statusData.stats || {};
  const isConnected = conn.status === 'connected';
  const isQrReady = conn.status === 'qr_ready';
  const isServiceOffline = conn.status === 'service_offline';
  const isUnlimitedDaily = !settingsForm.daily_limit || Number(settingsForm.daily_limit) <= 0;

  return (
    <div className="space-y-5 animate-fade-in" dir="rtl">
      {/* Top Banner & Connection Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isConnected
                  ? 'bg-emerald-600 text-white'
                  : isQrReady
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <MessageCircle size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-800">
                  منظومة واتساب أطلس والشات الموحد (WhatsApp Web)
                </h1>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    متصل الآن ({conn.connectedPhone})
                  </span>
                ) : isQrReady ? (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 cursor-pointer hover:bg-amber-100"
                  >
                    <QrCode size={13} />
                    جاهز لمسح الـ QR (اضغط للربط)
                  </button>
                ) : isServiceOffline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    خدمة whatsapp-system متوقفة (Port 5055)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    جاري الاتصال...
                  </span>
                )}

                {settingsForm.is_paused && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
                    <PauseCircle size={13} />
                    الإرسال التلقائي متوقف مؤقتاً
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>
                  👤 حسابك الحالي في اللوج:{' '}
                  <strong className="text-[#0C3C82]">
                    {user?.fullNameAr || user?.fullName || user?.username}
                  </strong>{' '}
                  ({user?.role?.label || 'موظف'})
                </span>
                <span className="text-slate-300">|</span>
                <span>كل رسالة ترسلها يُحفظ اسمك عليها تلقائياً في سجل الإدارة</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
              <p className="text-[11px] text-slate-500 font-medium">محادثات نشطة</p>
              <p className="text-base font-black text-slate-800">{stats.total_chats || 0}</p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-rose-50/70 border border-rose-200/70 text-center">
              <p className="text-[11px] text-rose-600 font-medium">غير مقروء</p>
              <p className="text-base font-black text-rose-700">{stats.unread_messages || 0}</p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-center">
              <p className="text-[11px] text-emerald-700 font-medium">دليل الطلاب والجروبات</p>
              <p className="text-base font-black text-emerald-800">
                {stats.total_directory || 0}
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-sky-50/70 border border-sky-200/70 text-center">
              <p className="text-[11px] text-sky-700 font-medium">إرسال اليوم</p>
              <p className="text-base font-black text-sky-800">
                {stats.sent_today || 0}{' '}
                <span className="text-[11px] font-bold text-emerald-700">
                  ({isUnlimitedDaily ? 'مفتوح ∞' : `/ ${settingsForm.daily_limit}`})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100">
          {[
            {
              id: 'chats',
              label: '💬 الدردشات ودليل الطلاب (WhatsApp Web)',
              badge: stats.unread_messages > 0 ? stats.unread_messages : null,
            },
            {
              id: 'groups',
              label: '📅 جروبات الباكدج الـ 12 وجروبات الاختبار',
            },
            {
              id: 'audit',
              label: '🛡️ سجل ردود الموظفين (اللوج)',
            },
            {
              id: 'templates',
              label: '📝 القوالب والمتغيرات (وضع المراجعة)',
            },
            {
              id: 'settings',
              label: '⚙️ الربط (QR) وإعدادات الميعاد والوتيرة',
              alert: !isConnected,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#0C3C82] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {tab.badge}
                </span>
              )}
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: LIVE CHATS & FULL WHATSAPP WEB DIRECTORY */}
      {/* ============================================================ */}
      {activeTab === 'chats' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
          {/* Right Column: Chats & Directory Sidebar */}
          <div className="lg:col-span-4 border-l border-slate-200 flex flex-col h-[680px]">
            <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
              <div className="flex items-center justify-between gap-1.5">
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={chatsSearch}
                    onChange={(e) => setChatsSearch(e.target.value)}
                    placeholder="ابحث بالاسم، رقم الطالب، ولي الأمر، أو #الكود..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#0C3C82]"
                  />
                </div>
                <button
                  onClick={handleSyncAllChatsAndStudents}
                  disabled={syncingChats}
                  className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 cursor-pointer shrink-0"
                  title="مزامنة كل الطلاب والمحادثات والجروبات"
                >
                  <RefreshCw size={15} className={syncingChats ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setNewChatModalOpen(true)}
                  className="px-2.5 py-2 rounded-xl bg-[#0C3C82] text-white text-xs font-bold hover:bg-[#082a5c] flex items-center gap-1 shrink-0 cursor-pointer"
                  title="بدء محادثة جديدة برقم هاتف"
                >
                  <Plus size={15} />
                  <span>جديد</span>
                </button>
              </div>

              {/* Filter Tabs like WhatsApp Web */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'active', label: '💬 دردشات نشطة' },
                  { id: 'unread', label: '🔴 غير مقروء' },
                  { id: 'students', label: '🎓 كل الطلاب (292)' },
                  { id: 'groups', label: '👥 الجروبات' },
                  { id: 'all', label: 'الكل' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setChatsFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                      chatsFilter === f.id
                        ? 'bg-[#0C3C82] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chats Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {chats.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <MessageCircle size={32} className="mx-auto opacity-40" />
                  <p className="text-xs font-bold">لا توجد محادثات في هذا التصنيف حالياً</p>
                  <button
                    onClick={() => setChatsFilter('students')}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold cursor-pointer"
                  >
                    عرض دليل جميع الطلاب وأولياء الأمور (292)
                  </button>
                </div>
              ) : (
                chats.map((chat) => {
                  const isSelected = selectedChatJid === chat.jid;
                  const consentBadge =
                    CONSENT_BADGES[chat.consent_status] || CONSENT_BADGES.NEW;
                  const isUnmappedLid =
                    chat.jid?.endsWith('@lid') && !isValidDisplayPhone(chat.phone);

                  const displayStudentPhone = isValidDisplayPhone(chat.student_phone)
                    ? chat.student_phone
                    : null;
                  const displayParentPhone = isValidDisplayPhone(chat.parent_phone)
                    ? chat.parent_phone
                    : isValidDisplayPhone(chat.phone)
                    ? chat.phone
                    : null;

                  return (
                    <div
                      key={chat.jid}
                      onClick={() => setSelectedChatJid(chat.jid)}
                      className={`p-3.5 cursor-pointer transition-colors hover:bg-sky-50/50 ${
                        isSelected ? 'bg-sky-50 border-r-4 border-[#0C3C82]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-black text-xs sm:text-sm text-slate-800 truncate">
                              {chat.student_name ||
                                chat.contact_name ||
                                chat.push_name ||
                                displayParentPhone ||
                                'محادثة واتساب'}
                            </p>
                            {chat.student_code && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[10px] font-bold">
                                #{chat.student_code}
                              </span>
                            )}
                            {chat.is_group && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                جروب
                              </span>
                            )}
                          </div>

                          {/* Always show Student Phone & Parent Phone cleanly! */}
                          {!chat.is_group && (
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-slate-600">
                              {displayParentPhone && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                  <Phone size={10} className="text-[#0C3C82]" />
                                  <span>ولي الأمر: {displayParentPhone}</span>
                                </span>
                              )}
                              {displayStudentPhone &&
                                displayStudentPhone !== displayParentPhone && (
                                  <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded">
                                    <span>الطالب: {displayStudentPhone}</span>
                                  </span>
                                )}
                              {isUnmappedLid && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-sans font-bold">
                                  🔗 حساب واتساب ({chat.push_name || 'اضغط لربط الرقم'})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {chat.last_message_text && chat.last_message_at && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(chat.last_message_at).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                          {chat.unread_count > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {chat.last_message_text && (
                        <p className="text-xs text-slate-600 truncate mt-1.5">
                          {chat.last_message_dir === 'outgoing' && (
                            <span className="text-[#0C3C82] font-semibold ml-1">
                              [{chat.last_message_by || 'موظف'}]:
                            </span>
                          )}
                          {chat.last_message_text}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${consentBadge.className}`}
                        >
                          {consentBadge.short}
                        </span>
                        {chat.grade_name && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                            {chat.grade_name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Left Column: Active Chat Window */}
          <div className="lg:col-span-8 flex flex-col h-[680px] bg-slate-50/50">
            {!selectedChatJid ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                  <MessageCircle size={32} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">
                  اختر أي محادثة أو طالب من القائمة على اليمين لفتح الشات الكامل
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  جميع رسائل العميل الصادرة والواردة تتجمع في شات واحد موحد مع عرض رقم الطالب ورقم
                  ولي الأمر، وتسجيل اسم الموظف الذي يرد على كل رسالة.
                </p>
              </div>
            ) : (
              <>
                {/* Active Chat Header */}
                <div className="p-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-sm sm:text-base text-slate-800">
                        {activeChatInfo?.student_name ||
                          activeChatInfo?.contact_name ||
                          activeChatInfo?.push_name ||
                          (isValidDisplayPhone(activeChatInfo?.phone)
                            ? activeChatInfo.phone
                            : 'محادثة واتساب')}
                      </h3>
                      {activeChatInfo?.student_code && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-mono text-xs font-bold">
                          كود #{activeChatInfo.student_code}
                        </span>
                      )}
                      {activeChatInfo?.grade_name && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                          {activeChatInfo.grade_name}
                        </span>
                      )}
                    </div>

                    {/* Phone Numbers Row in Chat Header */}
                    {!activeChatInfo?.is_group && (
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                        {isValidDisplayPhone(
                          activeChatInfo?.parent_phone || activeChatInfo?.phone
                        ) && (
                          <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                            <Phone size={12} className="text-[#0C3C82]" />
                            <span>
                              رقم ولي الأمر:{' '}
                              {activeChatInfo?.parent_phone || activeChatInfo?.phone}
                            </span>
                          </span>
                        )}
                        {isValidDisplayPhone(activeChatInfo?.student_phone) && (
                          <span className="font-mono font-bold text-sky-700 flex items-center gap-1">
                            <Phone size={12} />
                            <span>رقم الطالب: {activeChatInfo.student_phone}</span>
                          </span>
                        )}
                        {selectedChatJid?.endsWith('@lid') &&
                          !isValidDisplayPhone(activeChatInfo?.phone) && (
                            <button
                              type="button"
                              onClick={() => setLinkLidModalOpen(true)}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Link2 size={12} />
                              <span>ربط هذه المحادثة برقم هاتف الطالب/ولي الأمر</span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeChatInfo?.student_id && (
                      <Link
                        to={`/students/${activeChatInfo.student_id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                      >
                        <ExternalLink size={13} />
                        <span>فتح ملف الطالب</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Chat Messages Scroll Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 space-y-1">
                      <p className="font-bold text-slate-600">
                        ابدأ المحادثة الآن مع{' '}
                        {activeChatInfo?.student_name || activeChatInfo?.contact_name}
                      </p>
                      <p>اكتب رسالتك في الأسفل واضغط Enter للإرسال المباشر</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isOutgoing = msg.direction === 'outgoing';
                      const catInfo =
                        CATEGORY_LABELS[msg.category] || CATEGORY_LABELS.CHAT_REPLY;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isOutgoing ? 'items-start' : 'items-end'
                          }`}
                        >
                          <div
                            className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-2xs ${
                              isOutgoing
                                ? 'bg-[#0C3C82] text-white rounded-tr-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                            }`}
                          >
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                              {msg.message_text}
                            </p>

                            <div
                              className={`mt-2 pt-1.5 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] ${
                                isOutgoing
                                  ? 'border-white/15 text-sky-100'
                                  : 'border-slate-100 text-slate-400'
                              }`}
                            >
                              {isOutgoing ? (
                                <span className="font-bold flex items-center gap-1">
                                  <UserCheck size={11} />
                                  بواسطة: {msg.sent_by_user_name || 'النظام'}
                                  {msg.sent_by_user_role ? ` (${msg.sent_by_user_role})` : ''}
                                </span>
                              ) : (
                                <span>
                                  وارد من:{' '}
                                  {activeChatInfo?.student_name ||
                                    activeChatInfo?.contact_name ||
                                    'العميل'}
                                </span>
                              )}

                              <span className="font-mono">
                                {new Date(msg.created_at).toLocaleString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                          </div>
                          {isOutgoing && (
                            <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                              {catInfo.label}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Box */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3 bg-white border-t border-slate-200 flex items-end gap-2"
                >
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder={`اكتب رسالتك واضغط Enter للإرسال الفوري... (تُسجل باسم: ${
                      user?.fullNameAr || user?.fullName || user?.username
                    })`}
                    className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm outline-none focus:border-[#0C3C82] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-3 rounded-xl bg-[#0C3C82] hover:bg-[#082a5c] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {sendingReply ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    <span>إرسال</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: STAFF AUDIT LOG */}
      {/* ============================================================ */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#0C3C82]" />
                <span>إحصائيات ردود الموظفين (اضغط على اسم الموظف لفلترة رسائله)</span>
              </h3>
              {auditStaffFilter && (
                <button
                  onClick={() => setAuditStaffFilter('')}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  إلغاء فلتر الموظف ({auditStaffFilter}) ✕
                </button>
              )}
            </div>

            {staffSummary.length === 0 ? (
              <p className="text-xs text-slate-400">لم يتم إرسال رسائل مسجلة بعد.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {staffSummary.map((st, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      setAuditStaffFilter(
                        auditStaffFilter === st.staff_name ? '' : st.staff_name
                      )
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      auditStaffFilter === st.staff_name
                        ? 'bg-sky-50 border-[#0C3C82] ring-2 ring-[#0C3C82]/20'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs sm:text-sm text-slate-800">
                        👤 {st.staff_name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                        {st.staff_role || 'موظف'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-slate-500">
                        ردود مباشرة: <strong>{st.direct_replies}</strong>
                      </span>
                      <span className="font-bold text-[#0C3C82]">
                        الإجمالي: {st.total_sent} رسالة
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="بحث باسم الموظف، اسم الطالب، الرقم، أو نص الرسالة..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={auditDirectionFilter}
                  onChange={(e) => setAuditDirectionFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
                >
                  <option value="">كل الاتجاهات (صادر ووارد)</option>
                  <option value="outgoing">الرسائل الصادرة فقط (ردود الموظفين والنظام)</option>
                  <option value="incoming">الرسائل الواردة فقط</option>
                </select>

                <select
                  value={auditCategoryFilter}
                  onChange={(e) => setAuditCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
                >
                  <option value="">كل التصنيفات</option>
                  <option value="CHAT_REPLY">رد شات مباشر من موظف</option>
                  <option value="DAILY_SCHEDULE">جدول باكدج يومي</option>
                  <option value="INTRO_HANDSHAKE">رسالة تعريفية أولى</option>
                  <option value="PHONE_DIRECT">من هاتف الواتساب مباشرة</option>
                </select>

                <button
                  onClick={fetchAuditLogs}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={14} className={auditLoading ? 'animate-spin' : ''} />
                  <span>تحديث</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#0C3C82] text-white text-xs">
                    <th className="py-3 px-3.5 font-semibold">التوقيت</th>
                    <th className="py-3 px-3.5 font-semibold">الموظف المُرسل (من قام بالرد)</th>
                    <th className="py-3 px-3.5 font-semibold">المستلم / المحادثة</th>
                    <th className="py-3 px-3.5 font-semibold">التصنيف</th>
                    <th className="py-3 px-3.5 font-semibold">نص الرسالة</th>
                    <th className="py-3 px-3.5 font-semibold text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        لا توجد سجلات مطابقة للبحث
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const cat =
                        CATEGORY_LABELS[log.category] || CATEGORY_LABELS.CHAT_REPLY;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                            {new Date(log.created_at).toLocaleString('ar-EG', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            {log.direction === 'incoming' ? (
                              <span className="text-slate-500 font-semibold">
                                📥 رسالة واردة من العميل
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-[#0C3C82]">
                                  👤 {log.sent_by_user_name || 'النظام التلقائي'}
                                </span>
                                {log.sent_by_user_role && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                    {log.sent_by_user_role}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <p className="font-bold text-slate-800">
                              {log.recipient_name || '—'}
                            </p>
                            {isValidDisplayPhone(log.phone) && (
                              <p className="font-mono text-[11px] text-slate-500">{log.phone}</p>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.color}`}
                            >
                              {cat.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 max-w-md">
                            <p className="truncate text-slate-700" title={log.message_text}>
                              {log.message_text}
                            </p>
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {log.direction === 'incoming' ? 'مستلمة' : 'تم الإرسال ✅'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: THE 12 OFFICIAL GROUPS, TEST GROUPS WITH ABDALLA & DAILY SCHEDULE */}
      {/* ============================================================ */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {/* Test Mode vs Official Live Mode Banner */}
          <div
            className={`rounded-2xl border p-4 shadow-xs transition-all ${
              scheduleSendMode === 'test'
                ? 'bg-amber-50/80 border-amber-300'
                : 'bg-emerald-50/80 border-emerald-300'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <FlaskConical
                    size={20}
                    className={
                      scheduleSendMode === 'test' ? 'text-amber-700' : 'text-emerald-700'
                    }
                  />
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    {scheduleSendMode === 'test'
                      ? `🧪 وضع الاختبار الآمن مفعّل (يرسل الرسائل لجروب الاختبار المشترك مع عبد الله ${testPartnerPhone} أولاً)`
                      : '📢 الوضع الرسمي الفعلي مفعّل (يرسل الرسائل لجروبات أولياء الأمور الـ 12 مباشرة)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  يمكنك تجربة إرسال الجداول في جروب الاختبار المشترك مع رقمك (
                  <span className="font-mono font-bold">{testPartnerPhone}</span>) للتأكد من شكل
                  الرسائل والمواعيد قبل تحويل الزر للوضع الرسمي.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Mode Toggle Switch */}
                <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleSwitchScheduleMode('test')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                      scheduleSendMode === 'test'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FlaskConical size={13} />
                    <span>وضع الاختبار (مع عبد الله)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchScheduleMode('live')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                      scheduleSendMode === 'live'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users size={13} />
                    <span>الوضع الرسمي (أولياء الأمور)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateTestGroup('unified', null)}
                  disabled={creatingTestGroup}
                  className="px-4 py-2 rounded-xl bg-[#0C3C82] hover:bg-[#082a5c] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {creatingTestGroup ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>🧪 إنشاء وربط جروب اختباري مشترك مع عبد الله (01224385098)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Day & Broadcast Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Calendar size={19} className="text-[#0C3C82]" />
                <span>جروبات أكاديمية أطلس الـ 12 الرسمية وجدول الباكدج اليومي</span>
              </h2>
              {scheduleDateInfo && (
                <p className="text-xs text-slate-500 mt-1">
                  المعاينة الحالية ليوم:{' '}
                  <strong className="text-[#0C3C82]">
                    {scheduleDateInfo.dayNameAr} الموافق {scheduleDateInfo.formattedDateAr}
                  </strong>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setScheduleTarget('today')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    scheduleTarget === 'today'
                      ? 'bg-white text-[#0C3C82] shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  جدول اليوم
                </button>
                <button
                  onClick={() => setScheduleTarget('tomorrow')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    scheduleTarget === 'tomorrow'
                      ? 'bg-white text-[#0C3C82] shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  جدول الغد
                </button>
              </div>

              <button
                onClick={handleSyncLiveGroups}
                disabled={syncingLiveGroups}
                className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} className={syncingLiveGroups ? 'animate-spin' : ''} />
                <span>مزامنة الجروبات من الواتساب</span>
              </button>

              <button
                onClick={() => handleSendSchedule(null)}
                disabled={sendingScheduleId !== null}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 ${
                  scheduleSendMode === 'test'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {sendingScheduleId === 'ALL' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>
                  {scheduleSendMode === 'test'
                    ? '🧪 إرسال كل الجداول لجروب الاختبار الآن'
                    : '📢 إرسال الجدول لكل الجروبات الرسمية الآن'}
                </span>
              </button>
            </div>
          </div>

          {/* 12 Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedulePreviews.map((grp) => {
              const gradePkgGroups = availablePackageGroups.filter(
                (pg) => pg.grade_id === grp.grade_id || pg.grade_order === grp.grade_order
              );

              return (
                <div
                  key={grp.config_id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 ${
                    grp.is_active ? 'border-slate-200/90' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#0C3C82] text-white font-black text-xs flex items-center justify-center shrink-0">
                          {grp.display_order}
                        </span>
                        <div>
                          <h3 className="font-black text-sm text-slate-800">
                            {grp.official_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
                              {grp.grade_name}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                              الفئة: {grp.section_label}
                            </span>
                            {grp.sessions_count > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                                {grp.sessions_count} حصة في هذا اليوم
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                🌴 عطلة / لا توجد حصص (لن يُرسل)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={grp.is_active}
                          onChange={(e) =>
                            handleUpdateGroupConfig(grp.config_id, {
                              is_active: e.target.checked,
                            })
                          }
                          className="rounded text-[#0C3C82]"
                        />
                        <span>مفعّل</span>
                      </label>
                    </div>

                    {/* Official Group & Test Group Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Official Parent Group */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-600">📢 الجروب الرسمي:</span>
                          {grp.wa_group_jid ? (
                            <span className="text-emerald-700 font-bold">✅ مربوط</span>
                          ) : (
                            <span className="text-amber-700 font-bold">غير مربوط</span>
                          )}
                        </div>
                        <select
                          value={grp.wa_group_jid || ''}
                          onChange={(e) => {
                            const selectedJid = e.target.value || null;
                            const matchedObj = liveWaGroups.find((g) => g.id === selectedJid);
                            handleUpdateGroupConfig(grp.config_id, {
                              wa_group_jid: selectedJid,
                              wa_group_matched_name: matchedObj ? matchedObj.subject : null,
                            });
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700"
                        >
                          <option value="">
                            {grp.wa_group_matched_name
                              ? grp.wa_group_matched_name
                              : '-- اختر الجروب الرسمي --'}
                          </option>
                          {liveWaGroups.map((lg) => (
                            <option key={lg.id} value={lg.id}>
                              {lg.subject} ({lg.participantsCount})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Test Group with Abdalla */}
                      <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-900">🧪 جروب الاختبار:</span>
                          {grp.test_group_jid ? (
                            <span className="text-emerald-700 font-bold">✅ جاهز</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCreateTestGroup('single', grp.config_id)}
                              disabled={creatingTestGroup}
                              className="text-[#0C3C82] font-bold hover:underline cursor-pointer"
                            >
                              + إنشاء مع عبد الله
                            </button>
                          )}
                        </div>
                        <select
                          value={grp.test_group_jid || ''}
                          onChange={(e) => {
                            const selectedJid = e.target.value || null;
                            const matchedObj = liveWaGroups.find((g) => g.id === selectedJid);
                            handleUpdateGroupConfig(grp.config_id, {
                              test_group_jid: selectedJid,
                              test_group_name: matchedObj ? matchedObj.subject : null,
                            });
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-amber-200 bg-white text-[11px] font-semibold text-slate-700"
                        >
                          <option value="">
                            {grp.test_group_name
                              ? grp.test_group_name
                              : '-- اختر أو أنشئ جروب اختبار --'}
                          </option>
                          {liveWaGroups.map((lg) => (
                            <option key={lg.id} value={lg.id}>
                              {lg.subject}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewModalGroup(grp)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>معاينة الجدول</span>
                      </button>

                      <button
                        onClick={() => {
                          setFilterModalGroup({ ...grp, gradePkgGroups });
                          setTempSelectedGroupIds(grp.selected_group_ids || []);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Filter size={13} />
                        <span>
                          {grp.selected_group_ids?.length > 0
                            ? `محدد (${grp.selected_group_ids.length} مجموعة)`
                            : 'كل مجموعات الباكدج'}
                        </span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleSendSchedule(grp.config_id)}
                      disabled={
                        grp.sessions_count === 0 ||
                        (scheduleSendMode === 'test'
                          ? !grp.test_group_jid
                          : !grp.wa_group_jid) ||
                        sendingScheduleId !== null
                      }
                      title={
                        grp.sessions_count === 0
                          ? 'عطلة — لا توجد حصص مقررة اليوم لذا لن يتم النشر'
                          : ''
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                        grp.sessions_count === 0
                          ? 'bg-slate-400 cursor-not-allowed'
                          : scheduleSendMode === 'test'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#0C3C82] hover:bg-[#082a5c]'
                      }`}
                    >
                      {sendingScheduleId === grp.config_id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>
                        {grp.sessions_count === 0
                          ? 'عطلة — لا توجد حصص'
                          : scheduleSendMode === 'test'
                          ? 'إرسال للاختبار 🧪'
                          : 'إرسال للرسمي 📢'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: TEMPLATES & VARIABLES */}
      {/* ============================================================ */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-black text-sm">
                🛡️ نظام المراجعة المسبقة للقوالب (كما طلبت: &quot;جهز القوالب بس مش هنبعتها غير لما نراجعها&quot;)
              </p>
              <p>
                جميع القوالب أدناه مجهزة بالمتغيرات الذكية، ولكنها في وضع{' '}
                <strong>&quot;قيد المراجعة (غير معتمدة للإرسال التلقائي)&quot;</strong> افتراضياً.
                راجع نص كل قالب وعدّله كما تحب، ثم اضغط على زر{' '}
                <strong>&quot;اعتماد وتفعيل القالب&quot;</strong> عندما تكون جاهزاً.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {templates.map((tpl) => {
              const vars = Array.isArray(tpl.variables_list) ? tpl.variables_list : [];

              return (
                <div
                  key={tpl.key}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm sm:text-base text-slate-800">
                          {tpl.title_ar}
                        </h3>
                        {tpl.is_approved ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✅ معتمد ومفعّل للإرسال
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            ⏸️ قيد المراجعة (متوقف عن الإرسال التلقائي)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{tpl.description_ar}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleSaveTemplate(tpl, {
                            is_approved: !tpl.is_approved,
                            is_enabled: !tpl.is_approved,
                          })
                        }
                        disabled={savingTemplateKey === tpl.key}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          tpl.is_approved
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        <span>
                          {tpl.is_approved
                            ? 'إرجاع لوضع المراجعة (إيقاف)'
                            : 'اعتماد وتفعيل القالب بعد المراجعة'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 ml-1">
                      المتغيرات المتاحة (اضغط للإدراج):
                    </span>
                    {vars.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setTemplates((prev) =>
                            prev.map((item) =>
                              item.key === tpl.key
                                ? { ...item, body_template: `${item.body_template} ${v}` }
                                : item
                            )
                          );
                        }}
                        className="px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-mono text-xs font-bold cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={6}
                    value={tpl.body_template}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTemplates((prev) =>
                        prev.map((item) =>
                          item.key === tpl.key ? { ...item, body_template: val } : item
                        )
                      );
                    }}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-[#0C3C82] leading-relaxed bg-slate-50/40"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {tpl.updated_by_name
                        ? `آخر تعديل بواسطة: ${tpl.updated_by_name}`
                        : 'النص الافتراضي'}
                    </span>
                    <button
                      onClick={() => handleSaveTemplate(tpl)}
                      disabled={savingTemplateKey === tpl.key}
                      className="px-4 py-2 rounded-xl bg-[#0C3C82] hover:bg-[#082a5c] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {savingTemplateKey === tpl.key ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      <span>حفظ نص القالب</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: QR CONNECTION, SCHEDULE TIMING & PACING SETTINGS */}
      {/* ============================================================ */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
              <QrCode size={20} className="text-[#0C3C82]" />
              <span>حالة اتصال الواتساب (QR Code)</span>
            </h3>

            {isConnected ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-950">
                    متصل وجاهز للإرسال والاستقبال!
                  </p>
                  <p className="text-xs font-mono font-bold text-emerald-800 mt-1">
                    الرقم المتصل: {conn.connectedPhone}
                  </p>
                  <p className="text-xs text-emerald-700">{conn.connectedName}</p>
                </div>

                <button
                  onClick={handleLogoutWhatsApp}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>فصل الجلسة وتغيير الرقم</span>
                </button>
              </div>
            ) : isQrReady && conn.qrDataUrl ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  افتح تطبيق <strong>WhatsApp</strong> على الهاتف ← الأجهزة المرتبطة ← ربط جهاز،
                  وامسح الكود:
                </p>
                <div className="bg-white p-3 rounded-2xl inline-block border border-slate-200 shadow-xs">
                  <img
                    src={conn.qrDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-60 h-60 mx-auto object-contain"
                  />
                </div>
                <div>
                  <button
                    onClick={handleReconnect}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>تحديث الكود</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  {conn.lastError || 'جاري تجهيز رمز الـ QR للربط...'}
                </p>
                <button
                  onClick={handleReconnect}
                  className="px-4 py-2 rounded-xl bg-[#0C3C82] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>طلب رمز QR الآن</span>
                </button>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-800">
                  مفتاح الإيقاف الطارئ (Kill Switch)
                </p>
                <p className="text-[11px] text-slate-500">
                  إيقاف أو استئناف جميع عمليات الإرسال التلقائي
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSaveSettings(null, { is_paused: !settingsForm.is_paused })
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  settingsForm.is_paused
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {settingsForm.is_paused ? (
                  <>
                    <PlayCircle size={15} />
                    <span>استئناف الإرسال</span>
                  </>
                ) : (
                  <>
                    <PauseCircle size={15} />
                    <span>إيقاف الإرسال مؤقتاً</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSaveSettings}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5"
          >
            <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
              <Sliders size={20} className="text-[#0C3C82]" />
              <span>إعدادات ميعاد الإرسال، الوتيرة، وإرسال اليوم المفتوح</span>
            </h3>

            {/* 1. Daily Schedule Timing */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-black text-[#0C3C82]">
                  1️⃣ ميعاد إرسال جدول الباكدج اليومي للجروبات
                </p>
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.auto_send_daily_schedule)}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        auto_send_daily_schedule: e.target.checked,
                      })
                    }
                    className="rounded text-[#0C3C82]"
                  />
                  <span>تفعيل الإرسال التلقائي اليومي</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    ساعة الإرسال اليومي (توقيت القاهرة):
                  </label>
                  <input
                    type="time"
                    value={settingsForm.daily_schedule_send_time || '20:00'}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        daily_schedule_send_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    نوع الجدول المُرسل:
                  </label>
                  <select
                    value={settingsForm.daily_schedule_target || 'tomorrow'}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        daily_schedule_target: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="tomorrow">إرسال جدول الغد (مساء اليوم السابق)</option>
                    <option value="today">إرسال جدول نفس اليوم (صباحاً)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Pacing & Rate Limiting (Unlimited Daily Sending by default!) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <p className="text-xs sm:text-sm font-black text-[#0C3C82]">
                2️⃣ التحكم في الوتيرة والفواصل الزمنية (الإرسال اليومي مفتوح بلا قيود ∞)
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    أقل فاصل بين رسالتين (ثانية):
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={120}
                    value={settingsForm.min_delay_seconds ?? 8}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        min_delay_seconds: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    أقصى فاصل بين رسالتين (ثانية):
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={300}
                    value={settingsForm.max_delay_seconds ?? 18}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        max_delay_seconds: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    الفاصل بين الجروبات (ثانية):
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={120}
                    value={settingsForm.group_delay_seconds ?? 5}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        group_delay_seconds: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    حجم الدفعة قبل الراحة:
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={settingsForm.batch_size ?? 25}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        batch_size: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    مدة استراحة الدفعة (ثانية):
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={settingsForm.batch_cooldown_seconds ?? 120}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        batch_cooldown_seconds: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                    حد الإرسال اليومي (0 = مفتوح ∞):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={settingsForm.daily_limit ?? 0}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        daily_limit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-bold text-emerald-900"
                  />
                </div>
              </div>
            </div>

            {/* 3. Phone Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  رقم عبد الله المشترك في جروبات الاختبار:
                </label>
                <input
                  type="text"
                  value={settingsForm.test_partner_phone || '01224385098'}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      test_partner_phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  رقم شؤون الطلاب في القوالب {'{center_phone}'}:
                </label>
                <input
                  type="text"
                  value={settingsForm.center_support_phone || '01288817183'}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      center_support_phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-[#0C3C82] hover:bg-[#082a5c] text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
              >
                {savingSettings ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>حفظ جميع إعدادات الواتساب والوتيرة</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: PREVIEW GROUP SCHEDULE MESSAGE */}
      {/* ============================================================ */}
      {previewModalGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalGroup(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm sm:text-base text-slate-800">
                👁️ معاينة رسالة الجدول: {previewModalGroup.official_name}
              </h3>
              <button
                onClick={() => setPreviewModalGroup(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-slate-800 max-h-[380px] overflow-y-auto">
              {previewModalGroup.message_preview}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewModalGroup(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  const id = previewModalGroup.config_id;
                  setPreviewModalGroup(null);
                  handleSendSchedule(id);
                }}
                className="px-4 py-2 rounded-xl bg-[#0C3C82] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={13} />
                <span>
                  {scheduleSendMode === 'test'
                    ? 'إرسال لجروب الاختبار الآن 🧪'
                    : 'إرسال للجروب الرسمي الآن 📢'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: FILTER SPECIFIC PACKAGE GROUPS FOR BOYS / GIRLS GROUP */}
      {/* ============================================================ */}
      {filterModalGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setFilterModalGroup(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-800">
                  🎯 تخصيص مجموعات الباكدج لجروب: {filterModalGroup.official_name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  إذا لم تحدد أي مجموعة، سيقوم النظام بإرسال كل مجموعات باكدج المرحلة تلقائياً.
                </p>
              </div>
              <button
                onClick={() => setFilterModalGroup(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2">
              {filterModalGroup.gradePkgGroups?.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center">
                  لا توجد مجموعات باكدج مسجلة لهذه المرحلة
                </p>
              ) : (
                filterModalGroup.gradePkgGroups.map((pg) => {
                  const checked = tempSelectedGroupIds.includes(pg.id);
                  return (
                    <label
                      key={pg.id}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{pg.group_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {pg.subject_name} — {pg.teacher_name}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSelectedGroupIds([...tempSelectedGroupIds, pg.id]);
                          } else {
                            setTempSelectedGroupIds(
                              tempSelectedGroupIds.filter((id) => id !== pg.id)
                            );
                          }
                        }}
                        className="rounded text-[#0C3C82]"
                      />
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setTempSelectedGroupIds([])}
                className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
              >
                إعادة ضبط (شمل كل مجموعات المرحلة)
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterModalGroup(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateGroupConfig(filterModalGroup.config_id, {
                      selected_group_ids: tempSelectedGroupIds,
                    });
                    setFilterModalGroup(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0C3C82] text-white text-xs font-bold cursor-pointer"
                >
                  حفظ التخصيص
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: START NEW CHAT MESSAGE */}
      {/* ============================================================ */}
      {newChatModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setNewChatModalOpen(false)}
        >
          <form
            onSubmit={handleStartNewChat}
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm sm:text-base text-slate-800">
                💬 إرسال رسالة جديدة لولي أمر أو طالب
              </h3>
              <button
                type="button"
                onClick={() => setNewChatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم موبايل الواتساب (مثال: 01224385098):
              </label>
              <input
                type="text"
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نص الرسالة:
              </label>
              <textarea
                rows={4}
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewChatModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={sendingReply}
                className="px-4 py-2 rounded-xl bg-[#0C3C82] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {sendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>إرسال وتسجيل باسمي</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: LINK LID TO PHONE NUMBER */}
      {/* ============================================================ */}
      {linkLidModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLinkLidModalOpen(false)}
        >
          <form
            onSubmit={handleLinkLidToPhone}
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm sm:text-base text-slate-800">
                🔗 ربط المحادثة برقم هاتف الطالب / ولي الأمر
              </h3>
              <button
                type="button"
                onClick={() => setLinkLidModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              أدخل رقم هاتف صاحب هذه المحادثة ليقوم النظام بربطها بملف الطالب ودمج جميع رسائلها في
              شات واحد بشكل دائم:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف (مثال: 01012345678):
              </label>
              <input
                type="text"
                value={linkLidPhone}
                onChange={(e) => setLinkLidPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkLidModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0C3C82] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>ربط ودمج الشات</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
