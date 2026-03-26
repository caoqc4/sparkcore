"use client";

import Link from "next/link";
import {
  trackProductEvent,
  type ProductEventName,
  type ProductEventPayload
} from "@/lib/product/events";

type TrackedLinkProps = {
  href: string;
  className?: string;
  event: ProductEventName;
  payload?: ProductEventPayload;
  children: React.ReactNode;
};

export function TrackedLink({
  href,
  className,
  event,
  payload,
  children
}: TrackedLinkProps) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => trackProductEvent(event, payload ?? {})}
    >
      {children}
    </Link>
  );
}
