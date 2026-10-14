import { useEffect, useRef, useState } from 'react';

const DEFAULT_SITE_KEY = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '0x4AAAAAAFWKPtUZzYA0UYN3';

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  siteKey = DEFAULT_SITE_KEY,
  theme = 'light',
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  // Keep latest callbacks in a ref to avoid infinite re-render loop
  const callbacksRef = useRef({ onVerify, onError, onExpire });
  callbacksRef.current = { onVerify, onError, onExpire };

  useEffect(() => {
    let intervalId = null;
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current !== null) return; // already rendered

      try {
        // Clear any previous stray DOM nodes inside container
        containerRef.current.innerHTML = '';

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme,
          language: 'ar',
          callback: (token) => {
            if (isMounted) {
              callbacksRef.current.onVerify?.(token);
            }
          },
          'error-callback': (code) => {
            console.error('Cloudflare Turnstile error code:', code);
            if (isMounted) {
              callbacksRef.current.onError?.(code);
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              callbacksRef.current.onExpire?.();
            }
          },
        });

        widgetIdRef.current = id;
        if (isMounted) {
          setIsRendered(true);
        }
      } catch (err) {
        console.error('Error rendering Turnstile:', err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      intervalId = setInterval(() => {
        if (window.turnstile) {
          clearInterval(intervalId);
          renderWidget();
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme]); // ONLY depend on siteKey and theme!

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white/90 rounded-2xl border border-slate-200 shadow-sm min-h-[75px]">
      <div ref={containerRef} className="cf-turnstile-wrapper flex justify-center" />
      {!isRendered && (
        <span className="text-xs text-slate-400 mt-1 animate-pulse">
          جاري تحميل التحقق الأمني من Cloudflare...
        </span>
      )}
    </div>
  );
}
