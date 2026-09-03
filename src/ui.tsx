import { useEffect, useRef, useState, type ReactNode } from "react";

/* ═══════════════ أيقونات SVG مرسومة يدوياً ═══════════════ */
const P: Record<string, ReactNode> = {
  dash: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.8" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.8" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.8" /><path d="M13.5 17h7M17 13.5v7" /></>,
  box: <><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="M4 7l8 4 8-4M12 11v10" /><path d="M8 5l8 4" /></>,
  truck: <><path d="M2.5 6h11v10h-11zM13.5 9h4l3 3v4h-7" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></>,
  tag: <><path d="M3.5 12V4.5a1 1 0 0 1 1-1H12l8.5 8.5-7.5 7.5L3.5 12Z" /><circle cx="8" cy="8" r="1.6" /></>,
  book: <><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H6a2 2 0 0 0-2 2V4.5Z" /><path d="M4 20a2 2 0 0 0 2 2h13v-4M8 7h7M8 10.5h5" /></>,
  shield: <><path d="M12 3 5 5.8v5.4c0 4.4 2.9 7.6 7 9.8 4.1-2.2 7-5.4 7-9.8V5.8L12 3Z" /><path d="m9 11.5 2.2 2.2L15.5 9" /></>,
  life: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /><path d="m5.9 5.9 3.6 3.6M14.5 14.5l3.6 3.6M18.1 5.9l-3.6 3.6M9.5 14.5l-3.6 3.6" /></>,
  bell: <><path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" /><path d="M9.8 19.5a2.3 2.3 0 0 0 4.4 0" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  chevD: <path d="m6 9.5 6 6 6-6" />,
  chevS: <path d="m9.5 6 6 6-6 6" />,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.8 2-1.8 0-.9-.6-1.4-.6-2.2 0-1 .8-1.8 2-1.8H17a4 4 0 0 0 4-4c0-4.5-4-8.2-9-8.2Z" /><circle cx="7.5" cy="10.5" r="1.15" /><circle cx="11" cy="7" r="1.15" /><circle cx="15.5" cy="8" r="1.15" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" /></>,
  users: <><circle cx="9" cy="9" r="3.4" /><path d="M2.8 19.5c.8-3.4 3.2-5.2 6.2-5.2s5.4 1.8 6.2 5.2M15.5 5.9a3.4 3.4 0 0 1 0 6.2M17.6 14.6c2 .7 3.2 2.3 3.7 4.9" /></>,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8" /></>,
  db: <><ellipse cx="12" cy="5.5" rx="7.5" ry="3" /><path d="M4.5 5.5v13c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-13" /><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" /></>,
  key: <><circle cx="8" cy="14.5" r="4.5" /><path d="m11.5 11 8-8M16 6.5l2.5 2.5M13.5 9l2 2" /></>,
  save: <><path d="M5 3.5h11l3.5 3.5V20a.5.5 0 0 1-.5.5h-14a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" /><path d="M8 3.5V9h7V3.5M8 20.5v-7h8v7" /></>,
  down: <><path d="M12 3.5v11M7.5 10 12 14.5 16.5 10" /><path d="M4.5 17v2.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V17" /></>,
  xlsx: <><path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" /><path d="m9 12 5 5.5M14 12l-5 5.5M15 3.5V8h4.5" /></>,
  pdf: <><path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" /><path d="M8 17v-5.5h1.4a1.6 1.6 0 0 1 0 3.2H8M13.8 17v-5.5h1.2a2.75 2.75 0 0 1 0 5.5h-1.2M15 3.5V8h4.5" /></>,
  print: <><path d="M7 8V3.5h10V8" /><rect x="4" y="8" width="16" height="8" rx="1.5" /><path d="M7 13.5h10v7H7z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4.5 6.5h15M9 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h3.4A1.3 1.3 0 0 1 15 4.8v1.7M6.5 6.5 7.3 20a.8.8 0 0 0 .8.7h7.8a.8.8 0 0 0 .8-.7l.8-13.5" /><path d="M10 10.5v6M14 10.5v6" /></>,
  undo: <><path d="M8 5 3.5 9.5 8 14" /><path d="M3.5 9.5H15a5.5 5.5 0 0 1 0 11h-4" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="1.6" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7M12 14.5v2" /></>,
  unlock: <><rect x="5" y="10.5" width="14" height="9.5" rx="1.6" /><path d="M8 10.5V7.8a4 4 0 0 1 7.8-1.2M12 14.5v2" /></>,
  check: <path d="m4.5 12.5 5 5L19.5 6.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  filter: <path d="M4 5.5h16L14 13v6.5l-4-2V13L4 5.5Z" />,
  cal: <><rect x="3.5" y="5" width="17" height="15.5" rx="1.6" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
  coins: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
  chart: <><path d="M4 4v16h16" /><path d="m7 15 4-5 3 3 5-7" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="M4 9h16M15.5 14.5h1.5" /></>,
  swap: <><path d="M7 4 3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7" /></>,
  scale: <><path d="M12 4v16M8 20h8M12 4 5.5 6.5M12 4l6.5 2.5" /><path d="M5.5 6.5 3 13a3 3 0 0 0 5 0l-2.5-6.5ZM18.5 6.5 16 13a3 3 0 0 0 5 0l-2.5-6.5Z" /></>,
  pulse: <path d="M3 12h4l2.5-6.5L14 18l2.5-6H21" />,
  bld: <><rect x="5" y="3.5" width="14" height="17" rx="1" /><path d="M9 7h2M13 7h2M9 10.5h2M13 10.5h2M9 14h2M13 14h2M10.5 20.5v-3.5h3v3.5" /></>,
  out: <><path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" /><path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20Z" /><path d="m14.5 8 2.5 2.5" /></>,
  wave: <><path d="M2.5 9c2.6-2.8 5.2-2.8 7.8 0s5.2 2.8 7.8 0c1.4-1.5 2.6-2 3.4-1.8" /><path d="M2.5 15c2.6-2.8 5.2-2.8 7.8 0s5.2 2.8 7.8 0c1.4-1.5 2.6-2 3.4-1.8" /></>,
  receipt: <><path d="M6 3.5h12V21l-2.4-1.6L13.2 21l-2.4-1.6L8.4 21 6 19.4V3.5Z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></>,
  clip: <><rect x="5" y="5" width="14" height="16" rx="1.5" /><path d="M9 5V3.5h6V5M9 10h6M9 13.5h6M9 17h3.5" /></>,
  file: <><path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" /><path d="M15 3.5V8h4.5M9 12h6M9 15.5h6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.2l3.5 2" /></>,
  alert: <><path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 10v4.5M12 17.4v.4" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 7.6v.4" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3.5 12.5 8.5 4.7 8.5-4.7M3.5 16.5 12 21l8.5-4.5" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c-2.8 2.4-4 5.2-4 8.5s1.2 6.1 4 8.5c2.8-2.4 4-5.2 4-8.5s-1.2-6.1-4-8.5Z" /></>,
  code: <><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /></>,
  server: <><rect x="3.5" y="4" width="17" height="6.5" rx="1.3" /><rect x="3.5" y="13.5" width="17" height="6.5" rx="1.3" /><path d="M7 7.2h.4M7 16.7h.4M17 7.2h-3.5M17 16.7h-3.5" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" /></>,
  arrow: <><path d="M4 12h15" /><path d="m13.5 6 6 6-6 6" /></>,
  phone: <path d="M6.5 3.5h3l1.5 4.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" /></>,
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  home: <><path d="m3.5 11 8.5-7.5L20.5 11" /><path d="M6 9.5V20h4.5v-5.5h3V20H18V9.5" /></>,
};

