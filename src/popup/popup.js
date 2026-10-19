// ============================================================
// src/popup/popup.js
// Clean, restricted User/Pass authentication controller
// ============================================================

const SUPABASE_URL  = "https://cstqftxvemarvesbremc.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdHFmdHh2ZW1hcnZlc2JyZW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTU5NTAsImV4cCI6MjEwNzk5MTk1MH0.JEdHBNiBJ7MLFoePUuzG-vQj8v5uNgDoAvdQvYTh3Yo";

let supabase = null;
const $ = (id) => document.getElementById(id);

async function init() {
  bindEvents();

  try {
    if (window.supabase) {
      const { createClient } = window.supabase;
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: {
          storage: chromeStorageAdapter(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        showAuthenticated(session.user);
      } else {
        showLoginForm();
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) showAuthenticated(session.user);
        else showLoginForm();
      });
    }
  } catch (err) {
    console.warn("Supabase popup init error:", err);
  }
}

function chromeStorageAdapter() {
  return {
    getItem(key) {
      return new Promise(r => chrome.storage.local.get([key], res => r(res[key] ?? null)));
    },
    setItem(key, value) {
      return new Promise(r => chrome.storage.local.set({ [key]: value }, r));
    },
    removeItem(key) {
      return new Promise(r => chrome.storage.local.remove([key], r));
    },
  };
}

function showAuthenticated(user) {
  $("login-section").style.display = "none";
  $("authenticated-section").style.display = "block";
  $("auth-user-email").textContent = user.email || "Authorized User";
}

function showLoginForm() {
  $("login-section").style.display = "block";
  $("authenticated-section").style.display = "none";
  $("input-password").value = "";
}

function bindEvents() {
  $("btn-login-action").addEventListener("click", handleLogin);
  $("input-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  $("input-email").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  $("btn-signout-action").addEventListener("click", async () => {
    if (supabase) await supabase.auth.signOut();
    showLoginForm();
  });

  $("btn-open-workspace").addEventListener("click", (e) => {
    e.preventDefault();
    const url = chrome.runtime.getURL("src/editor/workspace.html");
    if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  });
}

async function handleLogin() {
  const email = $("input-email").value.trim();
  const password = $("input-password").value.trim();
  const errorBox = $("login-error-msg");
  const loginBtn = $("btn-login-action");
  const spinner = $("login-spinner");
  const text = $("login-text");

  if (!email || !password) {
    errorBox.textContent = "Please enter both User (Email) and Password.";
    errorBox.style.display = "block";
    return;
  }

  errorBox.style.display = "none";
  loginBtn.disabled = true;
  spinner.style.display = "inline-block";
  text.textContent = "Verifying...";

  try {
    if (!supabase) throw new Error("Authentication service initializing, try again in a second.");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error("Invalid login credentials. Only authorized accounts created by the admin can log in.");
    }

    if (data?.user) {
      showAuthenticated(data.user);
      // Automatically open the workspace tab upon successful login
      const url = chrome.runtime.getURL("src/editor/workspace.html");
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url });
      }
    }
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = "block";
  } finally {
    loginBtn.disabled = false;
    spinner.style.display = "none";
    text.textContent = "Log In";
  }
}

document.addEventListener("DOMContentLoaded", init);
