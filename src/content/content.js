// ============================================================
// src/content/content.js
// Injected on https://codeforces.com/*
// Adds workspace shortcuts to problem pages.
// ============================================================

(function () {
  "use strict";

  if (window.__cfProInjected) return;
  window.__cfProInjected = true;

  // Run immediately on page load
  injectFeatures();

  // Also observe DOM changes for dynamically loaded contest/problem content
  const observer = new MutationObserver(() => {
    injectFeatures();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  function injectFeatures() {
    const path = window.location.pathname;

    // Remove any previous sidebar button if present
    const oldSidebarBtn = document.getElementById("cf-pro-submit-btn");
    if (oldSidebarBtn) oldSidebarBtn.remove();

    // Check if on problem page (contest, problemset, or gym)
    const isProblemPage = /\/(contest|problemset|gym)\/.*problem\//.test(path);
    if (isProblemPage) {
      enhanceProblemPageHeader();
    }
  }

  function getProblemDetailsFromUrl() {
    const url = window.location.pathname;
    const match = url.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/) ||
                  url.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/) ||
                  url.match(/\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    return {
      contestId: match ? match[1] : "",
      problemIndex: match ? match[2] : ""
    };
  }

  // Injected at the top of the problem statement (right by the title)
  function enhanceProblemPageHeader() {
    const titleEl = document.querySelector(".problem-statement .header .title");
    if (!titleEl || document.getElementById("cf-pro-header-btn")) return;

    const { contestId, problemIndex } = getProblemDetailsFromUrl();

    const btn = document.createElement("button");
    btn.id = "cf-pro-header-btn";
    btn.type = "button";
    btn.innerHTML = `⚡ CF Workspace`;
    btn.style.cssText = `
      display: inline-flex; align-items: center; gap: 7px;
      margin: 10px 0 14px 0; padding: 8px 20px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%);
      color: #ffffff; border: 1px solid rgba(217, 119, 6, 0.45); border-radius: 8px;
      font-weight: 800; font-size: 13.5px; letter-spacing: 0.3px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      cursor: pointer; transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 14px rgba(217, 119, 6, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.35);
      text-shadow: 0 1px 2px rgba(60, 25, 0, 0.5);
    `;
    btn.onmouseover = () => {
      btn.style.transform = "translateY(-1px)";
      btn.style.background = "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #b45309 100%)";
      btn.style.boxShadow = "0 6px 20px rgba(245, 158, 11, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.45)";
    };
    btn.onmouseout = () => {
      btn.style.transform = "none";
      btn.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)";
      btn.style.boxShadow = "0 4px 14px rgba(217, 119, 6, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.35)";
    };

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({
        type: "OPEN_WORKSPACE",
        contestId,
        problemIndex
      });
    });

    titleEl.parentNode.insertBefore(btn, titleEl.nextSibling);
  }

})();