export function I({ n, size = 18, className = "" }: { n: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[n] || P.info}
    </svg>
  );
}

/* ═══════════════ الشعار ═══════════════ */
export function Logo({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="13" fill={light ? "rgba(255,255,255,0.12)" : "#0b4f7a"} />
        <path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#67d5ff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#a5e6ff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
        <circle cx="37" cy="13" r="3" fill="#ffd28a" />
      </svg>
      <div className="leading-none">
        <div className={`font-display font-bold text-lg tracking-tight leading-tight ${light ? "text-white" : "text-ink"}`}>
          النظام المالي <span className="text-[var(--brand2)]">المتكامل</span>
        </div>
        <div className={`text-[0.62rem] font-bold mt-1 ${light ? "text-white/60" : "text-mute"}`}>أوكيانوس سوفت — Okyanus Soft • v3.0</div>
      </div>
    </div>
  );
}

/* ═══════════════ عدّاد متحرك ═══════════════ */
export function useCountUp(target: number, dur = 950) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

/* ═══════════════ كشف الظهور عند التمرير ═══════════════ */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); ob.disconnect(); } }, { threshold: 0.08 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${on ? "on" : ""} ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

/* ═══════════════ نافذة منبثقة ═══════════════ */
export function Modal({ open, onClose, title, icon, children, wide = false }: { open: boolean; onClose: () => void; title: string; icon?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#04121f]/60 backdrop-blur-[3px] anim-fadein" onClick={onClose} />
      <div className={`relative card anim-pop w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[88vh] overflow-auto`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line sticky top-0 bg-surface z-10 rounded-t-[14px]">
          {icon && <span className="w-9 h-9 rounded-lg grid place-items-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"><I n={icon} size={19} /></span>}
          <h3 className="font-display font-bold text-lg flex-1">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-mute hover:text-bad hover:bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] transition-colors" aria-label="إغلاق"><I n="x" size={17} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════ شارات الحالة ═══════════════ */
export function Chip({ s }: { s: string }) {
  const map: Record<string, string> = {
    "مرحّل": "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]",
    "مرحّلة": "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]",
    "ملغي": "bg-[color-mix(in_srgb,var(--bad)_13%,transparent)] text-[var(--bad)]",
    "ملغاة": "bg-[color-mix(in_srgb,var(--bad)_13%,transparent)] text-[var(--bad)]",
    "بانتظار الموافقة": "bg-[color-mix(in_srgb,var(--warn)_15%,transparent)] text-[var(--warn)]",
    "نقدي": "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]",
    "آجل": "bg-[color-mix(in_srgb,var(--warn)_15%,transparent)] text-[var(--warn)]",
    "ساري": "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]",
    "مقبول": "bg-[color-mix(in_srgb,var(--brand)_13%,transparent)] text-[var(--brand)]",
    "مرفوض": "bg-[color-mix(in_srgb,var(--bad)_13%,transparent)] text-[var(--bad)]",
    "منتهي": "bg-[color-mix(in_srgb,var(--mute)_18%,transparent)] text-[var(--mute)]",
    "مفتوحة": "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]",
    "مقفلة": "bg-[color-mix(in_srgb,var(--bad)_13%,transparent)] text-[var(--bad)]",
    "رئيسي": "bg-[color-mix(in_srgb,var(--brand)_13%,transparent)] text-[var(--brand)]",
    "فرعي": "bg-[color-mix(in_srgb,var(--mute)_16%,transparent)] text-[var(--soft)]",
  };
  return <span className={`chip ${map[s] || "bg-[color-mix(in_srgb,var(--mute)_16%,transparent)] text-[var(--soft)]"}`}>{s}</span>;
}

/* ═══════════════ رسوم بيانية ═══════════════ */
export function BarChart({ data, color = "var(--brand)", height = 190, unit = "" }: { data: { label: string; value: number }[]; color?: string; height?: number; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 group min-w-0" title={`${d.label}: ${d.value.toLocaleString("en-US")}${unit}`}>
          <div className="text-[0.6rem] font-num font-bold text-mute opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}K` : d.value}</div>
          <div className="w-full max-w-[38px] rounded-t-md bar-grow cursor-pointer transition-all group-hover:brightness-110"
            style={{ height: `${(d.value / max) * 100}%`, background: `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 55%, transparent))`, animationDelay: `${i * 60}ms` }} />
          <div className="text-[0.63rem] font-bold text-mute truncate w-full text-center">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ points, color = "var(--brand2)", height = 150 }: { points: number[]; color?: string; height?: number }) {
  const w = 300, h = 100, pad = 6;
  const max = Math.max(...points, 1), min = Math.min(...points, 0);
  const pts = points.map((p, i) => [pad + (i * (w - pad * 2)) / (points.length - 1), h - pad - ((p - min) / (max - min || 1)) * (h - pad * 2)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ height, width: "100%" }} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`lg-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${w - pad},${h} L${pad},${h} Z`} fill={`url(#lg-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" className="line-draw" style={{ "--dash": 620 } as React.CSSProperties} />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="var(--surface)" stroke={color} strokeWidth="1.8" />)}
    </svg>
  );
}

export function Donut({ parts, size = 150, label }: { parts: { value: number; color: string; name: string }[]; size?: number; label?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  let acc = 0;
  const R = 42, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
          {parts.map((p, i) => {
            const frac = p.value / total;
            const dash = `${frac * C} ${C}`;
            const off = -acc * C;
            acc += frac;
            return <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={p.color} strokeWidth="13" strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt" className="transition-all duration-700" />;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-num font-bold text-lg leading-none">{label}</div>
            <div className="text-[0.6rem] text-mute font-bold mt-1">الإجمالي</div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
            <span className="text-soft">{p.name}</span>
            <span className="font-num text-mute">{Math.round((p.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ باركود ═══════════════ */
export function Barcode({ value, h = 34 }: { value: string; h?: number }) {
  const bars = value.split("").map((c) => ((c.charCodeAt(0) % 4) + 1));
  return (
    <div className="inline-flex items-end gap-[2px]" dir="ltr" aria-label={value}>
      {bars.map((b, i) => <span key={i} className="inline-block bg-ink/85" style={{ width: b > 2 ? 2.5 : 1.2, height: h - (i % 3 === 0 ? 5 : 0) }} />)}
    </div>
  );
}

/* ═══════════════ رأس صفحة الوحدة ═══════════════ */
export function PageHead({ icon, title, desc, children }: { icon: string; title: string; desc: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5 anim-rise">
      <div className="flex items-center gap-3.5">
        <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}>
          <I n={icon} size={23} />
        </span>
        <div>
          <h1 className="font-display font-bold text-2xl leading-tight">{title}</h1>
          <p className="text-mute text-[0.82rem] font-medium mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}

/* ═══════════════ تبويبات داخلية ═══════════════ */
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-line mb-5 px-1">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-colors ${active === t.id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
          {t.icon && <I n={t.icon} size={15} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════ بطاقة إحصائية ═══════════════ */
export function Stat({ icon, label, value, sub, tone = "var(--brand)", delay = 0 }: { icon: string; label: string; value: number; sub?: string; tone?: string; delay?: number }) {
  const v = useCountUp(value);
  return (
    <Reveal delay={delay}>
      <div className="card card-lift p-4 relative overflow-hidden">
        <div className="absolute -top-6 -start-6 w-20 h-20 rounded-full opacity-[0.09]" style={{ background: tone }} />
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[0.72rem] font-bold text-mute">{label}</div>
            <div className="font-num font-bold text-[1.45rem] leading-tight mt-1" style={{ color: tone }}>{Math.round(v).toLocaleString("en-US")}</div>
            {sub && <div className="text-[0.68rem] font-bold text-mute mt-1">{sub}</div>}
          </div>
          <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone }}>
            <I n={icon} size={20} />
          </span>
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════ حالة فارغة ═══════════════ */
export function Empty({ msg }: { msg: string }) {
  return (
    <div className="py-14 text-center">
      <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="var(--mute)" strokeWidth="1.3" className="mx-auto mb-3 opacity-60"><path d="M12 3 4 7v10l8 4 8-4V7l-8-4ZM4 7l8 4 8-4M12 11v10" strokeLinejoin="round" /></svg>
      <p className="text-mute font-bold text-sm">{msg}</p>
    </div>
  );
}
