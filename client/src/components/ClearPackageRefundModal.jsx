import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Package, X, AlertTriangle, LogOut, CheckCircle2,
  DollarSign, Calculator, Layers, HelpCircle
} from 'lucide-react';
import { formatEGP, formatCount } from '../lib/formatters';

export default function ClearPackageRefundModal({
  isOpen,
  onClose,
  student,
  packageEnrollment,
  onSuccess
}) {
  if (!isOpen || !packageEnrollment) return null;

  const totalSessions = parseInt(packageEnrollment.total_sessions || 0, 10);
  const usedSessions = parseInt(packageEnrollment.used_sessions || 0, 10);
  const remainingSessions = Math.max(0, parseInt(packageEnrollment.remaining_sessions || 0, 10));
  const effectiveSessionPrice = parseFloat(packageEnrollment.effective_session_price || 0);
  const remainingValue = Math.round(remainingSessions * effectiveSessionPrice);
  const totalDebt = parseFloat(packageEnrollment.total_amount_due || 0);
  const maxRefund = Math.max(0, remainingValue - totalDebt);

  const [refundAmount, setRefundAmount] = useState(maxRefund);
  const [dropGroups, setDropGroups] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRefundAmount(maxRefund);
  }, [packageEnrollment, maxRefund]);

  const handleRefundAmountChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setRefundAmount('');
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (val > maxRefund) {
        setRefundAmount(maxRefund);
        toast.error(`⚠️ لا يمكن صرف مبلغ يتجاوز صافي المستحق (${formatEGP(maxRefund)})`);
        return;
      }
      if (val < 0) {
        setRefundAmount(0);
        return;
      }
    }
    setRefundAmount(valStr);
  };

  const handleRefundAmountBlur = () => {
    const val = parseFloat(refundAmount);
    if (isNaN(val) || val < 0) {
      setRefundAmount(0);
    } else if (val > maxRefund) {
      setRefundAmount(maxRefund);
      toast.error(`⚠️ تم ضبط المبلغ على صافي المستحق (${formatEGP(maxRefund)})`);
    }
  };

  const refundNum = parseFloat(refundAmount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (refundNum > maxRefund) {
      toast.error(`مبلغ الاسترداد لا يمكن أن يتجاوز صافي المستحق للطالب (${formatEGP(maxRefund)})`);
      return;
    }

    if (refundNum < 0) {
      toast.error('مبلغ الاسترداد لا يمكن أن يكون سالباً');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        package_enrollment_id: packageEnrollment.id,
        refund_amount: refundNum,
        drop_groups: dropGroups,
        notes: notes.trim() || undefined,
      };

      const { data } = await api.post('/subscriptions/clear-package', payload);
      toast.success(data.message || 'تمت تصفية اشتراك الباكدج بنجاح');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تصفية الباكدج');
    } finally {
      setLoading(false);
    }
  };

  const groupsList = packageEnrollment.groups || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
        {/* Header */}
        <div className="p-5 text-white flex items-center justify-between bg-gradient-to-r from-rose-700 via-rose-800 to-rose-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-base font-black">تصفية اشتراك الباكدج واسترداد الحصص</h3>
              <p className="text-xs text-rose-100 mt-0.5">
                {student?.full_name_ar || student?.full_name} (#{student?.student_code}) • {packageEnrollment.package_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Package Overview Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-500">اسم الباكدج والمرحلة:</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {packageEnrollment.package_name} ({packageEnrollment.grade_name})
                </p>
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-slate-400">سعر الباكدج المسدد:</span>
                <p className="text-sm font-black text-[#0C3C82]">
                  {formatEGP(packageEnrollment.total_price || 0)}
                </p>
              </div>
            </div>

            {/* Sessions Aggregation Math */}
            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 block">إجمالي حصص الباكدج</span>
                <span className="text-base font-black text-slate-900">{totalSessions} حصة</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 block">الحصص المستهلكة</span>
                <span className="text-base font-black text-blue-700">{usedSessions} حصة</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 block">المتبقي للاسترداد</span>
                <span className="text-base font-black text-emerald-800">{remainingSessions} حصة</span>
              </div>
            </div>

            {/* Fair Package Session Rate Note */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1 text-xs">
              <div className="flex items-center justify-between text-blue-950 font-bold">
                <span>سعر الحصة الفعلي المحسوب في الباكدج:</span>
                <span className="font-mono text-sm font-black text-[#0C3C82]">
                  {effectiveSessionPrice.toFixed(2)} ج.م / حصة
                </span>
              </div>
              <p className="text-[11px] text-blue-700">
                (سعر الباكدج {packageEnrollment.total_price} ج.م ÷ {totalSessions} حصة = {effectiveSessionPrice.toFixed(2)} ج.م، بدلاً من سعر الحصة للبرايفت العادي)
              </p>
            </div>

            {/* Values Calculation */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>إجمالي قيمة الحصص المتبقية ({remainingSessions} حصة × {effectiveSessionPrice.toFixed(2)} ج.م):</span>
                <span className="font-bold font-mono">{formatEGP(remainingValue)}</span>
              </div>

              {totalDebt > 0 && (
                <div className="flex items-center justify-between text-rose-700 font-bold">
                  <span>- مديونية متبقية على اشتراك الباكدج:</span>
                  <span className="font-mono">-{formatEGP(totalDebt)}</span>
                </div>
              )}

              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs font-black text-emerald-900 mt-2">
                <span>صافي المستحق للاسترداد نقدياً للطالب:</span>
                <span className="font-mono text-base">{formatEGP(maxRefund)}</span>
              </div>
            </div>

            {/* Included Groups Pill List */}
            {groupsList.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 mb-1.5 block">
                  المجموعات المشمولة في هذا الباكدج ({groupsList.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {groupsList.map((g) => (
                    <span
                      key={g.group_id}
                      className="px-2 py-1 rounded-lg bg-slate-200/80 text-slate-800 text-[10px] font-bold"
                    >
                      {g.subject_name}: {g.group_name_ar || g.group_name} ({g.remaining_sessions || 0} حصة متبقية)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Refund Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المبلغ المسترد نقداً للطالب من الخزينة (ج.م):
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={maxRefund}
                value={refundAmount}
                onChange={handleRefundAmountChange}
                onBlur={handleRefundAmountBlur}
                className={`atlas-input text-lg font-black text-center pr-4 pl-12 ${
                  refundNum > maxRefund
                    ? 'border-rose-500 bg-rose-50 text-rose-800'
                    : 'text-rose-700 bg-rose-50/40 border-rose-300'
                }`}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ج.م
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              محسوب تلقائياً حسب رصيد الحصص العادل للباكدج ({maxRefund} ج.م كحد أقصى)
            </p>
          </div>

          {/* Drop Groups Checkbox */}
          <div
            className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setDropGroups(!dropGroups)}
          >
            <input
              type="checkbox"
              id="dropGroupsPkg"
              checked={dropGroups}
              onChange={(e) => setDropGroups(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <label htmlFor="dropGroupsPkg" className="text-xs font-bold text-rose-900 cursor-pointer">
              إلغاء قيد الطالب وإسقاطه تلقائياً من جميع مجموعات الباكدج ({groupsList.length} مجموعات)
            </label>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              سبب تصفية الباكدج / ملاحظات الإدارة:
            </label>
            <input
              type="text"
              placeholder="مثال: رغبة ولي الأمر في إيقاف الباكدج لظروف خاصة"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="atlas-input text-xs"
            />
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle size={18} className="flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">تنبيه عند التأكيد:</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                سيتم إقفال اشتراك الباكدج، وتصفية رصيد الحصص، {dropGroups ? `وحذف قيد الطالب من ${groupsList.length} مجموعة.` : ''} {refundNum > 0 ? `كما سيتم تسجيل إذن صرف نقدية من درج الخزينة بمبلغ ${formatEGP(refundNum)} فوراً.` : ''}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="atlas-btn-ghost text-xs">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || refundNum > maxRefund || refundNum < 0}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                'جاري التصفية...'
              ) : (
                <>
                  <LogOut size={15} />
                  <span>تأكيد تصفية الباكدج {refundNum > 0 ? `وصرف ${formatEGP(refundNum)}` : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
