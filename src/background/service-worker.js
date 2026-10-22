// ============================================================
// src/background/service-worker.js
// Background worker for Codeforces Pro
// ============================================================

// ── Toolbar Icon Click Handler ────────────────────────────────
chrome.action.onClicked.addListener(async (tab) => {
  let contestId = "";
  let problemIndex = "";

  if (tab?.url) {
    const match = tab.url.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/) ||
                  tab.url.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/) ||
                  tab.url.match(/\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (match) {
      contestId = match[1];
      problemIndex = match[2];
    }
  }

  await openWorkspace(contestId, problemIndex);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "OPEN_WORKSPACE") {
    openWorkspace(msg.contestId, msg.problemIndex).then(
      () => sendResponse({ success: true }),
      (error) => sendResponse({ error: error?.message || String(error) })
    );
    return true;
  }

  if (msg.type === "SUBMIT_SOLUTION") {
    handleSubmission(msg, sender).then(
      sendResponse,
      error => sendResponse({ error: `Submission worker failed: ${error?.message || String(error)}` })
    );
    return true;
  }

  if (msg.type === "GET_SESSION") {
    getSession().then(sendResponse);
    return true;
  }

  if (msg.type === "FOCUS_CF_SUBMIT_TAB") {
    if (cfSubmitTabId) {
      chrome.tabs.update(cfSubmitTabId, { active: true }).then(() => {
        chrome.tabs.get(cfSubmitTabId, t => {
          if (t?.windowId !== undefined) {
            chrome.windows.update(t.windowId, { focused: true });
          }
        });
      }).catch(() => {});
    }
    return true;
  }
});

async function openWorkspace(contestId, problemIndex) {
  const params = new URLSearchParams();
  if (contestId) params.set("contestId", contestId);
  if (problemIndex) params.set("problemIndex", problemIndex);
  const baseUrl = chrome.runtime.getURL("src/editor/workspace.html");
  const query = params.toString() ? `?${params}` : "";
  const tabs = await chrome.tabs.query({});
  const workspaces = tabs.filter(tab => tab.url?.startsWith(baseUrl));

  if (workspaces.length) {
    const [workspace, ...duplicates] = workspaces;
    if (duplicates.length) {
      await chrome.tabs.remove(duplicates.map(tab => tab.id).filter(id => id !== undefined));
    }
    const updateProperties = { active: true };
    if (query) updateProperties.url = `${baseUrl}${query}`;
    await chrome.tabs.update(workspace.id, updateProperties);
    if (workspace.windowId !== undefined) {
      await chrome.windows.update(workspace.windowId, { focused: true });
    }
    return;
  }

  await chrome.tabs.create({ url: `${baseUrl}${query}` });
}

let cfSubmitTabId = null;

