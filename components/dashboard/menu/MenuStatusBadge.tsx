interface MenuStatusBadgeProps {
  available: boolean;
}

export function MenuStatusBadge({ available }: MenuStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        available
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border border-white/10 bg-white/5 text-white/45"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          available ? "bg-emerald-400" : "bg-white/30"
        }`}
      />
      {available ? "Available" : "Unavailable"}
    </span>
  );
}
