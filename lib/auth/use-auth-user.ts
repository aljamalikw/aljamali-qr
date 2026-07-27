"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { fetchUserRole } from "./get-user-role";
import { getRoleLabel, type AppRole } from "./roles";
import { getUserDisplayName, getUserInitials } from "./user-display";

export const OWNER_ROLE_LABEL = "Restaurant Owner";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>("restaurant_owner");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        const nextRole = await fetchUserRole(nextUser);
        if (mounted) setRole(nextRole);
      }

      if (mounted) setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName);

  return {
    user,
    loading,
    displayName,
    initials,
    role,
    roleLabel: getRoleLabel(role),
  };
}
