. 
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://yswoqzcipvkpbrqqbucu.supabase.co";

// Use the same publishable key as auth.js.
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WvvZJk6SDYdV7_foZotolg_FtpGXx9f";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const form = document.getElementById("articleForm");
const publishButton = document.querySelector(".publish-button");
const securityNote = document.querySelector(".security-note");

async function checkAdminAccess() {
  securityNote.textContent = "Checking administrator access...";
  publishButton.disabled = true;

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    window.location.replace("auth.html");
    return;
  }

  const user = data.user;

  // Read the role from trusted application metadata.
  if (user.app_metadata?.role !== "admin") {
    document.body.replaceChildren();

    const message = document.createElement("p");
    message.textContent =
      "Access denied. Administrator permission is required.";
    message.style.cssText =
      "margin:60px auto;max-width:600px;padding:24px;" +
      "font-family:sans-serif;text-align:center;";

    document.body.appendChild(message);
    return;
  }

  securityNote.textContent =
    "Administrator recognised. Publishing is not enabled yet.";
}

checkAdminAccess();
