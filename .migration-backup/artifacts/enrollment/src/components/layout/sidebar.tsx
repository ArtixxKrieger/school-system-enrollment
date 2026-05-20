import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  UserCheck,
  GraduationCap,
  Settings,
  Shield,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  BookOpenCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Students",
    icon: Users,
    children: [
      { label: "Master List", href: "/students" },
      { label: "Courses", href: "/courses" },
    ],
  },
  {
    label: "Enrollment",
    icon: ClipboardList,
    children: [
      { label: "Enrollees", href: "/enrollees" },
      { label: "Enrolled", href: "/enrollment" },
    ],
  },
  {
    label: "Academics",
    icon: BookOpen,
    children: [
      { label: "Curriculum", href: "/curriculum" },
    ],
  },
  {
    label: "System Control",
    icon: Settings,
    roles: ["superadmin", "admin"],
    children: [
      { label: "Settings", href: "/settings" },
      { label: "Role Management", href: "/role-management" },
      { label: "Vouchers", href: "/vouchers" },
    ],
  },
];

function NavSection({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((c) => c.href === location);
  });

  if (!item.children) {
    const active = location === item.href;
    return (
      <Link href={item.href!}>
        <div
          data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
            active
              ? "bg-white/20 text-white"
              : "text-green-100/80 hover:bg-white/10 hover:text-white",
            collapsed && "justify-center px-2",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </div>
      </Link>
    );
  }

  const anyChildActive = item.children.some((c) => c.href === location);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid={`nav-section-${item.label.toLowerCase().replace(/\s/g, "-")}`}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
          anyChildActive ? "bg-white/10 text-white" : "text-green-100/80 hover:bg-white/10 hover:text-white",
          collapsed && "justify-center px-2",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="ml-7 mt-1 space-y-0.5">
          {item.children.map((child) => {
            const childActive = location === child.href;
            return (
              <Link key={child.href} href={child.href}>
                <div
                  data-testid={`nav-child-${child.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm cursor-pointer transition-all",
                    childActive ? "bg-white/20 text-white font-medium" : "text-green-100/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {child.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ className, onMobileClose }: { className?: string; onMobileClose?: () => void }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // On mobile the sidebar lives inside a Sheet — the X button should close
  // the sheet rather than collapse the sidebar.
  const isMobile = !!onMobileClose;

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role ?? "");
  });

  return (
    <div
      className={cn(
        "flex flex-col h-full transition-all duration-200",
        collapsed ? "w-16" : "w-60",
        className,
      )}
      style={{
        background: "linear-gradient(180deg, #02310a 0%, #0a6901 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <BookOpenCheck className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-bold text-white leading-tight">KURIOS</p>
            <p className="text-[10px] text-green-200/80 leading-tight">ENROLLMENT SYSTEM</p>
          </div>
        )}
        <button
          onClick={isMobile ? onMobileClose : () => setCollapsed((v) => !v)}
          className="ml-auto text-green-200/60 hover:text-white transition-colors"
          data-testid="button-toggle-sidebar"
        >
          {!isMobile && collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-0.5">
          {visibleItems.map((item) => (
            <NavSection key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/10" />

      {/* User section */}
      <div className="p-3 space-y-1">
        <Link href="/profile">
          <div
            data-testid="link-profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-green-100/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <User className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-medium text-white text-xs">{user?.fullName}</p>
                <p className="truncate text-[10px] text-green-200/60 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
        </Link>
        <button
          onClick={logout}
          data-testid="button-logout"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-green-100/80 hover:bg-red-500/20 hover:text-red-200 transition-all",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
