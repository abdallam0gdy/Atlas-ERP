import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera, RefreshCw, Zap, ZapOff, CheckCircle2,
  XCircle, AlertTriangle, Sparkles, Clock, CalendarX,
  X, AlertCircle, ShieldAlert
} from 'lucide-react';

export default function MobileCameraScanner({
  onScan,
  isProcessing,
  scanResult,
  onClose,
}) {
  const [isStarting, setIsStarting] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [availableCamerasCount, setAvailableCamerasCount] = useState(0);

  const scannerRef = useRef(null);
  const readerElementId = 'gate-mobile-camera-viewfinder';
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const isMountedRef = useRef(true);

  // Handle successful code detection from camera
  const handleDetectedCode = useCallback((decodedText) => {
    if (!decodedText) return;
    const cleanCode = String(decodedText).trim();
    if (cleanCode.length === 0) return;

    const now = Date.now();
    // Debounce duplicate scans: 2.5s for same code, 1s for different code
    if (
      cleanCode === lastScannedCodeRef.current &&
      now - lastScanTimeRef.current < 2500
    ) {
      return;
    }
    if (now - lastScanTimeRef.current < 1000) {
      return;
    }

    lastScannedCodeRef.current = cleanCode;
    lastScanTimeRef.current = now;

    // Haptic vibration feedback on mobile
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(120);
      } catch {
        // ignore vibration failure
      }
    }

    if (onScan) {
      onScan(cleanCode);
    }
  }, [onScan]);

  // Start or restart camera scanner
  const startCamera = useCallback(async (currentFacingMode) => {
    setIsStarting(true);
    setCameraError(null);

    // Stop existing instance if scanning
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error clearing previous scanner:', err);
      }
    }

    // Wait a tick for DOM element to be fully mounted
    await new Promise((resolve) => setTimeout(resolve, 80));
    if (!isMountedRef.current) return;

    const element = document.getElementById(readerElementId);
    if (!element) {
      setCameraError('لم يتم العثور على نافذة الكاميرا');
      setIsStarting(false);
      return;
    }

    try {
      // Check available cameras
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (isMountedRef.current) {
          setAvailableCamerasCount(cameras?.length || 0);
        }
      } catch {
        // getCameras might throw if permission not yet granted; continue
      }

      const scanner = new Html5Qrcode(readerElementId, { verbose: false });
      scannerRef.current = scanner;

      const scanConfig = {
        fps: 12,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxEdge = Math.max(160, Math.floor(minEdge * 0.72));
          return { width: boxEdge, height: boxEdge };
        },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: currentFacingMode },
        scanConfig,
        handleDetectedCode,
        () => {
          // ignore per-frame decode errors
        }
      );

      if (!isMountedRef.current) {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
        return;
      }

      setIsStarting(false);

      // Check if torch/flashlight is supported
      try {
        const trackCaps = scanner.getRunningTrackCameraCapabilities();
        if (trackCaps && typeof trackCaps.torchFeature === 'function') {
          const torchFeat = trackCaps.torchFeature();
          if (torchFeat && torchFeat.isSupported()) {
            setTorchAvailable(true);
          }
        }
      } catch {
        setTorchAvailable(false);
      }
    } catch (err) {
      console.error('Camera start failed:', err);
      if (!isMountedRef.current) return;
      setIsStarting(false);

      const errMsg = String(err?.message || err || '').toLowerCase();
      if (errMsg.includes('permission') || errMsg.includes('notallowed') || errMsg.includes('denied')) {
        setCameraError('لم يتم منح إذن الوصول للكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات المتصفح.');
      } else if (errMsg.includes('notfound') || errMsg.includes('devicesnotfound')) {
        setCameraError('لم يتم العثور على كاميرا في هذا الجهاز.');
      } else if (errMsg.includes('readable') || errMsg.includes('busy') || errMsg.includes('track')) {
        setCameraError('الكاميرا قيد الاستخدام بواسطة تطبيق آخر، أو تعذر فتحها.');
      } else {
        setCameraError('تعذر تشغيل الكاميرا. يرجى التأكد من استخدام اتصال آمن (HTTPS) والسماح بإذن الكاميرا.');
      }
    }
  }, [handleDetectedCode]);

  // Initial startup on mount
  useEffect(() => {
    isMountedRef.current = true;
    startCamera(facingMode);

    return () => {
      isMountedRef.current = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {}).finally(() => {
              try { scannerRef.current?.clear(); } catch {}
            });
          } else {
            try { scannerRef.current.clear(); } catch {}
          }
        } catch {
          // cleanup safe
        }
      }
    };
  }, [startCamera, facingMode]);

  // Switch camera front/back
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setIsTorchOn(false);
    startCamera(nextMode);
  };

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !torchAvailable) return;
    try {
      const trackCaps = scannerRef.current.getRunningTrackCameraCapabilities();
      if (trackCaps && typeof trackCaps.torchFeature === 'function') {
        const nextTorch = !isTorchOn;
        await trackCaps.torchFeature().apply(nextTorch);
        setIsTorchOn(nextTorch);
      }
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Viewfinder Header & Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Camera size={20} className="text-cyan-300" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>مسح الحضور بكاميرا الموبايل</span>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 rounded-full font-bold">
                {facingMode === 'environment' ? '📷 الخلفية' : '🤳 الأمامية'}
              </span>
            </h3>
            <p className="text-[11px] text-white/50">وجّه الكاميرا نحو كود QR أو باركود الطالب</p>
          </div>
        </div>

        {/* Action Buttons: Flip / Torch / Close */}
        <div className="flex items-center gap-1.5">
          {torchAvailable && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isTorchOn
                  ? 'bg-amber-400 text-slate-900 shadow-md font-bold'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
              }`}
              title={isTorchOn ? 'إطفاء الكشاف' : 'تشغيل الكشاف'}
            >
              {isTorchOn ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
          )}

          {availableCamerasCount > 1 && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
              title="تبديل الكاميرا (الأمامية / الخلفية)"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white/70 hover:text-rose-200 transition-all cursor-pointer"
              title="إغلاق الكاميرا والعودة"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Camera Viewfinder Box */}
      <div className="relative w-full max-w-[340px] aspect-square mx-auto rounded-3xl overflow-hidden bg-black/90 border-2 border-cyan-400/40 shadow-2xl flex items-center justify-center">
        {/* HTML5 QR Code Container (Library mounts video here) */}
        <div
          id={readerElementId}
          className="w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Viewfinder Overlay Targeting Corners & Animated Scan Laser */}
        {!cameraError && !isStarting && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="relative w-full h-full max-w-[240px] max-h-[240px]">
              {/* Corner Brackets */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl shadow-sm" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl shadow-sm" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl shadow-sm" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl shadow-sm" />

              {/* Animated Laser Scanning Line */}
              <div
                className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#0EA5E9]"
                style={{
                  animation: 'laserScan 2.4s ease-in-out infinite alternate',
                }}
              />
            </div>
          </div>
        )}

        {/* Loading Spinner during startup */}
        {isStarting && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center z-10">
            <RefreshCw size={36} className="text-cyan-400 animate-spin mb-3" />
            <p className="text-white text-sm font-bold">جاري فتح كاميرا الهاتف...</p>
            <p className="text-white/40 text-xs mt-1">يرجى السماح بإذن الكاميرا عند طلبه</p>
          </div>
        )}

        {/* Processing Indicator when code is being verified on server */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center z-20 backdrop-blur-xs">
            <RefreshCw size={40} className="text-emerald-400 animate-spin mb-3" />
            <p className="text-white text-base font-black">جاري تسجيل حضور الطالب...</p>
          </div>
        )}

        {/* Error Fallback (e.g. Permission Denied) */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-30">
            <ShieldAlert size={44} className="text-amber-400 mb-2.5" />
            <h4 className="text-white font-bold text-sm mb-1.5">تعذر الوصول للكاميرا</h4>
            <p className="text-white/70 text-xs leading-relaxed max-w-xs mb-4">
              {cameraError}
            </p>
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>إعادة المحاولة الآن</span>
            </button>
          </div>
        )}
      </div>

      {/* CSS Keyframe for Laser Scanning Line */}
      <style>{`
        @keyframes laserScan {
          0% { top: 8%; opacity: 0.3; }
          50% { opacity: 1; }
          100% { top: 92%; opacity: 0.3; }
        }
      `}</style>

      {/* Live Scan Results Display (Appears right under camera) */}
      {scanResult && (
        <div className="animate-fade-in space-y-3 pt-1">
          {/* Status Message Banner */}
          <div
            className={`p-4 rounded-2xl border text-center transition-all ${
              scanResult.success && scanResult.type !== 'ALREADY_SCANNED'
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                : scanResult.type === 'ALREADY_SCANNED'
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-100'
                : scanResult.type === 'TOO_EARLY'
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-100'
                : 'bg-rose-500/20 border-rose-400/40 text-rose-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {scanResult.success && scanResult.type !== 'ALREADY_SCANNED' ? (
                <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
              ) : scanResult.type === 'ALREADY_SCANNED' ? (
                <AlertTriangle size={24} className="text-amber-400 shrink-0" />
              ) : scanResult.type === 'TOO_EARLY' ? (
                <Clock size={24} className="text-amber-400 shrink-0 animate-pulse" />
              ) : (
                <XCircle size={24} className="text-rose-400 shrink-0" />
              )}
              <h4 className="text-base font-black leading-snug">{scanResult.message}</h4>
            </div>
          </div>

          {/* Student Info Card */}
          {scanResult.data?.student && (
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-right space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-base flex items-center justify-center shrink-0">
                    {scanResult.data.student.fullName?.[0] || 'ط'}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">
                      {scanResult.data.student.fullName}
                    </p>
                    <p className="text-white/60 text-[11px] mt-0.5">
                      {scanResult.data.student.gradeName}
                      {scanResult.data.student.studentCode && ` • كود: #${scanResult.data.student.studentCode}`}
                    </p>
                  </div>
                </div>

                {scanResult.data.student.discountPercent > 0 && (
                  <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                    <Sparkles size={12} className="text-purple-300" />
                    <span>{scanResult.data.student.statusName || 'خصم'} ({scanResult.data.student.discountPercent}%)</span>
                  </span>
                )}
              </div>

              {/* Registered Sessions */}
              {scanResult.data?.sessions?.map((session, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 border border-white/5 text-xs"
                >
                  <div>
                    <p className="text-white font-semibold flex items-center gap-1.5">
                      <span>{session.subjectName || session.groupName}</span>
                      {session.startTime && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-cyan-300">
                          {session.startTime}
                        </span>
                      )}
                    </p>
                    <p className="text-white/50 text-[10px] mt-0.5">
                      {session.teacherName} • {session.classroomName || 'القاعة المحددة'}
                    </p>
                  </div>
                  <span
                    className={`font-bold text-[11px] ${
                      session.paymentStatus === 'paid'
                        ? 'text-emerald-400'
                        : session.paymentStatus === 'free'
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {session.paymentStatus === 'paid' ? '✅ مدفوع' : session.paymentStatus === 'free' ? '🎁 مجاني' : '⚠️ يحتاج دفع'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
