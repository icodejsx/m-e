import {
  LayoutDashboard,
  Building2,
  Network,
  FolderTree,
  Tags,
  FileType2,
  MapPin,
  Scale,
  CalendarRange,
  Landmark,
  FileText,
  Briefcase,
  Banknote,
  Target as TargetIcon,
  FileCode,
  Users,
  UserCog,
  ClipboardEdit,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export interface NavSection {
  id: string;
  label: string;
  links: NavLink[];
}

export const NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    links: [
      {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Programme KPIs, submissions and target progress.",
      },
    ],
  },
  {
    id: "master",
    label: "Master data",
    links: [
      { href: "/mdas", label: "MDAs", icon: Building2, description: "Ministries, Departments and Agencies." },
      { href: "/departments", label: "Departments / Agencies", icon: Network },
      { href: "/report-classes", label: "Report Classes", icon: FolderTree },
      { href: "/report-categories", label: "Report Categories", icon: Tags },
      { href: "/report-types", label: "Report Types", icon: FileType2 },
      { href: "/lgas", label: "LGAs", icon: MapPin },
      { href: "/units", label: "Units of Measurement", icon: Scale },
      { href: "/reporting-periods", label: "Reporting Periods", icon: CalendarRange },
      { href: "/funding-sources", label: "Funding Sources", icon: Landmark },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    links: [
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/projects", label: "Projects", icon: Briefcase },
      { href: "/project-funding", label: "Project Funding", icon: Banknote },
      { href: "/targets", label: "Targets", icon: TargetIcon },
      { href: "/templates", label: "Dynamic Templates", icon: FileCode },
      { href: "/users", label: "Users (Reporting Officers)", icon: Users },
      { href: "/assignments", label: "User Assignments", icon: UserCog },
    ],
  },
  {
    id: "capture",
    label: "Data capture",
    links: [
      { href: "/capture", label: "Fill Dynamic Form", icon: ClipboardEdit },
      { href: "/progress", label: "Target Progress", icon: TrendingUp },
    ],
  },
];

export function findNavLink(pathname: string): { section: NavSection; link: NavLink } | null {
  const clean = pathname.split("?")[0].replace(/\/$/, "") || "/";
  for (const section of NAV) {
    for (const link of section.links) {
      if (link.href === clean) return { section, link };
      if (link.href !== "/" && clean.startsWith(link.href + "/"))
        return { section, link };
    }
  }
  return null;
}
