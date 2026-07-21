interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
