import { useState, useRef } from 'react';
import { uploadToImgBB } from '../../lib/imgbb';
import { Upload, X, Loader2, CheckCircle, Camera, FolderOpen, AlertCircle } from 'lucide-react';

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
  const [showChoiceMenu, setShowChoiceMenu] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const setUploadingStatus = (status) => {
    setIsUploading(status);
    onUploadingChange?.(status);
  };

  const processFile = async (file) => {
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)');
      return;
    }

    setUploadError(null);
    setShowChoiceMenu(false);
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

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleCameraCapture = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setLocalPreview(null);
    setUploadError(null);
    setShowChoiceMenu(false);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleBoxClick = () => {
    if (isUploading) return;
    if (localPreview) return; // if already has preview, don't show menu
    setShowChoiceMenu(true);
  };

  const handleChooseFile = (e) => {
    e.stopPropagation();
    setShowChoiceMenu(false);
    fileInputRef.current?.click();
  };

  const handleChooseCamera = (e) => {
    e.stopPropagation();
    setShowChoiceMenu(false);
    cameraInputRef.current?.click();
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

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
        disabled={isUploading}
      />

      {/* Upload Box */}
      <div
        onClick={handleBoxClick}
        className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
          localPreview
            ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400 cursor-default'
            : uploadError
            ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400 cursor-pointer'
            : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-sky-400 cursor-pointer'
        }`}
      >
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
                onClick={(e) => { e.stopPropagation(); setShowChoiceMenu(true); }}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
              >
                تغيير الصورة
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
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

      {/* Choice Menu Overlay */}
      {showChoiceMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={(e) => { e.stopPropagation(); setShowChoiceMenu(false); }}
        >
          <div
            className="bg-white w-full sm:w-auto sm:min-w-[340px] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="p-4 pb-2 text-center border-b border-slate-100">
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />
              <h3 className="text-sm font-bold text-slate-800">اختر طريقة رفع الصورة</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">تصور صورة حالياً من الكاميرا ولا ترفع صورة جاهزة؟</p>
            </div>

            {/* Choice Buttons */}
            <div className="p-3 space-y-2">
              <button
                type="button"
                onClick={handleChooseCamera}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-right transition-all cursor-pointer active:scale-[0.98] group"
              >
                <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                  <Camera size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold text-sky-800">📸 التقط صورة من الكاميرا</div>
                  <div className="text-[11px] text-sky-600/80 mt-0.5">فتح الكاميرا وتصور صورتك دلوقتي</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleChooseFile}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-right transition-all cursor-pointer active:scale-[0.98] group"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                  <FolderOpen size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">📁 اختر صورة من الملفات</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">ارفع صورة جاهزة من المعرض أو الجهاز</div>
                </div>
              </button>
            </div>

            {/* Cancel */}
            <div className="p-3 pt-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowChoiceMenu(false); }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
          <AlertCircle size={13} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
