export function Logo({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 40"
      fill="none"
      className={className}
    >
      <path
        d="M2 20H18L24 6L36 34L48 12L54 28L60 20H78"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M92 8H108V12H96V18H106V22H96V32H92V8Z" fill="currentColor" />
      <path
        d="M112 8H124C126.2 8 128 9.8 128 12V18C128 20.2 126.2 22 124 22H116V32H112V8ZM116 12V18H124V12H116Z"
        fill="currentColor"
      />
      <path d="M132 8H136L142 26L148 8H152L144 32H140L132 8Z" fill="currentColor" />
      <path
        d="M164 12V8H160V12H156V16H160V26C160 27.1 160.9 28 162 28H166V32H162C158.7 32 156 29.3 156 26V16H152V12H156V8H164Z"
        fill="currentColor"
      />
      <path
        d="M172 12V32H168V12H172ZM184 32H180V12H184V19C184 19 186 12 192 12V16C188 16 184 19 184 24V32Z"
        fill="currentColor"
      />
      <path
        d="M200 12V32H196V12H200ZM200 12V16C200 16 204 12 210 12C216 12 218 16 218 20V32H214V20C214 18 212 16 208 16C204 16 200 19 200 24V32H196V12H200Z"
        fill="currentColor"
      />
      <path
        d="M224 22H238C238 17 234 12 229 12C224 12 220 17 220 22C220 27 224 32 229 32C233 32 236 30 237 27L234 25C233 27 231 28 229 28C226 28 224 26 224 22ZM229 16C232 16 234 18 234 22H224C224 18 226 16 229 16Z"
        fill="currentColor"
      />
    </svg>
  );
}
