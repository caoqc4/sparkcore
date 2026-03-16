export default function ChatLoading() {
  return (
    <main className="shell">
      <div className="app-shell">
        <div className="topbar">
          <div>
            <p className="eyebrow">Chat</p>
            <h1 className="title">Loading thread...</h1>
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
                </div>
              ))}
            </div>
          </aside>

          <section className="panel chat-panel">
            <div className="message-list">
              <div className="message message-assistant message-loading">
                <p className="message-role">Loading</p>
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line" />
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
