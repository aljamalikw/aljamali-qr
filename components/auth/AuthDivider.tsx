export function AuthDivider() {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gold/10" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-surface-elevated/80 px-4 text-xs uppercase tracking-wider text-white/35">
          or
        </span>
      </div>
    </div>
  );
}
