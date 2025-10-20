// background.js - Service worker to handle side panel

chrome.action.onClicked.addListener((tab) => {
  // Check if we're on Reddit
  if (tab.url.includes('reddit.com')) {
    // Open side panel for this tab
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    alert('Please open this extension on Reddit.com');
  }
});