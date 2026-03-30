"use client";

import { useState } from "react";

type DeleteAccountConfirmProps = {
  action: (formData: FormData) => Promise<void>;
  redirectTo: string;
};

export function DeleteAccountConfirm({ action, redirectTo }: DeleteAccountConfirmProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="button button-danger settings-danger-btn"
        onClick={() => setOpen(true)}
        type="button"
      >
        Delete account
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
                Delete your account?
              </h3>
              <button
                aria-label="Close"
                className="settings-upgrade-close"
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="settings-upgrade-copy delete-account-copy">
              This will permanently remove your account, all companions, memory, and chat history.
              This action cannot be undone.
            </p>
            <form action={action} className="settings-upgrade-actions">
              <input name="redirect_to" type="hidden" value={redirectTo} />
              <button
                className="button button-secondary"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button className="button button-danger" type="submit">
                Delete account
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
