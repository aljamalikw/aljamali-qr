"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { adminNavItems } from "@/lib/admin/nav-items";
import { signOut } from "@/lib/auth/sign-out";
import { DashboardIcon, getNavIcon } from "@/components/dashboard/icons/DashboardIcons";

interface AdminSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

function resolveIcon(id: string) {
  if (id === "demo-requests") return "tables" as const;
  if (id === "restaurants") return "categories" as const;
  if (id === "owners") return "views" as const;
  if (id === "reservations") return "tables" as const;
  if (id === "subscriptions") return "subscription" as const;
  if (id === "payments") return "subscription" as const;
  if (id === "announcements") return "bell" as const;
  if (id === "email-templates") return "menu-items" as const;
  return getNavIcon(id === "dashboard" ? "dashboard" : id);
}

export function AdminSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === "/admin" || pathname === "/admin/dashboard"
      : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-center border-b border-gold/10 px-4 py-5 ${
          collapsed ? "justify-center" : "gap-3"
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
          <DashboardIcon name="logo" className="h-5 w-5" />
        </span>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-w-0"
          >
            <p className="truncate font-serif text-base font-bold text-white">
              Aljamali <span className="text-gold">Admin</span>
            </p>
            <p className="truncate text-[11px] text-white/40">
              Platform Control
            </p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {adminNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-gold/15 text-gold shadow-sm shadow-gold/10"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <DashboardIcon
                name={resolveIcon(item.id)}
                className={`h-5 w-5 shrink-0 ${active ? "text-gold" : "text-white/50 group-hover:text-gold"}`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <span className="ms-auto h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-gold/10 p-3">
        <button
          type="button"
          onClick={() => signOut(router, "/admin/login")}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition-all duration-300 hover:bg-white/5 hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <DashboardIcon name="close" className="h-5 w-5 shrink-0 text-white/50" />
          {!collapsed && <span className="truncate">Logout</span>}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden w-full items-center justify-center gap-2 rounded-xl border border-gold/15 bg-surface-elevated px-3 py-2.5 text-sm text-white/60 transition-all duration-300 hover:border-gold/30 hover:text-gold lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <DashboardIcon
            name={collapsed ? "chevron-right" : "chevron-left"}
            className="h-4 w-4"
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="dashboard-sidebar fixed inset-y-0 start-0 z-50 hidden lg:block"
      >
        {sidebarContent}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="dashboard-sidebar fixed inset-y-0 start-0 z-50 w-[260px] lg:hidden"
          >
            <div className="flex items-center justify-end border-b border-gold/10 px-4 py-3">
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close menu"
              >
                <DashboardIcon name="close" className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
