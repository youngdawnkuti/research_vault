import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://yswoqzcipvkpbrqqbucu.supabase.co";

// Copy the SAME publishable key already used in auth.js.
// Never put a secret or service-role key in browser code.
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WvvZJk6SDYdV7_foZotolg_FtpGXx9f";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const dashboard = document.getElementById("dashboard");
const loadingMessage = document.getElementById("loadingMessage");
const memberEmail = document.getElementById("memberEmail");
const logoutBtn = document.getElementById("logoutBtn");
const researchList = document.getElementById("researchList");
const libraryMessage = document.getElementById("libraryMessage");
const researchLibrary = document.getElementById("researchLibrary");

async function loadResearchLibrary() {
  libraryMessage.textContent = "Loading your research library...";
  researchList.replaceChildren();

  const { data, error } = await supabase.rpc(
    "get_published_article_previews"
  );

  if (error) {
    libraryMessage.textContent =
      "We couldn't load the research library. Please refresh and try again.";
    console.error("Library loading error:", error);
    return;
  }

  if (!data || data.length === 0) {
    libraryMessage.textContent =
      "No published research is available yet.";
    return;
  }

  libraryMessage.textContent = "";

  data.forEach((article) => {
    const card = document.createElement("div");
    card.className = "research-card";

    const icon = document.createElement("div");
    icon.className = "research-icon";
    icon.textContent = "📚";

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = article.title;

    const category = document.createElement("p");
    category.textContent = article.category || "General Research";

    const summary = document.createElement("p");
    summary.textContent =
      article.summary || "Explore this research article.";

    const access = document.createElement("span");
    access.className = "access-label";
    access.textContent = article.is_premium ? "Premium" : "Free";

    const link = document.createElement("a");
    link.className = "primary-link";
    link.href = "article.html?slug=" +
      encodeURIComponent(article.slug);
    link.textContent = "View research →";

    details.append(title, category, summary, access);

    if (article.is_premium) {
      const notice = document.createElement("p");
      notice.textContent =
        "Premium content requires authorized access.";
      details.appendChild(notice);
    }

    details.appendChild(link);
    card.append(icon, details);
    researchList.appendChild(card);
  });
}

async function loadDashboard() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    window.location.replace("auth.html");
    return;
  }

  memberEmail.textContent =
    data.session.user.email || "Research Vault member";

  loadingMessage.hidden = true;
  dashboard.hidden = false;
    logoutBtn.hidden = false;

  await loadResearchLibrary();
}

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Logging out...";

  const { error } = await supabase.auth.signOut();

  if (error) {
    logoutBtn.disabled = false;
    logoutBtn.textContent = "Log out";
    alert("Logout failed. Please try again.");
    return;
  }

  window.location.replace("auth.html");
});

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.replace("auth.html");
  }
});

loadDashboard();