async function handleSubmission({ contestId, problemIndex, problemInput, langId, langName, code }, sender) {
  const fullProblemCode = (problemInput || `${contestId}${problemIndex}`).trim();
  if (!fullProblemCode) {
    return { error: "Missing problem identifier (e.g. 1900B)." };
  }
  if (!code || !code.trim()) {
    return { error: "Cannot submit empty source code." };
  }

  const workspaceTabId = sender?.tab?.id;
  const isGym = Number(contestId) >= 100000;
  const preferredUrl = isGym
    ? `https://codeforces.com/gym/${contestId}/submit`
    : (contestId && !isNaN(Number(contestId))
        ? `https://codeforces.com/contest/${contestId}/submit`
        : `https://codeforces.com/problemset/submit`);

  let tab = null;

  try {
    // 1. Check for existing submit tab or Codeforces tab
    const allTabs = await chrome.tabs.query({ url: "*://codeforces.com/*" });

    // First priority: A tab that is ALREADY on a submit page
    const existingSubmitTab = allTabs.find(t => {
      try {
        const p = new URL(t.url).pathname;
        return p.includes("/submit");
      } catch {
        return false;
      }
    });

    if (existingSubmitTab) {
      tab = existingSubmitTab;
      // Bring submit tab to focus so Cloudflare Turnstile has CPU priority
      await chrome.tabs.update(tab.id, { active: true });
      if (tab.windowId !== undefined) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      // Note: Do NOT reload the tab if it is already on /submit, to preserve any already-solved Turnstile state!
    } else {
      // Find another Codeforces tab to navigate, or create a new one
      const reusableTab = allTabs.find(t => {
        try {
          const p = new URL(t.url).pathname;
          return p.includes("/my") || p.includes("/status") || p.includes("/problem");
        } catch {
          return false;
        }
      });

      if (reusableTab) {
        tab = reusableTab;
        await chrome.tabs.update(tab.id, { url: preferredUrl, active: true });
      } else if (cfSubmitTabId) {
        try {
          tab = await chrome.tabs.get(cfSubmitTabId);
          await chrome.tabs.update(tab.id, { url: preferredUrl, active: true });
        } catch {
          tab = null;
        }
      }

      if (!tab) {
        tab = await chrome.tabs.create({ url: preferredUrl, active: true });
      }
      cfSubmitTabId = tab.id;

      if (tab.windowId !== undefined) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }

      await waitForTabReady(tab.id, 15000);
    }

    // Check if redirected to login / enter
    const currentTab = await chrome.tabs.get(tab.id);
    if (currentTab.url && (currentTab.url.includes("/enter") || currentTab.url.includes("/login"))) {
      await chrome.tabs.update(tab.id, { active: true });
      return { error: "You are not logged into Codeforces in this browser. Please log into Codeforces in the opened tab, then retry." };
    }

    // 2. Inject automation script to paste problem, language, source code into #editor & #source, wait for Turnstile, and submit
    let fillResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: cfFillAndSubmitFormScript,
      args: [contestId, problemIndex, langId, langName, code, fullProblemCode],
    });

    let fillResult = fillResults?.[0]?.result;

    if (!fillResult) {
      return { error: "Could not execute submission automation script on Codeforces." };
    }

    if (fillResult.needTurnstile) {
      await chrome.tabs.update(tab.id, { active: true });
      if (tab.windowId !== undefined) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      return { error: fillResult.error, needTurnstile: true };
    }

    if (fillResult.needFocus || fillResult.needLogin) {
      await chrome.tabs.update(tab.id, { active: true });
      return { error: fillResult.error };
    }

    if (fillResult.error) {
      return { error: fillResult.error };
    }

    if (!fillResult.submitted) {
      return { error: "Form could not be submitted on Codeforces." };
    }

    const existingIds = fillResult.existingSubmissionIds || [];
    const detectedHandle = fillResult.handle || "";

    // 3. Inspect tab & API for new submission ID
    let submissionId = null;
    let finalHandle = detectedHandle;

    for (let attempt = 0; attempt < 15; attempt++) {
      await new Promise(r => setTimeout(r, 1000));

      // Strategy A: DOM inspection of the submission tab
      try {
        const inspectResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: "MAIN",
          func: cfInspectSubmissionResult,
          args: [contestId, problemIndex, existingIds],
        });
        const inspectRes = inspectResults?.[0]?.result;

        if (inspectRes?.error) {
          await chrome.tabs.update(tab.id, { active: true });
          return { error: inspectRes.error };
        }
        if (inspectRes?.submissionId) {
          submissionId = inspectRes.submissionId;
          if (inspectRes.handle) finalHandle = inspectRes.handle;
          break;
        }
      } catch (e) {
        // Tab is navigating or reloading
      }

      // Strategy B: user.status API (if handle detected)
      if (detectedHandle) {
        try {
          const uResp = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(detectedHandle)}&from=1&count=5`, { cache: "no-store" });
          const uJson = await uResp.json();
          if (uJson.status === "OK" && uJson.result?.length > 0) {
            const now = Math.floor(Date.now() / 1000);
            const recentSub = uJson.result.find(s =>
              (now - s.creationTimeSeconds) < 120 &&
              !existingIds.includes(s.id)
            );
            if (recentSub) {
              submissionId = recentSub.id;
              finalHandle = detectedHandle;
              break;
            }
          }
        } catch (e) {}
      }

      // Strategy C: contest.status API
      if (!submissionId && !isGym && contestId && !isNaN(Number(contestId))) {
        try {
          const apiResp = await fetch(`https://codeforces.com/api/contest.status?contestId=${contestId}&from=1&count=5`, { cache: "no-store" });
          const apiJson = await apiResp.json();
          if (apiJson.status === "OK" && apiJson.result?.length > 0) {
            const now = Math.floor(Date.now() / 1000);
            const recentSub = apiJson.result.find(s =>
              s.problem?.index?.toUpperCase() === String(problemIndex || "").toUpperCase() &&
              (now - s.creationTimeSeconds) < 120 &&
              !existingIds.includes(s.id)
            );
            if (recentSub) {
              submissionId = recentSub.id;
              if (recentSub.author?.members?.[0]?.handle) {
                finalHandle = recentSub.author.members[0].handle;
              }
              break;
            }
          }
        } catch (e) {}
      }
    }

    // Now switch back to workspace tab
    if (workspaceTabId) {
      try {
        await chrome.tabs.update(workspaceTabId, { active: true });
      } catch (e) {}
    }

    if (submissionId) {
      return { submissionId, handle: finalHandle, message: "Submitted successfully." };
    }

    return {
      submissionId: null,
      handle: finalHandle,
      message: `Solution submitted to Codeforces for ${fullProblemCode}. Polling verdict...`
    };

  } catch (err) {
    console.error("[CF Pro SW] Submission exception:", err);
    return { error: err?.message || String(err) };
  }
}

