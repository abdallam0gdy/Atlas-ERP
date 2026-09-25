import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { 
  X, BookOpen, Search, User, Check, Loader2, 
  DollarSign, AlertCircle, Phone, Calendar 
} from 'lucide-react';

export default function BookletReservationModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [booklets, setBooklets] = useState([]);
  
  // Student Search
  const [studentSearch, setStudentSearch] = useState('');
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form State
  const [selectedBookletId, setSelectedBookletId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paidAmount, setPaidAmount] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBooklets();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStudentSearch('');
    setStudentResults([]);
    setSelectedStudent(null);
    setSelectedBookletId('');
    setQuantity(1);
    setPaidAmount(0);
    setSelectedGroupId('');
    setNotes('');
  };

  const fetchBooklets = async () => {
    try {
      const res = await api.get('/booklets');
      setBooklets(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching booklets:', err);
    }
  };

  // Student Search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studentSearch.trim().length >= 2) {
        searchStudents(studentSearch.trim());
      } else {
        setStudentResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const searchStudents = async (query) => {
    setSearchingStudents(true);
    try {
      const res = await api.get('/students', { params: { search: query, limit: 8 } });
      setStudentResults(res.data?.data?.students || []);
    } catch (err) {
      console.error('Error searching students:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  const selectedBooklet = booklets.find(b => b.id === selectedBookletId);
  const unitPrice = parseFloat(selectedBooklet?.selling_price || 0);
  const totalPrice = unitPrice * (parseInt(quantity, 10) || 1);
  const remainingAmount = Math.max(0, totalPrice - (parseFloat(paidAmount) || 0));

  // Auto-clamp paidAmount if totalPrice decreases below it
  useEffect(() => {
    const paid = parseFloat(paidAmount);
    if (!isNaN(paid) && paid > totalPrice) {
      setPaidAmount(totalPrice);
    }
  }, [totalPrice]);

  const handlePaidAmountChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setPaidAmount('');
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      if (val > totalPrice) {
        setPaidAmount(totalPrice);
        toast.error(`⚠️ لا يمكن دفع عربون أكبر من إجمالي السعر (${totalPrice.toFixed(2)} ج.م)`);
        return;
      }
      if (val < 0) {
        setPaidAmount(0);
        return;
      }
    }
    setPaidAmount(valStr);
  };

  const handlePaidAmountBlur = () => {
    const val = parseFloat(paidAmount);
    if (isNaN(val) || val < 0) {
      setPaidAmount(0);
    } else if (val > totalPrice) {
      setPaidAmount(totalPrice);
      toast.error(`⚠️ تم ضبط المبلغ على إجمالي السعر (${totalPrice.toFixed(2)} ج.م)`);
    }
  };

  // Auto-set paid amount when booklet changes if desired
  const handleSelectBooklet = (bookletId) => {
    setSelectedBookletId(bookletId);
    const b = booklets.find(item => item.id === bookletId);
    if (b) {
      // Default deposit to full price or half
      setPaidAmount(b.selling_price || 0);
      // Auto select first group if available
      if (b.groups && b.groups.length > 0) {
        setSelectedGroupId(b.groups[0].group_id || b.groups[0].id || '');
      } else {
        setSelectedGroupId('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('يرجى اختيار الطالب من قاعدة البيانات أولاً');
      return;
    }
    if (!selectedBookletId) {
      toast.error('يرجى اختيار الملزمة أو الكتاب المطلوب حجزها');
      return;
    }
    const paidVal = parseFloat(paidAmount) || 0;
    if (paidVal < 0) {
      toast.error('المبلغ المدفوع لا يمكن أن يكون سالباً');
      return;
    }
    if (paidVal > totalPrice) {
      toast.error(`المبلغ المدفوع (${paidVal} ج.م) لا يمكن أن يتجاوز إجمالي السعر (${totalPrice.toFixed(2)} ج.م)`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        student_id: selectedStudent.id,
        item_id: selectedBookletId,
        group_id: selectedGroupId || null,
        quantity: parseInt(quantity, 10) || 1,
        paid_amount: parseFloat(paidAmount) || 0,
        notes: notes.trim() || null,
      };

      const res = await api.post('/booklets/reservations', payload);
      toast.success(res.data?.message || 'تم تسجيل حجز الملزمة بنجاح');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حجز الملزمة');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#0C3C82' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                حجز ملزمة / كتاب لطالب
              </h2>
              <p className="text-xs text-slate-500">مكتب الملازم والكتب المدرسية - تسجيل الحجز وتحصيل العربون</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Step 1: Student Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. اختيار الطالب من قاعدة البيانات <span className="text-red-500">*</span>
            </label>

            {!selectedStudent ? (
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="ابحث باسم الطالب، كود الطالب #1004، أو رقم الهاتف..."
                    className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    autoFocus
                  />
                  <Search size={16} className="absolute right-3 top-2.5 text-slate-400" />
                  {searchingStudents && (
                    <Loader2 size={16} className="absolute left-3 top-2.5 animate-spin text-blue-600" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {studentResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                    {studentResults.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudentSearch('');
                          setStudentResults([]);
                        }}
                        className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                            {s.full_name?.charAt(0) || 'ط'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{s.full_name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{s.phone || 'بدون هاتف'} - {s.grade_name || ''}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          #{s.student_code || s.barcode_id}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {selectedStudent.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{selectedStudent.full_name}</p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      كود: #{selectedStudent.student_code || selectedStudent.barcode_id} | موبايل: {selectedStudent.phone || '—'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                >
                  تغيير الطالب
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Booklet Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. الملزمة أو الكتاب المطلوب <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBookletId}
              onChange={(e) => handleSelectBooklet(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            >
              <option value="">-- اختر الملزمة / الكتاب --</option>
              {booklets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (المدرس: {b.teacher_name || 'عام'} - السعر: {b.selling_price} ج.م - المتبقي بالمخزن: {b.current_stock})
                </option>
              ))}
            </select>
          </div>

          {/* Target Group Selection if booklet has groups */}
          {selectedBooklet && selectedBooklet.groups && selectedBooklet.groups.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المجموعة المستهدفة للحجز (اختياري)
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- بدون تحديد مجموعة محددة --</option>
                {selectedBooklet.groups.map((g) => (
                  <option key={g.group_id || g.id} value={g.group_id || g.id}>
                    {g.group_name || g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Quantity & Price Calculation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الكمية المطلوبة
              </label>
              <input
                type="number"
                min="1"
                max={selectedBooklet?.current_stock || 100}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                سعر النسخة
              </label>
              <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold">
                {unitPrice.toFixed(2)} ج.م
              </div>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>إجمالي قيمة الملزمة:</span>
              <span className="font-bold text-slate-800">{totalPrice.toFixed(2)} ج.م</span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                المبلغ المدفوع كعربون الآن (ج.م)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  max={totalPrice}
                  value={paidAmount}
                  onChange={handlePaidAmountChange}
                  onBlur={handlePaidAmountBlur}
                  placeholder="0"
                  className={`w-full px-3 py-2 text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 ${
                    parseFloat(paidAmount) > totalPrice
                      ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-400'
                      : 'border-blue-300 bg-white focus:ring-blue-500'
                  }`}
                />
                <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">ج.م</span>
              </div>
              {parseFloat(paidAmount) > totalPrice && (
                <p className="text-[11px] text-red-600 font-bold mt-1">
                  ⚠️ لا يمكن دفع أكثر من إجمالي السعر ({totalPrice.toFixed(2)} ج.م)
                </p>
              )}
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 font-bold">
              <span className="text-slate-700">المبلغ المتبقي للتحصيل عند التسليم:</span>
              <span className={`px-2 py-0.5 rounded text-xs ${remainingAmount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                {remainingAmount.toFixed(2)} ج.م {remainingAmount === 0 && '(مسدد بالكامل)'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات الحجز (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: الاستلام في حصة يوم الأحد القادم"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !selectedStudent ||
                !selectedBookletId ||
                parseFloat(paidAmount) > totalPrice ||
                parseFloat(paidAmount) < 0
              }
              className="px-6 py-2 text-sm font-bold text-white rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              style={{ background: '#0C3C82' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جاري تسجيل الحجز...</span>
                </>
              ) : (
                <span>تأكيد حجز الملزمة</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
