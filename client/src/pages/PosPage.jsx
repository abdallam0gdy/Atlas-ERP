import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  Printer, CheckCircle2, Coins, Barcode,
  Package, ArrowRight, User, Sparkles, RefreshCw, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PosPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Cart
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed sale modal for thermal print
  const [completedSale, setCompletedSale] = useState(null);

  const barcodeInputRef = useRef(null);

  // Load inventory
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/pos/inventory');
      setItems(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل الأصناف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Ensure barcode scanner input keeps focus
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart]);

  // Handle barcode scanner input enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    const query = search.trim().toLowerCase();
    // Try exact barcode match first
    const matched = items.find(
      (i) => i.barcode?.toLowerCase() === query || i.name.toLowerCase() === query
    );

    if (matched) {
      addToCart(matched);
      setSearch('');
      toast.success(`تمت إضافة: ${matched.name}`, { duration: 1500 });
    } else {
      toast.error('لم يتم العثور على صنف بهذا الباركود');
    }
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQ = i.quantity + delta;
            return newQ > 0 ? { ...i, quantity: newQ } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount('');
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, i) => sum + parseFloat(i.selling_price) * i.quantity,
    0
  );
  const total = Math.max(0, subtotal - (parseFloat(discount) || 0));
  const paid = paidAmount === '' ? total : parseFloat(paidAmount) || 0;
  const change = Math.max(0, paid - total);

  // Quick cash buttons
  const setExactPaid = () => setPaidAmount(total.toString());
  const addQuickCash = (amount) => {
    const current = parseFloat(paidAmount) || 0;
    setPaidAmount((current + amount).toString());
  };

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    if (paid < total) {
      toast.error('المبلغ المدفوع أقل من الإجمالي المطلوب');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          cost_price: i.cost_price,
          selling_price: i.selling_price,
        })),
        discount: parseFloat(discount) || 0,
        paid_amount: paid,
        payment_method: 'cash',
      };

      const { data } = await api.post('/pos/sales', payload);
      setCompletedSale(data.data);
      toast.success('تمت عملية البيع بنجاح!');
      clearCart();
      fetchInventory(); // refresh stock
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'فشل إتمام عملية البيع');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/inventory')}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="الرجوع إلى المخزن"
          >
            <ArrowRight size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <ShoppingCart size={22} style={{ color: '#0C3C82' }} />
              شاشة كاشير المبيعات السريعة (POS)
            </h1>
            <p className="text-xs text-slate-500">
              بيع الملازم والكتب والكروت مع طباعة الإيصال الفوري وخصم المخزن
            </p>
          </div>
        </div>

        <button
          onClick={fetchInventory}
          className="atlas-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
        >
          <RefreshCw size={13} />
          تحديث المخزون
        </button>
      </div>

      {/* Main Cashier Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Items Catalog & Barcode Scanner (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Barcode / Search Box */}
          <form onSubmit={handleBarcodeSubmit} className="atlas-card p-3">
            <div className="relative">
              <Barcode
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0C3C82]"
              />
              <input
                ref={barcodeInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="امسح الباركود بالماسح أو اكتب اسم الصنف ثم اضغط Enter..."
                className="atlas-input text-xs w-full pr-10 font-bold"
              />
            </div>
          </form>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'booklet', label: 'ملازم' },
              { id: 'book', label: 'كتب' },
              { id: 'card', label: 'كروت' },
              { id: 'supply', label: 'أدوات' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#0C3C82] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isOut = item.current_stock <= 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isOut}
                  onClick={() => addToCart(item)}
                  className={`atlas-card p-3 text-right flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border ${
                    isOut
                      ? 'opacity-40 cursor-not-allowed bg-slate-50'
                      : 'hover:border-[#0C3C82]'
                  }`}
                >
                  <div>
                    <span className="atlas-badge text-[10px] bg-blue-50 text-[#0C3C82] mb-1">
                      {item.category === 'booklet'
                        ? 'ملزمة'
                        : item.category === 'book'
                        ? 'كتاب'
                        : item.category === 'card'
                        ? 'كارت'
                        : 'أدوات'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                      {item.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-[#0C3C82]">
                      {parseFloat(item.selling_price).toFixed(2)} ج.م
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isOut ? 'text-red-500' : 'text-slate-400'
                      }`}
                    >
                      {isOut ? 'نفد' : `${item.current_stock} متبقي`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Live Cart & Fast Checkout (5 cols) */}
        <div className="lg:col-span-5">
          <div className="atlas-card p-4 space-y-4 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#0C3C82]" />
                <h3 className="font-bold text-slate-800 text-sm">
                  سلة الفاتورة ({cart.length} أصناف)
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:underline"
                >
                  إفراغ السلة
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  السلة فارغة. انقر على صنف أو امسح الباركود للإضافة.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60"
                  >
                    <div className="flex-1 pr-1">
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {parseFloat(item.selling_price).toFixed(2)} ج.م ×{' '}
                        {item.quantity} ={' '}
                        <span className="font-bold text-[#0C3C82]">
                          {(parseFloat(item.selling_price) * item.quantity).toFixed(2)}{' '}
                          ج.م
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-xs w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors mr-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Discount */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>الإجمالي قبل الخصم:</span>
                <span className="font-bold">{subtotal.toFixed(2)} ج.م</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">خصم (ج.م):</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => {
                    const valStr = e.target.value;
                    if (valStr === '') {
                      setDiscount('');
                      return;
                    }
                    const val = parseFloat(valStr);
                    if (!isNaN(val)) {
                      if (val > subtotal) {
                        setDiscount(subtotal);
                        toast.error(`⚠️ لا يمكن تطبيق خصم أكبر من إجمالي الفاتورة (${subtotal.toFixed(2)} ج.م)`);
                        return;
                      }
                      if (val < 0) {
                        setDiscount(0);
                        return;
                      }
                    }
                    setDiscount(valStr);
                  }}
                  placeholder="0.00"
                  className="atlas-input text-xs w-24 py-1 text-center font-bold text-red-600"
                />
              </div>

              <div className="flex items-center justify-between text-base font-black text-[#0C3C82] pt-2 border-t border-slate-200">
                <span>المطلوب دفعه:</span>
                <span>{total.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Payment & Change Calculator */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  المبلغ المدفوع (ج.م):
                </label>
                <button
                  type="button"
                  onClick={setExactPaid}
                  className="text-[11px] font-bold text-[#0C3C82] hover:underline"
                >
                  المبلغ بالضبط
                </button>
              </div>

              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={total.toString()}
                className="atlas-input text-sm font-black text-center w-full py-2 bg-white"
              />

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1.5 justify-center">
                {[10, 20, 50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => addQuickCash(amt)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-bold text-slate-600">الباقي للعميل:</span>
                <span className="text-base font-black text-emerald-600">
                  {change.toFixed(2)} ج.م
                </span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
              className="atlas-btn-primary w-full py-3 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer size={18} />
              {isProcessing ? 'جاري التأكيد...' : 'إتمام البيع وطباعة الفاتورة'}
            </button>
          </div>
        </div>
      </div>

      {/* Completed Sale / Thermal Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="atlas-card w-full max-w-sm p-6 space-y-4 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                إيصال استلام - سنتر أطلس
              </h3>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Thermal Receipt (80mm style) */}
            <div
              id="thermal-receipt"
              className="font-mono text-xs text-slate-800 border-2 border-dashed border-slate-300 p-4 rounded-lg bg-white space-y-2"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h2 className="text-base font-black tracking-tight">
                  سنتر أطلس التعليمي
                </h2>
                <p className="text-[10px] text-slate-500">
                  Atlas Educational Center
                </p>
                <p className="text-[10px] mt-1">فاتورة مبيعات نقدية</p>
                <p className="text-[11px] font-bold text-[#0C3C82]">
                  رقم: {completedSale.invoice_number}
                </p>
                <p className="text-[9px] text-slate-400">
                  {new Date(completedSale.created_at).toLocaleString('ar-EG')}
                </p>
              </div>

              {/* Items Table */}
              <table className="w-full text-[11px] mt-2">
                <thead>
                  <tr className="border-b border-dashed border-slate-300">
                    <th className="text-right py-1">الصنف</th>
                    <th className="text-center py-1">الكمية</th>
                    <th className="text-left py-1">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedSale.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{it.name || it.item_name}</td>
                      <td className="text-center py-1">{it.quantity}</td>
                      <td className="text-left py-1 font-bold">
                        {(parseFloat(it.selling_price || it.unit_price) * it.quantity).toFixed(2)}{' '}
                        ج
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Breakdown */}
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>الإجمالي:</span>
                  <span>{parseFloat(completedSale.subtotal).toFixed(2)} ج.م</span>
                </div>
                {parseFloat(completedSale.discount) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم:</span>
                    <span>-{parseFloat(completedSale.discount).toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-[#0C3C82] pt-1 border-t border-slate-200">
                  <span>الصافي المطلوب:</span>
                  <span>{parseFloat(completedSale.total_amount).toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>المدفوع:</span>
                  <span>{parseFloat(completedSale.paid_amount).toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>الباقي:</span>
                  <span>{parseFloat(completedSale.change_amount).toFixed(2)} ج.م</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
                <p>شكراً لزيارتكم سنتر أطلس ✨</p>
                <p>نتمنى لأبنائنا الطلاب دوام التوفيق والنجاح</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="atlas-btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <Printer size={15} />
                طباعة الإيصال (Thermal Print)
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="atlas-btn-secondary px-3 py-2 text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
