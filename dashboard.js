import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://yswoqzcipvkpbrqqbucu.supabase.co";

// Copy the SAME publishable key already used in auth.js.
// Never put a secret or service-role key in browser code.
const SUPABASE_PUBLISHABLE_KEY =
  "PASTE_YOUR_EXISTING_PUBLISHABLE_KEY_HERE";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const dashboard = document.getElementById("dashboard");
const loadingMessage = document.getElementById("loadingMessage");
const memberEmail = document.getElementById("memberEmail");
const logoutBtn = document.getElementById("logoutBtn");

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
