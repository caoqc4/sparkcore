"use client";

import { useEffect } from "react";
import {
  trackProductEvent,
  type ProductEventName,
  type ProductEventPayload
} from "@/lib/product/events";

type ProductEventTrackerProps = {
  event: ProductEventName;
  payload?: ProductEventPayload;
};

export function ProductEventTracker({
  event,
  payload
}: ProductEventTrackerProps) {
  useEffect(() => {
    trackProductEvent(event, payload ?? {});
  }, [event, payload]);

  return null;
}
