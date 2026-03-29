# 2026-03-29 Product Console High-Risk Actions Test Plan

## 1. Purpose

This document defines the safest way to validate the two destructive product-console actions that were intentionally skipped during the main integration pass:

- `Sign out all`
- `Delete account`

The goal is to verify backend behavior, audit coverage, and user-visible outcomes without risking the primary working account or the shared test environment.

---

## 2. Scope

This plan only covers:

- `/app/settings`
- `Sign out all`
- `Delete account`
- related audit / export / operation-log side effects

It does not cover:

- normal settings saves
- knowledge lifecycle actions
- channel connect / disconnect
- chat / role / memory flows

Those have already been tested in the current integration cycle.

---

## 3. Recommendation

Do **not** run these actions on the main working account.

Use a dedicated disposable test account with a small but complete product footprint:

- at least 1 role
- at least 1 thread with a few messages
- at least 1 memory item
- at least 1 knowledge source
- at least 1 settings record

If possible, use a fresh email created only for this validation pass.

---

## 4. Preconditions

Before running either test:

1. Confirm the test account can log into the current remote environment.
2. Confirm the account has visible product data in:
   - `Chat`
   - `Role`
   - `Knowledge`
   - `Settings`
3. Confirm the following backend tables already exist in remote Supabase:
   - `user_data_exports`
   - `user_account_deletion_audits`
   - `product_settings_operation_logs`
4. Confirm the current build includes the already-tested export and settings actions.

Optional but recommended:

- capture the test account `user_id`
- capture one sample `role_id`
- capture one sample `thread_id`

This makes post-action verification easier.

---

## 5. Test Order

Always run in this order:

1. `Sign out all`
2. log back in
3. verify account data is still intact
4. `Delete account`

Reason:

- `Sign out all` is reversible and lower risk
- `Delete account` is terminal for the test account
- successful re-login after `Sign out all` proves the account remains valid before the deletion test starts

---

## 6. Test A: Sign Out All

### Steps

1. Log into the disposable test account.
2. Open `/app/settings`.
3. Confirm the account section shows the expected email and user id.
4. Trigger `Sign out all`.
5. Observe the immediate UI result.
6. Attempt to access `/app/chat` or `/app/settings` again in the same session.
7. Log back in with the same test account.
8. Re-open `/app/settings`.

### Expected Product Behavior

- the current session is no longer trusted
- protected routes redirect to login
- after re-login, the account still exists
- all roles, chat history, knowledge sources, and settings remain intact

### Expected Backend Effects

- one `product_settings_operation_logs` record with:
  - `operation = sign_out_all_sessions`
  - `status = completed`
- no deletion audit record should be created
- no export is required for this action

### Failure Conditions

Treat the test as failed if:

- the current session stays active after the action
- re-login fails for the same account
- account data disappears
- no operation log is written

---

## 7. Test B: Delete Account

### Steps

1. Log into the disposable test account again.
2. Open `/app/settings`.
3. Confirm the account still has visible product data.
4. Trigger `Delete account`.
5. Observe the immediate UI result.
6. Attempt to log in again with the same account.
7. Check backend side effects in Supabase.

### Expected Product Behavior

- the current session is terminated
- the account becomes inaccessible for normal product use
- re-login should fail or land on a non-restored account state, depending on the auth deletion strategy in effect

### Expected Backend Effects

- one `product_settings_operation_logs` record with:
  - `operation = delete_account`
  - `status = completed`
- one `user_account_deletion_audits` record exists
- one export snapshot is created before deletion and linked through:
  - `deletion_audit_id`
  - `export_record_id`

### Failure Conditions

Treat the test as failed if:

- the account remains fully usable after deletion
- no deletion audit record exists
- no export snapshot is created before deletion
- operation log status is missing or failed without explanation

---

## 8. Post-Test Verification

After both tests, verify:

- operation logs exist for both actions
- the sign-out action did not destroy account data
- the delete action created both:
  - audit record
  - export snapshot
- the disposable test account is no longer needed

Recommended SQL verification checklist:

- query `product_settings_operation_logs` by `user_id`
- query `user_data_exports` by `owner_user_id`
- query `user_account_deletion_audits` by `user_id`

---

## 9. Safety Notes

- Never run `Delete account` on the main working account.
- Avoid running these actions while other manual testing is in progress in the same browser session.
- If testing in a shared environment, announce the disposable test account ahead of time so others do not depend on it.

---

## 10. Short Decision

Current recommendation:

- do **not** execute these actions in the current main account session
- run them later in a dedicated disposable account pass

That keeps the current integration work stable while still leaving a clear path to validate the final high-risk behavior.
