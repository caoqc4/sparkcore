"use client";

import { useRef, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { setContentLanguage } from "@/app/actions/language";
import type { AppLanguage } from "@/lib/i18n/site";

type ContentLanguageSwitcherProps = {
  currentLanguage: AppLanguage;
  label: string;
  languages: Record<AppLanguage, string>;
};

export function ContentLanguageSwitcher({
  currentLanguage,
  label,
  languages,
}: ContentLanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const redirectPath = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.removeAttribute("open");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <details className="lang-switch-dropdown" ref={detailsRef}>
      <summary className="button button-secondary lang-switch-trigger" aria-label={label}>
        {languages[currentLanguage]}
        <span className="lang-switch-icon" aria-hidden="true">▾</span>
      </summary>
      <div className="lang-switch-menu">
        <p className="lang-switch-menu-label">{label}</p>
        {(["en", "zh-CN"] as const).map((language) => {
          const isActive = language === currentLanguage;
          return (
            <button
              key={language}
              className={`lang-switch-option${isActive ? " lang-switch-option-active" : ""}`}
              disabled={isPending || isActive}
              onClick={() => {
                if (detailsRef.current) detailsRef.current.removeAttribute("open");
                startTransition(async () => {
                  const formData = new FormData();
                  formData.set("language", language);
                  formData.set("redirect_path", redirectPath);
                  await setContentLanguage(formData);
                });
              }}
              type="button"
            >
              {languages[language]}
            </button>
          );
        })}
      </div>
    </details>
  );
}
