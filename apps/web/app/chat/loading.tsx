import { cookies } from "next/headers";
import {
  CHAT_UI_LANGUAGE_COOKIE,
  getChatCopy,
  resolveChatLocale
} from "@/lib/i18n/chat-ui";

export default async function ChatLoading() {
  const cookieStore = await cookies();
  const copy = getChatCopy(
    resolveChatLocale(cookieStore.get(CHAT_UI_LANGUAGE_COOKIE)?.value)
  );

  return (
    <main className="shell">
      <div className="app-shell">
        <div className="topbar">
          <div>
            <p className="eyebrow">{copy.page.eyebrow}</p>
            <h1 className="title">{copy.loading.title}</h1>
            <p className="helper-copy">{copy.loading.helper}</p>
          </div>
        </div>

        <section className="chat-layout">
          <aside className="panel chat-sidebar">
            <div className="skeleton skeleton-title" />
            <div className="thread-list">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="thread-link thread-link-loading" key={index}>
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-meta" />
                  <div className="skeleton skeleton-meta" />
                </div>
              ))}
            </div>
          </aside>

          <section className="panel chat-panel">
            <div className="thread-state-card thread-state-card-loading">
              <div className="thread-state-copy">
                <p className="eyebrow thread-state-eyebrow">{copy.loading.eyebrow}</p>
                <h2>{copy.loading.cardTitle}</h2>
                <p className="helper-copy">{copy.loading.cardDescription}</p>
              </div>

              <div className="message-list">
                <div className="message message-assistant message-loading">
                  <p className="message-role">{copy.loading.eyebrow}</p>
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line" />
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
