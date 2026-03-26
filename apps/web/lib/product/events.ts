"use client";

export type ProductEventName =
  | "landing_cta_click"
  | "create_started"
  | "create_completed"
  | "im_bind_started"
  | "im_bind_success"
  | "first_dashboard_view"
  | "relationship_summary_view"
  | "first_memory_view"
  | "memory_action_hide"
  | "memory_action_incorrect"
  | "memory_action_restore";

export type ProductEventPayload = Record<string, unknown>;

declare global {
  interface Window {
    __sparkcoreProductEvents?: Array<{
      name: ProductEventName;
      payload: ProductEventPayload;
      timestamp: string;
    }>;
  }
}

export function trackProductEvent(
  name: ProductEventName,
  payload: ProductEventPayload = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  const event = {
    name,
    payload,
    timestamp: new Date().toISOString()
  };

  window.__sparkcoreProductEvents = window.__sparkcoreProductEvents ?? [];
  window.__sparkcoreProductEvents.push(event);
  window.dispatchEvent(new CustomEvent("sparkcore:product-event", { detail: event }));

  if (process.env.NODE_ENV !== "production") {
    console.info("[sparkcore-product-event]", event);
  }
}
