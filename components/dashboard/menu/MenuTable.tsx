import type { ReactNode } from "react";
import Image from "next/image";
import type { DashboardMenuItem } from "@/lib/dashboard/menu/types";
import {
  formatMenuPrice,
  getCategoryLabel,
} from "@/lib/dashboard/menu/utils";
import { MenuBadges } from "./MenuBadges";
import { MenuStatusBadge } from "./MenuStatusBadge";
import { MenuIcon } from "./icons/MenuIcons";

interface MenuTableProps {
  items: DashboardMenuItem[];
  onEdit: (item: DashboardMenuItem) => void;
  onDuplicate: (item: DashboardMenuItem) => void;
  onDelete: (item: DashboardMenuItem) => void;
}

function ActionButton({
  label,
  onClick,
  variant = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 transition-all duration-200 ${
        variant === "danger"
          ? "text-white/45 hover:bg-red-500/10 hover:text-red-400"
          : "text-white/45 hover:bg-gold/10 hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

function MenuRowActions({
  item,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  item: DashboardMenuItem;
  onEdit: (item: DashboardMenuItem) => void;
  onDuplicate: (item: DashboardMenuItem) => void;
  onDelete: (item: DashboardMenuItem) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <ActionButton label="Edit" onClick={() => onEdit(item)}>
        <MenuIcon name="edit" className="h-4 w-4" />
      </ActionButton>
      <ActionButton label="Duplicate" onClick={() => onDuplicate(item)}>
        <MenuIcon name="duplicate" className="h-4 w-4" />
      </ActionButton>
      <ActionButton label="Delete" onClick={() => onDelete(item)} variant="danger">
        <MenuIcon name="delete" className="h-4 w-4" />
      </ActionButton>
    </div>
  );
}

export function MenuTable({
  items,
  onEdit,
  onDuplicate,
  onDelete,
}: MenuTableProps) {
  if (items.length === 0) {
    return (
      <div className="dashboard-card rounded-2xl p-10 text-center">
        <p className="text-white/45">No dishes match your current filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="dashboard-card hidden overflow-hidden rounded-2xl md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-gold/10 bg-black/30">
                {["Photo", "Name", "Category", "Price", "Status", "Badges", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/40"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="group border-b border-white/5 transition-colors duration-200 last:border-0 hover:bg-gold/[0.03]"
                >
                  <td className="px-5 py-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-gold/10">
                      <Image
                        src={item.image}
                        alt={item.name.en}
                        fill
                        sizes="48px"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        unoptimized={item.image.startsWith("data:")}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-white transition-colors group-hover:text-gold-light">
                      {item.name.en}
                    </p>
                    <p className="mt-0.5 text-xs text-white/40 font-arabic" dir="rtl">
                      {item.name.ar}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-white/60">
                    {getCategoryLabel(item.category)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-serif font-semibold text-gold">
                      {formatMenuPrice(item.price)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <MenuStatusBadge available={item.available} />
                  </td>
                  <td className="px-5 py-4">
                    <MenuBadges item={item} />
                  </td>
                  <td className="px-5 py-4">
                    <MenuRowActions
                      item={item}
                      onEdit={onEdit}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="dashboard-card rounded-2xl p-4 transition-all duration-200 hover:border-gold/25"
          >
            <div className="flex gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gold/10">
                <Image
                  src={item.image}
                  alt={item.name.en}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized={item.image.startsWith("data:")}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{item.name.en}</p>
                    <p className="truncate text-xs text-white/40 font-arabic" dir="rtl">
                      {item.name.ar}
                    </p>
                  </div>
                  <span className="shrink-0 font-serif text-sm font-semibold text-gold">
                    {formatMenuPrice(item.price)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/45">
                    {getCategoryLabel(item.category)}
                  </span>
                  <MenuStatusBadge available={item.available} />
                </div>

                <div className="mt-2">
                  <MenuBadges item={item} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-white/5 pt-3">
              <MenuRowActions
                item={item}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
