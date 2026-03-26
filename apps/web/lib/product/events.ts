"use client";

import posthog from "posthog-js";

export type ProductEventName =
  | "landing_cta_click"
  | "create_started"
  | "create_completed"
  | "im_bind_started"
  | "im_bind_success"
  | "first_dashboard_view"
  | "first_privacy_view"
  | "relationship_summary_view"
  | "first_supplementary_chat_view"
  | "supplementary_chat_send"
  | "first_memory_view"
  | "memory_action_hide"
  | "memory_action_incorrect"
  | "memory_action_restore";

export type ProductEventPayload = Record<string, unknown>;

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
    __sparkcoreProductEvents?: Array<{
      name: ProductEventName;
      payload: ProductEventPayload;
      timestamp: string;
    }>;
    __sparkcorePostHogReady?: boolean;
  }
}

function sanitizeCurrentPath() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.pathname;
}

function sanitizePayload(payload: ProductEventPayload) {
  const sanitized: ProductEventPayload = {};

  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey.includes("thread") ||
      normalizedKey.includes("agent") ||
      normalizedKey.includes("content") ||
      normalizedKey.includes("message")
    ) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

function buildEventPayload(payload: ProductEventPayload) {
  return {
    ...sanitizePayload(payload),
    current_path: sanitizeCurrentPath()
  };
}

function syncClarityTags(name: ProductEventName, payload: ProductEventPayload) {
  if (typeof window === "undefined" || typeof window.clarity !== "function") {
    return;
  }

  const currentPath = sanitizeCurrentPath();

  window.clarity("set", "product_event", name);

  if (currentPath) {
    window.clarity("set", "product_path", currentPath);
  }

  if (typeof payload.surface === "string") {
    window.clarity("set", "product_surface", payload.surface);
  }

  if (typeof payload.platform === "string") {
    window.clarity("set", "product_platform", payload.platform);
  }

  if (typeof payload.relationship_state === "string") {
    window.clarity("set", "relationship_state", payload.relationship_state);
  }
}

export function initProductAnalytics(args: {
  apiKey: string;
  apiHost: string;
}) {
  if (typeof window === "undefined" || window.__sparkcorePostHogReady) {
    return;
  }

  posthog.init(args.apiKey, {
    api_host: args.apiHost,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    persistence: "localStorage+cookie",
    loaded: () => {
      window.__sparkcorePostHogReady = true;

      for (const queuedEvent of window.__sparkcoreProductEvents ?? []) {
        posthog.capture(queuedEvent.name, buildEventPayload(queuedEvent.payload));
      }
    }
  });
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
  syncClarityTags(name, payload);

  if (window.__sparkcorePostHogReady) {
    posthog.capture(name, buildEventPayload(payload));
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[sparkcore-product-event]", event);
  }
}
