"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createOrder } from "@/lib/orders/createOrder";
import type { OrderType } from "@/lib/orders/types";
import type { OrderCartState } from "@/lib/orders/use-order-cart";
import { validateCreateOrder } from "@/lib/orders/validateCreateOrder";
import { formatPublicPrice } from "@/lib/public-menu/format-price";
import { t } from "@/lib/public-menu/i18n";
import type { PublicLanguage, PublicRestaurant } from "@/lib/public-menu/types";

interface OrderCartProps {
  restaurant: PublicRestaurant;
  cart: OrderCartState;
  lang: PublicLanguage;
}

const ORDER_TYPE_OPTIONS: { value: OrderType; key: "dineIn" | "takeaway" | "delivery" }[] = [
  { value: "Dine In", key: "dineIn" },
  { value: "Takeaway", key: "takeaway" },
  { value: "Delivery", key: "delivery" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

const fieldMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

export function OrderCart({ restaurant, cart, lang }: OrderCartProps) {
  const searchParams = useSearchParams();
  const qrTableNumber = searchParams.get("table")?.trim() ?? "";

  const [open, setOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("Dine In");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [tableNumber, setTableNumber] = useState(qrTableNumber);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);

  const tableFromQr = Boolean(qrTableNumber);

  useEffect(() => {
    if (qrTableNumber) {
      setTableNumber(qrTableNumber);
    }
  }, [qrTableNumber]);

  if (restaurant.onlineOrderingEnabled === false) return null;

  const resetForm = () => {
    setOrderType("Dine In");
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setLandmark("");
    setTableNumber(qrTableNumber);
    setSpecialInstructions("");
    setError(null);
    setPlacedOrderNumber(null);
  };

  const closeDrawer = () => {
    setOpen(false);
    if (placedOrderNumber) resetForm();
  };

  const localizedValidationMessage = (message: string): string => {
    if (message === "Your cart is empty.") return t("cartEmpty", lang);
    if (message === "Please confirm your table number.") return t("tableRequiredError", lang);
    if (message === "Please enter your name and phone number.") {
      return lang === "ar"
        ? "الرجاء إدخال الاسم ورقم الهاتف."
        : "Please enter your name and phone number.";
    }
    if (message === "Please enter a delivery address.") return t("deliveryAddress", lang);
    return message;
  };

  const handleSubmit = async () => {
    setError(null);

    const payload = {
      orderType,
      customerName,
      customerPhone,
      deliveryAddress,
      landmark,
      tableNumber,
      items: cart.lines.map((line) => ({
        menuItemId: line.menuItemId,
        itemName: line.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        notes: line.notes.trim() || undefined,
      })),
    };

    const validation = validateCreateOrder(payload);
    if (!validation.ok) {
      setError(localizedValidationMessage(validation.message));
      return;
    }

    setSubmitting(true);
    const result = await createOrder({
      restaurantId: restaurant.id,
      orderType,
      customerName: orderType === "Dine In" ? undefined : customerName.trim() || undefined,
      customerPhone: orderType === "Dine In" ? undefined : customerPhone.trim() || undefined,
      deliveryAddress: orderType === "Delivery" ? deliveryAddress : undefined,
      landmark: orderType === "Delivery" ? landmark.trim() || undefined : undefined,
      tableNumber: orderType === "Dine In" ? tableNumber : undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      items: payload.items,
      taxRate: restaurant.taxRate,
      currency: restaurant.currency,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setPlacedOrderNumber(result.data.orderNumber);
    cart.clearCart();
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-5 end-5 z-40 flex items-center gap-2.5 rounded-full border border-gold/40 bg-gradient-to-r from-[#e8c547] via-gold to-[#b8942e] px-5 py-3.5 text-sm font-bold text-black shadow-[0_12px_40px_rgba(212,175,55,0.35)]"
        aria-label={t("viewCart", lang)}
      >
        <span className="text-lg" aria-hidden="true">
          🛒
        </span>
        <span className="hidden sm:inline">{t("viewCart", lang)}</span>
        {cart.totalCount > 0 && (
          <motion.span
            key={cart.totalCount}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-bold text-gold"
          >
            {cart.totalCount}
          </motion.span>
        )}
        {cart.totalCount > 0 ? (
          <span className="hidden text-xs font-semibold opacity-80 sm:inline">
            {formatPublicPrice(cart.subtotal, restaurant.currency, lang)}
          </span>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="order-cart-shell"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: lang === "ar" ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: lang === "ar" ? "-100%" : "100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="menu-drawer absolute inset-y-0 end-0 flex w-full max-w-md flex-col border-gold/20 bg-[#0b0b0b]/95 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:border-s"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
                <h2 className="font-serif text-xl font-bold text-white">{t("yourCart", lang)}</h2>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label={t("close", lang)}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {placedOrderNumber ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center py-10 text-center"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-300">
                      ✓
                    </span>
                    <h3 className="mt-5 font-serif text-xl font-bold text-white">
                      {t("orderPlacedTitle", lang)}
                    </h3>
                    <p className="mt-2 text-sm text-white/55">{t("orderPlacedDesc", lang)}</p>
                    <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2">
                      <p className="text-xs uppercase tracking-wider text-white/45">
                        {t("orderNumberLabel", lang)}
                      </p>
                      <p className="font-serif text-lg font-bold text-gold">{placedOrderNumber}</p>
                    </div>
                    <button type="button" onClick={resetForm} className="menu-btn-primary mt-6">
                      {t("startNewOrder", lang)}
                    </button>
                  </motion.div>
                ) : cart.lines.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-4xl">
                      🛒
                    </div>
                    <p className="mt-5 font-serif text-lg text-white/80">{t("cartEmpty", lang)}</p>
                    <p className="mt-1 max-w-[220px] text-sm text-white/40">{t("cartEmptyHint", lang)}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      {cart.lines.map((line) => (
                        <div
                          key={line.key}
                          className="rounded-xl border border-white/10 bg-black/20 p-3.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">{line.name}</p>
                              <p className="mt-0.5 text-xs text-white/45">
                                {formatPublicPrice(line.unitPrice, restaurant.currency, lang)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => cart.removeLine(line.key)}
                              className="shrink-0 text-white/35 transition-colors hover:text-red-400"
                              aria-label="Remove"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-1.5 py-1">
                              <button
                                type="button"
                                onClick={() => cart.decrementLine(line.key)}
                                className="flex h-6 w-6 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
                              >
                                −
                              </button>
                              <span className="min-w-4 text-center text-sm text-white">{line.quantity}</span>
                              <button
                                type="button"
                                onClick={() => cart.incrementLine(line.key)}
                                className="flex h-6 w-6 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-serif text-sm font-bold text-gold">
                              {formatPublicPrice(line.unitPrice * line.quantity, restaurant.currency, lang)}
                            </span>
                          </div>
                          <input
                            value={line.notes}
                            onChange={(e) => cart.updateLineNotes(line.key, e.target.value)}
                            placeholder={t("itemNotesPlaceholder", lang)}
                            className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
                        {t("orderType", lang)}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {ORDER_TYPE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setOrderType(option.value);
                              setError(null);
                            }}
                            className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                              orderType === option.value
                                ? "border-gold/40 bg-gold/15 text-gold"
                                : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"
                            }`}
                          >
                            {t(option.key, lang)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={orderType}
                        {...fieldMotion}
                        className="space-y-3"
                      >
                        {orderType === "Dine In" && (
                          <>
                            <p className="text-xs leading-relaxed text-white/45">
                              {t("dineInCheckoutHint", lang)}
                            </p>
                            {tableFromQr ? (
                              <div className="rounded-xl border border-gold/25 bg-gold/10 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gold/70">
                                  {t("tableNumberDetected", lang)}
                                </p>
                                <p className="mt-1 font-serif text-lg font-bold text-gold">
                                  {tableNumber}
                                </p>
                              </div>
                            ) : (
                              <input
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                placeholder={`${t("tableNumber", lang)}*`}
                                className={inputClass}
                                required
                              />
                            )}
                            <textarea
                              value={specialInstructions}
                              onChange={(e) => setSpecialInstructions(e.target.value)}
                              placeholder={t("orderNotesOptional", lang)}
                              rows={2}
                              className={inputClass}
                            />
                          </>
                        )}

                        {orderType === "Takeaway" && (
                          <>
                            <p className="text-xs leading-relaxed text-white/45">
                              {t("takeawayCheckoutHint", lang)}
                            </p>
                            <input
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder={t("nameOptional", lang)}
                              className={inputClass}
                            />
                            <input
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder={t("phoneOptional", lang)}
                              type="tel"
                              className={inputClass}
                            />
                            <textarea
                              value={specialInstructions}
                              onChange={(e) => setSpecialInstructions(e.target.value)}
                              placeholder={t("specialInstructionsPlaceholder", lang)}
                              rows={2}
                              className={inputClass}
                            />
                          </>
                        )}

                        {orderType === "Delivery" && (
                          <>
                            <p className="text-xs leading-relaxed text-white/45">
                              {t("deliveryCheckoutHint", lang)}
                            </p>
                            <input
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder={`${t("fullName", lang)}*`}
                              className={inputClass}
                              required
                            />
                            <input
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder={`${t("phoneNumber", lang)}*`}
                              type="tel"
                              className={inputClass}
                              required
                            />
                            <textarea
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder={`${t("deliveryAddress", lang)}*`}
                              rows={2}
                              className={inputClass}
                              required
                            />
                            <input
                              value={landmark}
                              onChange={(e) => setLandmark(e.target.value)}
                              placeholder={t("landmarkOptional", lang)}
                              className={inputClass}
                            />
                            <textarea
                              value={specialInstructions}
                              onChange={(e) => setSpecialInstructions(e.target.value)}
                              placeholder={t("orderNotesOptional", lang)}
                              rows={2}
                              className={inputClass}
                            />
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between text-sm text-white/60">
                        <span>{t("subtotal", lang)}</span>
                        <span>{formatPublicPrice(cart.subtotal, restaurant.currency, lang)}</span>
                      </div>
                      {restaurant.taxRate > 0 && (
                        <div className="flex items-center justify-between text-sm text-white/60">
                          <span>
                            {t("tax", lang)} ({restaurant.taxRate}%)
                          </span>
                          <span>{formatPublicPrice(cart.taxAmount, restaurant.currency, lang)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-white/10 pt-2 font-serif text-base font-bold text-white">
                        <span>{t("grandTotal", lang)}</span>
                        <span className="text-gold">
                          {formatPublicPrice(cart.grandTotal, restaurant.currency, lang)}
                        </span>
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={submitting}
                      className="menu-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? t("placingOrder", lang) : t("placeOrder", lang)}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
