import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Search, Filter, Edit2, Trash2,
  Loader2, Sparkles, School, GraduationCap
} from 'lucide-react';
import SubjectModal from '../components/SubjectModal';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // all, general, azhar, both
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/master/subjects');
      setSubjects(data.data || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      toast.error('فشل تحميل قائمة المواد');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف/تعطيل مادة "${name}"؟`)) return;
    try {
      const { data } = await api.delete(`/master/subjects/${id}`);
      toast.success(data.message || 'تمت العملية بنجاح');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حذف المادة');
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      !search ||
      s.name_ar?.toLowerCase().includes(search.toLowerCase()) ||
      s.name_en?.toLowerCase().includes(search.toLowerCase()) ||
      s.code?.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      selectedType === 'all' ||
      s.education_type === selectedType ||
      (selectedType !== 'all' && s.education_type === 'both');

    return matchesSearch && matchesType;
  });

  const generalCount = subjects.filter((s) => s.education_type === 'general' || s.education_type === 'both').length;
  const azharCount = subjects.filter((s) => s.education_type === 'azhar' || s.education_type === 'both').length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <BookOpen size={26} style={{ color: '#0C3C82' }} />
            المواد الدراسية (التعليم العام والأزهري)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة وتصنيف المواد الدراسية المقررة بالسنتر ومتابعة المجموعات المرتبطة بها
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSubject(null);
            setIsModalOpen(true);
          }}
          className="atlas-btn-primary self-start sm:self-auto text-xs px-4 py-2.5"
        >
          <Plus size={16} className="ml-1.5 inline" />
          إضافة مادة جديدة
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي المواد بالسنتر</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{subjects.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0C3C82] flex items-center justify-center">
            <BookOpen size={20} />
          </div>
        </div>

        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">مواد التعليم العام</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{generalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0EA5E9] flex items-center justify-center">
            <School size={20} />
          </div>
        </div>

        <div className="atlas-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">مواد التعليم الأزهري</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{azharCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="atlas-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم المادة أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="atlas-input text-xs w-full pr-9"
          />
        </div>

        {/* Education Type Filter Tabs */}
        <div className="flex items-center gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'جميع المواد' },
            { id: 'general', label: 'تعليم عام' },
            { id: 'azhar', label: 'تعليم أزهري 🕌' },
            { id: 'both', label: 'مشترك' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === tab.id
                  ? 'bg-[#0C3C82] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Subject Cards */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 size={32} className="animate-spin text-[#0C3C82] mb-3" />
          <p className="text-xs">جاري تحميل المواد الدراسية...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="atlas-card py-16 text-center text-slate-400">
          <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold text-slate-600">لا توجد مواد مطابقة للبحث</p>
          <p className="text-xs mt-1">جرّب تغيير كلمات البحث أو أضف مادة جديدة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => {
            const isAzhar = sub.education_type === 'azhar';
            const isBoth = sub.education_type === 'both';

            return (
              <div
                key={sub.id}
                className="atlas-card p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-slate-200/90 group"
              >
                {/* Color Top Border */}
                <div
                  className="absolute top-0 right-0 left-0 h-1.5"
                  style={{ backgroundColor: sub.color || '#0C3C82' }}
                />

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="text-right flex-1">
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-[#0C3C82] transition-colors">
                      {sub.name_ar}
                    </h3>
                    {sub.name_en && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                        {sub.name_en}
                      </p>
                    )}
                  </div>

                  <span className="atlas-badge font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-bold flex-shrink-0">
                    {sub.code || '—'}
                  </span>
                </div>

                {/* Badges & Meta */}
                <div className="flex items-center gap-2 mb-4">
                  {isAzhar ? (
                    <span className="atlas-badge text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      🕌 أزهري
                    </span>
                  ) : isBoth ? (
                    <span className="atlas-badge text-xs px-2.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                      مشترك (عام/أزهر)
                    </span>
                  ) : (
                    <span className="atlas-badge text-xs px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                      عام
                    </span>
                  )}

                  <span className="text-xs text-slate-500 font-medium">
                    {sub.groups_count || 0} مجموعات دراسية نشطة
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">إجراءات المادة</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingSubject(sub);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#0C3C82] hover:bg-blue-50 transition-colors"
                      title="تعديل المادة"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(sub.id, sub.name_ar)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="حذف المادة"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <SubjectModal
        isOpen={isModalOpen}
        initialData={editingSubject}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSubject(null);
        }}
        onSuccess={fetchSubjects}
      />
    </div>
  );
}
