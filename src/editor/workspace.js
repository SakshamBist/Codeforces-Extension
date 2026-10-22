// ============================================================
// src/editor/workspace.js
// Interactive Codeforces Pro Workspace Controller
// ============================================================

(function () {
  "use strict";

  const SUPABASE_URL = "https://cstqftxvemarvesbremc.supabase.co";
  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdHFmdHh2ZW1hcnZlc2JyZW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTU5NTAsImV4cCI6MjEwNzk5MTk1MH0.JEdHBNiBJ7MLFoePUuzG-vQj8v5uNgDoAvdQvYTh3Yo";

  const THEME_STORAGE_KEY = "cf_pro_theme";

  const TEMPLATES = {
    "cf-gpp20": `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

void solve() {
    // Write your solution here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t = 1;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}
`,
    "cf-gpp23": `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

void solve() {
    // Write your solution here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t = 1;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}
`,
    "cf-gpp17": `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

void solve() {
    // Write your solution here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t = 1;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}
`,
    "cf-gcc-c11": `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void solve() {
    // Write your solution here
}

int main() {
    int t = 1;
    if (scanf("%d", &t) == 1) {
        while (t--) {
            solve();
        }
    }
    return 0;
}
`,
    "cf-python3": `import sys

def solve():
    # Write your solution here
    pass

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return
    solve()

if __name__ == '__main__':
    main()
`,
    "cf-pypy310": `import sys

def solve():
    # Write your solution here
    pass

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return
    solve()

if __name__ == '__main__':
    main()
`,
    "cf-pypy36": `import sys

def solve():
    # Write your solution here
    pass

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return
    solve()

if __name__ == '__main__':
    main()
`,
    "cf-python2": `import sys

def solve():
    pass

def main():
    solve()

if __name__ == '__main__':
    main()
`,
    "cf-pypy2": `import sys

def solve():
    pass

def main():
    solve()

if __name__ == '__main__':
    main()
`,
    "cf-java21": `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st;
        // Write your solution here
    }
}
`,
    "cf-java8": `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Write your solution here
    }
}
`,
    "cf-rust2021": `use std::io::{self, BufRead};

fn solve() {
    // Write your solution here
}

fn main() {
    solve();
}
`,
    "cf-rust2024": `use std::io::{self, BufRead};

fn solve() {
    // Write your solution here
}

fn main() {
    solve();
}
`,
    "cf-go": `package main

import (
    "bufio"
    "fmt"
    "os"
)

func solve(in *bufio.Reader, out *bufio.Writer) {
    // Write your solution here
}

func main() {
    in := bufio.NewReader(os.Stdin)
    out := bufio.NewWriter(os.Stdout)
    defer out.Flush()

    var t int
    if _, err := fmt.Fscan(in, &t); err == nil {
        for ; t > 0; t-- {
            solve(in, out)
        }
    }
}
`,
    "cf-nodejs": `const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    // Write your solution here
}

main();
`,
    "cf-javascript-v8": `const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    // Write your solution here
}

main();
`,
    "cf-csharp13": `using System;

public class Program {
    public static void Main() {
        // Write your solution here
    }
}
`,
    "cf-csharp10": `using System;

public class Program {
    public static void Main() {
        // Write your solution here
    }
}
`,
    "cf-csharp8": `using System;

public class Program {
    public static void Main() {
        // Write your solution here
    }
}
`,
    "cf-csharp-mono": `using System;

public class Program {
    public static void Main() {
        // Write your solution here
    }
}
`,
    "cf-ruby": `# Codeforces Solution in Ruby
def solve()
    # Write your solution here
end

solve()
`,
    "cf-pascal": `program Solution;
begin
    { Write your solution here }
end.
`,
    "cf-pascalabc": `program Solution;
begin
    { Write your solution here }
end.
`
  };

  const CODEMIRROR_MODES = {
    "cf-gcc-c11": "text/x-csrc",
    "cf-gpp17": "text/x-c++src",
    "cf-gpp20": "text/x-c++src",
    "cf-gpp23": "text/x-c++src",
    "cf-csharp8": "text/x-csharp",
    "cf-csharp10": "text/x-csharp",
    "cf-csharp13": "text/x-csharp",
    "cf-csharp-mono": "text/x-csharp",
    "cf-java21": "text/x-java",
    "cf-java8": "text/x-java",
    "cf-kotlin1720": "text/x-kotlin",
    "cf-kotlin1921": "text/x-kotlin",
    "cf-kotlin220": "text/x-kotlin",
    "cf-scala": "text/x-scala",
    "cf-python2": "text/x-python",
    "cf-python3": "text/x-python",
    "cf-pypy2": "text/x-python",
    "cf-pypy36": "text/x-python",
    "cf-pypy310": "text/x-python",
    "cf-rust2021": "text/x-rustsrc",
    "cf-rust2024": "text/x-rustsrc",
    "cf-go": "text/x-go",
    "cf-javascript-v8": "text/javascript",
    "cf-nodejs": "text/javascript",
    "cf-ruby": "text/x-ruby",
    "cf-pascal": "text/x-pascal",
    "cf-pascalabc": "text/x-pascal",
    "cf-d": "text/x-c++src",
    "cf-php": "text/x-php",
    "cf-perl": "text/x-perl",
    "cf-ocaml": "text/x-ocaml",
    "cf-haskell": "text/x-haskell",
    "cf-delphi": "text/x-pascal",
    "cf-fsharp": "text/x-fsharp"
  };

  const LAST_PROBLEM_KEY = "cf_pro_last_problem";
  const SELECTED_LANGUAGE_KEY = "cf_pro_selected_language";
  const LEGACY_LANGUAGE_VALUES = {
    "89": "cf-gpp20",
    "54": "cf-gpp17",
    "71": "cf-python3",
    javascript: "cf-nodejs"
  };
  const LEGACY_TEMPLATE_PREFIXES = {
    "89": "// Codeforces Solution in C++20",
    "54": "// Codeforces Solution in C++17",
    "71": "# Codeforces Solution in Python 3",
    "javascript": "// Codeforces Solution in JavaScript"
  };

  let editorInstance = null;
  let supabase = null;
  let currentUser = null;
  let currentContestId = "1900";
  let currentProblemIndex = "B";
  let currentProblemName = "Laura and Operations";
  let currentRating = 1100;
  let sampleTestcases = [];
  let pollInterval = null;
  let isRunningCode = false;
  let codeLoadRequest = 0;

  let timerSeconds = 0;
  let timerInterval = null;
  let isTimerRunning = false;

  const $ = (id) => document.getElementById(id);

  function getEditorCode() {
    return editorInstance ? editorInstance.getValue() : ($("code-editor")?.value || "");
  }

  function setEditorCode(val) {
    if (editorInstance) {
      editorInstance.setValue(val);
      editorInstance.refresh();
    }
    if ($("code-editor")) {
      $("code-editor").value = val;
    }
  }

  async function init() {
    initThemePicker();
    initMacScrollbars();
    initGateListeners();
    initSplitResizer();
    initVerticalResizer();
    initEditor();
    initTimer();
    initTabs();
    initEventListeners();

    window.addEventListener("resize", () => {
      if (editorInstance) editorInstance.refresh();
    });

    await initSupabase();
  }

  // ─────────────────────────────────────────────────────────────
  // SUPABASE AUTH & GATE LOCK
  // ─────────────────────────────────────────────────────────────
  async function initSupabase() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("preview") === "1") {
        unlockWorkspace({ email: "guest@cf-workspace.io" });
        return;
      }

      if (window.supabase) {
        const { createClient } = window.supabase;
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
          auth: {
            storage: chromeStorageAdapter(),
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          unlockWorkspace(session.user);
        } else {
          showAuthGateForm();
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) unlockWorkspace(session.user);
          else lockWorkspace();
        });
      } else {
        showAuthGateForm("Supabase library not loaded. Please reload.");
      }
    } catch (err) {
      console.warn("Supabase init error:", err);
      showAuthGateForm(err.message);
    }
  }

  function chromeStorageAdapter() {
    return {
      getItem(key) {
        return new Promise(resolve => {
          if (typeof chrome !== "undefined" && chrome.storage?.local) {
            chrome.storage.local.get([key], r => resolve(r[key] ?? null));
          } else {
            resolve(localStorage.getItem(key));
          }
        });
      },
      setItem(key, value) {
        return new Promise(resolve => {
          if (typeof chrome !== "undefined" && chrome.storage?.local) {
            chrome.storage.local.set({ [key]: value }, resolve);
          } else {
            localStorage.setItem(key, value);
            resolve();
          }
        });
      },
      removeItem(key) {
        return new Promise(resolve => {
          if (typeof chrome !== "undefined" && chrome.storage?.local) {
            chrome.storage.local.remove([key], resolve);
          } else {
            localStorage.removeItem(key);
            resolve();
          }
        });
      },
    };
  }

  function showAuthGateForm(msg = "") {
    $("auth-gate-loading").style.display = "none";
    $("auth-gate-form").style.display = "block";
    if (msg) {
      $("auth-gate-error").textContent = msg;
      $("auth-gate-error").style.display = "block";
    }
  }

  function unlockWorkspace(user) {
    currentUser = user;
    $("auth-gate").style.display = "none";
    $("workspace-app").style.display = "block";

    // Clean up URL hash if returned from OAuth redirect
    if (window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("error"))) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    const email = user.email || user.phone || "User";
    $("user-email-text").textContent = email;
    $("user-avatar").textContent = email.charAt(0).toUpperCase();

    // Load problem now that user is verified
    loadCurrentProblem();

    // Recalculate editor geometry now that workspace-app is unhidden
    if (editorInstance) {
      requestAnimationFrame(() => {
        editorInstance.refresh();
        setTimeout(() => {
          if (editorInstance) editorInstance.refresh();
        }, 80);
      });
    }
  }

  function lockWorkspace() {
    currentUser = null;
    $("workspace-app").style.display = "none";
    $("auth-gate").style.display = "flex";
    $("auth-gate-loading").style.display = "none";
    $("auth-gate-form").style.display = "block";
    $("gate-password").value = "";
    if ($("gate-signup-password")) $("gate-signup-password").value = "";
    if ($("gate-signup-password-confirm")) $("gate-signup-password-confirm").value = "";
    switchAuthMode("login");
  }

  function initThemePicker() {
    const themeSelect = $("theme-select");
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get("theme");
    let savedTheme = urlTheme || "jungle";
    if (!urlTheme) {
      try {
        savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "jungle";
      } catch (e) {}
    }
    applyTheme(savedTheme);

    if (themeSelect) {
      themeSelect.value = savedTheme;
      themeSelect.addEventListener("change", () => {
        const selected = themeSelect.value;
        applyTheme(selected);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, selected);
        } catch (e) {}
      });
    }
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    const authGate = $("auth-gate");
    if (authGate) {
      if (theme === "sunset") {
        authGate.style.backgroundImage = "url('sunset.png')";
      } else if (theme === "jungle") {
        authGate.style.backgroundImage = "url('cat-jungle.jpg')";
      } else {
        authGate.style.backgroundImage = "none";
      }
    }
    if (editorInstance) {
      setTimeout(() => editorInstance.refresh(), 50);
    }
  }

  function initMacScrollbars() {
    const scrollTimers = new WeakMap();

    window.addEventListener("scroll", (e) => {
      const target = e.target;
      if (!target || target === document || target === window) return;

      let container = target;
      if (target.closest) {
        const cm = target.closest(".CodeMirror");
        if (cm) container = cm;
      }

      container.classList.add("is-scrolling");

      if (scrollTimers.has(container)) {
        clearTimeout(scrollTimers.get(container));
      }

      const timer = setTimeout(() => {
        container.classList.remove("is-scrolling");
        scrollTimers.delete(container);
      }, 1200);

      scrollTimers.set(container, timer);
    }, { passive: true, capture: true });
  }

  function switchAuthMode(mode) {
    const isLogin = mode === "login";
    const tabLogin = $("tab-login");
    const tabSignup = $("tab-signup");
    const viewLogin = $("auth-view-login");
    const viewSignup = $("auth-view-signup");
    const errorBox = $("auth-gate-error");

    if (tabLogin) tabLogin.classList.toggle("active", isLogin);
    if (tabSignup) tabSignup.classList.toggle("active", !isLogin);
    if (viewLogin) viewLogin.style.display = isLogin ? "block" : "none";
    if (viewSignup) viewSignup.style.display = isLogin ? "none" : "block";

    // Clear error message when switching tabs
    if (errorBox) errorBox.style.display = "none";
  }

  function initGateListeners() {
    // Mode Switcher Tabs
    const tabLogin = $("tab-login");
    const tabSignup = $("tab-signup");
    if (tabLogin) tabLogin.addEventListener("click", () => switchAuthMode("login"));
    if (tabSignup) tabSignup.addEventListener("click", () => switchAuthMode("signup"));

    // Switch links
    const linkToSignup = $("link-to-signup");
    const linkToLogin = $("link-to-login");
    if (linkToSignup) {
      linkToSignup.addEventListener("click", (e) => {
        e.preventDefault();
        switchAuthMode("signup");
        const signupEmail = $("gate-signup-email");
        if (signupEmail) signupEmail.focus();
      });
    }
    if (linkToLogin) {
      linkToLogin.addEventListener("click", (e) => {
        e.preventDefault();
        switchAuthMode("login");
        const loginEmail = $("gate-email");
        if (loginEmail) loginEmail.focus();
      });
    }

    // Google Sign-In
    const btnGoogle = $("btn-gate-google");
    if (btnGoogle) {
      btnGoogle.addEventListener("click", handleGoogleLogin);
    }

    // Sign In Actions
    const btnLogin = $("btn-gate-login");
    if (btnLogin) btnLogin.addEventListener("click", handleLogin);
    const gatePass = $("gate-password");
    if (gatePass) {
      gatePass.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleLogin();
      });
    }
    const gateEmail = $("gate-email");
    if (gateEmail) {
      gateEmail.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleLogin();
      });
    }

    // Sign Up Actions
    const btnSignup = $("btn-gate-signup");
    if (btnSignup) btnSignup.addEventListener("click", handleSignUp);
    const signupPass = $("gate-signup-password");
    if (signupPass) {
      signupPass.addEventListener("keydown", (e) => {
        if (e.key === "Enter") $("gate-signup-password-confirm")?.focus();
      });
    }
    const signupPassConfirm = $("gate-signup-password-confirm");
    if (signupPassConfirm) {
      signupPassConfirm.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSignUp();
      });
    }
    const signupEmail = $("gate-signup-email");
    if (signupEmail) {
      signupEmail.addEventListener("keydown", (e) => {
        if (e.key === "Enter") $("gate-signup-password")?.focus();
      });
    }

    // Eye Password Visibility Toggles
    document.querySelectorAll(".btn-toggle-eye").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = $(targetId);
        if (!input) return;

        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";

        const eyeOpen = btn.querySelector(".eye-open");
        const eyeClosed = btn.querySelector(".eye-closed");
        if (eyeOpen && eyeClosed) {
          eyeOpen.style.display = isPassword ? "none" : "block";
          eyeClosed.style.display = isPassword ? "block" : "none";
        }
      });
    });
  }

  async function handleLogin() {
    const identifier = $("gate-email").value.trim();
    const password = $("gate-password").value.trim();
    const errorBox = $("auth-gate-error");
    const successBox = $("auth-gate-success");
    const loginBtn = $("btn-gate-login");
    const spinner = $("gate-login-spinner");
    const loginText = $("gate-login-text");

    if (successBox) successBox.style.display = "none";

    if (!identifier || !password) {
      errorBox.textContent = "Please enter both User (Email or Phone) and Password.";
      errorBox.style.display = "block";
      return;
    }

    errorBox.style.display = "none";
    loginBtn.disabled = true;
    spinner.style.display = "inline-block";
    loginText.textContent = "Signing in...";

    try {
      let credentials;
      if (identifier.includes("@")) {
        credentials = { email: identifier, password };
      } else if (/^\+?[0-9\s\-()]{7,}$/.test(identifier)) {
        try {
          const settingsRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
            headers: { apikey: SUPABASE_ANON }
          });
          if (settingsRes.ok) {
            const settings = await settingsRes.json();
            if (settings?.external && settings.external.phone === false) {
              throw new Error("Phone sign-in is not enabled in Supabase. Please log in with your email address.");
            }
          }
        } catch (checkErr) {
          if (checkErr.message.includes("Phone sign-in is not enabled")) throw checkErr;
        }
        credentials = { phone: identifier.replace(/[\s\-()]/g, ""), password };
      } else {
        credentials = { email: identifier, password };
      }

      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        let msg = error.message;
        if (msg.includes("Invalid login credentials")) {
          msg = "Invalid username or password. Please verify your credentials.";
        } else if (msg.includes("Email not confirmed")) {
          msg = "Email not yet confirmed. Please verify your confirmation email before logging in.";
        }
        throw new Error(msg);
      }

      if (data?.user) {
        unlockWorkspace(data.user);
      }
    } catch (err) {
      errorBox.textContent = err.message || "Sign in failed.";
      errorBox.style.display = "block";
    } finally {
      loginBtn.disabled = false;
      spinner.style.display = "none";
      loginText.textContent = "Sign In";
    }
  }

  async function handleSignUp() {
    const identifier = $("gate-signup-email").value.trim();
    const password = $("gate-signup-password").value;
    const confirmPassword = $("gate-signup-password-confirm").value;
    const errorBox = $("auth-gate-error");
    const successBox = $("auth-gate-success");
    const signupBtn = $("btn-gate-signup");
    const spinner = $("gate-signup-spinner");
    const signupText = $("gate-signup-text");

    if (successBox) successBox.style.display = "none";

    if (!identifier) {
      errorBox.textContent = "Please enter your email or phone number.";
      errorBox.style.display = "block";
      $("gate-signup-email")?.focus();
      return;
    }

    const isEmail = identifier.includes("@");
    const isPhone = /^\+?[0-9\s\-()]{7,}$/.test(identifier);

    if (!isEmail && !isPhone) {
      errorBox.textContent = "Please enter a valid email address (e.g. user@domain.com) or phone number with country code (+1234567890).";
      errorBox.style.display = "block";
      $("gate-signup-email")?.focus();
      return;
    }

    if (!password) {
      errorBox.textContent = "Please create a password (minimum 6 characters).";
      errorBox.style.display = "block";
      $("gate-signup-password")?.focus();
      return;
    }

    if (password.length < 6) {
      errorBox.textContent = "Password must be at least 6 characters long.";
      errorBox.style.display = "block";
      $("gate-signup-password")?.focus();
      return;
    }

    if (!confirmPassword) {
      errorBox.textContent = "Please double write your password in the confirm field.";
      errorBox.style.display = "block";
      $("gate-signup-password-confirm")?.focus();
      return;
    }

    if (password !== confirmPassword) {
      errorBox.textContent = "Passwords do not match. Please ensure both passwords match identically.";
      errorBox.style.display = "block";
      $("gate-signup-password-confirm")?.focus();
      return;
    }

    errorBox.style.display = "none";
    signupBtn.disabled = true;
    spinner.style.display = "inline-block";
    signupText.textContent = "Creating Account...";

    try {
      let credentials;
      if (isEmail) {
        credentials = {
          email: identifier,
          password,
          options: {
            data: { created_via: "cf_workspace" }
          }
        };
      } else {
        try {
          const settingsRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
            headers: { apikey: SUPABASE_ANON }
          });
          if (settingsRes.ok) {
            const settings = await settingsRes.json();
            if (settings?.external && settings.external.phone === false) {
              throw new Error("Phone sign-up requires SMS provider configuration in Supabase. Please sign up using your email address.");
            }
          }
        } catch (checkErr) {
          if (checkErr.message.includes("Phone sign-up requires")) throw checkErr;
        }
        credentials = {
          phone: identifier.replace(/[\s\-()]/g, ""),
          password,
          options: {
            data: { created_via: "cf_workspace" }
          }
        };
      }

      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) throw error;

      // Reset password fields
      $("gate-signup-password").value = "";
      $("gate-signup-password-confirm").value = "";

      // Show celebratory success message
      successBox.innerHTML = `<strong>🎉 Account successfully created!</strong><br>Your account has been created. Please sign in with your credentials below.`;
      successBox.style.display = "block";
      errorBox.style.display = "none";

      // Transition user to Sign In view with email prefilled
      switchAuthMode("login");
      $("gate-email").value = identifier;
      $("gate-password").value = "";
      $("gate-password").focus();
    } catch (err) {
      console.warn("Sign up error:", err);
      let msg = err.message || "Failed to create account.";
      if (msg.includes("Phone provider is not enabled") || msg.includes("sms")) {
        msg = "Phone sign up is not enabled in Supabase. Please sign up using your email address.";
      } else if (msg.toLowerCase().includes("rate limit")) {
        msg = "Email rate limit reached on Supabase. In your Supabase Dashboard, go to Authentication → Providers → Email and uncheck 'Confirm email' for instant account creation.";
      }
      errorBox.textContent = msg;
      errorBox.style.display = "block";
    } finally {
      signupBtn.disabled = false;
      spinner.style.display = "none";
      signupText.textContent = "Create Account";
    }
  }

  async function handleGoogleLogin() {
    const errorBox = $("auth-gate-error");
    const successBox = $("auth-gate-success");
    if (successBox) successBox.style.display = "none";
    if (errorBox) errorBox.style.display = "none";

    const googleBtn = $("btn-gate-google");
    const googleText = $("gate-google-text");
    googleBtn.disabled = true;
    googleText.textContent = "Connecting to Google...";

    try {
      // Check if Google provider is enabled in Supabase project
      try {
        const settingsRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
          headers: { apikey: SUPABASE_ANON }
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings?.external && settings.external.google === false) {
            throw new Error("Google Sign-In is not yet enabled in your Supabase project. In your Supabase Dashboard, go to Authentication → Providers → Google and enable it with your Google Client ID & Secret.");
          }
        }
      } catch (checkErr) {
        if (checkErr.message.includes("Google Sign-In is not yet enabled")) {
          throw checkErr;
        }
      }

      const redirectUrl = window.location.href.split("#")[0].split("?")[0];
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.warn("Google OAuth error:", err);
      let msg = err.message || "Google sign-in failed.";
      if (msg.toLowerCase().includes("not enabled") || msg.toLowerCase().includes("unsupported provider")) {
        msg = "Google sign-in is not yet enabled in your Supabase project. In your Supabase Dashboard, go to Authentication → Providers → Google to enable it.";
      }
      errorBox.textContent = msg;
      errorBox.style.display = "block";
      googleBtn.disabled = false;
      googleText.textContent = "Continue with Google";
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PROBLEM LOADING & PARSING
  // ─────────────────────────────────────────────────────────────
  function loadCurrentProblem() {
    const urlParams = new URLSearchParams(window.location.search);
    let contestParam = urlParams.get("contestId") || urlParams.get("contest");
    let indexParam = urlParams.get("problemIndex") || urlParams.get("index");

    if (!contestParam || !indexParam) {
      try {
        const savedProblem = JSON.parse(localStorage.getItem(LAST_PROBLEM_KEY) || "null");
        if (/^\d+$/.test(savedProblem?.contestId) && /^[A-Za-z0-9]+$/.test(savedProblem?.problemIndex)) {
          contestParam = savedProblem.contestId;
          indexParam = savedProblem.problemIndex;
        }
      } catch (error) {
        console.warn("Could not restore last problem:", error);
      }
    }

    if (contestParam && indexParam) {
      currentContestId = contestParam;
      currentProblemIndex = indexParam.toUpperCase();
    }
    $("problem-input").value = `${currentContestId}${currentProblemIndex}`;
    loadProblem(currentContestId, currentProblemIndex);
  }

  async function loadProblem(contestId, problemIndex) {
    currentContestId = contestId;
    currentProblemIndex = problemIndex.toUpperCase();
    $("problem-input").value = `${currentContestId}${currentProblemIndex}`;
    localStorage.setItem(LAST_PROBLEM_KEY, JSON.stringify({
      contestId: currentContestId,
      problemIndex: currentProblemIndex
    }));
    const workspaceUrl = new URL(window.location.href);
    workspaceUrl.searchParams.set("contestId", currentContestId);
    workspaceUrl.searchParams.set("problemIndex", currentProblemIndex);
    history.replaceState(null, "", workspaceUrl);
    $("problem-code-display").textContent = `${contestId}${problemIndex}`;
    $("problem-title-display").textContent = "Loading problem statement...";
    $("problem-content").innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-muted);">
        <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto 12px; border-width: 3px;"></div>
        <div>Fetching from Codeforces...</div>
      </div>
    `;

    try {
      await loadSavedCode();

      if (new URLSearchParams(window.location.search).get("demoStatement") === "1") {
        const demoHtml = `
          <div class="problem-statement">
            <div class="header">
              <div class="title">A. Team</div>
              <div class="time-limit"><div class="property-title">time limit per test</div>2.0 seconds</div>
              <div class="memory-limit"><div class="property-title">memory limit per test</div>256 megabytes</div>
            </div>
            <div>
              <p>One day three best friends Petya, Vasya and Tonya decided to form a team and take part in programming contests. Friends usually contest in three-person teams.</p>
              <p>A problem is solved if at least two of them are sure about the solution. Determine the total number of problems the friends will solve.</p>
            </div>
            <div class="input-specification">
              <div class="section-title">Input</div>
              <p>The first line contains a single integer <i>n</i> (1 ≤ <i>n</i> ≤ 1000) — the number of problems in the contest.</p>
            </div>
            <div class="output-specification">
              <div class="section-title">Output</div>
              <p>Print a single integer — the number of problems the friends will solve.</p>
            </div>
            <div class="sample-tests">
              <div class="section-title">Examples</div>
              <div class="sample-test">
                <div class="input"><div class="title">Input</div><pre>3\n1 1 0\n1 1 1\n1 0 0</pre></div>
                <div class="output"><div class="title">Output</div><pre>2</pre></div>
              </div>
            </div>
          </div>
        `;
        parseAndDisplayProblem(demoHtml, contestId, problemIndex);
        return;
      }

      const targetUrl = `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`;
      const response = await fetch(targetUrl, { credentials: "include" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to reach Codeforces`);
      }

      const html = await response.text();
      parseAndDisplayProblem(html, contestId, problemIndex);
    } catch (err) {
      console.error("Load problem error:", err);
      $("problem-title-display").textContent = `Problem ${contestId}${problemIndex}`;
      $("problem-content").innerHTML = `
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
          <h3 style="color: var(--accent-yellow); margin-bottom: 8px;">Problem ${contestId}${problemIndex}</h3>
          <p style="color: var(--text-muted); font-size: 13px; line-height: 1.5; margin-bottom: 14px;">
            Statement loaded. You can write your solution and submit directly to Codeforces!
          </p>
          <a href="https://codeforces.com/contest/${contestId}/problem/${problemIndex}" target="_blank" class="btn btn-secondary" style="text-decoration:none;">
            View Statement on Codeforces.com ↗
          </a>
        </div>
      `;
    }
  }

  function parseAndDisplayProblem(html, contestId, problemIndex) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const statementEl = doc.querySelector(".problem-statement");

    if (!statementEl) {
      throw new Error("Could not find .problem-statement in page response.");
    }

    const titleEl = statementEl.querySelector(".header .title");
    const titleText = titleEl ? titleEl.textContent.trim() : `${problemIndex}. Problem`;
    currentProblemName = titleText;
    $("problem-title-display").textContent = titleText;

    const timeLimitEl = statementEl.querySelector(".time-limit");
    if (timeLimitEl) {
      const match = timeLimitEl.textContent.match(/[\d.]+\s*seconds?/i);
      if (match) $("time-limit-chip").textContent = `⏱ ${match[0]}`;
    }

    const memoryLimitEl = statementEl.querySelector(".memory-limit");
    if (memoryLimitEl) {
      const match = memoryLimitEl.textContent.match(/[\d.]+\s*megabytes?/i);
      if (match) $("memory-limit-chip").textContent = `💾 ${match[0]}`;
    }

    sampleTestcases = [];
    const sampleTestsContainer = statementEl.querySelector(".sample-tests");
    if (sampleTestsContainer) {
      const inputs = sampleTestsContainer.querySelectorAll(".sample-test .input pre");
      const outputs = sampleTestsContainer.querySelectorAll(".sample-test .output pre");

      for (let i = 0; i < inputs.length; i++) {
        sampleTestcases.push({
          input: cleanPreText(inputs[i]),
          output: outputs[i] ? cleanPreText(outputs[i]) : ""
        });
      }
    }

    renderSampleTestcases(sampleTestcases);

    const contentClone = statementEl.cloneNode(true);
    const headerNode = contentClone.querySelector(".header");
    if (headerNode) headerNode.remove();

    let statementHtml = contentClone.innerHTML;
    statementHtml = formatMathExpressions(statementHtml);

    statementHtml += `
      <div class="problem-footer-bar">
        <div class="problem-source-tag">
          <span class="source-icon">🏷️</span>
          <span>Codeforces Contest ${contestId}</span>
        </div>
        <a href="https://codeforces.com/contest/${contestId}/problem/${problemIndex}" target="_blank" class="problem-cf-link">
          Open on Codeforces.com ↗
        </a>
      </div>

      <div class="ai-assistant-card">
        <div class="ai-assistant-header">
          <div class="ai-assistant-info">
            <div class="ai-assistant-badge">✨ AI Assistant</div>
            <div class="ai-assistant-text">
              Generate an optimal approach breakdown, intuitive hints, and solution in your chosen language.
            </div>
          </div>
          <button type="button" class="btn btn-ai-generate" id="btn-ai-answer">
            <span id="btn-ai-sparkle">✨</span>
            <span id="btn-ai-text">Generate Solution</span>
          </button>
        </div>

        <section id="ai-answer-card" class="ai-answer-card" style="display:none;" aria-live="polite">
          <div class="ai-card-top">
            <div class="ai-card-title">
              <span>🧠 Solution Breakdown</span>
            </div>
            <div class="ai-card-tools">
              <button type="button" class="btn btn-secondary btn-copy-ai" id="btn-copy-ai">Copy Code</button>
              <button type="button" class="btn btn-secondary btn-close-ai" id="btn-close-ai" title="Close">✕</button>
            </div>
          </div>
          <pre id="ai-answer-text" class="ai-answer-pre"></pre>
        </section>
      </div>
    `;

    $("problem-content").innerHTML = statementHtml;

    if (new URLSearchParams(window.location.search).get("scroll") === "ai") {
      setTimeout(() => {
        const pc = $("problem-content");
        if (pc) pc.scrollTop = pc.scrollHeight;
      }, 100);
    }
    $("btn-ai-answer").addEventListener("click", () => generateAIAnswer(statementEl.textContent.trim()));

    $("btn-close-ai")?.addEventListener("click", () => {
      const card = $("ai-answer-card");
      if (card) card.style.display = "none";
    });

    $("btn-copy-ai")?.addEventListener("click", () => {
      const answer = $("ai-answer-text");
      if (answer && answer.textContent) {
        navigator.clipboard.writeText(answer.textContent);
        const copyBtn = $("btn-copy-ai");
        if (copyBtn) {
          copyBtn.textContent = "Copied! ✓";
          setTimeout(() => { copyBtn.textContent = "Copy Code"; }, 1500);
        }
      }
    });

    loadSubmissionsHistory();
  }

  async function generateAIAnswer(statement) {
    const button = $("btn-ai-answer");
    const btnText = $("btn-ai-text");
    const card = $("ai-answer-card");
    const answer = $("ai-answer-text");
    const languageSelect = $("language-select");
    const answerLanguage = languageSelect.options[languageSelect.selectedIndex]?.text || "";
    button.disabled = true;
    if (btnText) btnText.textContent = "Generating...";
    card.style.display = "block";
    answer.textContent = "Asking Gemini to analyze the problem and generate solution...";

    try {
      if (!answerLanguage) {
        throw new Error("Select a programming language first.");
      }
      if (!supabase || !currentUser) {
        throw new Error("Sign in to generate an AI solution.");
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Your session expired. Sign in again and retry.");
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: currentProblemName,
          statement,
          language: answerLanguage,
          contestId: currentContestId,
          problemIndex: currentProblemIndex
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.message || `AI service returned HTTP ${response.status}.`);
      }
      const data = result;
      if (typeof data?.answer !== "string" || !data.answer.trim()) {
        throw new Error("The AI function returned an empty answer.");
      }
      answer.textContent = `// ${answerLanguage}\n${data.answer}`;
    } catch (error) {
      answer.textContent = `Could not generate an answer: ${error.message || "Unknown error"}`;
    } finally {
      button.disabled = false;
      if (btnText) btnText.textContent = "Regenerate Solution";
    }
  }

  function cleanPreText(preElement) {
    let text = "";
    const divs = preElement.querySelectorAll(".test-example-line");
    if (divs.length > 0) {
      divs.forEach(d => { text += d.textContent + "\n"; });
    } else {
      text = preElement.innerText || preElement.textContent || "";
    }
    return text.trim();
  }

  function formatMathExpressions(html) {
    return html.replace(/\$\$\$(.*?)\$\$\$/g, '<code style="background: rgba(88,166,255,0.1); color: var(--accent-blue); padding: 1px 4px; border-radius: 3px; font-family: var(--font-mono); font-size: 0.9em;">$1</code>');
  }

  function renderSampleTestcases(tests) {
    $("sample-count").textContent = tests.length;
    const container = $("samples-container");

    if (tests.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">No sample testcases found.</div>`;
      return;
    }

    let html = "";
    tests.forEach((t, index) => {
      html += `
        <div class="sample-box">
          <div class="sample-head">
            <span>Sample Test #${index + 1}</span>
            <button class="sample-copy-btn" data-copy-sample="${index}">Copy Input</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr;">
            <div>
              <div style="padding: 4px 12px; font-size: 11px; color: var(--text-muted); background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);">INPUT</div>
              <pre class="sample-pre" id="sample-in-${index}">${escapeHtml(t.input)}</pre>
            </div>
            <div style="border-left: 1px solid var(--border-color);">
              <div style="padding: 4px 12px; font-size: 11px; color: var(--text-muted); background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);">EXPECTED OUTPUT</div>
              <pre class="sample-pre">${escapeHtml(t.output)}</pre>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll("[data-copy-sample]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-copy-sample");
        if (tests[idx]) {
          navigator.clipboard.writeText(tests[idx].input);
          btn.textContent = "Copied! ✓";
          setTimeout(() => { btn.textContent = "Copy Input"; }, 1500);
        }
      });
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function initEditor() {
    const editor = $("code-editor");
    const langSelect = $("language-select");
    const savedLanguage = localStorage.getItem(SELECTED_LANGUAGE_KEY);
    const preferredLanguage = LEGACY_LANGUAGE_VALUES[savedLanguage] || savedLanguage;
    if (preferredLanguage && Array.from(langSelect.options).some(option => option.value === preferredLanguage)) {
      langSelect.value = preferredLanguage;
    }

    function updateLanguageLabel() {
      const selectedLanguage = langSelect.options[langSelect.selectedIndex].text;
      $("editor-language-label").textContent = `💻 ${selectedLanguage}`;
      $("btn-submit-code").disabled = false;
      $("submit-label").textContent = "Submit to CF";
    }

    const wrapper = $("editor-wrapper");
    if (window.CodeMirror && wrapper) {
      editorInstance = CodeMirror(wrapper, {
        value: editor.value || "",
        mode: CODEMIRROR_MODES[langSelect.value] || "text/x-c++src",
        theme: "default",
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: false,
        extraKeys: {
          "Cmd-Enter": () => runCustomInput(),
          "Ctrl-Enter": () => runCustomInput(),
          "Cmd-Shift-Enter": () => submitSolution(),
          "Ctrl-Shift-Enter": () => submitSolution(),
          "Tab": (cm) => {
            if (cm.somethingSelected()) {
              cm.indentSelection("add");
            } else {
              cm.replaceSelection("    ", "end", "+input");
            }
          }
        }
      });

      editor.style.display = "none";
      const lineNumbers = $("line-numbers");
      if (lineNumbers) lineNumbers.style.display = "none";

      if (window.ResizeObserver && wrapper) {
        const ro = new ResizeObserver(() => {
          if (editorInstance && wrapper.offsetWidth > 0 && wrapper.offsetHeight > 0) {
            editorInstance.refresh();
          }
        });
        ro.observe(wrapper);
      }

      editorInstance.on("change", () => {
        editor.value = editorInstance.getValue();
        saveCodeLocally();
      });
      editorInstance.on("blur", saveCodeLocally);
      window.addEventListener("pagehide", saveCodeLocally);
    } else {
      editor.addEventListener("input", () => {
        updateLineNumbers();
        saveCodeLocally();
      });
      editor.addEventListener("blur", saveCodeLocally);
      window.addEventListener("pagehide", saveCodeLocally);

      editor.addEventListener("scroll", () => {
        const lineNumbers = $("line-numbers");
        if (lineNumbers) lineNumbers.scrollTop = editor.scrollTop;
      });
    }

    langSelect.addEventListener("change", () => {
      saveCodeLocally();
      updateLanguageLabel();
      localStorage.setItem(SELECTED_LANGUAGE_KEY, langSelect.value);
      if (editorInstance) {
        const mode = CODEMIRROR_MODES[langSelect.value] || "text/x-c++src";
        editorInstance.setOption("mode", mode);
      }
      loadSavedCode();
    });

    updateLanguageLabel();
    updateLineNumbers();
  }

  function updateLineNumbers() {
    const lineNumbers = $("line-numbers");
    if (!lineNumbers || editorInstance) return;
    const editor = $("code-editor");
    lineNumbers.textContent = Array.from(
      { length: editor.value.split("\n").length },
      (_, index) => index + 1
    ).join("\n");
  }

  async function loadSavedCode() {
    const requestId = ++codeLoadRequest;
    const contestId = currentContestId;
    const problemIndex = currentProblemIndex;
    const languageId = $("language-select").value;
    const storageKey = `cf_code_${contestId}_${problemIndex}_${languageId}`;
    const legacyLanguageId = Object.keys(LEGACY_LANGUAGE_VALUES)
      .find(oldId => LEGACY_LANGUAGE_VALUES[oldId] === languageId);
    const legacyKey = legacyLanguageId
      ? `cf_code_${contestId}_${problemIndex}_${legacyLanguageId}`
      : null;
    let saved = null;

    try {
      saved = localStorage.getItem(storageKey)
        ?? (legacyKey ? localStorage.getItem(legacyKey) : null);
    } catch (error) {
      console.warn("Could not read editor code from local storage:", error);
    }
    if (saved === null && typeof chrome !== "undefined" && chrome.storage?.local) {
      try {
        const stored = await new Promise((resolve, reject) => {
          chrome.storage.local.get([storageKey, ...(legacyKey ? [legacyKey] : [])], result => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(result[storageKey] ?? (legacyKey ? result[legacyKey] : null) ?? null);
          });
        });
        saved = typeof stored === "string" ? stored : null;
      } catch (error) {
        console.warn("Could not read editor code from extension storage:", error);
      }
    }

    if (requestId !== codeLoadRequest
        || contestId !== currentContestId
        || problemIndex !== currentProblemIndex
        || languageId !== $("language-select").value) return;

    const legacyPrefix = LEGACY_TEMPLATE_PREFIXES[legacyLanguageId];
    if (legacyPrefix && saved?.startsWith(legacyPrefix)) {
      saved = null;
      try {
        localStorage.removeItem(storageKey);
        if (legacyKey) localStorage.removeItem(legacyKey);
      } catch (error) {
        console.warn("Could not remove legacy editor template:", error);
      }
    }
    if (saved !== null) {
      setEditorCode(saved);
      if (legacyKey && saved !== "") persistCode(storageKey, saved);
    } else {
      const template = TEMPLATES[languageId] ?? "";
      setEditorCode(template);
    }
    updateLineNumbers();
  }

  function saveCodeLocally() {
    const langId = $("language-select").value;
    const storageKey = `cf_code_${currentContestId}_${currentProblemIndex}_${langId}`;
    persistCode(storageKey, getEditorCode());

    $("save-status-badge").textContent = "(Saved)";
    setTimeout(() => {
      $("save-status-badge").textContent = "(Auto-saved)";
    }, 1500);
  }

  function persistCode(storageKey, code) {
    try {
      localStorage.setItem(storageKey, code);
    } catch (error) {
      console.warn("Could not save editor code to local storage:", error);
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ [storageKey]: code }, () => {
        if (chrome.runtime.lastError) {
          console.warn("Could not save editor code to extension storage:", chrome.runtime.lastError.message);
        }
      });
    }
  }

  async function submitSolution() {
    const code = getEditorCode();
    if (!code) {
      alert("Please write some code before submitting!");
      return;
    }

    const langId = $("language-select").value;
    const submitBtn = $("btn-submit-code");
    const submitLabel = $("submit-label");
    const submitSpinner = $("submit-spinner");
    const submitIcon = $("submit-icon");

    switchTab("tab-verdict");
    updateVerdictCard("testing", "Submitting to Codeforces...", "Sending source code to Codeforces via your browser session...");

    submitBtn.disabled = true;
    submitSpinner.style.display = "inline-block";
    submitIcon.style.display = "none";
    submitLabel.textContent = "Submitting...";

    try {
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: "SUBMIT_SOLUTION",
          contestId: currentContestId,
          problemIndex: currentProblemIndex,
          problemInput: $("problem-input")?.value?.trim() || `${currentContestId}${currentProblemIndex}`,
          langId: langId,
          langName: $("language-select").selectedOptions[0]?.textContent.trim() || "",
          code: code
        }, async (response) => {
          submitBtn.disabled = false;
          submitSpinner.style.display = "none";
          submitIcon.style.display = "inline";
          submitLabel.textContent = "Submit to CF";

          if (chrome.runtime.lastError) {
            updateVerdictCard(
              "wa",
              "Extension Error",
              `${chrome.runtime.lastError.message} Reload Codeforces Pro from brave://extensions and refresh this workspace.`
            );
            return;
          }

          if (!response) {
            updateVerdictCard(
              "wa",
              "Extension Needs Reload",
              "The background worker returned no response. Open brave://extensions, click Reload on Codeforces Pro, then refresh this workspace."
            );
            return;
          }

          if (response?.needTurnstile) {
            const alertEl = $("verdict-turnstile-alert");
            if (alertEl) alertEl.style.display = "flex";
          } else {
            const alertEl = $("verdict-turnstile-alert");
            if (alertEl) alertEl.style.display = "none";
          }

          if (response?.error) {
            updateVerdictCard("wa", "Submission Failed", response.error);
            return;
          }

          const submissionId = response?.submissionId;
          const userHandle = response?.handle;

          if (submissionId) {
            $("metric-sub-id").textContent = submissionId;
            updateVerdictCard("testing", "Submitted! In Queue", `Submission ID #${submissionId}. Polling Codeforces verdict...`);
            startVerdictPolling(submissionId, userHandle);
          } else {
            updateVerdictCard(
              "testing",
              "Submitted! Polling Verdict...",
              response?.message || "Solution submitted to Codeforces. Waiting for confirmation..."
            );
            startVerdictPolling(null, userHandle);
          }
          loadSubmissionsHistory(userHandle);
        });
      } else {
        submitBtn.disabled = false;
        submitSpinner.style.display = "none";
        submitIcon.style.display = "inline";
        submitLabel.textContent = "Submit to CF";
        alert("Extension background service worker not connected.");
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitSpinner.style.display = "none";
      submitIcon.style.display = "inline";
      submitLabel.textContent = "Submit to CF";
      updateVerdictCard("wa", "Error", err.message);
    }
  }

  function startVerdictPolling(submissionId, handle) {
    if (pollInterval) clearInterval(pollInterval);

    let attempts = 0;
    const maxAttempts = 35;

    pollInterval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        $("verdict-extra-info").textContent = "Polling timed out. Check Codeforces directly for final verdict.";
        return;
      }

      try {
        let sub = null;

        // Strategy 1: Poll contest.status API (public, no authentication needed)
        if (currentContestId && !isNaN(Number(currentContestId)) && Number(currentContestId) < 100000) {
          try {
            const resp = await fetch(`https://codeforces.com/api/contest.status?contestId=${currentContestId}&from=1&count=25`);
            const json = await resp.json();
            if (json.status === "OK" && json.result?.length > 0) {
              if (submissionId) {
                sub = json.result.find(s => s.id === Number(submissionId));
              }
              if (!sub && handle) {
                sub = json.result.find(s =>
                  s.author?.members?.some(m => m.handle?.toLowerCase() === handle.toLowerCase()) &&
                  s.problem?.index?.toUpperCase() === String(currentProblemIndex).toUpperCase()
                );
              }
              if (!sub && !submissionId) {
                // If ID is not yet known, match recent submission on this problem
                const now = Math.floor(Date.now() / 1000);
                sub = json.result.find(s =>
                  s.problem?.index?.toUpperCase() === String(currentProblemIndex).toUpperCase() &&
                  (now - s.creationTimeSeconds) < 120
                );
              }
            }
          } catch (e) {
            console.warn("Contest status API poll error:", e);
          }
        }

        // Strategy 2: Poll user.status API with handle (works for all problems including Gym)
        if (!sub && handle) {
          try {
            const resp = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&count=10`);
            const json = await resp.json();
            if (json.status === "OK" && json.result?.length > 0) {
              if (submissionId) {
                sub = json.result.find(s => s.id === Number(submissionId));
              }
              if (!sub) {
                sub = json.result.find(s =>
                  String(s.contestId) === String(currentContestId) &&
                  s.problem?.index?.toUpperCase() === String(currentProblemIndex).toUpperCase()
                );
              }
            }
          } catch (e) {
            console.warn("User status API poll error:", e);
          }
        }

        if (sub) {
          $("metric-sub-id").textContent = sub.id;
          $("metric-time").textContent = `${sub.timeConsumedMillis} ms`;
          $("metric-memory").textContent = `${Math.round(sub.memoryConsumedBytes / 1024)} KB`;

          const verdict = sub.verdict;

          if (!verdict || verdict === "TESTING") {
            const passCount = sub.passedTestCount || 0;
            updateVerdictCard("testing", `Testing... (Passed: ${passCount})`, `Running against test cases on Codeforces.`);
          } else {
            clearInterval(pollInterval);

            if (verdict === "OK") {
              updateVerdictCard("ac", "Accepted! 🎉", `All ${sub.passedTestCount} testcases passed! Time: ${sub.timeConsumedMillis}ms, Memory: ${Math.round(sub.memoryConsumedBytes / 1024)}KB`);
              syncSubmissionToSupabase(sub, "solved");
            } else if (verdict.includes("WRONG_ANSWER")) {
              updateVerdictCard("wa", `Wrong Answer on Test ${(sub.passedTestCount || 0) + 1} ❌`, `Incorrect output on test ${(sub.passedTestCount || 0) + 1}. Time: ${sub.timeConsumedMillis}ms.`);
              syncSubmissionToSupabase(sub, "attempted");
            } else if (verdict.includes("TIME_LIMIT")) {
              updateVerdictCard("tle", `Time Limit Exceeded ⏱️`, `Exceeded time limit on test ${(sub.passedTestCount || 0) + 1}.`);
              syncSubmissionToSupabase(sub, "attempted");
            } else if (verdict.includes("MEMORY_LIMIT")) {
              updateVerdictCard("tle", `Memory Limit Exceeded 💾`, `Exceeded memory limit on test ${(sub.passedTestCount || 0) + 1}.`);
              syncSubmissionToSupabase(sub, "attempted");
            } else if (verdict.includes("COMPILATION_ERROR")) {
              updateVerdictCard("wa", `Compilation Error ⚠️`, "Codeforces compiler reported an error compiling your solution.");
              syncSubmissionToSupabase(sub, "attempted");
            } else if (verdict.includes("RUNTIME_ERROR")) {
              updateVerdictCard("wa", `Runtime Error 💥`, `Runtime crash on test ${(sub.passedTestCount || 0) + 1}.`);
              syncSubmissionToSupabase(sub, "attempted");
            } else {
              updateVerdictCard("wa", formatVerdict(verdict), `Completed with verdict: ${verdict}`);
              syncSubmissionToSupabase(sub, "attempted");
            }
          }
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    }, 2000);
  }

  function updateVerdictCard(type, title, description) {
    const cardTitle = $("verdict-status-text");
    cardTitle.className = `verdict-title ${type}`;
    cardTitle.innerHTML = `<span>${title}</span>`;
    $("verdict-extra-info").textContent = description;
    $("verdict-time-ago").textContent = new Date().toLocaleTimeString();
  }

  function formatVerdict(v) {
    return v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  async function syncSubmissionToSupabase(sub, status) {
    if (!supabase || !currentUser) return;

    try {
      await supabase.from("problem_history").upsert({
        user_id: currentUser.id,
        contest_id: parseInt(currentContestId, 10),
        problem_index: currentProblemIndex,
        problem_name: currentProblemName,
        rating: currentRating,
        status: status,
        verdict: sub.verdict,
        pass_count: sub.passedTestCount,
        time_ms: sub.timeConsumedMillis,
        memory_kb: Math.round(sub.memoryConsumedBytes / 1024),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,contest_id,problem_index" });

      $("verdict-extra-info").innerHTML += ` <span style="color: var(--accent-green); font-weight:600;">(Synced with Supabase ✓)</span>`;
    } catch (e) {
      console.warn("Supabase history sync error:", e);
    }
  }

  async function loadSubmissionsHistory(handle) {
    const container = $("submissions-history-container");
    if (!container) return;

    try {
      container.innerHTML = `
        <div style="text-align: center; padding: 14px; color: var(--text-muted); font-size: 12px;">
          <span class="spinner" style="display:inline-block; vertical-align:middle; margin-right:6px;"></span> Fetching submissions from Codeforces...
        </div>
      `;

      let submissions = [];

      // Strategy 1: user.status API if handle is known
      if (handle) {
        try {
          const resp = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=20`);
          const json = await resp.json();
          if (json.status === "OK" && json.result) {
            submissions = json.result.filter(s =>
              String(s.contestId) === String(currentContestId) &&
              s.problem?.index?.toUpperCase() === String(currentProblemIndex).toUpperCase()
            );
          }
        } catch (e) {}
      }

      // Strategy 2: contest.status API
      if (submissions.length === 0 && currentContestId && !isNaN(Number(currentContestId)) && Number(currentContestId) < 100000) {
        try {
          const resp = await fetch(`https://codeforces.com/api/contest.status?contestId=${currentContestId}&from=1&count=30`);
          const json = await resp.json();
          if (json.status === "OK" && json.result) {
            if (handle) {
              submissions = json.result.filter(s =>
                s.author?.members?.some(m => m.handle?.toLowerCase() === handle.toLowerCase()) &&
                s.problem?.index?.toUpperCase() === String(currentProblemIndex).toUpperCase()
              );
            } else {
              submissions = json.result.filter(s =>
                s.problem?.index?.toUpperCase() === String(currentProblemIndex).toUpperCase()
              ).slice(0, 10);
            }
          }
        } catch (e) {}
      }

      if (!submissions || submissions.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 12px;">
            No recent submissions found for problem ${currentContestId}${currentProblemIndex}. Submit your code to see history here.
          </div>
        `;
        return;
      }

      let html = `
        <table class="submissions-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Language</th>
              <th>Time</th>
              <th>Memory</th>
              <th>When</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
      `;

      submissions.forEach(sub => {
        const v = sub.verdict || "TESTING";
        let badgeClass = "sub-status-testing";
        let label = "Testing...";
        if (v === "OK") {
          badgeClass = "sub-status-ac";
          label = "Accepted";
        } else if (v.includes("WRONG_ANSWER")) {
          badgeClass = "sub-status-wa";
          label = `Wrong Answer (${(sub.passedTestCount || 0) + 1})`;
        } else if (v.includes("TIME_LIMIT")) {
          badgeClass = "sub-status-tle";
          label = "Time Limit";
        } else if (v.includes("MEMORY_LIMIT")) {
          badgeClass = "sub-status-tle";
          label = "Memory Limit";
        } else if (v.includes("COMPILATION_ERROR")) {
          badgeClass = "sub-status-wa";
          label = "Compilation Error";
        } else if (v.includes("RUNTIME_ERROR")) {
          badgeClass = "sub-status-wa";
          label = "Runtime Error";
        } else {
          label = formatVerdict(v);
        }

        const dateStr = sub.creationTimeSeconds
          ? formatTimeAgo(sub.creationTimeSeconds)
          : "—";

        html += `
          <tr>
            <td><span class="sub-status-badge ${badgeClass}">${label}</span></td>
            <td><span style="font-family:var(--font-mono); font-size:11px;">${escapeHtml(sub.programmingLanguage || "—")}</span></td>
            <td><span style="font-family:var(--font-mono); font-size:11px;">${sub.timeConsumedMillis ?? 0} ms</span></td>
            <td><span style="font-family:var(--font-mono); font-size:11px;">${Math.round((sub.memoryConsumedBytes || 0) / 1024)} KB</span></td>
            <td style="color:var(--text-muted); font-size:11px;">${dateStr}</td>
            <td>
              <a href="https://codeforces.com/contest/${sub.contestId}/submission/${sub.id}" target="_blank" style="color:var(--accent-blue); text-decoration:none; font-family:var(--font-mono); font-weight:700;">
                #${sub.id} ↗
              </a>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      container.innerHTML = html;

    } catch (e) {
      container.innerHTML = `
        <div style="text-align: center; padding: 14px; color: var(--accent-red); font-size: 12px;">
          Could not load submissions: ${e.message}
        </div>
      `;
    }
  }

  function formatTimeAgo(epochSec) {
    const elapsed = Math.floor(Date.now() / 1000) - epochSec;
    if (elapsed < 60) return "Just now";
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
    if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
    return `${Math.floor(elapsed / 86400)}d ago`;
  }

  function initSplitResizer() {
    const resizer = $("resizer-horizontal");
    const leftPanel = $("panel-problem");
    let isDragging = false;

    resizer.addEventListener("mousedown", () => {
      isDragging = true;
      resizer.classList.add("dragging");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const containerWidth = $("workspace-container").offsetWidth;
      const newWidthPercent = (e.clientX / containerWidth) * 100;
      if (newWidthPercent >= 20 && newWidthPercent <= 80) {
        leftPanel.style.width = `${newWidthPercent}%`;
        if (editorInstance) editorInstance.refresh();
      }
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        resizer.classList.remove("dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (editorInstance) editorInstance.refresh();
      }
    });
  }

  function initVerticalResizer() {
    const resizer = $("resizer-dock");
    const bottomDock = $("bottom-dock");
    const editorContainer = $("panel-editor");
    if (!resizer || !bottomDock) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    resizer.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
      startHeight = bottomDock.offsetHeight;
      resizer.classList.add("dragging");
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dy = startY - e.clientY;
      const maxHeight = (editorContainer ? editorContainer.offsetHeight : window.innerHeight) - 100;
      const newHeight = Math.max(90, Math.min(startHeight + dy, maxHeight));
      bottomDock.style.height = `${newHeight}px`;
      if (editorInstance) editorInstance.refresh();
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        resizer.classList.remove("dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (editorInstance) editorInstance.refresh();
      }
    });
  }

  function initTabs() {
    document.querySelectorAll(".dock-tab").forEach(tab => {
      const handleTabAction = () => {
        const targetId = tab.getAttribute("data-tab");
        switchTab(targetId);
      };

      // Hover / cursor movement: switch tab smoothly on hover without clicking
      tab.addEventListener("mouseenter", handleTabAction);
      tab.addEventListener("pointerenter", handleTabAction);
      // Also maintain click for touch and keyboard accessibility
      tab.addEventListener("click", handleTabAction);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get("tab") || "tab-samples";
    switchTab(initialTab);

    // Update sliding indicator on resize
    window.addEventListener("resize", () => {
      const activeTab = document.querySelector(".dock-tab.active");
      if (activeTab) updateTabIndicator(activeTab);
    });
  }

  function updateTabIndicator(activeTabEl) {
    const indicator = $("dock-tab-indicator");
    if (!indicator || !activeTabEl) return;
    const parent = activeTabEl.parentElement;
    if (!parent) return;

    const tabRect = activeTabEl.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const left = tabRect.left - parentRect.left;
    const top = tabRect.top - parentRect.top;
    const width = tabRect.width;
    const height = tabRect.height;

    indicator.style.left = `${left}px`;
    indicator.style.top = `${top}px`;
    indicator.style.width = `${width}px`;
    indicator.style.height = `${height}px`;
    indicator.style.opacity = "1";
  }

  function switchTab(tabId) {
    let activeTabEl = null;
    document.querySelectorAll(".dock-tab").forEach(t => {
      const isActive = t.getAttribute("data-tab") === tabId;
      t.classList.toggle("active", isActive);
      if (isActive) activeTabEl = t;
    });
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.style.display = pane.id === tabId ? "block" : "none";
    });
    if (activeTabEl) {
      updateTabIndicator(activeTabEl);
    }
    if (editorInstance) {
      setTimeout(() => editorInstance.refresh(), 30);
    }
  }

  function initTimer() {
    const timerWidget = $("timer-widget");
    const setTimerState = (state) => {
      if (timerWidget) timerWidget.setAttribute("data-timer-state", state);
    };

    $("btn-timer-toggle").addEventListener("click", () => {
      if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        $("btn-timer-toggle").textContent = "▶";
        setTimerState("paused");
      } else {
        isTimerRunning = true;
        $("btn-timer-toggle").textContent = "⏸";
        setTimerState("running");
        timerInterval = setInterval(() => {
          timerSeconds++;
          const hrs = String(Math.floor(timerSeconds / 3600)).padStart(2, "0");
          const mins = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, "0");
          const secs = String(timerSeconds % 60).padStart(2, "0");
          $("timer-display").textContent = `${hrs}:${mins}:${secs}`;
        }, 1000);
      }
    });

    $("btn-timer-reset").addEventListener("click", () => {
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerSeconds = 0;
      $("timer-display").textContent = "00:00:00";
      $("btn-timer-toggle").textContent = "▶";
      setTimerState("idle");
    });

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTimer = urlParams.get("timer");
      if (urlTimer === "running") {
        setTimerState("running");
        $("btn-timer-toggle").textContent = "⏸";
        $("timer-display").textContent = "00:14:32";
      } else if (urlTimer === "paused") {
        setTimerState("paused");
        $("btn-timer-toggle").textContent = "▶";
        $("timer-display").textContent = "00:14:32";
      }
    } catch (e) {}
  }

  function initEventListeners() {
    $("brand-home")?.addEventListener("click", () => {
      loadCurrentProblem();
    });

    $("btn-load-problem")?.addEventListener("click", handleProblemInput);
    $("problem-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleProblemInput();
    });

    $("btn-random-problem").addEventListener("click", () => {
      const diceBtn = $("btn-random-problem");
      if (diceBtn) {
        diceBtn.classList.remove("dice-roll");
        void diceBtn.offsetWidth;
        diceBtn.classList.add("dice-roll");
      }
      const val = $("problem-input").value.trim();
      if (val) {
        handleProblemInput();
      } else {
        loadRandomProblem();
      }
    });
    $("btn-submit-code").addEventListener("click", submitSolution);
    $("btn-run-code").addEventListener("click", runCustomInput);
    $("btn-run-samples").addEventListener("click", runSampleTests);

    $("btn-refresh-submissions")?.addEventListener("click", () => {
      loadSubmissionsHistory();
    });

    $("btn-focus-cf-turnstile")?.addEventListener("click", () => {
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: "FOCUS_CF_SUBMIT_TAB" });
      }
    });

    $("btn-reset-template").addEventListener("click", () => {
      if (confirm("Reset current editor code to standard template?")) {
        const langId = $("language-select").value;
        setEditorCode(TEMPLATES[langId] ?? "");
        saveCodeLocally();
      }
    });

    const CODE_FONT_KEY = "cf_code_font_size";
    const PROBLEM_FONT_KEY = "cf_problem_font_size";

    try {
      const savedCodeFont = localStorage.getItem(CODE_FONT_KEY);
      if (savedCodeFont) {
        const cmEl = document.querySelector(".CodeMirror");
        if (cmEl) cmEl.style.fontSize = savedCodeFont;
        if ($("code-editor")) $("code-editor").style.fontSize = savedCodeFont;
        if (editorInstance) editorInstance.refresh();
      }
      const savedProblemFont = localStorage.getItem(PROBLEM_FONT_KEY);
      if (savedProblemFont && $("problem-content")) {
        $("problem-content").style.fontSize = savedProblemFont;
      }
    } catch (e) {}

    $("btn-font-inc").addEventListener("click", () => {
      const cmEl = document.querySelector(".CodeMirror");
      const target = cmEl || $("code-editor");
      const current = parseInt(window.getComputedStyle(target).fontSize, 10);
      if (current < 26) {
        const next = `${current + 1}px`;
        if (cmEl) cmEl.style.fontSize = next;
        $("code-editor").style.fontSize = next;
        try { localStorage.setItem(CODE_FONT_KEY, next); } catch (e) {}
        if (editorInstance) editorInstance.refresh();
      }
    });
    $("btn-font-dec").addEventListener("click", () => {
      const cmEl = document.querySelector(".CodeMirror");
      const target = cmEl || $("code-editor");
      const current = parseInt(window.getComputedStyle(target).fontSize, 10);
      if (current > 10) {
        const next = `${current - 1}px`;
        if (cmEl) cmEl.style.fontSize = next;
        $("code-editor").style.fontSize = next;
        try { localStorage.setItem(CODE_FONT_KEY, next); } catch (e) {}
        if (editorInstance) editorInstance.refresh();
      }
    });

    $("btn-problem-font-inc")?.addEventListener("click", () => {
      const content = $("problem-content");
      if (!content) return;
      const current = parseInt(window.getComputedStyle(content).fontSize, 10) || 14;
      if (current < 28) {
        const next = `${current + 1}px`;
        content.style.fontSize = next;
        try { localStorage.setItem(PROBLEM_FONT_KEY, next); } catch (e) {}
      }
    });
    $("btn-problem-font-dec")?.addEventListener("click", () => {
      const content = $("problem-content");
      if (!content) return;
      const current = parseInt(window.getComputedStyle(content).fontSize, 10) || 14;
      if (current > 11) {
        const next = `${current - 1}px`;
        content.style.fontSize = next;
        try { localStorage.setItem(PROBLEM_FONT_KEY, next); } catch (e) {}
      }
    });

    $("btn-signout").addEventListener("click", async () => {
      if (supabase) await supabase.auth.signOut();
      lockWorkspace();
    });
  }

  const WANDBOX_COMPILE_URL = "https://wandbox.org/api/compile.json";
  const WANDBOX_COMPILERS = {
    "cf-gpp20": { compiler: "gcc-13.2.0", options: "warning,gnu++2a" },
    "cf-gpp23": { compiler: "gcc-13.2.0", options: "warning,gnu++2b" },
    "cf-gpp17": { compiler: "gcc-13.2.0", options: "warning,gnu++17" },
    "cf-gcc-c11": { compiler: "gcc-13.2.0-c", options: "warning,c11" },
    "cf-python3": { compiler: "cpython-3.14.0" },
    "cf-pypy310": { compiler: "cpython-3.14.0" },
    "cf-pypy36": { compiler: "cpython-3.14.0" },
    "cf-python2": { compiler: "cpython-2.7-head" },
    "cf-pypy2": { compiler: "cpython-2.7-head" },
    "cf-rust2021": { compiler: "rust-1.82.0" },
    "cf-rust2024": { compiler: "rust-1.82.0" },
    "cf-go": { compiler: "go-1.23.2" },
    "cf-java21": { compiler: "openjdk-jdk-21+35" },
    "cf-java8": { compiler: "openjdk-jdk-21+35" },
    "cf-nodejs": { compiler: "nodejs-20.17.0" },
    "cf-javascript-v8": { compiler: "nodejs-20.17.0" },
    "cf-csharp13": { compiler: "dotnetcore-8.0.402" },
    "cf-csharp10": { compiler: "dotnetcore-8.0.402" },
    "cf-csharp8": { compiler: "dotnetcore-8.0.402" },
    "cf-csharp-mono": { compiler: "mono-6.12.0.199" },
    "cf-ruby": { compiler: "ruby-3.3.11" },
    "cf-pascal": { compiler: "fpc-3.2.2" },
    "cf-pascalabc": { compiler: "fpc-3.2.2" }
  };

  async function runCustomInput() {
    const expected = $("custom-stdout").value;
    await executeTestCases([{
      label: "Custom input",
      input: $("custom-stdin").value,
      expected: expected.trim() ? expected : null
    }]);
  }

  async function runSampleTests() {
    if (!sampleTestcases.length) {
      showOutput("No sample tests", "Load a problem with sample tests before running them.", "error");
      switchTab("tab-output");
      return;
    }
    await executeTestCases(sampleTestcases.map((test, index) => ({
      label: `Sample ${index + 1}`,
      input: test.input,
      expected: test.output
    })));
  }

  async function executeTestCases(testCases) {
    if (isRunningCode) return;
    const code = getEditorCode();
    const languageId = $("language-select").value;
    const compiler = WANDBOX_COMPILERS[languageId];
    switchTab("tab-output");

    if (!code.trim()) {
      showOutput("No code", "Write a solution before running it.", "error");
      return;
    }
    if (code.length > 100000 || testCases.some(test => test.input.length > 100000)) {
      showOutput("Input too large", "Code and test input must each be smaller than 100,000 characters.", "error");
      return;
    }
    if (!compiler) {
      showOutput("Unsupported language", "This language is not configured for the hosted runner.", "error");
      return;
    }

    isRunningCode = true;
    $("btn-run-code").disabled = true;
    $("btn-run-samples").disabled = true;
    showOutput("Running...", "Sending code to the hosted compiler and running test cases.", "running");

    const results = [];
    let passed = 0;
    try {
      for (const test of testCases) {
        showOutput("Running...", `${test.label}: compiling and executing...`, "running");
        const response = await runOnWandbox(code, test.input, compiler, languageId);
        const output = response.program_output || response.program_message || "";
        const compileOutput = response.compiler_error || response.compiler_output || response.compiler_message || "";
        const runtimeError = response.program_error || "";

        if (response.status !== "0" && compileOutput) {
          results.push(`${test.label}: COMPILE ERROR\n${compileOutput}`);
          break;
        }
        if (response.status !== "0" || response.signal) {
          const isSyntaxError = /\b(SyntaxError|IndentationError|TabError)\b/.test(runtimeError);
          const errorType = isSyntaxError ? "SYNTAX ERROR" : "RUNTIME ERROR";
          const details = [runtimeError, output].filter(Boolean).join("\n");
          results.push(`${test.label}: ${errorType}${response.signal ? ` (${response.signal})` : ""}\n${details || "Program exited unsuccessfully."}`);
          break;
        }

        const matched = test.expected === null
          || normalizeOutput(output) === normalizeOutput(test.expected);
        if (matched) passed++;
        results.push(
          `${test.label}: ${test.expected === null ? "FINISHED" : matched ? "PASSED" : "WRONG ANSWER"}`
          + `\n--- Output ---\n${output || "Program finished successfully but printed no output. Add a print, cout, or console.log statement to display a result."}`
          + (test.expected === null ? "" : `\n--- Expected ---\n${test.expected || "(no output)"}`)
        );
      }

      const hasError = results.some(result =>
        [": COMPILE ERROR", ": SYNTAX ERROR", ": RUNTIME ERROR"].some(type => result.includes(type))
      );
      const allMatched = !hasError && passed === testCases.length;
      const status = hasError ? "Execution error" : allMatched
        ? (testCases.length === 1 && testCases[0].expected === null ? "Finished" : `Passed ${passed}/${testCases.length}`)
        : `Passed ${passed}/${testCases.length}`;
      const style = hasError || (!allMatched && testCases.some(test => test.expected !== null)) ? "error" : "success";
      showOutput(status, results.join("\n\n") || "No output.", style);
    } catch (error) {
      showOutput("Runner error", error.message || "Could not reach the hosted code runner.", "error");
    } finally {
      isRunningCode = false;
      $("btn-run-code").disabled = false;
      $("btn-run-samples").disabled = false;
    }
  }

  async function runOnWandbox(code, stdin, compiler, languageId) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const request = { compiler: compiler.compiler, code, stdin };
      if (compiler.options) request.options = compiler.options;
      const response = await fetch(WANDBOX_COMPILE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(request)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `Compiler returned HTTP ${response.status}.`);
      }
      return result;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("The hosted compiler timed out. Try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function normalizeOutput(text) {
    return text.replace(/\r\n/g, "\n").split("\n").map(line => line.trimEnd()).join("\n").trim();
  }

  function showOutput(status, output, style) {
    $("output-status").textContent = status;
    $("output-status").className = `output-status ${style}`;
    $("output-content").textContent = output;
  }

  function handleProblemInput() {
    const raw = $("problem-input").value.trim();
    if (!raw) return;

    const urlMatch = raw.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/) ||
                     raw.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
    if (urlMatch) {
      loadProblem(urlMatch[1], urlMatch[2]);
      return;
    }

    const codeMatch = raw.match(/^(\d+)\s*([A-Za-z0-9]+)$/);
    if (codeMatch) {
      loadProblem(codeMatch[1], codeMatch[2]);
      return;
    }

    alert("Please enter a valid problem format like '1900B' or paste a Codeforces problem URL.");
  }

  async function loadRandomProblem() {
    try {
      const resp = await fetch("https://codeforces.com/api/problemset.problems");
      const json = await resp.json();
      if (json.status === "OK" && json.result?.problems?.length > 0) {
        const filtered = json.result.problems.filter(p => p.rating && p.rating >= 1000 && p.rating <= 1600);
        const randomProblem = filtered[Math.floor(Math.random() * filtered.length)];
        $("problem-input").value = `${randomProblem.contestId}${randomProblem.index}`;
        loadProblem(randomProblem.contestId, randomProblem.index);
      }
    } catch (e) {
      console.warn("Random problem fetch error:", e);
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
