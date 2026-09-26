import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Package, Search, Edit3, CheckCircle2,
  GraduationCap, Sparkles, Filter, RefreshCw,
  X, Check, AlertCircle, Loader2, Coins, Layers, Eye
} from 'lucide-react';
import PackageDetailModal from '../components/PackageDetailModal';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eduFilter, setEduFilter] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'LANGUAGES'
  const [stageFilter, setStageFilter] = useState('ALL'); // 'ALL' | 'PRIMARY' | 'PREP' | 'SEC'
  
  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Detail & Groups Management Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPackage, setDetailPackage] = useState(null);

  const handleOpenDetail = (pkg) => {
    setDetailPackage(pkg);
    setDetailModalOpen(true);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/packages');
      setPackages(data.data || []);
    } catch (err) {
      console.error('Failed to load packages:', err);
      toast.error('تعذر تحميل باكدجات المراحل الدراسية');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (pkg) => {
    setSelectedPackage(pkg);
    setEditModalOpen(true);
  };

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (eduFilter !== 'ALL' && pkg.education_type !== eduFilter) return false;

      // Filter by stage based on grade_order
      if (stageFilter === 'PRIMARY' && pkg.grade_order > 6) return false;
      if (stageFilter === 'PREP' && (pkg.grade_order <= 6 || pkg.grade_order > 9)) return false;
      if (stageFilter === 'SEC' && pkg.grade_order <= 9) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (pkg.name || '').toLowerCase().includes(q);
        const matchGrade = (pkg.grade_name || '').toLowerCase().includes(q);
        if (!matchName && !matchGrade) return false;
      }

      return true;
    });
  }, [packages, eduFilter, stageFilter, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in max-w-7xl mx-auto" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Package size={28} className="text-[#0C3C82]" />
            منظومة باكدجات المراحل الدراسية
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسعير الباكدج الشامل وسعر المادة المنفردة داخل الباكدج لكل مرحلة دراسية للتعليم الحكومي واللغات
          </p>
        </div>

        <button
          onClick={fetchPackages}
          className="atlas-btn atlas-btn-ghost text-xs self-start md:self-auto flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          تحديث الأسعار
        </button>
      </div>

      {/* Info Notice Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 bg-[#0C3C82] text-white rounded-xl flex-shrink-0 mt-0.5 shadow-xs">
          <Sparkles size={18} />
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <h4 className="font-bold text-slate-900 text-sm mb-1">
            💡 كيف يعمل نظام الباكدجات في السنتر؟
          </h4>
          <p>
            • يتم تحديد سعر <strong>الباكدج الشامل</strong> لكل مرحلة (مثلاً: 300 ج.م للمرحلة الابتدائية، 450 ج.م للإعدادية، و 600 ج.م للثانوية) مع اختلاف تلقائي بين الحكومي واللغات.<br />
            • في حالة اشتراك طالب الباكدج في مادة واحدة فقط بالسنتر، يتم تطبيق <strong>سعر المادة المنفردة داخل الباكدج</strong>.<br />
            • عند تحصيل رسوم الباكدج، تذهب الإيرادات بالكامل للسنتر (100% سنتر) ويتولى السنتر محاسبة المعلمين بمعرفته.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالمرحلة الدراسية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="atlas-input pr-10 text-xs py-2 bg-slate-50 border-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              مسح
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Education Type Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setEduFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                eduFilter === 'ALL' ? 'bg-white text-[#0C3C82] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setEduFilter('PUBLIC')}
              className={`px-3 py-1 rounded-lg transition-all ${
                eduFilter === 'PUBLIC' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏛️ حكومي / عربي
            </button>
            <button
              onClick={() => setEduFilter('LANGUAGES')}
              className={`px-3 py-1 rounded-lg transition-all ${
                eduFilter === 'LANGUAGES' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 لغات / تجريبي
            </button>
          </div>

          {/* Academic Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="atlas-input text-xs py-1.5 font-bold text-slate-700 bg-white"
          >
            <option value="ALL">جميع المراحل</option>
            <option value="PRIMARY">المرحلة الابتدائية (1 - 6)</option>
            <option value="PREP">المرحلة الإعدادية (1 - 3)</option>
            <option value="SEC">المرحلة الثانوية (1 - 3)</option>
          </select>
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <Loader2 size={36} className="animate-spin text-[#0C3C82] mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">جاري تحميل باكدجات المراحل...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="atlas-card p-12 text-center border-dashed border-2 border-slate-200">
          <Package size={40} className="mx-auto mb-2 text-slate-400 opacity-60" />
          <p className="text-sm font-bold text-slate-700">لا توجد باكدجات مطابقة للبحث أو الفلتر</p>
          <p className="text-xs text-slate-400 mt-1">يرجى تعديل خيارات التصفية أعلاه.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => {
            const isLanguages = pkg.education_type === 'LANGUAGES';
            return (
              <div
                key={pkg.id}
                className={`atlas-card p-5 border transition-all flex flex-col justify-between hover:shadow-md ${
                  isLanguages
                    ? 'border-cyan-200/80 bg-gradient-to-b from-cyan-50/20 to-white'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  {/* Top Header & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl text-white ${isLanguages ? 'bg-cyan-600' : 'bg-[#0C3C82]'}`}>
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug">
                          {pkg.grade_name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          ترتيب المرحلة: #{pkg.grade_order}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isLanguages
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                          : 'bg-sky-100 text-sky-900 border-sky-300'
                      }`}
                    >
                      {isLanguages ? '🌐 لغات / تجريبي' : '🏛️ حكومي / عربي'}
                    </span>
                  </div>

                  {/* Pricing Display Cards */}
                  <div className="grid grid-cols-2 gap-2.5 my-3">
                    {/* Full Package Price */}
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-center">
                      <span className="text-[10px] font-bold text-amber-800 block mb-1">
                        📦 الباكدج الشامل
                      </span>
                      <span className="text-lg font-black text-amber-950 font-mono">
                        {parseFloat(pkg.package_price).toFixed(0)} <small className="text-[10px] font-normal">ج.م/شهر</small>
                      </span>
                    </div>

                    {/* Single Subject Price */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-600 block mb-1">
                        📖 مادة منفردة
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        {parseFloat(pkg.single_subject_price).toFixed(0)} <small className="text-[10px] font-normal">ج.م/شهر</small>
                      </span>
                    </div>
                  </div>

                  {pkg.notes && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2 mt-2">
                      📝 {pkg.notes}
                    </p>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenDetail(pkg)}
                    className="atlas-btn atlas-btn-primary text-xs px-3 py-1.5 flex-1 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Layers size={13} />
                    <span>إدارة المجموعات والتسكين</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(pkg)}
                    title="تعديل أسعار الباكدج"
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Package Detail & Groups/Enrollment Modal */}
      {detailModalOpen && detailPackage && (
        <PackageDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          pkg={detailPackage}
          onUpdated={fetchPackages}
        />
      )}

      {/* Edit Package Modal */}
      {editModalOpen && selectedPackage && (
        <EditPackageModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          pkg={selectedPackage}
          onSuccess={() => {
            fetchPackages();
            setEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// EDIT PACKAGE MODAL
// -------------------------------------------------------------
function EditPackageModal({ isOpen, onClose, pkg, onSuccess }) {
  const [packagePrice, setPackagePrice] = useState(pkg.package_price || 0);
  const [singleSubjectPrice, setSingleSubjectPrice] = useState(pkg.single_subject_price || 0);
  const [notes, setNotes] = useState(pkg.notes || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(`/packages/${pkg.id}`, {
        package_price: parseFloat(packagePrice) || 0,
        single_subject_price: parseFloat(singleSubjectPrice) || 0,
        notes: notes.trim() || null,
      });
      toast.success(data.message || 'تم تحديث تسعيرة الباقة بنجاح');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  const isLanguages = pkg.education_type === 'LANGUAGES';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-5 text-white flex items-center justify-between" style={{ background: '#0C3C82' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-base font-black">تعديل تسعيرة الباكدج</h3>
              <p className="text-xs text-white/80">
                {pkg.grade_name} • {isLanguages ? 'لغات / تجريبي' : 'حكومي / عربي'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>المرحلة:</span>
              <span className="text-[#0C3C82]">{pkg.grade_name}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-800 mt-1">
              <span>نوع التعليم:</span>
              <span>{isLanguages ? '🌐 لغات / تجريبي' : '🏛️ حكومي / عربي'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              📦 سعر الباكدج الشامل الشهري (ج.م):
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={packagePrice}
              onChange={(e) => setPackagePrice(e.target.value)}
              className="atlas-input text-base font-black text-center font-mono"
              required
              autoFocus
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              القيمة الشهرية الثابتة للطالب المشترك في باكدج المرحلة بالكامل
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              📖 سعر المادة المنفردة داخل الباكدج (ج.م):
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={singleSubjectPrice}
              onChange={(e) => setSingleSubjectPrice(e.target.value)}
              className="atlas-input text-base font-black text-center font-mono"
              required
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              سعر المادة الواحدة لطالب الباكدج إذا اختار مادة منفردة بالسنتر
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات وتفاصيل إضافية (اختياري):
            </label>
            <input
              type="text"
              placeholder="مثال: تشمل المراجعات والمذكرات"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="atlas-input text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="atlas-btn-ghost text-xs">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="atlas-btn-primary text-xs px-5 py-2.5 flex items-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التعديلات'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
