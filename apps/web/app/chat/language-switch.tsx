"use client";

import { useFormStatus } from "react-dom";
import type { ChatLocale } from "@/lib/i18n/chat-ui";

type LanguageSwitchProps = {
  action: (formData: FormData) => void;
  currentLocale: ChatLocale;
  redirectPath: string;
  label: string;
  languages: Record<ChatLocale, string>;
};

function LanguageButton({
  value,
  currentLocale,
  children
}: {
  value: ChatLocale;
  currentLocale: ChatLocale;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`button button-secondary language-switch-button ${
        currentLocale === value ? "language-switch-button-active" : ""
      }`}
      disabled={pending}
      name="language"
      type="submit"
      value={value}
    >
      {children}
    </button>
  );
}

export function LanguageSwitch({
  action,
  currentLocale,
  redirectPath,
  label,
  languages
}: LanguageSwitchProps) {
  return (
    <form action={action} className="language-switch">
      <input name="redirect_path" type="hidden" value={redirectPath} />
      <span className="language-switch-label">{label}</span>
      <LanguageButton currentLocale={currentLocale} value="en">
        {languages.en}
      </LanguageButton>
      <LanguageButton currentLocale={currentLocale} value="zh-CN">
        {languages["zh-CN"]}
      </LanguageButton>
    </form>
  );
}
