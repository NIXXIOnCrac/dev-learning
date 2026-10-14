import React, { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Route,
  Code2,
  Swords,
  FolderKanban,
  Trophy,
  Sparkles,
  Settings,
  Flame,
  Zap,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Check,
  Lock,
  Clock3,
  BookOpen,
  Terminal,
  Play,
  X,
  Target,
  CircleHelp,
  Bell,
  Search,
  MoreHorizontal,
  PanelLeftClose,
  Menu,
  CheckCircle2,
  Circle,
  RotateCcw,
  Send,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  Plus,
  FileCode2,
  Bug,
  GraduationCap,
  Maximize2,
  Copy,
  Database,
  Layers,
  ShieldCheck,
  Cloud,
  Smartphone,
  Cpu,
  Network,
  Gem,
  Braces,
  Globe,
  Command,
  ArrowLeft,
  Loader2,
  LogOut,
  User,
  Mail,
  CalendarDays,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  ListChecks,
  History,
  Award,
  Server,
  Layout,
  Eye,
  Pencil,
  SquareTerminal,
  Sprout,
  Compass,
} from "lucide-react";
const icons = {
  sprout: Sprout,
  compass: Compass,
  dashboard: LayoutDashboard,
  route: Route,
  code: Code2,
  swords: Swords,
  folder: FolderKanban,
  trophy: Trophy,
  sparkles: Sparkles,
  settings: Settings,
  flame: Flame,
  zap: Zap,
  arrow: ArrowRight,
  up: ArrowUpRight,
  chevron: ChevronRight,
  down: ChevronDown,
  check: Check,
  lock: Lock,
  clock: Clock3,
  book: BookOpen,
  terminal: Terminal,
  play: Play,
  x: X,
  target: Target,
  help: CircleHelp,
  bell: Bell,
  search: Search,
  more: MoreHorizontal,
  panel: PanelLeftClose,
  menu: Menu,
  success: CheckCircle2,
  circle: Circle,
  reset: RotateCcw,
  send: Send,
  sound: Volume2,
  mute: VolumeX,
  external: ExternalLink,
  download: Download,
  plus: Plus,
  file: FileCode2,
  bug: Bug,
  exam: GraduationCap,
  maximize: Maximize2,
  copy: Copy,
  database: Database,
  layers: Layers,
  shield: ShieldCheck,
  cloud: Cloud,
  phone: Smartphone,
  cpu: Cpu,
  network: Network,
  gem: Gem,
  braces: Braces,
  globe: Globe,
  command: Command,
  back: ArrowLeft,
  loading: Loader2,
  logout: LogOut,
  user: User,
  mail: Mail,
  calendar: CalendarDays,
  trending: TrendingUp,
  lightbulb: Lightbulb,
  alert: AlertCircle,
  tests: ListChecks,
  history: History,
  award: Award,
  server: Server,
  layout: Layout,
  eye: Eye,
  pencil: Pencil,
  shell: SquareTerminal,
};
export function Icon({ name, size = 18, ...props }) {
  const C = icons[name] || Code2;
  return <C size={size} strokeWidth={1.7} {...props} />;
}
export function LanguageIcon({ name, size = "normal" }) {
  return (
    <span className={`language-icon ${name} ${size}`}>
      {name === "python" ? (
        <svg viewBox="0 0 40 40" aria-label="Python">
          <path
            fill="#72a9f8"
            d="M20 4c-9 0-9 4-9 4v7h10v2H7s-5 0-5 8 5 8 5 8h5v-7s0-5 5-5h11s5 0 5-5V9s1-5-13-5Z"
          />
          <circle cx="16" cy="9" r="1.5" fill="#15243b" />
          <path
            fill="#f9d678"
            d="M20 36c9 0 9-4 9-4v-7H19v-2h14s5 0 5-8-5-8-5-8h-5v7s0 5-5 5H12s-5 0-5 5v7s-1 5 13 5Z"
            transform="translate(0 0)"
            opacity=".95"
          />
          <circle cx="24" cy="31" r="1.5" fill="#15243b" />
        </svg>
      ) : name === "js" ? (
        <b>JS</b>
      ) : name === "html" ? (
        <b>5</b>
      ) : name === "react" ? (
        <span>⚛</span>
      ) : (
        <Icon name={name} size={size === "small" ? 18 : 25} />
      )}
    </span>
  );
}
export function Brand({ small = false }) {
  return (
    <div className={`brand ${small ? "small" : ""}`}>
      <span className="brand-mark">
        <svg viewBox="0 0 32 32">
          <path
            d="M8 6h19l-4 6H12l-3 5h11l-4 6H6l-3 5V15z"
            fill="currentColor"
          />
        </svg>
      </span>
      {!small && (
        <>
          <strong>
            forge<span>.</span>
          </strong>
          <span className="academy-label">ACADEMY</span>
        </>
      )}
    </div>
  );
}
export function Progress({ value = 0, color = "" }) {
  return (
    <div className={`progress ${color}`}>
      <span style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
export function Pill({ children, color = "", className = "" }) {
  return <span className={`pill ${color} ${className}`}>{children}</span>;
}
export function Empty({ icon = "code", title, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Modal({ title, subtitle, onClose, children, wide = false }) {
  const panel = useRef();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const old = document.activeElement;
    const handler = (e) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const nodes = [
          ...panel.current.querySelectorAll(
            'button,input,select,textarea,summary,[tabindex="0"]',
          ),
        ].filter((n) => !n.disabled);
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    if (!panel.current.contains(document.activeElement))
      panel.current.querySelector("input,button")?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={panel}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export async function api(url, body, method) {
  const response = await fetch("/api/" + url, {
    method: method || (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
export function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-glow" />
      <svg viewBox="0 0 440 300" fill="none">
        <defs>
          <linearGradient
            id="top"
            x1="100"
            y1="40"
            x2="350"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#4285ef" />
            <stop offset="1" stopColor="#142647" />
          </linearGradient>
          <linearGradient id="front" x1="100" y1="100" x2="300" y2="300">
            <stop stopColor="#224d8c" />
            <stop offset="1" stopColor="#101929" />
          </linearGradient>
          <linearGradient id="screen" x1="180" y1="60" x2="300" y2="200">
            <stop stopColor="#152d50" />
            <stop offset="1" stopColor="#0b1529" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <g opacity=".25" stroke="#315789">
          <path d="m10 205 200-115 220 127M10 240 200-115 220 127M10 275 200-115 220 127M60 300V90M125 300V50M190 300V10M255 300V40M320 300V70M385 300V100" />
        </g>
        <path
          d="m74 220 126-73 159 91-126 73z"
          fill="#0d1728"
          stroke="#254b7c"
        />
        <path
          d="m104 204 97-56 126 73-97 56z"
          fill="url(#top)"
          stroke="#4b84d6"
        />
        <path d="m104 204 126 73v18l-126-72z" fill="url(#front)" />
        <path d="m230 277 97-56v18l-97 56z" fill="#172c4b" />
        <path
          d="m136 174 65-38 95 55-65 38z"
          fill="url(#top)"
          stroke="#518dde"
        />
        <path d="m136 174 95 55v36l-95-55z" fill="url(#front)" />
        <path d="m231 229 65-38v36l-65 38z" fill="#18345a" />
        <path d="m171 143 49-28 69 40-49 28z" fill="#2960a5" stroke="#5f9cf7" />
        <path d="m171 143 69 40v33l-69-40z" fill="url(#front)" />
        <path d="m240 183 49-28v33l-49 28z" fill="#193b6b" />
        <g transform="translate(160 40)">
          <path
            d="m0 14 14-8 130 74v99l-14 8L0 113z"
            fill="#0b172c"
            stroke="#3769aa"
          />
          <path
            d="m0 14 130 74v113L0 113z"
            fill="url(#screen)"
            stroke="#5c9cff"
          />
          <path d="m9 28 111 63v80L9 108z" fill="#0b1526" />
          <path d="m0 14 130 74v18L0 32z" fill="#294a77" />
          <circle cx="9" cy="27" r="2" fill="#83b7ff" />
          <circle cx="17" cy="31.5" r="2" fill="#83b7ff" />
          <circle cx="25" cy="36" r="2" fill="#83b7ff" />
          <path
            d="m46 82-17 3 17 23M81 102l17 23-17 3M72 85l-15 39"
            stroke="#71b7ff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m22 119 70 40" stroke="#215081" strokeWidth="3" />
          <path d="m22 127 48 27" stroke="#215081" strokeWidth="3" />
        </g>
        <g transform="translate(73 84)">
          <path d="m0 0 39 23v43L0 43z" fill="#142b48" stroke="#396d9f" />
          <path
            d="m12 24 6 3-6 10M22 40l8 4"
            stroke="#75caff"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(328 123)">
          <path d="m0 0 37-21v43L0 43z" fill="#132b43" stroke="#34799b" />
          <path d="m10 18 6 4 12-22" stroke="#79e0bf" strokeWidth="3" />
        </g>
        <path d="m314 62 8 4-8 5-8-5zM103 161l6 3-6 4-6-4z" fill="#6ca7ff" />
        <circle cx="348" cy="218" r="3" fill="#78b4ff" />
        <circle cx="121" cy="52" r="2" fill="#6aa7ff" />
        <path d="M340 78v10m-5-5h10" stroke="#63a0ff" />
      </svg>
      <div className="art-caption">
        <span /> built by you, not for you.
      </div>
    </div>
  );
}
