import { Link } from 'react-router-dom';

/**
 * Reusable CodeBuddy Brand Logo component.
 * Uses the user's official CodeBuddy artwork across navbars, sidebars, and auth screens.
 *
 * @param {'mark' | 'full'} variant - 'mark' shows compact icon + text; 'full' shows full banner logo
 * @param {string} subtitle - Optional subtitle next to the brand name (e.g., "Lucid Studio", "Teacher Portal")
 * @param {string} to - Optional route link target (defaults to '/')
 * @param {string} className - Optional extra wrapper classes
 */
export default function BrandLogo({
  variant = 'mark',
  subtitle = '',
  to = '/',
  onClick,
  className = '',
}) {
  const content =
    variant === 'full' ? (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <div className="rounded-2xl overflow-hidden bg-[#f7f5f0] border border-slate-200/80 dark:border-white/15 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]">
          <picture>
            <source srcSet="/logo.webp" type="image/webp" />
            <img
              src="/logo.jpg"
              alt="CodeBuddy — Code • Build • Grow Together"
              width={512}
              height={341}
              decoding="async"
              fetchPriority="high"
              className="h-28 sm:h-32 w-auto object-contain block"
            />
          </picture>
        </div>
      </div>
    ) : (
      <div className={`inline-flex items-center gap-2.5 group ${className}`}>
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#f7f5f0] border border-slate-200/80 dark:border-white/15 shadow-sm shrink-0 flex items-center justify-center">
          <picture className="w-full h-full block">
            <source srcSet="/logo-mark.webp" type="image/webp" />
            <img
              src="/logo-mark.png"
              alt="CodeBuddy Logo"
              width={36}
              height={36}
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </picture>
        </div>
        <div className="leading-tight">
          <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white block">
            Code<span className="text-blue-600 dark:text-cyan-400">Buddy</span>
          </span>
          {subtitle && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-cyan-300 font-medium block">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
