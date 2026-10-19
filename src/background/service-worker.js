// ============================================================
// src/background/service-worker.js
// Background worker for Codeforces Pro
// ============================================================

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "OPEN_WORKSPACE") {
    const params = new URLSearchParams();
    if (msg.contestId) params.set("contestId", msg.contestId);
    if (msg.problemIndex) params.set("problemIndex", msg.problemIndex);
    const query = params.toString() ? `?${params.toString()}` : "";
    
    chrome.tabs.create({
      url: chrome.runtime.getURL(`src/editor/workspace.html${query}`)
    });
    sendResponse({ success: true });
    return true;
  }

  if (msg.type === "SUBMIT_SOLUTION") {
    handleSubmission(msg).then(sendResponse);
    return true;
  }

  if (msg.type === "GET_SESSION") {
    getSession().then(sendResponse);
    return true;
  }
});

async function handleSubmission({ contestId, problemIndex, langId, code }) {
  try {
    const tabs = await chrome.tabs.query({ url: "https://codeforces.com/*" });
    let tab = tabs.find(t => !t.url.includes("login") && !t.url.includes("register"));

    let createdTab = false;
    if (!tab) {
      tab = await chrome.tabs.create({
        url: `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`,
        active: false,
      });
      createdTab = true;
      await sleep(3500);
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: cfSubmitScript,
      args: [contestId, problemIndex, langId, code],
    });

    const result = results?.[0]?.result;
    
    if (createdTab && tab.id) {
      chrome.tabs.remove(tab.id).catch(() => {});
    }

    if (result?.submissionId) {
      return { submissionId: result.submissionId };
    }
    return { error: result?.error || "Unknown submission error from Codeforces." };
  } catch (err) {
    console.error("[CF Pro SW] Submission error:", err);
    return { error: err.message };
  }
}

function cfSubmitScript(contestId, problemIndex, langId, code) {
  return new Promise(async (resolve) => {
    try {
      let csrf = document.querySelector('meta[name="X-Csrf-Token"]')?.getAttribute("content")
        || (typeof window.Codeforces?.getCsrfToken === "function" ? window.Codeforces.getCsrfToken() : null)
        || getCsrfFromCookies();

      if (!csrf) {
        try {
          const pageResp = await fetch(`https://codeforces.com/contest/${contestId}/submit`, { credentials: "include" });
          const pageHtml = await pageResp.text();
          const metaMatch = pageHtml.match(/name=['"]X-Csrf-Token['"]\s+content=['"]([^'"]+)['"]/i)
            || pageHtml.match(/csrf_token['"]\s+value=['"]([^'"]+)['"]/i);
          if (metaMatch) csrf = metaMatch[1];
        } catch (e) {}
      }

      if (!csrf) {
        resolve({ error: "Could not retrieve Codeforces CSRF token. Please log into codeforces.com in your browser first!" });
        return;
      }

      const form = new FormData();
      form.append("csrf_token", csrf);
      form.append("action", "submitSolutionFormSubmitAjax");
      form.append("contestId", contestId);
      form.append("submittedProblemIndex", problemIndex);
      form.append("programTypeId", langId);
      form.append("source", code);
      form.append("tabSize", "4");
      form.append("sourceFile", "");

      const resp = await fetch(
        `https://codeforces.com/contest/${contestId}/submit?csrf_token=${csrf}`,
        { method: "POST", body: form, credentials: "include" }
      );

      await new Promise(r => setTimeout(r, 1800));

      try {
        const statusResp = await fetch(
          `https://codeforces.com/contest/${contestId}/my-submissions`,
          { credentials: "include" }
        );
        const html = await statusResp.text();
        const match = html.match(/data-submission-id=["'](\d+)["']/i) ||
                      html.match(/\/submission\/(\d+)/i) ||
                      html.match(/submissionId=["']?(\d+)["']?/i);

        if (match) {
          resolve({ submissionId: parseInt(match[1], 10) });
          return;
        }
      } catch (e) {}

      try {
        const apiResp = await fetch(`https://codeforces.com/api/user.status?count=1`, { credentials: "include" });
        const apiJson = await apiResp.json();
        if (apiJson.status === "OK" && apiJson.result?.[0]?.id) {
          resolve({ submissionId: apiJson.result[0].id });
          return;
        }
      } catch (e) {}

      resolve({ submissionId: null, message: "Submitted to Codeforces." });

    } catch (e) {
      resolve({ error: e.message });
    }

    function getCsrfFromCookies() {
      const m = document.cookie.match(/CSRF-token=([^;]+)/i);
      return m ? decodeURIComponent(m[1]) : null;
    }
  });
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
