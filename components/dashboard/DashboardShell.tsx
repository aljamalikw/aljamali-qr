"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ImpersonationBannerHost } from "./ImpersonationBannerHost";
import { RestaurantProvider } from "./RestaurantProvider";
import { SubscriptionAccessProvider } from "./SubscriptionAccessProvider";
import { SubscriptionLockBanner } from "./SubscriptionLockBanner";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface DashboardShellProps {
  children: React.ReactNode;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarWidth = collapsed ? 80 : 260;

  return (
    <AuthGuard>
      <RestaurantProvider>
        <SubscriptionAccessProvider>
          <div className="min-h-screen bg-background">
            <Sidebar
              collapsed={collapsed}
              mobileOpen={mobileOpen}
              onToggleCollapse={() => setCollapsed((prev) => !prev)}
              onCloseMobile={() => setMobileOpen(false)}
            />

            <motion.div
              initial={false}
              animate={{ marginInlineStart: isDesktop ? sidebarWidth : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-screen"
            >
              <TopBar onOpenMobileMenu={() => setMobileOpen(true)} />
              <main className="px-4 pb-10 pt-2 sm:px-6 lg:px-8">
                <ImpersonationBannerHost />
                <SubscriptionLockBanner />
                {children}
              </main>
            </motion.div>
          </div>
        </SubscriptionAccessProvider>
      </RestaurantProvider>
    </AuthGuard>
  );
}
