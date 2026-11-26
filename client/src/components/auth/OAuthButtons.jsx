import { useEffect, useState } from 'react';
import { authService } from '../../services';
import { API_BASE_URL } from '../../services/api';

export default function OAuthButtons({ role = 'student', disabled = false }) {
  const [providers, setProviders] = useState({ google: false, github: false });

  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_OAUTH === 'false') return;
    let mounted = true;
    authService
      .getOAuthProviders()
      .then((res) => {
        if (mounted && res.data?.data) {
          setProviders({
            google: Boolean(res.data.data.google),
            github: Boolean(res.data.data.github),
          });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!providers.google && !providers.github) {
    return null;
  }

  const startOAuth = (provider) => {
    const redirectOrigin = encodeURIComponent(window.location.origin);
    window.location.href = `${API_BASE_URL}/auth/oauth/${provider}?role=${encodeURIComponent(role)}&redirectOrigin=${redirectOrigin}`;
  };

  return (
    <div className="space-y-3">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-2 text-gray-400">Or continue with</span>
        </div>
      </div>

      <div className={`grid gap-2.5 ${providers.google && providers.github ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {providers.google && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => startOAuth('google')}
            className="btn-secondary w-full text-xs sm:text-sm"
          >
            Continue with Google
          </button>
        )}
        {providers.github && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => startOAuth('github')}
            className="btn-secondary w-full text-xs sm:text-sm"
          >
            Continue with GitHub
          </button>
        )}
      </div>
    </div>
  );
}
