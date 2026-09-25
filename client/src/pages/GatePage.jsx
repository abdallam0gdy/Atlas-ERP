import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PrintReportModal from '../components/PrintReportModal';
import {
  DoorOpen, QrCode, Volume2, VolumeX, Clock,
  CheckCircle2, XCircle, AlertTriangle, User, BookOpen,
  Search, Hash, Keyboard, RefreshCw, ArrowRight, Camera,
  Printer, Download, LayoutDashboard, Filter, Check, List
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GatePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('scanner'); // 'scanner' | 'manual'
  const [scanResult, setScanResult] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayStats, setTodayStats] = useState({ total_scans: 0, unique_students: 0, paid_count: 0, pending_count: 0 });
  const [todayLogs, setTodayLogs] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(null);

  // Manual entry states
  const [manualCode, setManualCode] = useState('');
  const [lookedUpStudent, setLookedUpStudent] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Modals & Filters
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'paid' | 'pending'
  const [mobileTab, setMobileTab] = useState('terminal'); // 'terminal' | 'logs'

  const inputRef = useRef(null);
  const manualInputRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Maintain focus based on current mode
  const maintainFocus = useCallback(() => {
    if (mode === 'scanner') {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    } else if (mode === 'manual' && !lookedUpStudent) {
      if (manualInputRef.current && document.activeElement !== manualInputRef.current) {
        manualInputRef.current.focus();
      }
    }
  }, [mode, lookedUpStudent]);

  useEffect(() => {
    maintainFocus();

    const handleActivity = () => setTimeout(maintainFocus, 100);
    document.addEventListener('click', handleActivity);

    // Global shortcut: F2 toggles mode
    const handleGlobalKey = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setMode((prev) => (prev === 'scanner' ? 'manual' : 'scanner'));
        setLookedUpStudent(null);
        setLookupError('');
      } else if (e.key === 'Escape' && mode === 'manual') {
        setLookedUpStudent(null);
        setLookupError('');
        setManualCode('');
        setTimeout(() => manualInputRef.current?.focus(), 50);
      }
    };
    document.addEventListener('keydown', handleGlobalKey);

    loadTodayLog();
    const interval = setInterval(loadTodayLog, 15000);

    return () => {
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleGlobalKey);
      clearInterval(interval);
    };
  }, [maintainFocus, mode]);

  const loadTodayLog = async () => {
    try {
      const { data } = await api.get('/attendance/today');
      setTodayStats(data.data.stats || { total_scans: 0, unique_students: 0, paid_count: 0, pending_count: 0 });
      setTodayLogs(data.data.logs || []);
    } catch (err) {
      console.error('Failed to load today log:', err);
    }
  };

  // Play audio feedback
  const playSound = (type) => {
    if (!audioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'success') {
        oscillator.frequency.value = 880; // A5
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 1108; // C#6
        }, 100);
        setTimeout(() => oscillator.stop(), 200);
      } else {
        oscillator.frequency.value = 220; // A3
        gainNode.gain.value = 0.4;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 400);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  // Process barcode scan or direct code check-in
  const processScan = async (identifier) => {
    if (!identifier) return;
    const cleanId = String(identifier).trim();
    if (cleanId.length < 1) return;
    if (isProcessing) return;

    const now = Date.now();
    if (lastScanTime && now - lastScanTime < 500) return;
    setLastScanTime(now);

    setIsProcessing(true);
    setBarcodeInput('');

    try {
      const { data } = await api.post('/attendance/scan', { barcode_id: cleanId });
      setScanResult(data);

      if (data.success && data.type !== 'ALREADY_SCANNED') {
        playSound('success');
      } else if (!data.success) {
        playSound('error');
      }

      await loadTodayLog();

      // Clear result after 4 seconds
      setTimeout(() => {
        setScanResult(null);
        maintainFocus();
      }, 4000);
    } catch (err) {
      const errData = err.response?.data;
      setScanResult({
        success: false,
        type: 'ERROR',
        message: errData?.message || 'حدث خطأ في معالجة الحضور',
        data: { student: null, sessions: [] },
      });
      playSound('error');

      setTimeout(() => {
        setScanResult(null);
        maintainFocus();
      }, 3500);
    } finally {
      setIsProcessing(false);
      maintainFocus();
    }
  };

  // Handle Scanner Enter
  const handleScannerKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processScan(barcodeInput);
    }
  };

  // Handle Manual Code Lookup
  const handleManualSearch = async (e) => {
    if (e) e.preventDefault();
    const query = manualCode.trim();
    if (!query) return;

    setIsLookingUp(true);
    setLookupError('');
    setLookedUpStudent(null);

    try {
      const { data } = await api.get('/attendance/lookup', {
        params: { code: query },
      });

      if (data.success) {
        setLookedUpStudent(data);
      } else {
        setLookupError(data.message || 'لم يتم العثور على الطالب');
        playSound('error');
      }
    } catch (err) {
      setLookupError(err.response?.data?.message || `لم يتم العثور على طالب بالرقم: ${query}`);
      playSound('error');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Confirm manual attendance
  const handleConfirmManual = async () => {
    if (!lookedUpStudent?.student) return;
    const student = lookedUpStudent.student;
    await processScan(student.barcodeId || student.studentCode || student.id);
    setLookedUpStudent(null);
    setManualCode('');
    setTimeout(() => {
      manualInputRef.current?.focus();
    }, 100);
  };

  // Cancel manual lookup
  const handleCancelManual = () => {
    setLookedUpStudent(null);
    setLookupError('');
    setManualCode('');
    setTimeout(() => {
      manualInputRef.current?.focus();
    }, 50);
  };

  // Export today's log to Excel (CSV)
  const handleExportTodayLogs = () => {
    if (todayLogs.length === 0) {
      toast.error('لا توجد سجلات حضور مسجلة اليوم لتصديرها');
      return;
    }

    const headers = [
      'اسم الطالب',
      'كود الباركود',
      'المجموعة',
      'المادة',
      'المدرس',
      'توقيت الحضور',
      'حالة الدفع',
      'المسؤول'
    ];

    const rows = todayLogs.map((log) => [
      log.student_name || '',
      log.barcode_id || '',
      log.group_name_ar || log.group_name || '',
      log.subject_name || '',
      log.teacher_name || '',
      new Date(log.scan_timestamp).toLocaleTimeString('ar-EG'),
      log.payment_status === 'paid' ? 'مدفوع' : log.payment_status === 'free' ? 'مجاني' : 'ينتظر الدفع',
      log.scanned_by_name || ''
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val ?? '').replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        )
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_حضور_اليوم_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير كشف الحضور بنجاح');
  };

  // Filtered logs for display
  const filteredLogs = useMemo(() => {
    return todayLogs.filter((log) => {
      if (logFilter === 'paid') return log.payment_status === 'paid';
      if (logFilter === 'pending') return log.payment_status === 'pending';
      return true;
    });
  }, [todayLogs, logFilter]);

  // Current time display
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const getScanStateClass = () => {
    if (!scanResult) return 'gate-scan-ready';
    if (scanResult.success && scanResult.type !== 'ALREADY_SCANNED') return 'gate-scan-success';
    return 'gate-scan-error';
  };

  // Print modal columns
  const printColumns = [
    { header: 'اسم الطالب', accessor: 'student_name' },
    { header: 'كود الباركود', render: (l) => l.barcode_id },
    { header: 'المجموعة / الحصة', render: (l) => l.group_name_ar || l.group_name || '—' },
    { header: 'المادة والمدرس', render: (l) => `${l.subject_name || ''} (${l.teacher_name || ''})` },
    {
      header: 'وقت المسح',
      render: (l) => new Date(l.scan_timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    },
    {
      header: 'حالة الدفع',
      render: (l) => (l.payment_status === 'paid' ? '✅ مدفوع' : l.payment_status === 'free' ? 'مجاني' : '⚠️ يحتاج دفع')
    }
  ];

  return (
    <div className="gate-terminal flex flex-col" style={{ minHeight: '100vh', direction: 'rtl' }}>
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors text-xs font-semibold"
            title="الرجوع إلى لوحة التحكم الرئيسية"
          >
            <ArrowRight size={16} />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </Link>
          <div className="flex items-center gap-2">
            <DoorOpen size={22} className="text-cyan-300" />
            <div>
              <h1 className="text-white font-bold text-base sm:text-lg">بوابة الحضور الذكي</h1>
              <p className="text-white/40 text-[10px] sm:text-xs">Smart Attendance Gate — سنتر أطلس</p>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => {
              setMode('scanner');
              setLookedUpStudent(null);
              setLookupError('');
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mode === 'scanner'
                ? 'bg-cyan-500 text-slate-900 shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <QrCode size={16} />
            <span>ماسح QR</span>
          </button>
          <button
            onClick={() => {
              setMode('manual');
              setScanResult(null);
              setTimeout(() => manualInputRef.current?.focus(), 50);
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-cyan-500 text-slate-900 shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Keyboard size={16} />
            <span>تسجيل يدوي</span>
            <span className="hidden sm:inline text-[10px] opacity-75 bg-black/20 px-1 py-0.5 rounded font-mono">F2</span>
          </button>
        </div>

        {/* Top Right Utilities & Clock */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors text-xs flex items-center gap-1 font-semibold"
            title="طباعة كشف حضور اليوم"
          >
            <Printer size={16} />
            <span className="hidden md:inline">طباعة الكشف</span>
          </button>

          <button
            onClick={handleExportTodayLogs}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-400 hover:text-emerald-300 transition-colors text-xs flex items-center gap-1 font-semibold"
            title="تصدير كشف اليوم إلى Excel"
          >
            <Download size={16} />
            <span className="hidden md:inline">تصدير Excel</span>
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="text-white/50 hover:text-white transition-colors p-2 rounded-xl bg-white/5 hover:bg-white/15"
            title={audioEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
          >
            {audioEnabled ? <Volume2 size={18} className="text-cyan-400" /> : <VolumeX size={18} />}
          </button>

          <div className="text-left hidden sm:block">
            <p className="text-white font-bold text-sm sm:text-base font-mono">{timeStr}</p>
            <p className="text-white/40 text-[10px]">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden border-b border-white/10 bg-black/20 px-4 py-2 gap-2">
        <button
          onClick={() => setMobileTab('terminal')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'terminal' ? 'bg-cyan-500 text-slate-900 shadow' : 'text-white/60 hover:text-white'
          }`}
        >
          شاشة التسجيل والمسح
        </button>
        <button
          onClick={() => setMobileTab('logs')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'logs' ? 'bg-cyan-500 text-slate-900 shadow' : 'text-white/60 hover:text-white'
          }`}
        >
          <List size={14} />
          <span>سجل الحضور اليوم ({todayLogs.length})</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Attendance Scanner / Manual Terminal Area */}
        <div className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 ${mobileTab === 'logs' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Container Card */}
          <div
            className={`w-full max-w-xl rounded-3xl p-5 sm:p-8 transition-all duration-300 ${getScanStateClass()}`}
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            {/* 1. SCANNER MODE */}
            {mode === 'scanner' && (
              <div>
                {/* QR Code Input */}
                <div className="relative mb-5 sm:mb-6">
                  <QrCode size={22} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-300" />
                  <input
                    ref={inputRef}
                    id="gate-barcode-input"
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleScannerKeyDown}
                    placeholder="امسح كود الـ QR أو اكتب الكود واضغط Enter..."
                    autoFocus
                    autoComplete="off"
                    className="w-full py-4 sm:py-5 px-12 sm:px-14 text-xl sm:text-2xl text-center font-mono text-white rounded-2xl outline-none transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: '2px solid rgba(14,165,233,0.3)',
                      caretColor: '#0EA5E9',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0EA5E9';
                    }}
                  />
                  {isProcessing && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <RefreshCw size={22} className="text-cyan-300 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Scan Results Display */}
                {scanResult ? (
                  <div className="text-center py-4 animate-fade-in space-y-4">
                    {/* Status Icon */}
                    <div className="inline-flex p-3 rounded-full bg-white/10 mb-1">
                      {scanResult.success ? (
                        <CheckCircle2 size={54} className="text-emerald-400" />
                      ) : scanResult.type === 'ALREADY_SCANNED' ? (
                        <AlertTriangle size={54} className="text-amber-400" />
                      ) : (
                        <XCircle size={54} className="text-rose-400" />
                      )}
                    </div>

                    {/* Result Message */}
                    <h2 className="text-xl sm:text-2xl font-bold text-white px-2">
                      {scanResult.message}
                    </h2>

                    {/* Student Info If Found */}
                    {scanResult.data?.student && (
                      <div className="mt-3 p-4 rounded-2xl bg-white/10 border border-white/10 text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-lg flex items-center justify-center shrink-0">
                            {scanResult.data.student.fullName?.[0] || 'ط'}
                          </div>
                          <div>
                            <p className="text-white font-bold text-base">
                              {scanResult.data.student.fullName}
                            </p>
                            <p className="text-white/60 text-xs mt-0.5">
                              {scanResult.data.student.gradeName}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Today's Registered Sessions */}
                    {scanResult.data?.sessions?.length > 0 && (
                      <div className="mt-3 space-y-2 text-right">
                        {scanResult.data.sessions.map((session, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/10 border border-white/5"
                          >
                            <div>
                              <p className="text-white text-sm font-semibold">
                                {session.subjectName || session.groupName}
                              </p>
                              <p className="text-white/50 text-xs">
                                {session.teacherName} • {session.classroomName}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-emerald-400">
                              {session.paymentStatus === 'paid' ? '✅ مدفوع' : '⚠️ يحتاج دفع'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <QrCode size={64} className="mx-auto text-cyan-300/30 mb-3" />
                    <p className="text-white/70 text-base sm:text-lg font-bold">جاهز لمسح كود الـ QR أو الباركود</p>
                    <p className="text-white/40 text-xs mt-1">مرر كارت الطالب أمام الماسح أو اضغط F2 للإدخال اليدوي</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. MANUAL ENTRY MODE */}
            {mode === 'manual' && (
              <div className="space-y-4">
                {!lookedUpStudent ? (
                  <form onSubmit={handleManualSearch} className="space-y-4">
                    <div className="text-center mb-2">
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center gap-2">
                        <Hash size={20} className="text-cyan-300" />
                        إدخال يدوي برقم الطالب أو الباركود
                      </h2>
                      <p className="text-white/50 text-xs mt-1">
                        اكتب كود الطالب في السنتر (مثل 1001 أو 1011) للتحقق المباشر
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        ref={manualInputRef}
                        id="gate-manual-code-input"
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="أدخل كود الطالب (مثال: 1001)..."
                        autoFocus
                        className="w-full py-4 sm:py-5 px-6 text-2xl sm:text-3xl text-center font-mono text-white rounded-2xl outline-none transition-all font-bold"
                        style={{
                          background: 'rgba(0,0,0,0.35)',
                          border: '2px solid rgba(14,165,233,0.4)',
                          caretColor: '#0EA5E9',
                        }}
                      />
                      {isLookingUp && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <RefreshCw size={22} className="text-cyan-300 animate-spin" />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLookingUp || !manualCode.trim()}
                      className="w-full py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Search size={18} />
                      <span>بحث عن الطالب (Enter)</span>
                    </button>

                    {lookupError && (
                      <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-center text-xs sm:text-sm font-semibold">
                        {lookupError}
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="animate-fade-in-up space-y-4">
                    {/* Student Info Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-300 font-bold text-2xl flex items-center justify-center border border-cyan-400/30 shrink-0">
                          {lookedUpStudent.student.fullName?.[0] || 'ط'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                              {lookedUpStudent.student.fullName}
                            </h3>
                            <span className="bg-cyan-400/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                              #{lookedUpStudent.student.studentCode || lookedUpStudent.student.barcodeId}
                            </span>
                          </div>
                          <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                            {lookedUpStudent.student.gradeName}
                            {lookedUpStudent.student.phone && ` • ${lookedUpStudent.student.phone}`}
                          </p>
                        </div>
                      </div>

                      {/* Scheduled Sessions Today */}
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <p className="text-white/60 text-xs mb-2 font-medium">حصص ومجموعات اليوم:</p>
                        {lookedUpStudent.sessions?.length === 0 ? (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                            ⚠️ لا توجد حصص مجدولة لهذا الطالب اليوم في الجدول الدراسي
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {lookedUpStudent.sessions.map((sess, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5"
                              >
                                <div>
                                  <p className="text-white font-semibold text-xs sm:text-sm">
                                    {sess.subjectName || sess.groupName}
                                  </p>
                                  <p className="text-white/40 text-[11px] mt-0.5">
                                    {sess.teacherName} • {sess.classroomName || 'القاعة'}
                                  </p>
                                </div>
                                <div className="text-left">
                                  <span className={`text-[11px] font-bold ${
                                    sess.isAttended ? 'text-amber-400' : 'text-emerald-400'
                                  }`}>
                                    {sess.isAttended ? '✅ تم الحضور' : '⏳ جاهز للتسجيل'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Confirmation Buttons */}
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={handleConfirmManual}
                        disabled={isProcessing || lookedUpStudent.allAttended}
                        className="flex-1 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        <CheckCircle2 size={20} />
                        <span>{lookedUpStudent.allAttended ? 'تم تسجيله مسبقاً اليوم' : 'تأكيد الحضور الآن'}</span>
                      </button>

                      <button
                        onClick={handleCancelManual}
                        className="px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl font-bold text-xs sm:text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
                      >
                        إلغاء (Esc)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats Footer */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-6">
            <div className="text-center min-w-[70px]">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {todayStats.total_scans || 0}
              </p>
              <p className="text-white/50 text-xs">إجمالي الحضور</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center min-w-[70px]">
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
                {todayStats.unique_students || 0}
              </p>
              <p className="text-white/50 text-xs">طالب فريد</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center min-w-[70px]">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                {todayStats.paid_count || 0}
              </p>
              <p className="text-white/50 text-xs">اشتراك مدفوع</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center min-w-[70px]">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                {todayStats.pending_count || 0}
              </p>
              <p className="text-white/50 text-xs">ينتظر الدفع</p>
            </div>
          </div>
        </div>

        {/* Right Panel: Today's Log (with search and status filters) */}
        <div
          className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-r border-white/10 flex flex-col ${
            mobileTab === 'terminal' ? 'hidden lg:flex' : 'flex'
          }`}
          style={{ background: 'rgba(0,0,0,0.22)' }}
        >
          {/* Panel Header */}
          <div className="p-3 sm:p-4 border-b border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-cyan-400" />
                <span>سجل الحضور المباشر اليوم</span>
              </h3>
              <span className="atlas-badge bg-white/10 text-white/80 text-xs font-mono">
                {todayLogs.length}
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-black/30 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setLogFilter('all')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  logFilter === 'all' ? 'bg-white/20 text-white font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setLogFilter('paid')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  logFilter === 'paid' ? 'bg-emerald-500/30 text-emerald-300 font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                مدفوع
              </button>
              <button
                onClick={() => setLogFilter('pending')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  logFilter === 'pending' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                ينتظر الدفع
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-170px)]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Clock size={36} className="mx-auto text-white/20 mb-2" />
                <p className="text-white/40 text-sm font-medium">لا توجد سجلات مطابقة</p>
                <p className="text-white/30 text-xs mt-1">سجل أول حضور بالماسح أو الإدخال اليدوي</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-3 sm:p-3.5 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        log.payment_status === 'paid' ? 'bg-emerald-400' :
                        log.payment_status === 'free' ? 'bg-cyan-400' :
                        'bg-amber-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs sm:text-sm font-bold truncate">
                          {log.student_name}
                        </p>
                        <p className="text-white/50 text-[11px] mt-0.5 truncate">
                          {log.subject_name || log.group_name_ar || log.group_name}
                          {log.teacher_name && ` • ${log.teacher_name}`}
                        </p>
                      </div>
                      <div className="text-left shrink-0 text-xs">
                        <p className="text-white/60 font-mono">
                          {new Date(log.scan_timestamp).toLocaleTimeString('ar-EG', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          log.payment_status === 'paid' ? 'text-emerald-400 bg-emerald-500/10' :
                          log.payment_status === 'free' ? 'text-cyan-400 bg-cyan-500/10' :
                          'text-amber-400 bg-amber-500/10'
                        }`}>
                          {log.payment_status === 'paid' ? 'مدفوع' :
                           log.payment_status === 'free' ? 'مجاني' : 'ينتظر الدفع'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Today's Attendance Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="كشف الحضور اليومي الذكي"
        subtitle={`تاريخ اليوم (${todayLogs.length} عملية حضور مسجلة)`}
        columns={printColumns}
        data={todayLogs}
        filtersSummary={[`إجمالي الحضور: ${todayStats.total_scans}`, `الطلاب الفريدون: ${todayStats.unique_students}`]}
      />
    </div>
  );
}
