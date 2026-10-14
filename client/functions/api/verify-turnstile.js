export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body?.token;

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, message: 'رمز التحقق (Turnstile Token) مطلوب' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '0x4AAAAAAFWKPr6kGzFRbLeFrM5aUiWZMDY';
    const clientIp = request.headers.get('CF-Connecting-IP') || '';

    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);
    if (clientIp) {
      params.append('remoteip', clientIp);
    }

    const cfResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const outcome = await cfResponse.json();

    return new Response(JSON.stringify(outcome), {
      status: outcome.success ? 200 : 403,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: 'تعذر الاتصال بخدمة كلاودفير للتحقق' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
