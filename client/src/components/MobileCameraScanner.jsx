import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera, RefreshCw, Zap, ZapOff, CheckCircle2,
  XCircle, AlertTriangle, Sparkles, Clock,
  X, ShieldAlert, SwitchCamera
} from 'lucide-react';

const READER_ELEMENT_ID = 'gate-mobile-camera-viewfinder';

const MobileCameraScanner = memo(function MobileCameraScanner({
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
  const [retryNonce, setRetryNonce] = useState(0);

  // Refs to keep scanner lifecycle completely decoupled from parent re-renders
  const onScanRef = useRef(onScan);
  const isProcessingRef = useRef(isProcessing);
  const scannerRef = useRef(null);
  const lifecyclePromiseRef = useRef(Promise.resolve());
  const sessionIdRef = useRef(0);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Stable decode handler (zero dependencies -> never triggers camera restart)
  const handleDetectedCode = useCallback((decodedText) => {
    if (!decodedText || isProcessingRef.current) return;
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
        window.navigator.vibrate(100);
      } catch {
        // ignore vibration failure
      }
    }

    if (onScanRef.current) {
      onScanRef.current(cleanCode);
    }
  }, []);

  // Safely stop and clean up any active Html5Qrcode instance
  const stopActiveScanner = useCallback(async () => {
    const existing = scannerRef.current;
    scannerRef.current = null;
    if (!existing) return;

    try {
      const state = typeof existing.getState === 'function' ? existing.getState() : null;
      // Html5QrcodeScannerState: 2 = SCANNING, 3 = PAUSED
      if (existing.isScanning || state === 2 || state === 3) {
        await existing.stop();
      }
    } catch (err) {
      console.warn('Safe stop scanner warning:', err);
    }

    try {
      existing.clear();
    } catch {
      // ignore clear errors if DOM already cleaned
    }
  }, []);

  // Single serialized lifecycle effect — ONLY runs on mount, facingMode change, or manual retry
  useEffect(() => {
    const currentSessionId = ++sessionIdRef.current;
    let isCancelled = false;

    const runStart = async () => {
      if (isCancelled || currentSessionId !== sessionIdRef.current) return;

      setIsStarting(true);
      setCameraError(null);
      setTorchAvailable(false);
      setIsTorchOn(false);

      // Always ensure previous camera instance is fully stopped first
      await stopActiveScanner();

      // Wait a tiny tick for container layout/hardware release
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (isCancelled || currentSessionId !== sessionIdRef.current) return;

      const element = document.getElementById(READER_ELEMENT_ID);
      if (!element) {
        setCameraError('لم يتم العثور على نافذة الكاميرا');
        setIsStarting(false);
        return;
      }

      // Clear any leftover nodes inside viewfinder container
      element.innerHTML = '';

      const scanner = new Html5Qrcode(READER_ELEMENT_ID, {
        verbose: false,
        useBarCodeDetectorIfSupported: true,
      });
      scannerRef.current = scanner;

      const scanConfig = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxEdge = Math.max(160, Math.floor(minEdge * 0.72));
          return { width: boxEdge, height: boxEdge };
        },
        disableFlip: false,
      };

      try {
        try {
          await scanner.start(
            { facingMode },
            scanConfig,
            handleDetectedCode,
            () => {
              // ignore per-frame decode errors
            }
          );
        } catch (primaryErr) {
          // Fallback: if facingMode fails on desktop/single-cam devices, try first available camera ID
          const msg = String(primaryErr?.message || primaryErr || '').toLowerCase();
          const isPermissionDenied =
            msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied');

          if (isPermissionDenied || isCancelled || currentSessionId !== sessionIdRef.current) {
            throw primaryErr;
          }

          const cameras = await Html5Qrcode.getCameras().catch(() => []);
          if (!cameras || cameras.length === 0) {
            throw primaryErr;
          }
          await scanner.start(
            cameras[0].id,
            scanConfig,
            handleDetectedCode,
            () => {}
          );
        }

        // If unmounted or superseded while awaiting camera.start(), immediately release hardware
        if (isCancelled || currentSessionId !== sessionIdRef.current) {
          await stopActiveScanner();
          return;
        }

        setIsStarting(false);

        // Watch for OS/browser forcibly ending the video track (e.g. phone call / background tab)
        try {
          const videoEl = element.querySelector('video');
          const track = videoEl?.srcObject?.getVideoTracks?.()?.[0];
          if (track) {
            track.addEventListener(
              'ended',
              () => {
                if (!isCancelled && currentSessionId === sessionIdRef.current) {
                  setCameraError('توقفت الكاميرا مؤقتاً (ربما بسبب الخروج من المتصفح). اضغط لإعادة التشغيل.');
                }
              },
              { once: true }
            );
          }
        } catch {
          // non-critical
        }

        // Check torch/flashlight capability
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

        // Non-blocking camera count check after permission is already granted
        Html5Qrcode.getCameras()
          .then((cameras) => {
            if (!isCancelled && currentSessionId === sessionIdRef.current) {
              setAvailableCamerasCount(cameras?.length || 0);
            }
          })
          .catch(() => {});
      } catch (err) {
        console.error('Camera start failed:', err);
        await stopActiveScanner();
        if (isCancelled || currentSessionId !== sessionIdRef.current) return;

        setIsStarting(false);
        const errMsg = String(err?.message || err || '').toLowerCase();
        if (errMsg.includes('permission') || errMsg.includes('notallowed') || errMsg.includes('denied')) {
          setCameraError('لم يتم منح إذن الوصول للكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات المتصفح.');
        } else if (errMsg.includes('notfound') || errMsg.includes('devicesnotfound')) {
          setCameraError('لم يتم العثور على كاميرا في هذا الجهاز.');
        } else if (errMsg.includes('readable') || errMsg.includes('busy') || errMsg.includes('track')) {
          setCameraError('الكاميرا قيد الاستخدام بواسطة تطبيق آخر، أو تعذر فتحها.');
        } else if (typeof window !== 'undefined' && !window.isSecureContext) {
          setCameraError('المتصفح يمنع فتح الكاميرا على اتصال HTTP غير مشفر. يرجى الفتح عبر HTTPS أو تفعيل السماح للموقع.');
        } else {
          setCameraError('تعذر تشغيل الكاميرا. يرجى التأكد من السماح بإذن الكاميرا والمحاولة مرة أخرى.');
        }
      }
    };

    // Serialize start after any previous stop/start operation completes
    lifecyclePromiseRef.current = lifecyclePromiseRef.current
      .catch(() => {})
      .then(runStart);

    return () => {
      isCancelled = true;
      sessionIdRef.current += 1;
      lifecyclePromiseRef.current = lifecyclePromiseRef.current
        .catch(() => {})
        .then(stopActiveScanner);
    };
  }, [facingMode, retryNonce, handleDetectedCode, stopActiveScanner]);

  // Switch camera front/back (ONLY updates facingMode — useEffect handles restart cleanly)
  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Manual retry/restart
  const handleRetryCamera = () => {
    setRetryNonce((n) => n + 1);
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

        {/* Action Buttons: Torch / Flip / Restart / Close */}
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
              disabled={isStarting}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              title="تبديل الكاميرا (الأمامية / الخلفية)"
            >
              <SwitchCamera size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={handleRetryCamera}
            disabled={isStarting}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-40"
            title="إعادة تنشيط الكاميرا"
          >
            <RefreshCw size={16} className={isStarting ? 'animate-spin' : ''} />
          </button>

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
          id={READER_ELEMENT_ID}
          className="w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_#qr-shaded-region]:!border-black/35"
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
              onClick={handleRetryCamera}
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
});

export default MobileCameraScanner;
