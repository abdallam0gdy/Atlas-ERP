/**
 * خدمة رفع الصور إلى ImgBB API
 * المفتاح المعتمد من الإدارة: 7f3f174d39d019c48c4a67bd36f0b8f6
 */
export const IMGBB_API_KEY = '7f3f174d39d019c48c4a67bd36f0b8f6';

export async function uploadToImgBB(file) {
  if (!file) return null;

  // التحقق من حجم الملف (أقل من 10 ميجابايت)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 10 ميجابايت');
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok || !resJson.success) {
      const errorMsg = resJson?.error?.message || 'فشل رفع الصورة إلى خادم ImgBB';
      throw new Error(errorMsg);
    }

    return resJson.data.display_url || resJson.data.url;
  } catch (err) {
    console.error('ImgBB Upload Error:', err);
    throw new Error(err.message || 'تعذر رفع الصورة، تأكد من الاتصال بالإنترنت وحاول مرة أخرى');
  }
}
