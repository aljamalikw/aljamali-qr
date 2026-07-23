"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUserDisplayName, getUserInitials } from "./user-display";

export const OWNER_ROLE_LABEL = "Restaurant Owner";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName);

  return {
    user,
    loading,
    displayName,
    initials,
    roleLabel: OWNER_ROLE_LABEL,
  };
}
