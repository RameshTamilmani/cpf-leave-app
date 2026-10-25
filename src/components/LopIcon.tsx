// Shared Loss of Pay symbol across cards, details and warnings.
export function LopIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 7h12M8 3c7 0 7 8 0 8H6l10 10" />
      <path d="m3 3 18 18" />
    </svg>
  );
}
