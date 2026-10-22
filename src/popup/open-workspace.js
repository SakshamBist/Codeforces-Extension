document.getElementById("btn-open-workspace").addEventListener("click", async () => {
  let contestId = "";
  let problemIndex = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const match = tab.url.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/) ||
                    tab.url.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/) ||
                    tab.url.match(/\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/);
      if (match) {
        contestId = match[1];
        problemIndex = match[2];
      }
    }
  } catch (e) {}

  chrome.runtime.sendMessage({ type: "OPEN_WORKSPACE", contestId, problemIndex });
  window.close();
});
