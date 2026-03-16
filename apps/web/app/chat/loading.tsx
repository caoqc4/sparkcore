export default function ChatLoading() {
  return (
    <main className="shell">
      <div className="app-shell">
        <div className="topbar">
          <div>
            <p className="eyebrow">Chat</p>
            <h1 className="title">Loading current thread...</h1>
            <p className="helper-copy">
              The loading state belongs to the currently selected thread and will
              be replaced as soon as that thread resolves.
            </p>
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
            <div className="thread-status-panel">
              <div className="thread-status-copy">
                <h2>Loading thread data</h2>
                <p className="helper-copy">
                  Messages, thread metadata, and agent binding are resolving for
                  the active thread.
                </p>
              </div>

              <div className="message-list">
                <div className="message message-assistant message-loading">
                  <p className="message-role">Loading</p>
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
