"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMenuCategoryOptions,
  type MenuCategoryOption,
} from "./menu-options";

export function useMenuCategoryOptions() {
  const [categories, setCategories] = useState<MenuCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const result = await fetchMenuCategoryOptions();
    setLoading(false);

    if (result.ok) {
      setCategories(result.data);
    } else {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return { categories, loading, reload: loadCategories };
}
