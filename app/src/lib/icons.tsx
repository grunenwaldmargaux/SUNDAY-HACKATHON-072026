import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  ChartNoAxesColumn,
  Check,
  CheckCheck,
  CircleCheck,
  Clock,
  Dot,
  ExternalLink,
  FileText,
  Flame,
  List,
  Mail,
  Map as MapIcon,
  NotebookPen,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCog,
  UserPlus,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Kebab-case names mirror the prototype's `M(name)` helper so TYPE_META, QUEST_DEFS
// and reasonIcon values (already strings like "trending-up") work unchanged.
export const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  "building-2": Building2,
  calendar: Calendar,
  "calendar-check": CalendarCheck,
  "chart-no-axes-column": ChartNoAxesColumn,
  check: Check,
  "check-check": CheckCheck,
  "circle-check": CircleCheck,
  clock: Clock,
  dot: Dot,
  "external-link": ExternalLink,
  "file-text": FileText,
  flame: Flame,
  list: List,
  mail: Mail,
  map: MapIcon,
  "notebook-pen": NotebookPen,
  newspaper: Newspaper,
  plus: Plus,
  "refresh-cw": RefreshCw,
  search: Search,
  send: Send,
  sparkles: Sparkles,
  star: Star,
  swords: Swords,
  target: Target,
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  trophy: Trophy,
  "user-cog": UserCog,
  "user-plus": UserPlus,
  users: Users,
  x: X,
  zap: Zap,
};

export function Icon({
  name,
  size = 16,
  color,
  strokeWidth = 2,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}
