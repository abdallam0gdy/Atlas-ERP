import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import QRCodeLib from 'qrcode';
import { supabase } from '../../lib/supabase';
import { printHtmlDocument } from '../../lib/printUtils';
import { formatTime12h } from '../../lib/formatters';
import TurnstileWidget from '../../components/portal/TurnstileWidget';
import {
  Search, Fingerprint, ShieldCheck, Loader2, AlertCircle,
  CheckCircle2, Clock, Copy, Check, Download, Printer,
  GraduationCap, School, BookOpen, Calendar, MapPin,
  User, QrCode, RefreshCw, Sparkles, ArrowLeft, XCircle,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

const DAY_LABELS = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

function normalizeArabicDigits(str) {
  if (!str) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/[٠-٩]/g, (w) => String(arabicNumerals.indexOf(w)));
}

function cleanNationalId(input) {
  return normalizeArabicDigits(input).replace(/\D/g, '').slice(0, 14);
}

function validateEgyptianNationalId(raw) {
  const clean = cleanNationalId(raw);
  if (clean.length === 0) return { valid: false, clean, message: '' };
  if (clean.length < 14) {
    return { valid: false, clean, message: `متبقي ${14 - clean.length} أرقام لإكمال الرقم القومي` };
  }
  const century = clean[0];
  if (century !== '2' && century !== '3') {
    return { valid: false, clean, message: 'الرقم القومي المصري يجب أن يبدأ برقم 2 أو 3' };
  }
  const month = parseInt(clean.slice(3, 5), 10);
  const day = parseInt(clean.slice(5, 7), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, clean, message: 'صيغة تاريخ الميلاد داخل الرقم القومي غير صحيحة' };
  }
  return { valid: true, clean, message: '' };
}

function isLocalOrPrivateHost() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname || '';
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('100.') ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.endsWith('.local')
  );
}

function getCardBarcodeValue(student) {
  if (!student) return '';
  if (student.barcode_id && String(student.barcode_id).trim()) {
    return String(student.barcode_id).trim();
  }
  if (student.student_code !== null && student.student_code !== undefined && String(student.student_code).trim()) {
    return String(student.student_code).trim();
  }
  return '';
}

function formatArabicBirthDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return null;
  }
}

function formatEducationBadge(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'عام';
  const upper = s.toUpperCase();
  if (upper === 'LANGUAGES' || s.includes('لغات')) return 'لغات';
  if (upper === 'AZHAR' || s.includes('أزهر')) return 'أزهر';
  if (upper === 'PUBLIC') return 'عام';
  return s;
}

