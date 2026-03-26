"use client";

import { useFormStatus } from "react-dom";
import {
  trackProductEvent,
  type ProductEventName,
  type ProductEventPayload
} from "@/lib/product/events";

type FormSubmitButtonProps = {
  idleText: string;
  pendingText: string;
  className?: string;
  eventName?: ProductEventName;
  eventPayload?: ProductEventPayload;
};

export function FormSubmitButton({
  idleText,
  pendingText,
  className,
  eventName,
  eventPayload
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className ?? "button"}
      disabled={pending}
      onClick={() => {
        if (eventName) {
          trackProductEvent(eventName, eventPayload ?? {});
        }
      }}
      type="submit"
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
