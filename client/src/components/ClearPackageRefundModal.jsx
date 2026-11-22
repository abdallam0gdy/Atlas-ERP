import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Package, X, AlertTriangle, LogOut, Calendar
} from 'lucide-react';
import { formatEGP } from '../lib/formatters';

export default function ClearPackageRefundModal({
  isOpen,
  onClose,
  student,
  packageEnrollment,
  onSuccess
}) {
  if (!isOpen || !packageEnrollment) return null;

  const durationDays = Math.max(1, parseInt(packageEnrollment.duration_days || 30, 10));
  const initialUsedDays = Math.min(durationDays, Math.max(0, parseInt(packageEnrollment.used_days || 0, 10)));
  const netPrice = parseFloat(packageEnrollment.total_price || 0);
  const totalDebt = Math.max(0, parseFloat(packageEnrollment.total_amount_due || 0));
  const actualCashPaid = Math.max(
    0,
    parseFloat(
      packageEnrollment.total_amount_paid !== undefined
        ? packageEnrollment.total_amount_paid
        : Math.max(0, netPrice - totalDebt)
    )
  );

  const [usedDaysInput, setUsedDaysInput] = useState(initialUsedDays);
  const dailyRate = durationDays > 0 ? netPrice / durationDays : 0;
  const remainingDays = Math.max(0, durationDays - usedDaysInput);
  const consumedValue = Math.round(usedDaysInput * dailyRate);
  // Calculated refund based on used days, strictly capped at actualCashPaid
  const calculatedRefund = Math.max(
    0,
    Math.min(actualCashPaid, Math.round(actualCashPaid - consumedValue))
  );
  // Hard ceiling is what the student actually paid in cash
  const maxRefund = Math.round(actualCashPaid);

  const [refundAmount, setRefundAmount] = useState(calculatedRefund);
  const [dropGroups, setDropGroups] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsedDaysInput(initialUsedDays);
  }, [packageEnrollment, initialUsedDays]);

  useEffect(() => {
    setRefundAmount(calculatedRefund);
  }, [calculatedRefund]);

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
        toast.error(`⚠️ لا يمكن صرف مبلغ يتجاوز ما دفعه الطالب فعلياً (${formatEGP(maxRefund)})`);
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
      toast.error(`⚠️ تم ضبط المبلغ على الحد الأقصى المدفوع (${formatEGP(maxRefund)})`);
    }
  };

  const refundNum = parseFloat(refundAmount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (refundNum > maxRefund) {
      toast.error(`مبلغ الاسترداد لا يمكن أن يتجاوز إجمالي ما دفعه الطالب (${formatEGP(maxRefund)})`);
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
              <h3 className="text-base font-black">تصفية اشتراك الباكدج واسترداد الرصيد</h3>
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
                <span className="text-xs font-bold text-slate-500">اسم الباكدج وفترة الاشتراك:</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {packageEnrollment.package_name} ({packageEnrollment.grade_name})
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 font-mono">
                  <Calendar size={12} className="text-[#0C3C82]" />
                  <span>من {packageEnrollment.start_date} إلى {packageEnrollment.end_date}</span>
                </p>
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-slate-400 block">المسدد فعلياً بالخزينة:</span>
                <p className="text-sm font-black text-emerald-700">
                  {formatEGP(actualCashPaid)}
                </p>
                {totalDebt > 0 && (
                  <span className="text-[10px] font-bold text-rose-600">
                    مديونية: {formatEGP(totalDebt)}
                  </span>
                )}
              </div>
            </div>

            {/* Days Aggregation Math */}
            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 block">إجمالي مدة الباكدج</span>
                <span className="text-base font-black text-slate-900">{durationDays} يوم</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 block">الأيام المستهلكة</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max={durationDays}
                    value={usedDaysInput}
                    onChange={(e) => setUsedDaysInput(Math.min(durationDays, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                    className="w-14 text-center font-black text-blue-700 border border-blue-200 rounded-lg py-0.5 text-sm bg-blue-50/40"
                    title="يمكنك تعديل عدد الأيام المحسوبة على الطالب"
                  />
                  <span className="text-xs font-bold text-blue-700">يوم</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 block">الأيام المتبقية</span>
                <span className="text-base font-black text-emerald-800">{remainingDays} يوم</span>
              </div>
            </div>

            {/* Fair Package Daily Rate Note */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1 text-xs">
              <div className="flex items-center justify-between text-blue-950 font-bold">
                <span>قيمة اليوم الواحد في الباكدج:</span>
                <span className="font-mono text-sm font-black text-[#0C3C82]">
                  {dailyRate.toFixed(2)} ج.م / يوم
                </span>
              </div>
              <p className="text-[11px] text-blue-700">
                (صافي اشتراك الباكدج {netPrice} ج.م ÷ {durationDays} يوم = {dailyRate.toFixed(2)} ج.م لليوم)
              </p>
            </div>

            {/* Values Calculation */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>إجمالي المسدد فعلياً من الطالب:</span>
                <span className="font-bold font-mono">{formatEGP(actualCashPaid)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>قيمة الأيام المستهلكة ({usedDaysInput} يوم × {dailyRate.toFixed(2)} ج.م):</span>
                <span className="font-bold font-mono text-rose-600">-{formatEGP(consumedValue)}</span>
              </div>

              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs font-black text-emerald-900 mt-2">
                <span>صافي المستحق للاسترداد نقدياً للطالب:</span>
                <span className="font-mono text-base">{formatEGP(calculatedRefund)}</span>
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
                      {g.subject_name}: {g.group_name_ar || g.group_name}
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
              المستحق التلقائي حسب الأيام المتبقية: {calculatedRefund} ج.م (والحد الأقصى هو إجمالي المدفوع: {maxRefund} ج.م)
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
                سيتم إقفال اشتراك الباكدج، وتصفية الفترة المتبقية، {dropGroups ? `وحذف قيد الطالب من ${groupsList.length} مجموعة.` : ''} {refundNum > 0 ? `كما سيتم تسجيل إذن صرف نقدية من درج الخزينة بمبلغ ${formatEGP(refundNum)} فوراً.` : ''}
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
