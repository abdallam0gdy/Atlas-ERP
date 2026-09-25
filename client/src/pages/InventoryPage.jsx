import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Package, Plus, Search, Filter, AlertTriangle,
  Edit2, Trash2, Loader2, ShoppingCart, Coins,
  Barcode, CheckCircle2, TrendingUp
} from 'lucide-react';
import ItemModal from '../components/ItemModal';

const CATEGORY_MAP = {
  booklet: { label: 'ملزمة', color: '#0C3C82', bg: '#EFF6FF' },
  book: { label: 'كتاب', color: '#0284C7', bg: '#F0F9FF' },
  card: { label: 'كارت ذكي', color: '#7C3AED', bg: '#F5F3FF' },
  supply: { label: 'أدوات مكتبية', color: '#059669', bg: '#ECFDF5' },
  other: { label: 'أخرى', color: '#64748B', bg: '#F8FAFC' },
};

export default function InventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/pos/inventory');
      setItems(data.data || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      toast.error('فشل تحميل بيانات المخزن');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف الصنف "${name}"؟`)) return;
    try {
      await api.delete(`/pos/inventory/${id}`);
      toast.success('تم حذف الصنف بنجاح');
      fetchItems();
    } catch (err) {
      toast.error('فشل حذف الصنف');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStock = !onlyLowStock || item.current_stock <= item.min_stock_alert;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Calculate totals
  const totalCostValue = items.reduce((acc, i) => acc + parseFloat(i.cost_price || 0) * (i.current_stock || 0), 0);
  const totalRetailValue = items.reduce((acc, i) => acc + parseFloat(i.selling_price || 0) * (i.current_stock || 0), 0);
  const lowStockCount = items.filter((i) => i.current_stock <= i.min_stock_alert).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Package size={26} style={{ color: '#0C3C82' }} />
            المخزن العام والمستلزمات (Inventory)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة ومتابعة الملازم، الكتب، الكروت، والأدوات مع تحديد الأسعار والكميات المتاحة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* تم إخفاء زر الكاشير مؤقتاً */}
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="atlas-btn-primary text-xs px-4 py-2.5"
          >
            <Plus size={15} className="ml-1 inline" />
            إضافة صنف جديد
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الأصناف</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{items.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0C3C82] flex items-center justify-center">
            <Package size={20} />
          </div>
        </div>

        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">أصناف قاربت على النفاد</p>
            <p className="text-2xl font-black text-red-600 mt-1">{lowStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">تكلفة المخزون الكلية</p>
            <p className="text-2xl font-black text-slate-700 mt-1">{totalCostValue.toFixed(1)} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Coins size={20} />
          </div>
        </div>

        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">القيمة البيعية المتوقعة</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{totalRetailValue.toFixed(1)} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="atlas-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم الصنف أو الباركود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="atlas-input text-xs w-full pr-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="atlas-input text-xs"
          >
            <option value="all">كافة التصنيفات</option>
            <option value="booklet">ملازم</option>
            <option value="book">كتب</option>
            <option value="card">كروت ذكية</option>
            <option value="supply">أدوات مكتبية</option>
            <option value="other">أخرى</option>
          </select>

          {/* Low stock toggle */}
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
              onlyLowStock
                ? 'border-red-500 bg-red-50 text-red-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle size={13} className="ml-1 inline" />
            الناقص في المخزن فقط ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="atlas-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin text-[#0C3C82] mb-3" />
            <p className="text-xs">جاري تحميل أصناف المخزن...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold text-slate-600">لا توجد أصناف تطابق البحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="atlas-table w-full">
              <thead>
                <tr>
                  <th>اسم الصنف</th>
                  <th>التصنيف</th>
                  <th>الباركود / الكود</th>
                  <th>سعر الشراء</th>
                  <th>سعر البيع</th>
                  <th>الرصيد بالمخزن</th>
                  <th>الحالة</th>
                  <th className="text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
                  const isLow = item.current_stock <= item.min_stock_alert;

                  return (
                    <tr key={item.id}>
                      <td className="font-bold text-slate-800">
                        {item.name}
                        {item.subject_name && (
                          <span className="text-[11px] font-normal text-slate-400 block">
                            مادة: {item.subject_name}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className="atlas-badge text-[11px]"
                          style={{ backgroundColor: cat.bg, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        {item.barcode || '—'}
                      </td>
                      <td className="font-medium text-slate-600">
                        {parseFloat(item.cost_price).toFixed(2)} ج.م
                      </td>
                      <td className="font-bold text-[#0C3C82]">
                        {parseFloat(item.selling_price).toFixed(2)} ج.م
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                          <span className={isLow ? 'text-red-600' : 'text-slate-800'}>
                            {item.current_stock}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            (حد التنبيه: {item.min_stock_alert})
                          </span>
                        </div>
                      </td>
                      <td>
                        {isLow ? (
                          <span className="atlas-badge text-[11px] bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                            <AlertTriangle size={11} />
                            رصيد منخفض
                          </span>
                        ) : (
                          <span className="atlas-badge text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 size={11} />
                            متوفر
                          </span>
                        )}
                      </td>
                      <td className="text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C3C82] hover:bg-blue-50 transition-colors"
                            title="تعديل الصنف"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="حذف الصنف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ItemModal
        isOpen={isModalOpen}
        initialData={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={fetchItems}
      />
    </div>
  );
}
