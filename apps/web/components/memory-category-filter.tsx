"use client";

import { useState } from "react";
import {
  hideProductMemory,
  markProductMemoryIncorrect,
} from "@/app/app/memory/actions";
import type { AppLanguage } from "@/lib/i18n/site";

export type MemoryFilterItem = {
  id: string;
  categoryLabel: string;
  content: string;
  status: string;
  scope: string;
  createdAt: string;
  sourceThreadTitle: string | null;
  sourceThreadId: string | null;
};

const CATEGORY_DEFS = [
  {
    key: "Identity & Profile",
    icon: "◉",
    short: "Identity",
    empty: "Background, job, location, and core details will appear here as you chat.",
  },
  {
    key: "Preferences",
    icon: "♡",
    short: "Preferences",
    empty: "Likes, dislikes, habits, and personal tastes will be saved here.",
  },
  {
    key: "Relationship Status",
    icon: "◈",
    short: "Relationship",
    empty: "Emotional milestones and relationship context will appear here.",
  },
  {
    key: "Goals",
    icon: "◎",
    short: "Goals",
    empty: "Plans, aspirations, and intentions will be tracked here.",
  },
  {
    key: "Experiences",
    icon: "◇",
    short: "Experiences",
    empty: "Events you mention — trips, challenges, milestones — become shared memories.",
  },
  {
    key: "Emotional State",
    icon: "◐",
    short: "Mood",
    empty: "Recent moods and emotional context will be remembered here.",
  },
  {
    key: "Key Dates",
    icon: "◻",
    short: "Key Dates",
    empty: "Birthdays, anniversaries, and upcoming events will be saved here.",
  },
  {
    key: "Social Circle",
    icon: "◑",
    short: "Social",
    empty: "People you mention — names, roles, and context — will build up here.",
  },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  items: MemoryFilterItem[];
  redirectTo: string;
  language?: AppLanguage;
};

export function MemoryCategoryFilter({ items, redirectTo, language = "en" }: Props) {
  const isZh = language === "zh-CN";
  const [activeKey, setActiveKey] = useState<string>("all");

  const countByCategory = new Map<string, number>();
  for (const item of items) {
    const k = item.categoryLabel;
    countByCategory.set(k, (countByCategory.get(k) ?? 0) + 1);
  }

  const visibleItems =
    activeKey === "all"
      ? items
      : items.filter((i) => i.categoryLabel === activeKey);

  const activeDef =
    activeKey !== "all"
      ? CATEGORY_DEFS.find((d) => d.key === activeKey) ?? null
      : null;
  const categoryLabels = new Map<string, string>([
    ["Identity & Profile", isZh ? "身份与资料" : "Identity"],
    ["Preferences", isZh ? "偏好" : "Preferences"],
    ["Relationship Status", isZh ? "关系状态" : "Relationship"],
    ["Goals", isZh ? "目标" : "Goals"],
    ["Experiences", isZh ? "经历" : "Experiences"],
    ["Emotional State", isZh ? "情绪" : "Mood"],
    ["Key Dates", isZh ? "关键日期" : "Key Dates"],
    ["Social Circle", isZh ? "社交圈" : "Social"],
  ]);

  return (
    <div className="mcf-root">
      {/* ── Filter pills ── */}
      <div className="mcf-pills" role="tablist" aria-label={isZh ? "按类别筛选" : "Filter by category"}>
        <button
          role="tab"
          type="button"
          aria-selected={activeKey === "all"}
          className={`mcf-pill${activeKey === "all" ? " active" : ""}`}
          onClick={() => setActiveKey("all")}
        >
          {isZh ? "全部" : "All"}
          {items.length > 0 ? (
            <span className="mcf-pill-count">{items.length}</span>
          ) : null}
        </button>
        {CATEGORY_DEFS.map((def) => {
          const count = countByCategory.get(def.key) ?? 0;
          return (
            <button
              key={def.key}
              role="tab"
              type="button"
              aria-selected={activeKey === def.key}
              className={`mcf-pill${activeKey === def.key ? " active" : ""}${count === 0 ? " empty" : ""}`}
              onClick={() => setActiveKey(def.key)}
            >
              <span aria-hidden="true">{def.icon}</span>
              {categoryLabels.get(def.key) ?? def.short}
              {count > 0 ? (
                <span className="mcf-pill-count">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── Items or empty state ── */}
      <div className="mcf-body">
        {visibleItems.length > 0 ? (
          <div className="mcf-item-list">
            {visibleItems.map((item) => (
              <div key={item.id} className="mcf-item">
                {/* Header row: category + scope + date */}
                <div className="mcf-item-header">
                  <span className="mcf-item-category">{item.categoryLabel}</span>
                  <span
                    className={`mcf-item-scope${item.scope === "thread_local" ? " local" : ""}`}
                  >
                    {item.scope === "thread_local" ? (isZh ? "近期" : "Recent") : isZh ? "长期" : "Long-term"}
                  </span>
                  <span className="mcf-item-date">{formatDate(item.createdAt)}</span>
                </div>

                {/* Content */}
                <p className="mcf-item-content">{item.content}</p>

                {/* Footer row: source + actions */}
                <div className="mcf-item-footer">
                  {item.sourceThreadId ? (
                    <a
                      className="mcf-item-source"
                      href={`/app/chat?thread=${item.sourceThreadId}`}
                    >
                      {isZh ? "来自：" : "From: "} {item.sourceThreadTitle ?? (isZh ? "查看来源对话" : "View source thread")}
                    </a>
                  ) : (
                    <span />
                  )}
                  <div className="mcf-item-actions">
                    <form action={hideProductMemory}>
                      <input type="hidden" name="memory_id" value={item.id} />
                      <input type="hidden" name="redirect_to" value={redirectTo} />
                      <button type="submit" className="mcf-action-btn">
                        {isZh ? "隐藏" : "Hide"}
                      </button>
                    </form>
                    <form action={markProductMemoryIncorrect}>
                      <input type="hidden" name="memory_id" value={item.id} />
                      <input type="hidden" name="redirect_to" value={redirectTo} />
                      <button type="submit" className="mcf-action-btn">
                        {isZh ? "标记错误" : "Mark wrong"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mcf-empty">
            {activeDef ? (
              <>
                <span className="mcf-empty-icon" aria-hidden="true">
                  {activeDef.icon}
                </span>
                <p className="mcf-empty-hint">{activeDef.empty}</p>
              </>
            ) : (
              <p className="mcf-empty-hint">{isZh ? "还没有已保存的记忆。" : "No memories saved yet."}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