async function cfFillAndSubmitFormScript(contestId, problemIndex, langId, langName, code, problemInput) {
  const fullProblemCode = (problemInput || `${contestId}${problemIndex}`).trim().toUpperCase();
  const targetIndex = (problemIndex || fullProblemCode.replace(/^\d+/, "")).trim().toUpperCase();

  // 1. Session check
  const pathname = location.pathname.toLowerCase();
  if (pathname.includes("/enter") || pathname.includes("/login")) {
    return { error: "You are not logged into Codeforces. Please log in and retry.", needLogin: true };
  }

  const enterLink = document.querySelector('a[href*="/enter"], a[href*="/login"]');
  const profileLink = document.querySelector('a[href^="/profile/"], a[href*="/logout"]');
  if (enterLink && !profileLink) {
    return { error: "You are not logged into Codeforces in this browser. Please log in first.", needLogin: true };
  }

  const userHandle = profileLink?.textContent?.trim() || "";

  // 2. Find submit form
  const form = document.querySelector("form.submit-form")
    || Array.from(document.forms).find(f => f.querySelector('select[name="programTypeId"]'))
    || document.querySelector('form[action*="submit"]');

  if (!form) {
    return { error: "Codeforces submit form not found on this page. Make sure you are logged in." };
  }

  // 3. Problem Section (td.field-name Problem -> input#submittedProblemCode or select#submittedProblemIndex)
  let problemField = form.querySelector('input[name="submittedProblemCode"], #submittedProblemCode, select[name="submittedProblemIndex"], #submittedProblemIndex');
  if (!problemField) {
    const fieldNames = Array.from(form.querySelectorAll('td.field-name, td.fieldname, th, label'));
    const probLabel = fieldNames.find(el => /problem/i.test(el.textContent));
    if (probLabel) {
      problemField = probLabel.closest("tr")?.querySelector("input, select");
    }
  }

  if (problemField) {
    if (problemField.tagName === "SELECT") {
      // Contest dropdown: select matching index (e.g., 'B' or 'B - Laura and Operations')
      const options = Array.from(problemField.options);
      const opt = options.find(o => {
        const v = o.value.trim().toUpperCase();
        const t = o.textContent.trim().toUpperCase();
        return v === targetIndex || t.startsWith(targetIndex + " ") || t.startsWith(targetIndex + " -") || t === targetIndex;
      });
      if (opt) {
        problemField.value = opt.value;
      }
    } else {
      // Text input: paste exact text from workspace #problem-input (e.g., '1900B')
      problemField.focus();
      problemField.value = fullProblemCode;
    }
    problemField.dispatchEvent(new Event("input", { bubbles: true }));
    problemField.dispatchEvent(new Event("change", { bubbles: true }));
    problemField.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    problemField.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
    problemField.dispatchEvent(new Event("blur", { bubbles: true }));
    try {
      if (window.$) window.$(problemField).val(problemField.value).trigger("input").trigger("change").trigger("keyup").trigger("blur");
    } catch (e) {}
  }

  // 4. Language Section (div.nav-right select.select-control -> select[name="programTypeId"])
  let langSelect = form.querySelector('select[name="programTypeId"]');
  if (!langSelect) {
    const fieldNames = Array.from(form.querySelectorAll('td.field-name, td.fieldname, th, label'));
    const langLabel = fieldNames.find(el => /language|compiler|program/i.test(el.textContent));
    if (langLabel) {
      langSelect = langLabel.closest("tr")?.querySelector("select");
    }
  }

  if (langSelect) {
    const LANGUAGE_RULES = [
      { ids: ["89"], match: [/c\+\+20/i, /g\+\+20/i], test: id => id === "cf-gpp20" },
      { ids: ["91"], match: [/c\+\+23/i, /g\+\+23/i], test: id => id === "cf-gpp23" },
      { ids: ["54"], match: [/c\+\+17/i, /g\+\+17/i], test: id => id === "cf-gpp17" },
      { ids: ["43"], match: [/gcc.*c11/i, /c11/i, /\bc\b/i], test: id => id === "cf-gcc-c11" },
      { ids: ["70"], match: [/pypy\s*3/i], test: id => id.includes("pypy3") },
      { ids: ["41"], match: [/pypy\s*2/i], test: id => id.includes("pypy2") },
      { ids: ["31", "71"], match: [/python\s*3/i], exclude: [/pypy/i], test: id => id.includes("python3") },
      { ids: ["7"], match: [/python\s*2/i], exclude: [/pypy/i], test: id => id.includes("python2") },
      { ids: ["87", "74", "60", "36"], match: [/java\s*21/i, /java\s*17/i, /java/i], test: id => id.includes("java") },
      { ids: ["92", "88", "83"], match: [/kotlin/i], test: id => id.includes("kotlin") },
      { ids: ["90"], match: [/rust\s*2024/i], test: id => id === "cf-rust2024" },
      { ids: ["75"], match: [/rust/i], test: id => id.includes("rust") },
      { ids: ["93"], match: [/c#\s*13/i, /\.net\s*9/i], test: id => id === "cf-csharp13" },
      { ids: ["79"], match: [/c#\s*10/i, /\.net\s*6/i], test: id => id === "cf-csharp10" },
      { ids: ["65"], match: [/c#\s*8/i, /\.net\s*core/i], test: id => id === "cf-csharp8" },
      { ids: ["9"], match: [/mono/i], test: id => id.includes("mono") },
      { ids: ["55"], match: [/node/i], test: id => id.includes("node") },
      { ids: ["34"], match: [/javascript/i, /v8/i], test: id => id.includes("javascript") },
      { ids: ["32"], match: [/\bgo\b/i, /golang/i], test: id => id === "cf-go" },
      { ids: ["28"], match: [/\bd\b/i, /dmd/i], test: id => id === "cf-d" },
      { ids: ["12"], match: [/haskell/i, /ghc/i], test: id => id === "cf-haskell" },
      { ids: ["67"], match: [/ruby/i], test: id => id === "cf-ruby" },
      { ids: ["6"], match: [/php/i], test: id => id === "cf-php" },
      { ids: ["3"], match: [/delphi/i], test: id => id === "cf-delphi" },
      { ids: ["4"], match: [/pascal/i], exclude: [/pascalabc/i], test: id => id === "cf-pascal" },
      { ids: ["51"], match: [/pascalabc/i], test: id => id === "cf-pascalabc" },
      { ids: ["20"], match: [/scala/i], test: id => id === "cf-scala" },
      { ids: ["19"], match: [/ocaml/i], test: id => id === "cf-ocaml" },
      { ids: [], match: [/f#/i], test: id => id === "cf-fsharp" }
    ];

    const options = Array.from(langSelect.options);
    let matchedOption = null;

    const rule = LANGUAGE_RULES.find(r => r.test(langId));
    if (rule) {
      for (const id of rule.ids) {
        matchedOption = options.find(o => o.value === id);
        if (matchedOption) break;
      }
      if (!matchedOption && rule.match) {
        matchedOption = options.find(o => {
          const text = o.textContent;
          const excluded = rule.exclude && rule.exclude.some(rx => rx.test(text));
          return !excluded && rule.match.some(rx => rx.test(text));
        });
      }
    }

    if (!matchedOption && langName) {
      const cleanLang = langName.replace(/[^a-z0-9\s+]/gi, " ").toLowerCase();
      const words = cleanLang.split(/\s+/).filter(w => w.length > 2);
      let bestScore = 0;
      for (const o of options) {
        const oText = o.textContent.toLowerCase();
        const score = words.reduce((acc, w) => acc + (oText.includes(w) ? 1 : 0), 0);
        if (score > bestScore) {
          bestScore = score;
          matchedOption = o;
        }
      }
    }

    if (!matchedOption) {
      matchedOption = langSelect.selectedOptions[0] || options[0];
    }

    if (matchedOption) {
      langSelect.focus();
      langSelect.value = matchedOption.value;
      langSelect.dispatchEvent(new Event("change", { bubbles: true }));
      langSelect.dispatchEvent(new Event("input", { bubbles: true }));
      langSelect.dispatchEvent(new Event("blur", { bubbles: true }));
      try {
        if (window.$) window.$(langSelect).val(matchedOption.value).trigger("change");
      } catch (e) {}
    }
  }

  // 5. Source Code Section (Paste code into Ace Editor, textarea#source, and all form textareas)
  if (window.ace) {
    try {
      const aceEditor = window.ace.edit("editor")
        || (document.querySelector(".ace_editor") && window.ace.edit(document.querySelector(".ace_editor")));
      if (aceEditor && aceEditor.setValue) {
        aceEditor.setValue(code, -1);
        aceEditor.clearSelection();
      }
    } catch (e) {}
  }

  const allTextareas = Array.from(form.querySelectorAll("textarea, #source"));
  for (const ta of allTextareas) {
    if (ta.classList.contains("ace_text-input")) continue; // Avoid Ace 1px input
    ta.value = code;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
    try {
      if (window.$) window.$(ta).val(code).trigger("input").trigger("change");
    } catch (e) {}
  }

  // Clear file upload input so it doesn't conflict with source code
  const fileInputs = form.querySelectorAll('input[type="file"]');
  fileInputs.forEach(fi => {
    try { fi.value = ""; } catch (e) {}
  });

  // Ensure action input is set
  const actionInput = form.querySelector('input[name="action"]');
  if (actionInput) {
    actionInput.value = "submitSolutionFormSubmitted";
  }

  // 6. Locate the Submit Button first so we can monitor its state
  let submitBtn = form.querySelector('input[type="submit"]')
    || form.querySelector('button[type="submit"]')
    || form.querySelector('input.submit')
    || form.querySelector('input[value="Submit"]')
    || form.querySelector('#submit')
    || Array.from(form.querySelectorAll("input, button")).find(el =>
         /submit/i.test(el.type || "") || /submit/i.test(el.value || "") || /submit/i.test(el.textContent || "")
       );

  if (!submitBtn) {
    submitBtn = document.querySelector('input[type="submit"], input.submit, button[type="submit"]');
  }

  // 7. Turnstile Verification Check
  // Wait up to 12 seconds for Cloudflare Turnstile token or button enablement
  const turnstileElements = document.querySelectorAll(
    '[name="cf-turnstile-response"], .cf-turnstile, iframe[src*="challenges.cloudflare.com"]'
  );

  if (turnstileElements.length > 0) {
    const maxWaitMs = 12000;
    const startPoll = Date.now();

    while (Date.now() - startPoll < maxWaitMs) {
      const turnstileEl = document.querySelector('[name="cf-turnstile-response"]');
      const hasToken = turnstileEl && turnstileEl.value && turnstileEl.value.trim().length > 10;
      const isBtnEnabled = submitBtn && !submitBtn.disabled && !submitBtn.classList.contains("disabled");

      if (hasToken || (isBtnEnabled && Date.now() - startPoll > 1000)) {
        break;
      }

      // If unresolved after 1.5s, highlight widget and bring into view
      if (Date.now() - startPoll > 1500) {
        try {
          const targetWidget = document.querySelector('.cf-turnstile, iframe[src*="challenges.cloudflare.com"]');
          if (targetWidget) {
            targetWidget.scrollIntoView({ behavior: "smooth", block: "center" });
            targetWidget.style.outline = "3px solid #3ddbd9";
            targetWidget.style.borderRadius = "8px";
          }
        } catch (e) {}
      }

      await new Promise(r => setTimeout(r, 200));
    }

    const finalTurnstileEl = document.querySelector('[name="cf-turnstile-response"]');
    const finalHasToken = finalTurnstileEl && finalTurnstileEl.value && finalTurnstileEl.value.trim().length > 10;
    if (!finalHasToken && submitBtn && (submitBtn.disabled || submitBtn.classList.contains("disabled"))) {
      return {
        error: "Cloudflare verification needed. Please click the 'I am human' box in the Codeforces tab.",
        needTurnstile: true
      };
    }
  }

  if (!submitBtn) {
    return { error: "Codeforces submit button not found on the form." };
  }

  // 8. Re-sync code right before click
  if (window.ace) {
    try {
      const aceEditor = window.ace.edit("editor");
      if (aceEditor && aceEditor.setValue) aceEditor.setValue(code, -1);
    } catch (e) {}
  }
  for (const ta of allTextareas) {
    if (ta.classList.contains("ace_text-input")) continue;
    ta.value = code;
  }

  // 9. Force-enable the submit button
  submitBtn.removeAttribute("disabled");
  submitBtn.disabled = false;
  submitBtn.classList.remove("disabled");
  submitBtn.parentElement?.classList.remove("disabled");

  const $ = window.$ || window.jQuery;
  if ($) {
    try {
      $(submitBtn).prop("disabled", false).removeAttr("disabled").removeClass("disabled");
    } catch (e) {}
  }

  // 10. Capture existing submission IDs
  const existingSubmissionIds = Array.from(document.querySelectorAll('tr[data-submission-id], a[href*="/submission/"]'))
    .map(el => {
      const fromAttr = el.getAttribute?.("data-submission-id");
      if (fromAttr) return parseInt(fromAttr, 10);
      const m = el.href?.match(/\/submission\/(\d+)/);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter(Boolean);

  // 11. Trigger submission with full event dispatch
  await new Promise(r => setTimeout(r, 100));

  submitBtn.focus();
  try {
    submitBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    submitBtn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    submitBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  } catch (e) {}

  try {
    submitBtn.click();
  } catch (e) {}

  if ($) {
    try {
      $(submitBtn).trigger("click");
    } catch (e) {}
  }

  // Fallback: form.requestSubmit() / form.submit() if click didn't trigger unload
  setTimeout(() => {
    try {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit(submitBtn);
      } else {
        form.submit();
      }
    } catch (e) {
      try { form.submit(); } catch (err) {}
    }
  }, 250);

  return { submitted: true, handle: userHandle, existingSubmissionIds };
}

function cfInspectSubmissionResult(contestId, problemIndex, existingIds) {
  const existingSet = new Set(existingIds || []);

  // Check if session expired
  if (location.pathname.includes("/enter") || location.pathname.includes("/login")) {
    return { error: "Your Codeforces session expired. Please log in and retry." };
  }

  // Check for rejected / error messages on form
  const errorElements = Array.from(document.querySelectorAll(
    ".error, .alert-danger, .submit-error, .for__source, .for__submittedProblemCode, .for__submittedProblemIndex"
  ));
  for (const el of errorElements) {
    const text = el.textContent?.trim();
    if (text && el.offsetWidth > 0 && !text.includes("Codeforces Pro")) {
      return { error: `Codeforces rejected submission: ${text}` };
    }
  }

  const handleEl = document.querySelector('a[href^="/profile/"]');
  const handle = handleEl ? handleEl.textContent.trim() : "";

  // Check tr[data-submission-id]
  const rows = Array.from(document.querySelectorAll("tr[data-submission-id]"));
  for (const row of rows) {
    const id = parseInt(row.getAttribute("data-submission-id"), 10);
    if (id && !existingSet.has(id)) {
      return { submissionId: id, handle };
    }
  }

  // Fallback check /submission/ links
  const links = Array.from(document.querySelectorAll('a[href*="/submission/"]'));
  for (const link of links) {
    const m = link.href.match(/\/submission\/(\d+)/);
    if (m) {
      const id = parseInt(m[1], 10);
      if (id && !existingSet.has(id)) {
        return { submissionId: id, handle };
      }
    }
  }

  // If table has at least one row and we are on /my or /status, top row is likely our submission
  if (rows.length > 0 && (location.pathname.includes("/my") || location.pathname.includes("/status"))) {
    const topId = parseInt(rows[0].getAttribute("data-submission-id"), 10);
    if (topId) return { submissionId: topId, handle };
  }

  return { waiting: true };
}

async function getSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      for (const [k, v] of Object.entries(all)) {
        if (k.includes("auth-token") || k.startsWith("sb-")) {
          try {
            const parsed = typeof v === "string" ? JSON.parse(v) : v;
            if (parsed?.access_token || parsed?.user) {
              return resolve(parsed);
            }
          } catch (e) {}
        }
      }
      resolve(null);
    });
  });
}

function waitForTabReady(tabId, timeoutMs = 12000) {
  return new Promise(resolve => {
    let timeout;
    const cleanup = () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timeout);
    };
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        cleanup();
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);

    chrome.tabs.get(tabId, tab => {
      if (tab?.status === "complete") {
        cleanup();
        resolve();
      }
    });
  });
}
