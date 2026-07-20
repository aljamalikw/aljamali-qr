"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { MenuCategory } from "@/lib/saffron-garden/types";
import { initialMenuItems } from "@/lib/dashboard/menu/seed-data";
import type {
  AvailabilityFilter,
  DashboardMenuItem,
  MenuFormMode,
  MenuItemFormData,
  MenuSortOption,
} from "@/lib/dashboard/menu/types";
import {
  createEmptyFormData,
  duplicateMenuItem,
  filterAndSortMenuItems,
  formDataToMenuItem,
  generateMenuItemId,
  menuItemToFormData,
} from "@/lib/dashboard/menu/utils";
import { MenuToolbar } from "./MenuToolbar";
import { MenuTable } from "./MenuTable";
import { MenuEmptyState } from "./MenuEmptyState";
import { MenuTableSkeleton } from "./MenuTableSkeleton";
import {
  MenuItemFormDrawer,
} from "./MenuItemFormDrawer";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export function MenuManagement() {
  const [items, setItems] = useState<DashboardMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MenuCategory | "all">("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<MenuSortOption>("newest");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<MenuFormMode>("create");
  const [formData, setFormData] = useState<MenuItemFormData>(createEmptyFormData());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DashboardMenuItem | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(initialMenuItems);
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const filteredItems = useMemo(
    () =>
      filterAndSortMenuItems(items, {
        search,
        category,
        availability,
        sort,
      }),
    [items, search, category, availability, sort],
  );

  const openCreate = useCallback(() => {
    setFormMode("create");
    setFormData(createEmptyFormData());
    setEditingId(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((item: DashboardMenuItem) => {
    setFormMode("edit");
    setFormData(menuItemToFormData(item));
    setEditingId(item.id);
    setDrawerOpen(true);
  }, []);

  const handleSave = useCallback(
    (data: MenuItemFormData) => {
      if (formMode === "create") {
        const newItem = formDataToMenuItem(data, generateMenuItemId());
        setItems((prev) => [newItem, ...prev]);
      } else if (editingId) {
        const existing = items.find((i) => i.id === editingId);
        const updated = formDataToMenuItem(
          data,
          editingId,
          existing?.createdAt,
        );
        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item)),
        );
      }
      setDrawerOpen(false);
    },
    [formMode, editingId, items],
  );

  const handleDuplicate = useCallback((item: DashboardMenuItem) => {
    setItems((prev) => [duplicateMenuItem(item), ...prev]);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  const isEmpty = !loading && items.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {!isEmpty && (
        <MenuToolbar
          search={search}
          category={category}
          availability={availability}
          sort={sort}
          totalCount={items.length}
          filteredCount={filteredItems.length}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onAvailabilityChange={setAvailability}
          onSortChange={setSort}
          onAdd={openCreate}
        />
      )}

      {loading && (
        <div className="dashboard-card overflow-hidden rounded-2xl">
          <MenuTableSkeleton />
        </div>
      )}

      {!loading && isEmpty && <MenuEmptyState onAdd={openCreate} />}

      {!loading && !isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <MenuTable
            items={filteredItems}
            onEdit={openEdit}
            onDuplicate={handleDuplicate}
            onDelete={setDeleteTarget}
          />
        </motion.div>
      )}

      <MenuItemFormDrawer
        open={drawerOpen}
        mode={formMode}
        initialData={formData}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
      />

      <DeleteConfirmModal
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
