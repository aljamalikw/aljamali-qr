"use client";

import { useEffect, useState } from "react";
import {
  fetchImpersonationState,
  type ImpersonationState,
} from "@/lib/admin/impersonation-client";
import { ImpersonationBanner } from "./ImpersonationBanner";

export function ImpersonationBannerHost() {
  const [state, setState] = useState<ImpersonationState | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchImpersonationState().then((result) => {
      if (!mounted) return;
      if (result.ok) setState(result.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!state?.active || !state.restaurantName) return null;

  return <ImpersonationBanner restaurantName={state.restaurantName} />;
}
