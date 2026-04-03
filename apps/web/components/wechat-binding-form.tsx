"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";

type WeChatBindingFormProps = {
  agentId: string;
  characterChannelSlug: string;
  threadId: string;
  hasExistingBinding?: boolean;
  sessionStatus?: "pending" | "active" | "expired" | "revoked" | null;
};

export function WeChatBindingForm({
  agentId,
  characterChannelSlug,
  threadId,
  hasExistingBinding = false,
  sessionStatus = null
}: WeChatBindingFormProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const statusNoticeRef = useRef<HTMLDivElement | null>(null);
  const autoSubmitButtonRef = useRef<HTMLButtonElement | null>(null);
  const [peerId, setPeerId] = useState("");
  const [platformUserId, setPlatformUserId] = useState("");
  const [loginAttemptId, setLoginAttemptId] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<
    | "idle"
    | "starting"
    | "qr_ready"
    | "scanned"
    | "connected"
    | "identity_ready"
    | "timed_out"
    | "error"
  >("idle");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [channelId, setChannelId] = useState("");
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const shouldShowExpiredNotice =
    sessionStatus === "expired" &&
    loginStatus !== "starting" &&
    loginStatus !== "qr_ready" &&
    loginStatus !== "scanned" &&
    loginStatus !== "connected" &&
    loginStatus !== "identity_ready" &&
    channelId.length === 0 &&
    peerId.length === 0;

  const loginStatusLabel = useMemo(() => {
    switch (loginStatus) {
      case "starting":
        return "Preparing your WeChat QR page...";
      case "qr_ready":
        return "QR page is ready. Scan it in WeChat, then come back here.";
      case "scanned":
        return "Scan confirmed. Finish the confirmation in WeChat.";
      case "connected":
        return "WeChat login is ready. Now send the bot any message to get your IDs.";
      case "identity_ready":
        return "WeChat IDs found. SparkCore is saving this connection now.";
      case "timed_out":
        return "Still waiting for your first WeChat message. You can keep waiting or restart the login flow.";
      case "error":
        return loginError ?? "WeChat login failed. Please try again.";
      default:
        return "Click the button below to start the WeChat login flow.";
    }
  }, [loginError, loginStatus]);

  useEffect(() => {
    if (!loginAttemptId) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/integrations/wechat/openilink/status?attempt_id=${encodeURIComponent(loginAttemptId)}`,
          {
            method: "GET",
            cache: "no-store"
          }
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          status:
            | "starting"
            | "qr_ready"
            | "scanned"
            | "connected"
            | "identity_ready"
            | "error";
          qrUrl: string | null;
          errorMessage: string | null;
          channelId: string | null;
          peerId: string | null;
          platformUserId: string | null;
          connectedAt: string | null;
        };

        const nextStatus =
          payload.status === "connected" &&
          payload.connectedAt &&
          Date.now() - new Date(payload.connectedAt).getTime() > 2 * 60 * 1000
            ? "timed_out"
            : payload.status;

        setLoginStatus(nextStatus);
        setQrUrl(payload.qrUrl);
        setLoginError(payload.errorMessage);
        if (payload.channelId) {
          setChannelId(payload.channelId);
        }
        if (payload.peerId) {
          setPeerId(payload.peerId);
        }
        if (payload.platformUserId) {
          setPlatformUserId(payload.platformUserId);
        }

        if (payload.qrUrl && popupRef.current && !popupRef.current.closed) {
          popupRef.current.location.href = payload.qrUrl;
          popupRef.current = null;
        }

        if (nextStatus === "identity_ready" || nextStatus === "timed_out" || nextStatus === "error") {
          window.clearInterval(interval);
        }
      } catch {
        // Ignore transient polling failures; the next poll can recover.
      }
    }, 1200);

    return () => {
      window.clearInterval(interval);
    };
  }, [loginAttemptId]);

  useEffect(() => {
    if (
      loginStatus !== "identity_ready" ||
      isAutoSubmitting ||
      !channelId ||
      !peerId ||
      !platformUserId
    ) {
      return;
    }

    statusNoticeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    setIsAutoSubmitting(true);

    const timeout = window.setTimeout(() => {
      autoSubmitButtonRef.current?.click();
    }, 800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [channelId, isAutoSubmitting, loginStatus, peerId, platformUserId]);

  async function startWeChatLogin() {
    setLoginError(null);
    setQrUrl(null);
    setChannelId("");
    setPeerId("");
    setPlatformUserId("");
    setLoginStatus("starting");
    setIsAutoSubmitting(false);

    popupRef.current = window.open("", "_blank");

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.document.write(
        "<title>Preparing WeChat QR</title><p style='font-family:system-ui;padding:24px'>Preparing the WeChat QR page...</p>"
      );
    }

    try {
      const response = await fetch("/api/integrations/wechat/openilink/start", {
        method: "POST"
      });

      const payload = (await response.json()) as {
        attemptId?: string;
        error?: string;
      };

      if (!response.ok || !payload.attemptId) {
        throw new Error(payload.error || "Unable to start WeChat login.");
      }

      setLoginAttemptId(payload.attemptId);
    } catch (error) {
      setLoginStatus("error");
      setLoginError(error instanceof Error ? error.message : String(error));

      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;
    }
  }

  const isConnectedIdle = sessionStatus === "active" && loginStatus === "idle";

  return (
    <div className="connect-im-wechat-form" ref={containerRef}>
      <input name="agent_id" type="hidden" value={agentId} />
      <input
        name="character_channel_slug"
        type="hidden"
        value={characterChannelSlug}
      />
      <input name="thread_id" type="hidden" value={threadId} />

      {/* Already-active notice sits above the button so users see it first */}
      {isConnectedIdle ? (
        <div className="notice notice-success">
          Your WeChat session is already active. If this connection stops working later, use
          the button below to reconnect.
        </div>
      ) : shouldShowExpiredNotice ? (
        <div className="notice notice-error">
          Your previous WeChat session expired. Start the login flow again to reconnect.
        </div>
      ) : null}

      <div className="connect-im-inline-action">
        <button
          className="button button-secondary"
          onClick={startWeChatLogin}
          type="button"
        >
          {loginStatus === "idle"
            ? isConnectedIdle
              ? "Reconnect WeChat"
              : "Start WeChat Login"
            : loginStatus === "starting"
              ? "Opening QR Page..."
              : loginStatus === "connected" || loginStatus === "identity_ready" || loginStatus === "timed_out"
                ? "Restart WeChat Login"
                : "Try Again"}
        </button>
        {qrUrl ? (
          <a
            className="site-inline-link"
            href={qrUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open QR Page Again
          </a>
        ) : null}
      </div>

      {sessionStatus === "pending" ? (
        <div className="notice notice-success">
          Your WeChat login session is ready. Send the bot any message so SparkCore can capture the
          session IDs and finish the binding.
        </div>
      ) : null}

      {loginStatus === "identity_ready" ? (
        <div className="notice notice-success" ref={statusNoticeRef}>
          WeChat IDs found. SparkCore is confirming this connection for you now.
        </div>
      ) : loginStatus === "timed_out" ? (
        <div className="notice notice-error" ref={statusNoticeRef}>
          Still waiting for your first WeChat message. Send the bot any message, or restart the
          login flow.
        </div>
      ) : null}

      {loginStatus !== "idle" ? (
        <p className="helper-copy">{loginStatusLabel}</p>
      ) : null}

      <div className="connect-im-or-divider">
        <span>or enter IDs manually</span>
      </div>

      <div className="field">
        <label className="label" htmlFor="channel_id">
          WeChat Session ID
        </label>
        <input
          className="input"
          id="channel_id"
          name="channel_id"
          placeholder="Paste the WeChat session ID"
          value={channelId}
          onChange={(event) => setChannelId(event.target.value)}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="peer_id">
          WeChat User ID
        </label>
        <input
          className="input"
          id="peer_id"
          name="peer_id"
          onChange={(event) => {
            const nextValue = event.target.value;
            setPeerId(nextValue);
            setPlatformUserId(nextValue);
          }}
          placeholder="Paste the WeChat from_user_id"
          value={peerId}
        />
      </div>

      <input name="platform_user_id" type="hidden" value={platformUserId} />
      <button
        aria-hidden="true"
        className="sr-only"
        ref={autoSubmitButtonRef}
        tabIndex={-1}
        type="submit"
      >
        Auto submit WeChat binding
      </button>

      <FormSubmitButton
        eventName="im_bind_started"
        eventPayload={{ platform: "wechat", surface: "connect_im" }}
        idleText={hasExistingBinding ? "Update connection" : "Connect WeChat"}
        pendingText={isAutoSubmitting ? "Confirming WeChat..." : "Saving..."}
      />
    </div>
  );
}
