// ============================================================
// src/editor/workspace.js
// Interactive Codeforces Pro Workspace Controller
// ============================================================

(function () {
  "use strict";

  const SUPABASE_URL = "https://cstqftxvemarvesbremc.supabase.co";
  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdHFmdHh2ZW1hcnZlc2JyZW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTU5NTAsImV4cCI6MjEwNzk5MTk1MH0.JEdHBNiBJ7MLFoePUuzG-vQj8v5uNgDoAvdQvYTh3Yo";

  const TEMPLATES = {
    "89": `// Codeforces Solution in C++20\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solve() {\n    // Write your code here\n    \n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int t = 1;\n    cin >> t;\n    while (t--) {\n        solve();\n    }\n    return 0;\n}\n`,
    "54": `// Codeforces Solution in C++17\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solve() {\n    // Write your code here\n    \n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int t = 1;\n    cin >> t;\n    while (t--) {\n        solve();\n    }\n    return 0;\n}\n`,
    "71": `# Codeforces Solution in Python 3\nimport sys\n\ndef solve():\n    pass\n\ndef main():\n    input = sys.stdin.read\n    data = input().split()\n    if not data:\n        return\n\nif __name__ == '__main__':\n    main()\n`,
    "70": `# Codeforces Solution in PyPy 3\nimport sys\n\ndef main():\n    lines = sys.stdin.read().splitlines()\n\nif __name__ == '__main__':\n    main()\n`,
    "87": `// Codeforces Solution in Java 17\nimport java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int t = sc.hasNextInt() ? sc.nextInt() : 1;\n        while (t-- > 0) {\n            // solve\n        }\n    }\n}\n`,
    "75": `// Codeforces Solution in Rust 2021\nuse std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    let mut lines = stdin.lock().lines();\n}\n`
  };

  let supabase = null;
  let currentUser = null;
  let currentContestId = "1900";
  let currentProblemIndex = "B";
  let currentProblemName = "Laura and Operations";
  let currentRating = 1100;
  let sampleTestcases = [];
  let pollInterval = null;

  let timerSeconds = 0;
  let timerInterval = null;
  let isTimerRunning = false;

  const $ = (id) => document.getElementById(id);

  async function init() {
    initGateListeners();
    initSplitResizer();
    initEditor();
    initTimer();
    initTabs();
    initEventListeners();

    await initSupabase();
  }

  // ─────────────────────────────────────────────────────────────
  // SUPABASE AUTH & GATE LOCK
  // ─────────────────────────────────────────────────────────────
  async function initSupabase() {
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

    const email = user.email || "User";
    $("user-email-text").textContent = email;
    $("user-avatar").textContent = email.charAt(0).toUpperCase();

    // Load problem now that user is verified
    loadCurrentProblem();
  }

  function lockWorkspace() {
    currentUser = null;
    $("workspace-app").style.display = "none";
    $("auth-gate").style.display = "flex";
    $("auth-gate-loading").style.display = "none";
    $("auth-gate-form").style.display = "block";
    $("gate-password").value = "";
  }

  function initGateListeners() {
    $("btn-gate-login").addEventListener("click", handleLogin);
    $("gate-password").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
    $("gate-email").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  async function handleLogin() {
    const email = $("gate-email").value.trim();
    const password = $("gate-password").value.trim();
    const errorBox = $("auth-gate-error");
    const loginBtn = $("btn-gate-login");
    const spinner = $("gate-login-spinner");
    const loginText = $("gate-login-text");

    if (!email || !password) {
      errorBox.textContent = "Please enter both User (Email) and Password.";
      errorBox.style.display = "block";
      return;
    }

    errorBox.style.display = "none";
    loginBtn.disabled = true;
    spinner.style.display = "inline-block";
    loginText.textContent = "Verifying...";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error("Invalid login credentials. Only authorized accounts created by the admin can log in.");
      }

      if (data?.user) {
        unlockWorkspace(data.user);
      }
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = "block";
    } finally {
      loginBtn.disabled = false;
      spinner.style.display = "none";
      loginText.textContent = "Log In";
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PROBLEM LOADING & PARSING
  // ─────────────────────────────────────────────────────────────
  function loadCurrentProblem() {
    const urlParams = new URLSearchParams(window.location.search);
    const contestParam = urlParams.get("contestId") || urlParams.get("contest");
    const indexParam = urlParams.get("problemIndex") || urlParams.get("index");

    if (contestParam && indexParam) {
      currentContestId = contestParam;
      currentProblemIndex = indexParam.toUpperCase();
    }
    $("problem-input").value = `${currentContestId}${currentProblemIndex}`;
    loadProblem(currentContestId, currentProblemIndex);
  }

  async function loadProblem(contestId, problemIndex) {
    currentContestId = contestId;
    currentProblemIndex = problemIndex;

    $("problem-code-display").textContent = `${contestId}${problemIndex}`;
    $("problem-title-display").textContent = "Loading problem statement...";
    $("problem-content").innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-muted);">
        <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto 12px; border-width: 3px;"></div>
        <div>Fetching from Codeforces...</div>
      </div>
    `;

    try {
      loadSavedCode();

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
      <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: var(--text-muted);">Source: Codeforces Round / Contest ${contestId}</span>
        <a href="https://codeforces.com/contest/${contestId}/problem/${problemIndex}" target="_blank" style="color: var(--accent-blue); text-decoration: none; font-size: 12px; font-weight: 600;">
          Open on Codeforces.com ↗
        </a>
      </div>
    `;

    $("problem-content").innerHTML = statementHtml;
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
    const lineNumbers = $("line-numbers");
    const langSelect = $("language-select");

    function updateLineNumbers() {
      const lines = editor.value.split("\n").length;
      let lineNumText = "";
      for (let i = 1; i <= lines; i++) {
        lineNumText += i + "\n";
      }
      lineNumbers.textContent = lineNumText;
    }

    editor.addEventListener("input", () => {
      updateLineNumbers();
      saveCodeLocally();
    });

    editor.addEventListener("scroll", () => {
      lineNumbers.scrollTop = editor.scrollTop;
    });

    editor.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        updateLineNumbers();
      } else if (e.key === "Enter") {
        const start = editor.selectionStart;
        const currentLine = editor.value.substring(0, start).split("\n").pop();
        const indentMatch = currentLine.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : "";
        const extraIndent = currentLine.trim().endsWith("{") ? "    " : "";

        e.preventDefault();
        const insertText = "\n" + indent + extraIndent;
        editor.value = editor.value.substring(0, start) + insertText + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + insertText.length;
        updateLineNumbers();
      }
    });

    langSelect.addEventListener("change", () => {
      loadSavedCode();
    });

    updateLineNumbers();
  }

  function loadSavedCode() {
    const langId = $("language-select").value;
    const storageKey = `cf_code_${currentContestId}_${currentProblemIndex}_${langId}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      $("code-editor").value = saved;
    } else {
      $("code-editor").value = TEMPLATES[langId] || TEMPLATES["89"];
    }

    const lines = $("code-editor").value.split("\n").length;
    let lineNumText = "";
    for (let i = 1; i <= lines; i++) lineNumText += i + "\n";
    $("line-numbers").textContent = lineNumText;
  }

  function saveCodeLocally() {
    const langId = $("language-select").value;
    const storageKey = `cf_code_${currentContestId}_${currentProblemIndex}_${langId}`;
    localStorage.setItem(storageKey, $("code-editor").value);
    
    $("save-status-badge").textContent = "(Saved)";
    setTimeout(() => {
      $("save-status-badge").textContent = "(Auto-saved)";
    }, 1500);
  }

  async function submitSolution() {
    const code = $("code-editor").value.trim();
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
          langId: langId,
          code: code
        }, async (response) => {
          submitBtn.disabled = false;
          submitSpinner.style.display = "none";
          submitIcon.style.display = "inline";
          submitLabel.textContent = "Submit to CF";

          if (chrome.runtime.lastError) {
            updateVerdictCard("wa", "Extension Error", chrome.runtime.lastError.message);
            return;
          }

          if (response?.error) {
            updateVerdictCard("wa", "Submission Failed", response.error);
            return;
          }

          const submissionId = response?.submissionId;
          $("metric-sub-id").textContent = submissionId || "Pending";
          updateVerdictCard("testing", "Submitted! In Queue", `Submission ID #${submissionId || ""}. Polling Codeforces verdict...`);

          startVerdictPolling(submissionId);
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

  function startVerdictPolling(submissionId) {
    if (pollInterval) clearInterval(pollInterval);

    let attempts = 0;
    const maxAttempts = 30;

    pollInterval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        $("verdict-extra-info").textContent = "Polling timed out. Check Codeforces directly for final verdict.";
        return;
      }

      try {
        const resp = await fetch("https://codeforces.com/api/user.status?count=10", { credentials: "include" });
        const json = await resp.json();

        if (json.status === "OK" && json.result?.length > 0) {
          let sub = null;
          if (submissionId) {
            sub = json.result.find(s => s.id === submissionId);
          }
          if (!sub) {
            sub = json.result.find(s => 
              String(s.contestId) === String(currentContestId) &&
              s.problem.index.toUpperCase() === String(currentProblemIndex).toUpperCase()
            );
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
                updateVerdictCard("wa", `Wrong Answer on Test ${sub.passedTestCount + 1} ❌`, `Incorrect output. Time: ${sub.timeConsumedMillis}ms.`);
                syncSubmissionToSupabase(sub, "attempted");
              } else if (verdict.includes("TIME_LIMIT")) {
                updateVerdictCard("tle", `Time Limit Exceeded ⏱️`, `Exceeded time limit on test ${sub.passedTestCount + 1}.`);
                syncSubmissionToSupabase(sub, "attempted");
              } else {
                updateVerdictCard("wa", formatVerdict(verdict), `Completed with verdict: ${verdict}`);
                syncSubmissionToSupabase(sub, "attempted");
              }
            }
          }
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    }, 2500);
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
      }
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        resizer.classList.remove("dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    });
  }

  function initTabs() {
    document.querySelectorAll(".dock-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const targetId = tab.getAttribute("data-tab");
        switchTab(targetId);
      });
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll(".dock-tab").forEach(t => {
      t.classList.toggle("active", t.getAttribute("data-tab") === tabId);
    });
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.style.display = pane.id === tabId ? "block" : "none";
    });
  }

  function initTimer() {
    $("btn-timer-toggle").addEventListener("click", () => {
      if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        $("btn-timer-toggle").textContent = "▶";
      } else {
        isTimerRunning = true;
        $("btn-timer-toggle").textContent = "⏸";
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
    });
  }

  function initEventListeners() {
    $("btn-load-problem").addEventListener("click", handleProblemInput);
    $("problem-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleProblemInput();
    });

    $("btn-random-problem").addEventListener("click", loadRandomProblem);
    $("btn-submit-code").addEventListener("click", submitSolution);

    $("btn-reset-template").addEventListener("click", () => {
      if (confirm("Reset current editor code to standard template?")) {
        const langId = $("language-select").value;
        $("code-editor").value = TEMPLATES[langId] || TEMPLATES["89"];
        saveCodeLocally();
      }
    });

    $("btn-font-inc").addEventListener("click", () => {
      const current = parseInt(window.getComputedStyle($("code-editor")).fontSize, 10);
      if (current < 24) {
        $("code-editor").style.fontSize = `${current + 1}px`;
        $("line-numbers").style.fontSize = `${current + 1}px`;
      }
    });
    $("btn-font-dec").addEventListener("click", () => {
      const current = parseInt(window.getComputedStyle($("code-editor")).fontSize, 10);
      if (current > 10) {
        $("code-editor").style.fontSize = `${current - 1}px`;
        $("line-numbers").style.fontSize = `${current - 1}px`;
      }
    });

    $("btn-signout").addEventListener("click", async () => {
      if (supabase) await supabase.auth.signOut();
      lockWorkspace();
    });
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