function formatScheduleSlots(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) return [];
  return schedule.map((slot) => {
    const dayKey = String(slot.day || '').toLowerCase();
    const dayAr = DAY_LABELS[dayKey] || slot.day || '';
    const start = slot.start_time ? formatTime12h(slot.start_time) : '';
    const end = slot.end_time ? formatTime12h(slot.end_time) : '';
    return {
      dayAr,
      timeRange: start && end ? `${start} — ${end}` : start || 'حسب الجدول',
    };
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadImageSafe(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => resolve(null), 5000);
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export default function StudentCardLookupPage() {
  const [searchParams] = useSearchParams();
  const [nationalIdInput, setNationalIdInput] = useState(() =>
    cleanNationalId(searchParams.get('nid') || '')
  );
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileBypassedOnLan, setTurnstileBypassedOnLan] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lookupResult, setLookupResult] = useState(null); // { found, student, source, reason }
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const turnstileRef = useRef(null);
  const barcodeSvgRef = useRef(null);
  const qrWrapperRef = useRef(null);
  const resultSectionRef = useRef(null);
  const isLanHost = isLocalOrPrivateHost();

  const nidCheck = validateEgyptianNationalId(nationalIdInput);
  const student = lookupResult?.found ? lookupResult.student : null;
  const barcodeValue = getCardBarcodeValue(student);
  const hasCode = Boolean(
    student &&
      (student.student_code !== null && student.student_code !== undefined || student.barcode_id)
  );
  const isRejected = student?.status === 'rejected';
  const isInactive = student?.status === 'inactive';

  // Render live 1D Barcode whenever student card renders
  useEffect(() => {
    if (!barcodeValue || !barcodeSvgRef.current) return;
    try {
      JsBarcode(barcodeSvgRef.current, barcodeValue, {
        format: 'CODE128',
        width: 1.9,
        height: 46,
        displayValue: true,
        fontSize: 12,
        fontOptions: 'bold',
        font: 'monospace',
        margin: 4,
        background: '#ffffff',
        lineColor: '#0F172A',
      });
    } catch (err) {
      console.warn('JsBarcode render warning:', err);
    }
  }, [barcodeValue, student?.full_name]);

  // If on LAN/local IP and Turnstile fails to initialize after 4s, auto-allow smoothly
  useEffect(() => {
    if (!isLanHost) return;
    const timer = setTimeout(() => {
      if (!turnstileToken) {
        setTurnstileBypassedOnLan(true);
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [isLanHost, turnstileToken]);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken('');
    try {
      turnstileRef.current?.reset();
    } catch {
      // ignore
    }
  }, []);

  // Dual-source public lookup: Online Supabase RPC + fast optional local ERP enrichment
  const performLookup = async (cleanNid) => {
    // 1. Online Cloud Lookup (Supabase SECURITY DEFINER RPC — works anywhere on the internet without login!)
    const cloudPromise = (async () => {
      try {
        const { data, error } = await supabase.rpc('lookup_student_by_national_id', {
          p_national_id: cleanNid,
        });
        if (error) {
          console.warn('Supabase lookup RPC error:', error.message);
          return { ok: false, error: error.message };
        }
        return { ok: true, data };
      } catch (err) {
        return { ok: false, error: err?.message || 'cloud_error' };
      }
    })();

    // 2. Fast optional Local ERP Lookup (only responds when connected to center server; silently skipped on cloud static hosts)
    const localPromise = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await fetch(`${apiBase}/public/student-lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ national_id: cleanNid }),
          signal: controller.signal,
        });
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          return { ok: false };
        }
        const json = await res.json();
        if (res.status === 429) {
          return { ok: false, rateLimited: true, message: json?.message };
        }
        if (res.ok && json?.success) {
          return { ok: true, data: json };
        }
        return { ok: false };
      } catch {
        return { ok: false };
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    const [cloudRes, localRes] = await Promise.all([cloudPromise, localPromise]);

    if (localRes.rateLimited) {
      throw new Error(localRes.message || 'تم تجاوز عدد محاولات الاستعلام المسموحة، حاول بعد قليل.');
    }

    const cloudFound = cloudRes.ok && cloudRes.data?.found && cloudRes.data?.student;
    const localFound = localRes.ok && localRes.data?.found && localRes.data?.student;

    if (localFound && cloudFound) {
      // Merge: local ERP has freshest code/barcode/groups; cloud may hold ImgBB photo_url
      const localS = localRes.data.student;
      const cloudS = cloudRes.data.student;
      return {
        found: true,
        source: 'hybrid',
        student: {
          ...cloudS,
          ...localS,
          photo_url: localS.photo_url || cloudS.photo_url || null,
          school_name: localS.school_name || cloudS.school_name || null,
          groups:
            Array.isArray(localS.groups) && localS.groups.length > 0
              ? localS.groups
              : cloudS.groups || [],
        },
      };
    }

    if (localFound) {
      return {
        found: true,
        source: 'local',
        student: localRes.data.student,
      };
    }

    if (cloudFound) {
      return {
        found: true,
        source: 'cloud',
        student: cloudRes.data.student,
      };
    }

    // If BOTH failed with a technical error (e.g. RPC not installed yet & no local server)
    if (!cloudRes.ok && !localRes.ok) {
      throw new Error(
        'تعذر الاتصال بخدمة الاستعلام حالياً. يرجى التأكد من اتصالك بالإنترنت أو المحاولة بعد قليل.'
      );
    }

    return {
      found: false,
      reason: 'not_found',
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nidCheck.valid) {
      setErrorMessage(nidCheck.message || 'يرجى إدخال الرقم القومي الصحيح المكون من 14 رقماً');
      return;
    }

    // Require Cloudflare Turnstile on public online domains
    if (!isLanHost && !turnstileToken) {
      setErrorMessage('يرجى إكمال التحقق الأمني من Cloudflare أولاً قبل الاستعلام');
      return;
    }

    setIsSearching(true);
    setLookupResult(null);
    setPhotoFailed(false);

    try {
      // Optional backend verification of Turnstile token if local Express backend is present
      if (turnstileToken) {
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
          const verifyRes = await fetch(`${apiBase}/verify-turnstile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: turnstileToken }),
          });
          const ct = verifyRes.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const verifyJson = await verifyRes.json();
            if (verifyRes.status === 403 && verifyJson?.success === false) {
              resetTurnstile();
              setErrorMessage(verifyJson.message || 'فشل التحقق الأمني، يرجى إعادة المحاولة');
              setIsSearching(false);
              return;
            }
          }
        } catch {
          // Running directly on public cloud static host without local Express server — safe to continue with Turnstile client token
        }
      }

      const result = await performLookup(nidCheck.clean);
      setLookupResult(result);

      setTimeout(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (err) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء الاستعلام، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSearching(false);
      // Reset Turnstile token so next query gets a fresh one
      if (!isLanHost) {
        resetTurnstile();
      }
    }
  };

  const handleCopyCode = async () => {
    const codeText = student?.student_code ? String(student.student_code) : barcodeValue;
    if (!codeText) return;
    try {
      await navigator.clipboard.writeText(codeText);
      setCopiedCode(true);
      toast.success(`تم نسخ كود الطالب: ${codeText}`);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('تعذر النسخ التلقائي');
    }
  };

  // Generate and download a crisp high-resolution PNG Smart ID Card for phone gallery
  const handleDownloadCardPng = async () => {
    if (!student) return;
    setIsDownloadingPng(true);
    try {
      const width = 900;
      const height = 1320;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // White card background
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, 0, 0, width, height, 40);
      ctx.fill();

      // Header gradient
      const grad = ctx.createLinearGradient(0, 0, width, 320);
      grad.addColorStop(0, '#001E4A');
      grad.addColorStop(0.55, '#0C3C82');
      grad.addColorStop(1, '#0E5CAD');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 310);

      // Crimson bottom accent strip under header
      ctx.fillStyle = '#D8232A';
      ctx.fillRect(0, 310, width, 10);

      // Academy Logo
      const logoImg = await loadImageSafe('/atlas-logo.png');
      if (logoImg) {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        drawRoundedRect(ctx, width - 160, 42, 110, 110, 24);
        ctx.fill();
        ctx.drawImage(logoImg, width - 148, 54, 86, 86);
        ctx.restore();
      }

      // Header Text (RTL)
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px "IBM Plex Sans Arabic", "Cairo", sans-serif';
      ctx.fillText('أكاديمية أطلس التعليمية', width - 185, 92);

      ctx.fillStyle = '#BAE6FD';
      ctx.font = '600 24px "IBM Plex Sans Arabic", "Cairo", sans-serif';
      ctx.fillText('كارنيه الطالب الذكي — العام الدراسي 2026 / 2027', width - 185, 136);

      // Badge on top-left
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      drawRoundedRect(ctx, 48, 55, 220, 48, 24);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 21px "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText('ATLAS SMART ID', 158, 86);

      // Student Photo Circle overlapping header
      const photoCenterX = width / 2;
      const photoCenterY = 310;
      const photoRadius = 118;

      // Outer white ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoCenterX, photoCenterY, photoRadius + 10, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(12,60,130,0.22)';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();

      const photoImg = await loadImageSafe(student.photo_url);
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
      ctx.clip();
      if (photoImg) {
        // Cover-crop photo cleanly
        const scale = Math.max(
          (photoRadius * 2) / photoImg.width,
          (photoRadius * 2) / photoImg.height
        );
        const drawW = photoImg.width * scale;
        const drawH = photoImg.height * scale;
        ctx.drawImage(
          photoImg,
          photoCenterX - drawW / 2,
          photoCenterY - drawH / 2,
          drawW,
          drawH
        );
      } else {
        ctx.fillStyle = '#E7EEFF';
        ctx.fillRect(
          photoCenterX - photoRadius,
          photoCenterY - photoRadius,
          photoRadius * 2,
          photoRadius * 2
        );
        ctx.fillStyle = '#0C3C82';
        ctx.font = 'bold 92px "IBM Plex Sans Arabic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(student.full_name?.[0] || 'ط', photoCenterX, photoCenterY + 32);
      }
      ctx.restore();

      // Photo border ring
      ctx.beginPath();
      ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0C3C82';
      ctx.stroke();

      // Student Name
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 42px "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText(student.full_name || 'طالب أكاديمية أطلس', width / 2, 495, width - 80);

      // Grade & Education pills line
      const gradeLine = `${student.academic_grade || ''}  •  تعليم ${formatEducationBadge(student.education_type)}`;
      ctx.fillStyle = '#0C3C82';
      ctx.font = 'bold 28px "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText(gradeLine, width / 2, 548, width - 80);

      if (student.school_name) {
        ctx.fillStyle = '#64748B';
        ctx.font = '600 22px "IBM Plex Sans Arabic", sans-serif';
        ctx.fillText(`المدرسة: ${student.school_name}`, width / 2, 588, width - 100);
      }

      // Big Code Box
      ctx.fillStyle = '#F0F6FF';
      drawRoundedRect(ctx, 130, 622, width - 260, 128, 24);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#BFDBFE';
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 22px "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText('كود الطالب في السنتر', width / 2, 662);

      ctx.fillStyle = '#0C3C82';
      ctx.font = 'bold 58px monospace';
      ctx.fillText(
        student.student_code ? `#${student.student_code}` : barcodeValue || 'قيد التكويد',
        width / 2,
        728
      );

      // QR Code + Barcode Box
      if (barcodeValue) {
        const qrDataUrl = await QRCodeLib.toDataURL(barcodeValue, {
          width: 320,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: { dark: '#00275C', light: '#FFFFFF' },
        });
        const qrImg = await loadImageSafe(qrDataUrl);

        // White QR card frame
        ctx.fillStyle = '#FFFFFF';
        drawRoundedRect(ctx, width / 2 - 150, 778, 300, 300, 24);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#CBD5E1';
        ctx.stroke();

        if (qrImg) {
          ctx.drawImage(qrImg, width / 2 - 135, 793, 270, 270);
        }

        // 1D Barcode rendered on temp canvas
        const bcCanvas = document.createElement('canvas');
        JsBarcode(bcCanvas, barcodeValue, {
          format: 'CODE128',
          width: 2.6,
          height: 75,
          displayValue: true,
          fontSize: 22,
          fontOptions: 'bold',
          font: 'monospace',
          margin: 8,
          background: '#FFFFFF',
          lineColor: '#0F172A',
        });

        const bcDrawW = Math.min(width - 140, bcCanvas.width);
        const bcDrawH = (bcCanvas.height / bcCanvas.width) * bcDrawW;
        ctx.drawImage(bcCanvas, (width - bcDrawW) / 2, 1102, bcDrawW, bcDrawH);
      }

      // Footer bar
      ctx.fillStyle = '#00275C';
      ctx.fillRect(0, height - 66, width, 66);
      ctx.fillStyle = '#E0F2FE';
      ctx.font = '600 22px "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText('يُبرز هذا الكارنيه عند بوابة الدخول الذكية لتسجيل الحضور الفوري', width / 2, height - 26);

      // Trigger download
      const link = document.createElement('a');
      link.download = `Atlas_Card_${student.student_code || nidCheck.clean.slice(-4)}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('تم حفظ الكارنيه كصورة على جهازك بنجاح 📥');
    } catch (err) {
      console.error('Download PNG error:', err);
      toast.error('تعذر تحميل الصورة، يمكنك استخدام زر الطباعة أو لقطة شاشة');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  // Print clean official Smart ID Card via isolated iframe
  const handlePrintCard = async () => {
    if (!student) return;
    try {
      let qrDataUrl = '';
      let barcodeDataUrl = '';
      if (barcodeValue) {
        qrDataUrl = await QRCodeLib.toDataURL(barcodeValue, {
          width: 240,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: { dark: '#00275C', light: '#FFFFFF' },
        });
        const bcCanvas = document.createElement('canvas');
        JsBarcode(bcCanvas, barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 55,
          displayValue: true,
          fontSize: 15,
          fontOptions: 'bold',
          font: 'monospace',
          margin: 4,
          background: '#FFFFFF',
          lineColor: '#0F172A',
        });
        barcodeDataUrl = bcCanvas.toDataURL('image/png');
      }

      const groupsHtml =
        Array.isArray(student.groups) && student.groups.length > 0
          ? `<div class="schedule">
               <div class="schedule-title">جدول المجموعات والحصص</div>
               ${student.groups
                 .map((g) => {
                   const slots = formatScheduleSlots(g.schedule)
                     .map((s) => `${s.dayAr} (${s.timeRange})`)
                     .join(' • ');
                   return `<div class="group-row">
                     <div><strong>${escapeHtml(g.subject_name || g.group_name)}</strong> — ${escapeHtml(g.teacher_name || '')}</div>
                     <div class="group-time">${escapeHtml(slots || 'حسب الجدول')}</div>
                   </div>`;
                 })
                 .join('')}
             </div>`
          : '';

      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>كارنيه الطالب — ${escapeHtml(student.full_name)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
    body { margin: 0; padding: 20px; background: #fff; color: #0f172a; display: flex; flex-direction: column; align-items: center; }
    .card { width: 105mm; border: 2px solid #0C3C82; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #001E4A, #0C3C82); color: #fff; padding: 14px 16px; text-align: center; border-bottom: 4px solid #D8232A; }
    .header h1 { margin: 0; font-size: 18px; }
    .header p { margin: 4px 0 0; font-size: 11px; color: #BAE6FD; }
    .body { padding: 16px; text-align: center; }
    .avatar { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid #0C3C82; margin: 0 auto 10px; display: block; background: #E7EEFF; }
    .avatar-fallback { width: 88px; height: 88px; border-radius: 50%; border: 3px solid #0C3C82; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; background: #E7EEFF; color: #0C3C82; font-size: 34px; font-weight: 900; }
    .name { font-size: 17px; font-weight: 900; margin: 0 0 4px; color: #0F172A; }
    .meta { font-size: 12px; font-weight: 700; color: #0C3C82; margin: 0 0 8px; }
    .school { font-size: 11px; color: #64748B; margin: 0 0 12px; }
    .code-box { background: #F0F6FF; border: 1.5px solid #BFDBFE; border-radius: 12px; padding: 8px 12px; margin-bottom: 12px; }
    .code-label { font-size: 10px; color: #475569; font-weight: 700; }
    .code-val { font-size: 26px; font-weight: 900; font-family: monospace; color: #0C3C82; letter-spacing: 1px; }
    .qr-wrap img { width: 135px; height: 135px; border: 1px solid #CBD5E1; border-radius: 10px; padding: 4px; }
    .bc-wrap { margin-top: 8px; }
    .bc-wrap img { max-width: 100%; height: auto; }
    .footer { background: #00275C; color: #E0F2FE; font-size: 10px; text-align: center; padding: 8px; font-weight: 600; }
    .schedule { width: 105mm; margin-top: 14px; border: 1px solid #CBD5E1; border-radius: 12px; padding: 12px; }
    .schedule-title { font-size: 13px; font-weight: 800; color: #0C3C82; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; }
    .group-row { font-size: 11px; padding: 5px 0; border-bottom: 1px dashed #E2E8F0; }
    .group-row:last-child { border-bottom: none; }
    .group-time { color: #475569; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>أكاديمية أطلس التعليمية</h1>
      <p>كارنيه الطالب الذكي — 2026 / 2027</p>
    </div>
    <div class="body">
      ${
        student.photo_url
          ? `<img class="avatar" src="${escapeHtml(student.photo_url)}" alt="${escapeHtml(student.full_name)}" />`
          : `<div class="avatar-fallback">${escapeHtml(student.full_name?.[0] || 'ط')}</div>`
      }
      <h2 class="name">${escapeHtml(student.full_name)}</h2>
      <p class="meta">${escapeHtml(student.academic_grade || '')} • تعليم ${escapeHtml(formatEducationBadge(student.education_type))}</p>
      ${student.school_name ? `<p class="school">المدرسة: ${escapeHtml(student.school_name)}</p>` : ''}
      <div class="code-box">
        <div class="code-label">كود الطالب المعتمد</div>
        <div class="code-val">${student.student_code ? `#${escapeHtml(student.student_code)}` : escapeHtml(barcodeValue || 'قيد التكويد')}</div>
      </div>
      ${qrDataUrl ? `<div class="qr-wrap"><img src="${qrDataUrl}" alt="QR Code" /></div>` : ''}
      ${barcodeDataUrl ? `<div class="bc-wrap"><img src="${barcodeDataUrl}" alt="Barcode" /></div>` : ''}
    </div>
    <div class="footer">يُبرز هذا الكارنيه عند بوابة الدخول الذكية لتسجيل الحضور الفوري</div>
  </div>
  ${groupsHtml}
