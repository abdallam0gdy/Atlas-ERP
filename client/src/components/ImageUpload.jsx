import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Camera, UploadCloud, X, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';

/**
 * Reusable Image Upload Component with Instant WebP Compression
 * @param {string} value - Current image URL
 * @param {function} onChange - Callback when image URL changes
 * @param {string} category - 'students' | 'teachers' | 'logos' | 'users'
 * @param {string} label - Input label
 * @param {string} shape - 'circle' | 'rounded' | 'square'
 * @param {number} size - Size in pixels (default: 96)
 */
export default function ImageUpload({
  value,
  onChange,
  category = 'students',
  label = 'الصورة الشخصية',
  shape = 'circle',
  size = 96,
  hint = 'سيتم ضغط الصورة تلقائياً بصيغة WebP لتوفير المساحة والحماية',
}) {
  const [uploading, setUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const fileInputRef = useRef(null);

  // Reset load error if value changes
  useEffect(() => {
    setLoadError(false);
  }, [value]);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    // Relative upload path, prepend server origin
    return url;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP)');
      return;
    }

    // Validate max size 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً، الحد الأقصى 10 ميجابايت');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setUploading(true);
    setCompressionInfo(null);
    try {
      const { data } = await api.post(`/uploads/photo/${category}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success && data.data?.url) {
        onChange(data.data.url);
        setCompressionInfo(data.data);
        toast.success(`تم رفع وضغط الصورة بنجاح (توفير ${data.data.savedPercentage || 80}%)`);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error(err.response?.data?.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    if (!value) return;

    try {
      if (value.startsWith('/uploads/')) {
        await api.delete('/uploads/photo', { data: { url: value } }).catch(() => {});
      }
    } catch (err) {
      // Ignore deletion failure
    }

    onChange('');
    setCompressionInfo(null);
    toast.success('تم إزالة الصورة');
  };

  const shapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'rounded'
      ? 'rounded-2xl'
      : 'rounded-xl';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>{label}</span>
          {compressionInfo && (
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono">
              <Sparkles size={11} />
              وفرت {compressionInfo.savedPercentage}% ({compressionInfo.compressedSizeKb} KB)
            </span>
          )}
        </label>
      )}

      <div className="flex items-center gap-4">
        {/* Image Preview / Trigger Container */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{ width: `${size}px`, height: `${size}px` }}
          className={`relative group cursor-pointer border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 flex items-center justify-center overflow-hidden transition-all shadow-xs ${shapeClass}`}
        >
          {value && !loadError ? (
            <img
              src={getFullUrl(value)}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-sky-600 p-2 text-center transition-colors">
              <Camera size={size > 80 ? 24 : 18} />
              {size >= 80 && (
                <span className="text-[10px] font-bold mt-1">
                  {loadError ? 'إعادة اختيار' : 'اختر صورة'}
                </span>
              )}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
            <UploadCloud size={20} />
          </div>

          {/* Uploading Spinner */}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-xs">
              <Loader2 size={22} className="animate-spin text-sky-400" />
              <span className="text-[9px] font-bold mt-1">جاري الضغط...</span>
            </div>
          )}

          {/* Remove Button */}
          {value && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              title="إزالة الصورة"
              className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-transform hover:scale-110 z-10"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Action Description */}
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <UploadCloud size={14} />
              {value ? 'تغيير الصورة' : 'رفع صورة'}
            </button>
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
              >
                حذف
              </button>
            )}
          </div>
          {hint && <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
