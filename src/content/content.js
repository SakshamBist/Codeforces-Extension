// ============================================================
// src/content/content.js
// Injected on https://codeforces.com/*
// ============================================================

(function () {
  "use strict";

  if (window.__cfProInjected) return;
  window.__cfProInjected = true;

  const path = window.location.pathname;
  const isProblemPage = /\/contest\/\d+\/problem\//.test(path) || /\/problemset\/problem\//.test(path);

  chrome.runtime.sendMessage({ type: "GET_SESSION" }, (session) => {
    if (chrome.runtime.lastError) return;
    injectFloatingButton();
    if (isProblemPage) enhanceProblemPage();
  });

  function enhanceProblemPage() {
    const submitBtn = document.querySelector("input[type=submit],.submit");
    if (!submitBtn) return;

    const url = window.location.pathname;
    const match = url.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/) ||
                  url.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);

    const cfBtn = document.createElement("button");
    cfBtn.textContent = "⚡ Open in CF Pro Workspace";
    cfBtn.type = "button";
    cfBtn.style.cssText = `
      display:inline-block;margin-left:10px;padding:7px 14px;
      background:linear-gradient(135deg, #1f6feb, #238636);color:#fff;border:none;border-radius:6px;
      font-weight:700;cursor:pointer;font-size:13px;transition:opacity .2s;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    `;
    cfBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const contestId = match ? match[1] : "";
      const problemIndex = match ? match[2] : "";
      chrome.runtime.sendMessage({
        type: "OPEN_WORKSPACE",
        contestId,
        problemIndex
      });
    });
    submitBtn.parentNode.insertBefore(cfBtn, submitBtn.nextSibling);
  }

  function injectFloatingButton() {
    const floatBtn = document.createElement("div");
    floatBtn.id = "cf-pro-floating-btn";
    floatBtn.innerHTML = `⚡ CF Pro`;
    floatBtn.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      background: linear-gradient(135deg, #1f6feb, #238636);
      color: #fff; padding: 10px 16px; border-radius: 24px;
      font-weight: 700; font-size: 13px; font-family: sans-serif;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4); cursor: pointer;
      display: flex; align-items: center; gap: 6px;
    `;
    floatBtn.addEventListener("click", () => {
      const url = window.location.pathname;
      const match = url.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/) ||
                    url.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
      chrome.runtime.sendMessage({
        type: "OPEN_WORKSPACE",
        contestId: match ? match[1] : "",
        problemIndex: match ? match[2] : ""
      });
    });
    document.body.appendChild(floatBtn);
  }
})();
