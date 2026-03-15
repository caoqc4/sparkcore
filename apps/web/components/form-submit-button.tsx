"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  idleText: string;
  pendingText: string;
  className?: string;
};

export function FormSubmitButton({
  idleText,
  pendingText,
  className
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className ?? "button"} disabled={pending} type="submit">
      {pending ? pendingText : idleText}
    </button>
  );
}
