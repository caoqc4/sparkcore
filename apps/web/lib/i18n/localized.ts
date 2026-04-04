import type { AppLanguage } from "@/lib/i18n/site";

export type LocalizedValue<T> = {
  en: T;
  "zh-CN": T;
};

export function getLocalizedValue<T>(
  language: AppLanguage,
  value: LocalizedValue<T>,
): T {
  return value[language];
}
