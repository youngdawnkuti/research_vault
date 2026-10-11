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
    card.className = article.is_premium
  ? "research-card premium-card"
  : "research-card free-card";

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
    access.className = article.is_premium
  ? "access-label premium-label"
  : "access-label free-label";
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

/* =========================================
   LUXURY RESEARCH CARD COLLECTION
   ========================================= */

/* Shared card details */

.research-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 265px;
  padding: 30px;
  border-radius: 12px;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.research-card::after {
  position: absolute;
  z-index: -1;
  top: -48px;
  right: -42px;
  width: 145px;
  height: 145px;
  border: 1px solid currentColor;
  border-radius: 50%;
  opacity: 0.09;
  content: "";
  pointer-events: none;
}

.research-card:hover {
  transform: translateY(-5px);
}

/* Free research: clean editorial paper */

.free-card {
  border: 1px solid #e8ded8;
  border-top: 3px solid #d8b75b;
  background: linear-gradient(145deg, #ffffff 0%, #fffaf5 100%);
  color: #2a050b;
  box-shadow: 0 8px 25px rgba(42, 5, 11, 0.045);
}

.free-card:hover {
  border-color: #d8b75b;
  box-shadow: 0 16px 35px rgba(42, 5, 11, 0.09);
}

.free-card .research-icon {
  background: #f8edcf;
  box-shadow: inset 0 0 0 1px #efe0b1;
}

.free-card h3 {
  color: #2a050b;
}

.free-card p {
  color: #786b6e;
}

/* Premium research: signature burgundy */

.premium-card {
  border: 1px solid #59303a;
  border-top: 3px solid #ffd24d;
  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(217, 27, 56, 0.19),
      transparent 48%
    ),
    linear-gradient(145deg, #380a13 0%, #220309 100%);
  color: #fff8ed;
  box-shadow: 0 12px 30px rgba(42, 5, 11, 0.14);
}

.premium-card:hover {
  border-color: #ffd24d;
  box-shadow: 0 18px 40px rgba(42, 5, 11, 0.23);
}

.premium-card .research-icon {
  background: rgba(255, 210, 77, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 210, 77, 0.3);
}

.premium-card h3 {
  color: #fff5df;
}

.premium-card p {
  color: #d8c4c7;
}

/* Access labels */

.free-label {
  border-color: #eadbb1;
  background: #fff4cf;
  color: #593c08;
}

.premium-label {
  border-color: #ffd24d;
  background: #ffd24d;
  color: #2a050b;
}

/* Premium action button */

.premium-card .primary-link {
  border-color: #ffd24d;
  background: #ffd24d;
  color: #2a050b;
}

.premium-card .primary-link:hover {
  border-color: #fff0b0;
  background: #fff0b0;
}

/* Keep decorative effects subtle on phones */

@media (max-width: 500px) {
  .research-card {
    min-height: 0;
    padding: 22px;
  }

  .research-card::after {
    top: -38px;
    right: -35px;
    width: 105px;
    height: 105px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .research-card {
    transition: none;
  }

  .research-card:hover {
    transform: none;
  }
}
