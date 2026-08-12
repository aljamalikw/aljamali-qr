"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createOrder } from "@/lib/orders/createOrder";
import type { OrderType } from "@/lib/orders/types";
import type { OrderCartState } from "@/lib/orders/use-order-cart";
import { validateCreateOrder } from "@/lib/orders/validateCreateOrder";
import { formatPublicPrice } from "@/lib/public-menu/format-price";
import { t } from "@/lib/public-menu/i18n";
import type { PublicLanguage, PublicRestaurant } from "@/lib/public-menu/types";
import {
  planAllowsLoyalty,
  planAllowsOnlineOrdering,
} from "@/lib/subscriptions/plans";

type ReturningCustomer = {
  fullName: string | null;
  email: string | null;
  lastVisit: string | null;
  totalOrders: number;
  loyaltyPoints: number;
  enrolledInLoyalty: boolean;
};
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

const inputErrorClass =
  "w-full rounded-xl border border-red-400/50 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-red-400/60 focus:outline-none focus:ring-2 focus:ring-red-400/20";

const fieldMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type FieldErrors = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  deliveryAddress?: string;
};

export function OrderCart({ restaurant, cart, lang }: OrderCartProps) {
  const searchParams = useSearchParams();
  const qrTableNumber = searchParams.get("table")?.trim() ?? "";

  const [open, setOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("Dine In");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [tableNumber, setTableNumber] = useState(qrTableNumber);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [joinLoyalty, setJoinLoyalty] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [returningCustomer, setReturningCustomer] =
    useState<ReturningCustomer | null>(null);
  const [lookupPending, setLookupPending] = useState(false);

  const nameDirtyRef = useRef(false);
  const emailDirtyRef = useRef(false);
  const lookupSeqRef = useRef(0);

  const tableFromQr = Boolean(qrTableNumber);
  const loyaltyAvailable = planAllowsLoyalty(restaurant.subscriptionPlan);

  useEffect(() => {
    if (qrTableNumber) {
      setTableNumber(qrTableNumber);
    }
  }, [qrTableNumber]);

  useEffect(() => {
    const phone = customerPhone.trim();
    if (phone.length < 6) {
      setReturningCustomer(null);
      setLookupPending(false);
      return;
    }

    const seq = ++lookupSeqRef.current;
    setLookupPending(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({
            restaurantId: restaurant.id,
            phone,
          });
          const response = await fetch(`/api/customers/lookup?${params.toString()}`);
          const payload = (await response.json()) as {
            ok?: boolean;
            customer?: ReturningCustomer | null;
          };
          if (seq !== lookupSeqRef.current) return;

          const found = payload.ok ? (payload.customer ?? null) : null;
          setReturningCustomer(found);
          if (found) {
            if (!nameDirtyRef.current && found.fullName) {
              setCustomerName(found.fullName);
            }
            if (!emailDirtyRef.current && found.email) {
              setCustomerEmail(found.email);
            }
            if (found.enrolledInLoyalty && loyaltyAvailable) {
              setJoinLoyalty(true);
            }
          }
        } catch {
          if (seq === lookupSeqRef.current) {
            setReturningCustomer(null);
          }
        } finally {
          if (seq === lookupSeqRef.current) {
            setLookupPending(false);
          }
        }
      })();
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [customerPhone, restaurant.id, loyaltyAvailable]);

  if (restaurant.onlineOrderingEnabled === false) return null;
  if (!planAllowsOnlineOrdering(restaurant.subscriptionPlan)) return null;

  const resetForm = () => {
    setOrderType("Dine In");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setDeliveryAddress("");
    setLandmark("");
    setTableNumber(qrTableNumber);
    setSpecialInstructions("");
    setJoinLoyalty(false);
    setMarketingOptIn(false);
    setError(null);
    setFieldErrors({});
    setPlacedOrderNumber(null);
    setReturningCustomer(null);
    nameDirtyRef.current = false;
    emailDirtyRef.current = false;
  };

  const closeDrawer = () => {
    setOpen(false);
    if (placedOrderNumber) resetForm();
  };

  const localizedValidationMessage = (message: string): string => {
    if (message === "Your cart is empty.") return t("cartEmpty", lang);
    if (message === "Please confirm your table number.") return t("tableRequiredError", lang);
    if (message === "Please enter your full name (at least 2 characters).") {
      return t("nameRequiredError", lang);
    }
    if (message === "Please enter your mobile number.") {
      return t("phoneRequiredError", lang);
    }
    if (message === "Please enter a valid email address.") {
      return t("emailInvalidError", lang);
    }
    if (message === "Please enter a delivery address.") return t("deliveryAddress", lang);
    return message;
  };

  const validateInline = (): boolean => {
    const next: FieldErrors = {};
    const name = customerName.trim();
    const phone = customerPhone.trim();
    const email = customerEmail.trim();

    if (name.length < 2) {
      next.customerName = t("nameRequiredError", lang);
    }
    if (!phone) {
      next.customerPhone = t("phoneRequiredError", lang);
    }
    if (email && !isValidEmail(email)) {
      next.customerEmail = t("emailInvalidError", lang);
    }
    if (orderType === "Dine In" && !tableNumber.trim()) {
      next.tableNumber = t("tableRequiredError", lang);
    }
    if (orderType === "Delivery" && !deliveryAddress.trim()) {
      next.deliveryAddress = t("deliveryAddressRequiredError", lang);
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validateInline()) {
      return;
    }

    const payload = {
      orderType,
      customerName,
      customerPhone,
      customerEmail,
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
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      deliveryAddress: orderType === "Delivery" ? deliveryAddress : undefined,
      landmark: orderType === "Delivery" ? landmark.trim() || undefined : undefined,
      tableNumber: orderType === "Dine In" ? tableNumber : undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      joinLoyalty: loyaltyAvailable ? joinLoyalty : false,
      marketingOptIn,
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

  const formatVisit = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
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
        className="fixed bottom-5 end-5 z-40 flex items-center gap-2 rounded-full border border-gold/30 bg-gold px-5 py-3.5 text-sm font-bold text-black shadow-xl shadow-gold/25 transition-transform"
        aria-label={t("viewCart", lang)}
      >
        <span className="text-lg">🛒</span>
        {cart.totalCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[11px] font-bold text-gold">
            {cart.totalCount}
          </span>
        )}
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
              className="menu-drawer absolute inset-y-0 end-0 flex w-full max-w-md flex-col border-gold/10 sm:border-s"
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
                    <span className="text-4xl opacity-30">🛒</span>
                    <p className="mt-4 text-white/60">{t("cartEmpty", lang)}</p>
                    <p className="mt-1 text-sm text-white/35">{t("cartEmptyHint", lang)}</p>
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
                              setFieldErrors((prev) => ({
                                ...prev,
                                tableNumber: undefined,
                                deliveryAddress: undefined,
                              }));
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
                              <div>
                                <input
                                  value={tableNumber}
                                  onChange={(e) => {
                                    setTableNumber(e.target.value);
                                    setFieldErrors((prev) => ({
                                      ...prev,
                                      tableNumber: undefined,
                                    }));
                                  }}
                                  placeholder={`${t("tableNumber", lang)}*`}
                                  className={fieldErrors.tableNumber ? inputErrorClass : inputClass}
                                  aria-invalid={Boolean(fieldErrors.tableNumber)}
                                  required
                                />
                                {fieldErrors.tableNumber ? (
                                  <p className="mt-1 text-xs text-red-400">{fieldErrors.tableNumber}</p>
                                ) : null}
                              </div>
                            )}
                          </>
                        )}

                        {orderType === "Takeaway" && (
                          <p className="text-xs leading-relaxed text-white/45">
                            {t("takeawayCheckoutHint", lang)}
                          </p>
                        )}

                        {orderType === "Delivery" && (
                          <>
                            <p className="text-xs leading-relaxed text-white/45">
                              {t("deliveryCheckoutHint", lang)}
                            </p>
                            <div>
                              <textarea
                                value={deliveryAddress}
                                onChange={(e) => {
                                  setDeliveryAddress(e.target.value);
                                  setFieldErrors((prev) => ({
                                    ...prev,
                                    deliveryAddress: undefined,
                                  }));
                                }}
                                placeholder={`${t("deliveryAddress", lang)}*`}
                                rows={2}
                                className={
                                  fieldErrors.deliveryAddress ? inputErrorClass : inputClass
                                }
                                aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                                required
                              />
                              {fieldErrors.deliveryAddress ? (
                                <p className="mt-1 text-xs text-red-400">
                                  {fieldErrors.deliveryAddress}
                                </p>
                              ) : null}
                            </div>
                            <input
                              value={landmark}
                              onChange={(e) => setLandmark(e.target.value)}
                              placeholder={t("landmarkOptional", lang)}
                              className={inputClass}
                            />
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">
                        {t("customerInformation", lang)}
                      </h3>

                      {returningCustomer ? (
                        <div className="rounded-xl border border-gold/25 bg-gold/10 px-4 py-3">
                          <p className="font-serif text-sm font-semibold text-gold">
                            {t("welcomeBack", lang).replace(
                              "{name}",
                              returningCustomer.fullName?.trim() || t("guest", lang),
                            )}
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-white/40">
                                {t("lastVisit", lang)}
                              </p>
                              <p className="mt-0.5 text-xs text-white/80">
                                {formatVisit(returningCustomer.lastVisit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-white/40">
                                {t("totalOrders", lang)}
                              </p>
                              <p className="mt-0.5 text-xs text-white/80">
                                {returningCustomer.totalOrders}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-white/40">
                                {t("loyaltyPointsLabel", lang)}
                              </p>
                              <p className="mt-0.5 text-xs text-white/80">
                                {returningCustomer.loyaltyPoints}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : lookupPending ? (
                        <p className="text-xs text-white/40">{t("lookingUpCustomer", lang)}</p>
                      ) : null}

                      <div>
                        <input
                          value={customerName}
                          onChange={(e) => {
                            nameDirtyRef.current = true;
                            setCustomerName(e.target.value);
                            setFieldErrors((prev) => ({
                              ...prev,
                              customerName: undefined,
                            }));
                          }}
                          placeholder={`${t("fullName", lang)}*`}
                          className={fieldErrors.customerName ? inputErrorClass : inputClass}
                          aria-invalid={Boolean(fieldErrors.customerName)}
                          autoComplete="name"
                          required
                        />
                        {fieldErrors.customerName ? (
                          <p className="mt-1 text-xs text-red-400">{fieldErrors.customerName}</p>
                        ) : null}
                      </div>

                      <div>
                        <input
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            setFieldErrors((prev) => ({
                              ...prev,
                              customerPhone: undefined,
                            }));
                          }}
                          placeholder={`${t("mobileNumber", lang)}*`}
                          type="tel"
                          inputMode="tel"
                          className={fieldErrors.customerPhone ? inputErrorClass : inputClass}
                          aria-invalid={Boolean(fieldErrors.customerPhone)}
                          autoComplete="tel"
                          required
                        />
                        {fieldErrors.customerPhone ? (
                          <p className="mt-1 text-xs text-red-400">{fieldErrors.customerPhone}</p>
                        ) : null}
                      </div>

                      <div>
                        <input
                          value={customerEmail}
                          onChange={(e) => {
                            emailDirtyRef.current = true;
                            setCustomerEmail(e.target.value);
                            setFieldErrors((prev) => ({
                              ...prev,
                              customerEmail: undefined,
                            }));
                          }}
                          placeholder={t("emailOptional", lang)}
                          type="email"
                          autoComplete="email"
                          className={fieldErrors.customerEmail ? inputErrorClass : inputClass}
                          aria-invalid={Boolean(fieldErrors.customerEmail)}
                        />
                        {fieldErrors.customerEmail ? (
                          <p className="mt-1 text-xs text-red-400">{fieldErrors.customerEmail}</p>
                        ) : null}
                      </div>

                      <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder={t("orderNotesOptional", lang)}
                        rows={2}
                        className={inputClass}
                      />

                      <div className="space-y-2.5 pt-1">
                        {loyaltyAvailable ? (
                          <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80">
                            <input
                              type="checkbox"
                              checked={joinLoyalty}
                              onChange={(e) => setJoinLoyalty(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/40 text-gold focus:ring-gold/30"
                            />
                            <span>{t("joinLoyaltyRewards", lang)}</span>
                          </label>
                        ) : null}
                        <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80">
                          <input
                            type="checkbox"
                            checked={marketingOptIn}
                            onChange={(e) => setMarketingOptIn(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/40 text-gold focus:ring-gold/30"
                          />
                          <span>{t("receivePromotions", lang)}</span>
                        </label>
                      </div>
                    </div>

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
