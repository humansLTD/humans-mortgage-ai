function habonaShell(active) {
  const email = sessionStorage.getItem("authEmail") || sessionStorage.getItem("authPhone") || "";
  const item = (id, href, label, icon) =>
    `<a class="${active === id ? "active" : ""}" href="${href}">${icon}<span>${label}</span></a>`;
  return `
    <aside class="sidebar">
      <a class="brand" href="/app.html">
        <span class="brand-mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h5"/></svg>
        </span>
        משכנתא חכמה
      </a>
      <nav class="nav">
        ${item("home", "/app.html", "לוח בקרה", "▦")}
        ${item("watch", "/supervise.html", "מפקח משכנתא", "▤")}
        ${item("plan", "/plan.html", "יועץ תמהיל", "☰")}
        ${item("stats", "/metrics.html", "מדדים", "📈")}
      </nav>
      <div class="sidebar-foot">
        <div>מחובר כ</div>
        <div>${email}</div>
        <button type="button" id="logout">התנתקות ↩</button>
      </div>
    </aside>
  `;
}

function mountShell(active) {
  Habona.requireAuth();
  const root = document.getElementById("shell");
  root.insertAdjacentHTML("afterbegin", habonaShell(active));
  document.getElementById("logout").onclick = () => {
    sessionStorage.clear();
    location.href = "/";
  };
}
