
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://yswoqzcipvkpbrqqbucu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WvvZJk6SDYdV7_foZotolg_FtpGXx9f";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");
const accountPanel = document.getElementById("accountPanel");
const accountEmail = document.getElementById("accountEmail");
const logoutButton = document.getElementById("logoutButton");
const message = document.getElementById("message");
console.log("Research Vault auth.js loaded");

showMessage("Authentication script loaded. Ready to test.");

function showMessage(text) {
  message.textContent = text;
}

function switchTab(mode) {
  const signingUp = mode === "signup";

  signupForm.hidden = !signingUp;
  loginForm.hidden = signingUp;
  showSignup.classList.toggle("active", signingUp);
  showLogin.classList.toggle("active", !signingUp);
  showMessage("");
}

showSignup.addEventListener("click", () => switchTab("signup"));
showLogin.addEventListener("click", () => switchTab("login"));

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = signupForm.querySelector('button[type="submit"]');
  button.disabled = true;
  showMessage("Creating your account...");

  try {
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.href.split("?")[0]
      }
    });

    if (error) throw error;

    if (data.session) {
      showMessage("Account created. You are now signed in.");
    } else {
      showMessage(
        "Registration received! Check your email for a confirmation link before signing in."
      );
    }

    signupForm.reset();
  } catch (error) {
    showMessage("Registration failed: " + error.message);
  } finally {
    button.disabled = false;
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  showMessage("Signing you in...");

  try {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    
if (error) throw error;

loginForm.reset();
showMessage("Sign-in successful. Opening your dashboard...");

window.location.href = "dashboard.html";

  } catch (error) {
    showMessage("Sign-in failed: " + error.message);
  } finally {
    button.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    showMessage("You have signed out.");
  } catch (error) {
    showMessage("Sign-out failed: " + error.message);
  } finally {
    logoutButton.disabled = false;
  }
});

function renderAccount(session) {
  const signedIn = Boolean(session);

  accountPanel.hidden = !signedIn;
  signupForm.hidden = signedIn || !showSignup.classList.contains("active");
  loginForm.hidden = signedIn || showSignup.classList.contains("active");
  showSignup.hidden = signedIn;
  showLogin.hidden = signedIn;

  if (signedIn) {
    accountEmail.textContent = session.user.email || "Reader account";
  } else {
    accountEmail.textContent = "";
  }
}

supabase.auth.onAuthStateChange((_event, session) => {
  renderAccount(session);
});