</body>
</html>`;

      printHtmlDocument(html);
    } catch (err) {
      console.error('Print card error:', err);
      toast.error('تعذر تجهيز الكارنيه للطباعة');
    }
  };

  const handleResetSearch = () => {
    setLookupResult(null);
    setErrorMessage('');
    setNationalIdInput('');
    if (!isLanHost) resetTurnstile();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Main Search Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0C3C82] to-[#0EA5E9] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
              <CreditCard size={26} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#D8232A] bg-red-50 px-2.5 py-0.5 rounded-full mb-1">
                <Sparkles size={11} />
                استعلام فوري أونلاين بدون تسجيل دخول
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900">
                الاستعلام عن كود وكارنيه الطالب
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                اكتب الرقم القومي للطالب (14 رقماً) لعرض صورتك وكودك والـ QR الخاص بك فوراً
              </p>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#0C3C82] bg-[#F0F6FF] hover:bg-[#E0EDFF] border border-blue-200 px-3.5 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <GraduationCap size={15} />
            <span>طالب جديد؟ سجّل الآن</span>
          </Link>
        </div>

        {/* National ID Lookup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="student-lookup-nid"
                className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5"
              >
                <Fingerprint size={16} className="text-[#0C3C82]" />
                <span>الرقم القومي للطالب (14 رقماً)</span>
              </label>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  nidCheck.valid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : nationalIdInput.length > 0
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {nationalIdInput.length} / 14
              </span>
            </div>

            <div className="relative">
              <input
                id="student-lookup-nid"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                value={nationalIdInput}
                onChange={(e) => {
                  const cleaned = cleanNationalId(e.target.value);
                  setNationalIdInput(cleaned);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="مثال: 30905122101234"
                dir="ltr"
                className={`w-full py-4 px-5 text-xl sm:text-2xl text-center font-mono font-black tracking-[0.18em] rounded-2xl border-2 outline-none transition-all ${
                  nidCheck.valid
                    ? 'border-emerald-400 bg-emerald-50/30 text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                    : 'border-slate-200 bg-slate-50/60 text-slate-900 focus:border-[#0C3C82] focus:bg-white focus:ring-4 focus:ring-[#0C3C82]/10'
                }`}
              />
              {nidCheck.valid && (
                <CheckCircle2
                  size={22}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                />
              )}
            </div>

            {/* Progress Bar for 14 Digits */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  nidCheck.valid ? 'bg-emerald-500' : 'bg-[#0C3C82]'
                }`}
                style={{ width: `${Math.min(100, (nationalIdInput.length / 14) * 100)}%` }}
              />
            </div>

            {nationalIdInput.length > 0 && !nidCheck.valid && nidCheck.message && (
              <p className="text-xs font-semibold text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                <span>{nidCheck.message}</span>
              </p>
            )}
          </div>

          {/* Cloudflare Turnstile Security Verification */}
          {!turnstileBypassedOnLan && (
            <div className="space-y-1.5">
              <TurnstileWidget
                ref={turnstileRef}
                onVerify={(token) => {
                  setTurnstileToken(token);
                  if (errorMessage) setErrorMessage('');
                }}
                onExpire={() => setTurnstileToken('')}
                onError={() => {
                  if (isLanHost) {
                    setTurnstileBypassedOnLan(true);
                  } else {
                    setTurnstileToken('');
                  }
                }}
              />
              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>محمي بنظام التحقق الأمني لحماية خصوصية بيانات الطلاب</span>
              </p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSearching || !nidCheck.valid || (!isLanHost && !turnstileToken)}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-l from-[#00275C] via-[#0C3C82] to-[#0E5CAD] hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
          >
            {isSearching ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>جاري البحث وتجهيز الكارنيه الذكي...</span>
              </>
            ) : (
              <>
                <Search size={20} />
                <span>عرض الكود والكارنيه الذكي الآن</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* RESULT SECTION */}
      {lookupResult && (
        <div ref={resultSectionRef} className="space-y-5 animate-fade-in-up">
          {/* CASE 1: NOT FOUND */}
          {!lookupResult.found && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-amber-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Search size={30} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                لم يتم العثور على طالب مسجل بهذا الرقم القومي
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                تأكد من كتابة الـ 14 رقماً بشكل صحيح كما في شهادة الميلاد أو البطاقة. إذا لم تكن قد سجلت بعد في أكاديمية أطلس، يمكنك التسجيل الآن في دقيقة واحدة!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0C3C82] hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all"
                >
                  <GraduationCap size={18} />
                  <span>تسجيل طالب جديد الآن</span>
                  <ArrowLeft size={16} />
                </Link>
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                >
                  <RefreshCw size={15} />
                  <span>محاولة رقم آخر</span>
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: FOUND STUDENT */}
          {student && (
            <>
              {/* Status Alert if Pending / Rejected / Inactive */}
              {isRejected ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                  <XCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-black">حالة الطلب: لم يتم اعتماده بعد</p>
                    <p className="mt-0.5 text-rose-700">
                      يرجى مراجعة إدارة أكاديمية أطلس أو التواصل عبر الواتساب لتوضيح السبب واستكمال بياناتك.
                    </p>
                  </div>
                </div>
              ) : isInactive ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                  <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-black">حساب الطالب موقوف مؤقتاً</p>
                    <p className="mt-0.5 text-amber-800">
                      يرجى مراجعة شؤون الطلاب بالأكاديمية لإعادة تفعيل الكارنيه.
                    </p>
                  </div>
                </div>
              ) : !hasCode ? (
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex items-start gap-3 shadow-sm">
                  <Clock size={22} className="text-sky-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-black">تم استلام بياناتك بنجاح ✅ — طلبك قيد المراجعة والتكويد ⏳</p>
                    <p className="mt-0.5 text-sky-800">
                      فريق إدارة أطلس يراجع استمارتك حالياً. أعد الاستعلام من هذه الصفحة فور التفعيل ليظهر لك كودك الذكي ورمز الـ QR مباشرة!
                    </p>
                  </div>
                </div>
              ) : null}

              {/* DIGITAL SMART ID CARD */}
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden">
                {/* Card Official Top Banner */}
                <div
                  className="relative px-5 sm:px-8 pt-6 pb-16 text-white overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #001A42 0%, #0C3C82 55%, #0E5CAD 100%)',
                  }}
                >
                  {/* Decorative geometric circles */}
                  <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
                  <div className="absolute -bottom-16 left-20 w-56 h-56 rounded-full bg-[#0EA5E9]/15 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-lg shrink-0 flex items-center justify-center">
                        <img
                          src="/atlas-logo.png"
                          alt="Atlas"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-sky-200 font-bold">أكاديمية أطلس التعليمية</p>
                        <h3 className="text-base sm:text-lg font-black tracking-tight">
                          بطاقة الطالب الذكية (Smart ID)
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                        hasCode && !isRejected && !isInactive
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                          : isRejected
                          ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                          : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                      }`}
                    >
                      {hasCode && !isRejected && !isInactive ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>مفعّل ومكوّد بالنظام</span>
                        </>
                      ) : isRejected ? (
                        <>
                          <XCircle size={14} />
                          <span>غير معتمد</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span>قيد المراجعة والتكويد</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Crimson Accent Strip */}
                <div className="h-1.5 w-full bg-gradient-to-l from-[#D8232A] via-[#0EA5E9] to-[#0C3C82]" />

                {/* Card Body */}
                <div className="px-5 sm:px-8 pb-7">
                  {/* Avatar + Student Main Identity */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-12 mb-6 relative z-10 text-center sm:text-right">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-white p-1.5 shadow-xl border-2 border-[#0C3C82]/20 shrink-0">
                      {student.photo_url && !photoFailed ? (
                        <img
                          src={student.photo_url}
                          alt={student.full_name}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={() => setPhotoFailed(true)}
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#E7EEFF] to-[#DBEAFE] text-[#0C3C82] flex flex-col items-center justify-center font-black">
                          <span className="text-4xl">{student.full_name?.[0] || 'ط'}</span>
                          <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                            {student.gender === 'female' ? 'طالبة' : 'طالب'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 sm:pb-1">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                        {student.full_name}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F0F6FF] text-[#0C3C82] border border-blue-200 text-xs font-extrabold">
                          <GraduationCap size={14} />
                          <span>{student.academic_grade || 'غير محدد'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                          <span>تعليم {formatEducationBadge(student.education_type)}</span>
                        </span>
                        {hasCode && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                              student.enrollment_type === 'PRIVATE'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {student.enrollment_type === 'PRIVATE' ? '💎 نظام برايفت' : '📦 نظام باكدج'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Card Grid: Info + Code/QR */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                    {/* Right Column: Student Details */}
                    <div className="md:col-span-6 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200/80">
                          <User size={14} className="text-[#0C3C82]" />
                          <span>البيانات الدراسية المعتمدة</span>
                        </h4>

                        <div className="space-y-2.5 text-xs sm:text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">الرقم القومي:</span>
                            <span className="font-mono font-bold text-slate-800" dir="ltr">
                              {nidCheck.clean.slice(0, 6)}••••{nidCheck.clean.slice(-4)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">الصف الدراسي:</span>
                            <span className="font-bold text-slate-800">{student.academic_grade || '—'}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">نوع التعليم:</span>
                            <span className="font-bold text-slate-800">
                              {formatEducationBadge(student.education_type)}
                            </span>
                          </div>

                          {student.school_name && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 flex items-center gap-1">
                                <School size={13} />
                                <span>المدرسة:</span>
                              </span>
                              <span className="font-bold text-slate-800 text-left">
                                {student.school_name}
                              </span>
                            </div>
                          )}

                          {formatArabicBirthDate(student.birth_date) && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">تاريخ الميلاد:</span>
                              <span className="font-bold text-slate-800">
                                {formatArabicBirthDate(student.birth_date)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Prominent Code Box */}
                      <div className="p-4 rounded-2xl bg-gradient-to-l from-[#00275C] to-[#0C3C82] text-white shadow-md">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[11px] text-sky-200 font-semibold">كود الطالب في السنتر</p>
                            <p className="text-2xl sm:text-3xl font-black font-mono tracking-wider mt-0.5">
                              {student.student_code
                                ? `#${student.student_code}`
                                : hasCode
                                ? barcodeValue
                                : 'قيد التكويد'}
                            </p>
                          </div>

                          {hasCode && (
                            <button
                              type="button"
                              onClick={handleCopyCode}
                              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                            >
                              {copiedCode ? <Check size={15} className="text-emerald-300" /> : <Copy size={15} />}
                              <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                            </button>
                          )}
                        </div>
                        {student.barcode_id && (
                          <p className="text-[11px] font-mono text-sky-200/85 mt-1.5 pt-1.5 border-t border-white/15">
                            الباركود: {student.barcode_id}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Left Column: Live QR Code + 1D Barcode */}
                    <div className="md:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                      {hasCode && barcodeValue ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0C3C82]">
                            <QrCode size={15} />
                            <span>امسح هذا الكود مباشرة عند بوابة الدخول</span>
                          </div>

                          <div
                            ref={qrWrapperRef}
                            className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm inline-flex items-center justify-center"
                          >
                            <QRCodeCanvas
                              value={barcodeValue}
                              size={168}
                              level="H"
                              fgColor="#00275C"
                              bgColor="#FFFFFF"
                              includeMargin={false}
                            />
                          </div>

                          {/* 1D Barcode SVG */}
                          <div className="w-full overflow-x-auto flex justify-center pt-1">
                            <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
                          </div>
                        </>
                      ) : (
                        <div className="py-8 space-y-2.5">
                          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                            <Clock size={30} />
                          </div>
                          <p className="text-sm font-black text-slate-800">
                            الـ QR Code سيكون جاهزاً فور التكويد
                          </p>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                            بمجرد اعتماد استمارتك وتوليد كودك من الإدارة، سيظهر هنا رمز الدخول الذكي تلقائياً.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons (Download PNG / Print / New Search) */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {hasCode && (
                        <>
                          <button
                            type="button"
                            onClick={handleDownloadCardPng}
                            disabled={isDownloadingPng}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isDownloadingPng ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                            <span>تحميل الكارنيه كصورة للموبايل</span>
                          </button>

                          <button
                            type="button"
                            onClick={handlePrintCard}
                            className="px-5 py-2.5 rounded-xl bg-[#0C3C82] hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Printer size={16} />
                            <span>طباعة الكارنيه</span>
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleResetSearch}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={15} />
                      <span>استعلام لطالب آخر</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* STUDENT ENROLLED SCHEDULE / GROUPS */}
              {Array.isArray(student.groups) && student.groups.length > 0 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#E7EEFF] text-[#0C3C82] flex items-center justify-center">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">
                          جدول مجموعاتك ومواعيد الحصص
                        </h3>
                        <p className="text-xs text-slate-500">
                          المجموعات المسجل بها حالياً ({student.groups.length} مجموعة)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {student.groups.map((grp, idx) => {
                      const slots = formatScheduleSlots(grp.schedule);
                      return (
                        <div
                          key={grp.group_id || idx}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#0C3C82]/40 transition-colors space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: grp.subject_color || '#0C3C82' }}
                              />
                              <h4 className="font-black text-slate-900 text-sm truncate">
                                {grp.subject_name || grp.group_name}
                              </h4>
                            </div>
                            {grp.classroom_name && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-lg shrink-0">
                                <MapPin size={11} className="text-[#D8232A]" />
                                <span>{grp.classroom_name}</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-[#0C3C82]">
                            {grp.teacher_name || 'معلم المادة'}
                            {grp.group_name && grp.subject_name && (
                              <span className="text-slate-400 font-medium"> • {grp.group_name}</span>
                            )}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {slots.length > 0 ? (
                              slots.map((slot, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg"
                                >
                                  <Calendar size={11} className="text-sky-600" />
                                  <span>{slot.dayAr}:</span>
                                  <span className="font-mono text-[#0C3C82]">{slot.timeRange}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400">حسب الجدول المعلن</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
