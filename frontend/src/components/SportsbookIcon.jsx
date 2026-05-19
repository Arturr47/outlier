export function CalienteIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#FF6B00" />
      <path d="M12 5c-1.5 3-5 5-5 9a5 5 0 0010 0c0-4-3.5-6-5-9z" fill="#FFF" />
      <path d="M12 10c-.8 1.5-2.5 2.5-2.5 4.5a2.5 2.5 0 005 0c0-2-1.7-3-2.5-4.5z" fill="#FF6B00" />
    </svg>
  );
}

export function Bet365Icon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#027B5B" />
      <text x="12" y="16" textAnchor="middle" fill="#FFD700" fontSize="9" fontWeight="bold" fontFamily="Arial">365</text>
    </svg>
  );
}

export function BetcrisIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#1A1A2E" />
      <text x="12" y="15" textAnchor="middle" fill="#E94560" fontSize="7" fontWeight="bold" fontFamily="Arial">BC</text>
      <rect x="4" y="17" width="16" height="2" rx="1" fill="#E94560" />
    </svg>
  );
}

export function getSportsbookIcon(name) {
  const n = name?.toLowerCase() || '';
  if (n.includes('caliente')) return CalienteIcon;
  if (n.includes('365') || n.includes('bet365')) return Bet365Icon;
  if (n.includes('betcris')) return BetcrisIcon;
  return null;
}

export function SportsbookBadge({ name }) {
  const Icon = getSportsbookIcon(name);
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="w-4 h-4" />}
      <span className="text-[11px] text-[#8b949e] font-medium">{name}</span>
    </div>
  );
}
