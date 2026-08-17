/**
 * Illustrative Aljamali QR dashboard preview for the marketing hero.
 * Uses the existing demo restaurant name "Saffron Garden" — not live customer data.
 */
export function HeroDashboardPreview() {
  const kpis = [
    { label: "QR Scans", value: "1,284" },
    { label: "Orders", value: "186" },
    { label: "Reservations", value: "42" },
    { label: "Revenue", value: "2.4k" },
  ] as const;

  const weekBars = [42, 58, 48, 72, 65, 88, 76];
  const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];

  const popular = [
    { name: "Grilled Sea Bass", meta: "42 orders" },
    { name: "Truffle Pasta", meta: "37 orders" },
    { name: "Signature Latte", meta: "29 orders" },
  ] as const;

  const recentOrders = [
    { id: "#1042", status: "Ready", amount: "18.5" },
    { id: "#1041", status: "Preparing", amount: "12.0" },
    { id: "#1040", status: "Completed", amount: "24.75" },
  ] as const;

  const reservations = [
    { time: "19:00", party: "Table 4 · 4 guests" },
    { time: "20:30", party: "Table 9 · 2 guests" },
  ] as const;

  return (
    <div
      className="relative mx-auto w-full max-w-xl lg:max-w-none"
      aria-label="Demo dashboard preview for Saffron Garden"
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gold/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-[#0b0a08] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-serif text-base font-semibold text-white sm:text-lg">
                Saffron Garden
              </p>
              <span className="shrink-0 rounded-full border border-gold/35 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                Demo
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/45">Professional Plan</p>
          </div>
          <span className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/50 sm:inline">
            Illustrative data
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                {kpi.label}
              </p>
              <p className="mt-1 font-serif text-lg font-bold text-white sm:text-xl">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border-t border-white/8 p-3 sm:p-4 lg:grid-cols-5">
          <div className="rounded-xl border border-white/8 bg-black/35 p-3 lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-white">Weekly Analytics</p>
              <p className="text-[10px] text-gold/70">Orders · Revenue · Reservations</p>
            </div>
            <div className="flex h-28 items-end gap-2 sm:h-32">
              {weekBars.map((height, index) => (
                <div key={`${weekLabels[index]}-${index}`} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#8a6d22] to-gold"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-white/35">{weekLabels[index]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-black/35 p-3 lg:col-span-2">
            <p className="text-xs font-semibold text-white">Popular Items</p>
            <ul className="mt-3 space-y-2.5">
              {popular.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-white/75">{item.name}</span>
                  <span className="shrink-0 text-gold/80">{item.meta}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/8 p-3 sm:grid-cols-3 sm:p-4">
          <div className="rounded-xl border border-white/8 bg-black/35 p-3 sm:col-span-1">
            <p className="text-xs font-semibold text-white">Recent Orders</p>
            <ul className="mt-3 space-y-2">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-white/70">
                    {order.id}{" "}
                    <span className="text-white/35">· {order.status}</span>
                  </span>
                  <span className="text-gold/80">{order.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/8 bg-black/35 p-3">
            <p className="text-xs font-semibold text-white">Today&apos;s Reservations</p>
            <ul className="mt-3 space-y-2">
              {reservations.map((row) => (
                <li key={row.time} className="text-[11px] text-white/70">
                  <span className="text-gold/80">{row.time}</span> · {row.party}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/8 bg-black/35 p-3">
            <p className="text-xs font-semibold text-white">Quick Actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Add Item", "New QR", "Campaign"].map((action) => (
                <span
                  key={action}
                  className="rounded-lg border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] font-medium text-gold"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
