import Link from "next/link";

type LogoProps = {
  href?: string;
  subtitle?: string;
  size?: "sm" | "md";
  inverted?: boolean;
};

/** Símbolo SportTech Liquid Glass: gramado estilizado com brilho especular */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient id="arenaEmerald" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="glassShine" x1="0" y1="0" x2="0" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#arenaEmerald)" />
      <rect x="1" y="1" width="30" height="15" rx="8" fill="url(#glassShine)" />
      <rect
        x="6"
        y="8.5"
        width="20"
        height="15"
        rx="2.5"
        stroke="#FFFFFF"
        strokeWidth="1.75"
      />
      <line x1="16" y1="8.5" x2="16" y2="23.5" stroke="#FFFFFF" strokeWidth="1.75" />
      <circle cx="16" cy="16" r="3.25" stroke="#FFFFFF" strokeWidth="1.75" />
    </svg>
  );
}

export function Logo({ href = "/", subtitle, size = "md", inverted = false }: LogoProps) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 transition-opacity hover:opacity-90">
      <span className="transition-transform duration-300 group-hover:scale-105">
        <LogoMark size={size === "sm" ? 28 : 34} />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-[family-name:var(--font-montserrat)] font-black tracking-tight ${
            size === "sm" ? "text-base" : "text-lg"
          } ${inverted ? "text-white" : "text-slate-900"}`}
        >
          Arena<span className="text-emerald-500">GL</span>
        </span>
        {subtitle && (
          <span
            className={`block font-sans text-[10px] font-semibold uppercase tracking-wider ${
              inverted ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}
