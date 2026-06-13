"use client";

import { useCallback, useRef } from "react";
import { useWidgetStore } from "./useWidgetStore";
import type { CustomerInfo } from "./useWidgetStore";

const CACHE_KEY_PREFIX = "ph_customer_";
const DEBOUNCE_MS = 800;

export function useCustomerRecognition() {
  const { clinicId, setCustomer } = useWidgetStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recognizeByPhone = useCallback(
    async (rawPhone: string): Promise<CustomerInfo | null> => {
      if (!clinicId) return null;

      // Sanitize phone
      let phone = rawPhone.replace(/\D/g, "");
      if (phone.length === 12 && phone.startsWith("91")) phone = phone.slice(2);
      if (phone.length !== 10) return null;

      // Check sessionStorage cache first
      const cacheKey = `${CACHE_KEY_PREFIX}${clinicId}_${phone}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as CustomerInfo | null;
          setCustomer(parsed);
          return parsed;
        }
      } catch {
        // sessionStorage may not be available
      }

      try {
        const res = await fetch("/api/widget/recognize-customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinicId, phone }),
        });

        if (!res.ok) return null;

        const data = await res.json() as { found: boolean; customer?: CustomerInfo };

        const customer = data.found && data.customer ? data.customer : null;
        setCustomer(customer);

        // Cache in sessionStorage
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(customer));
        } catch {
          // ignore
        }

        return customer;
      } catch {
        return null;
      }
    },
    [clinicId, setCustomer]
  );

  /** Debounced version — call this on every phone input change */
  const recognizeDebounced = useCallback(
    (phone: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        recognizeByPhone(phone);
      }, DEBOUNCE_MS);
    },
    [recognizeByPhone]
  );

  return { recognizeByPhone, recognizeDebounced };
}
