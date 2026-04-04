"use client";

import { useState } from "react";
import type { AppLanguage } from "@/lib/i18n/site";

type DeleteAccountConfirmProps = {
  action: (formData: FormData) => Promise<void>;
  redirectTo: string;
  language?: AppLanguage;
};

export function DeleteAccountConfirm({ action, redirectTo, language = "en" }: DeleteAccountConfirmProps) {
  const isZh = language === "zh-CN";
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="button button-danger settings-danger-btn"
        onClick={() => setOpen(true)}
        type="button"
      >
        {isZh ? "删除账户" : "Delete account"}
      </button>

      {open && (
        <div
          aria-hidden="true"
          className="settings-upgrade-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            aria-labelledby="delete-account-title"
            aria-modal="true"
            className="settings-upgrade-dialog delete-account-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="settings-upgrade-head">
              <h3 className="settings-upgrade-title delete-account-title" id="delete-account-title">
                {isZh ? "确认删除账户？" : "Delete your account?"}
              </h3>
              <button
                aria-label={isZh ? "关闭" : "Close"}
                className="settings-upgrade-close"
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="settings-upgrade-copy delete-account-copy">
              {isZh
                ? "这会永久删除你的账户、所有角色、记忆和聊天记录，而且无法撤销。"
                : "This will permanently remove your account, all companions, memory, and chat history. This action cannot be undone."}
            </p>
            <form action={action} className="settings-upgrade-actions">
              <input name="redirect_to" type="hidden" value={redirectTo} />
              <button
                className="button button-secondary"
                onClick={() => setOpen(false)}
                type="button"
              >
                {isZh ? "取消" : "Cancel"}
              </button>
              <button className="button button-danger" type="submit">
                {isZh ? "删除账户" : "Delete account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
