import { useState, useRef } from 'react';
import { uploadToImgBB } from '../../lib/imgbb';
import { Upload, X, Loader2, CheckCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function ImageUploadField({
  label,
  description,
  badgeText,
  value,
  onChange,
  onUploadingChange,
  required = false,
  isWhiteBackground = false,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [localPreview, setLocalPreview] = useState(value || null);
  const fileInputRef = useRef(null);

  const setUploadingStatus = (status) => {
    setIsUploading(status);
    onUploadingChange?.(status);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)');
      return;
    }

    setUploadError(null);
    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);
    setUploadingStatus(true);

    try {
      const uploadedUrl = await uploadToImgBB(file);
      setLocalPreview(uploadedUrl);
      onChange(uploadedUrl);
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'فشل رفع الصورة، يرجى المحاولة مرة أخرى');
      // لا نحذف المعاينة المحلية حتى يرى المستخدم ماذا حاول رفعه، ولكن نفرغ القيمة المحفوظة
      onChange('');
    } finally {
      setUploadingStatus(false);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setLocalPreview(null);
    setUploadError(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs sm:text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {badgeText && (
          <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
            {badgeText}
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
          {description}
        </p>
      )}

      {/* Upload Box */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
          localPreview
            ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
            : uploadError
            ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
            : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-sky-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {localPreview ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className={`relative w-20 h-20 rounded-xl overflow-hidden shadow-sm shrink-0 border ${
                isWhiteBackground ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'
              }`}>
                <img
                  src={localPreview}
                  alt="المعاينة"
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-right">
                {isUploading ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700">
                    <Loader2 size={13} className="animate-spin" />
                    <span>جاري رفع الصورة إلى الخادم...</span>
                  </div>
                ) : value ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle size={14} />
                      <span>تم رفع الصورة بنجاح وتجهيز الرابط</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono truncate max-w-[220px]" dir="ltr">
                      {value}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 font-semibold">
                    جاهز لإعادة المحاولة
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                تغيير الصورة
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                title="حذف الصورة"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2">
              <Upload size={22} />
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-700 mb-1">
              اضغط هنا لاختيار أو التقاط الصورة
            </div>
            <div className="text-[11px] text-slate-400">
              صيغ الصور المدعومة: JPG, PNG, WEBP (حد أقصى 10 ميجابايت)
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
          <AlertCircle size={13} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
