const VALIDATION_RULES = {
  titleMinLength: { min: 10, name: "Title minimum length" },
  titleMaxLength: { max: 300, name: "Title maximum length" },
  contentMinLength: { min: 50, name: "Content minimum length" },
  noAllCaps: { threshold: 0.3, name: "Avoid excessive ALL CAPS" },
  noExcessivePunctuation: { threshold: 0.1, name: "Avoid excessive punctuation" },
  noSpamKeywords: { name: "No spam keywords" },
  properSpacing: { name: "Proper paragraph spacing" },
  noExcessiveLinks: { max: 5, name: "Excessive links" }
};

const SPAM_KEYWORDS = [
  'click here', 'buy now', 'limited time', 'act now', 'don\'t miss',
  'free money', 'guaranteed', 'no risk', 'make money fast', 'work from home',
  'dm for details', 'contact me privately', 'message me', 'dm me',
  'click link', 'visit now', 'order now', 'shop now', 'subscribe now',
  'earn money', 'make cash', 'quick money', 'easy money', 'free cash',
  'secret revealed', 'shocking', 'unbelievable', 'exposed',
  'you won', 'you\'ve won', 'congratulations', 'claim prize',
  'verify account', 'confirm identity', 'update payment',
  'bitcoin', 'cryptocurrency', 'forex', 'mlm', 'network marketing',
  'weight loss', 'diet pills', 'miracle cure', 'lose weight fast',
  'dating', 'singles', 'meet women', 'hot singles',
  'click to see', 'see what happens', 'you won\'t believe',
  'urgent action required', 'act immediately', 'before it\'s gone'
];

function validatePost(title, content) {
  const results = [];
  let score = 0;
  const maxScore = 100;
  let passCount = 0;
  let totalChecks = 0;

  // Check title length
  totalChecks++;
  if (title.length >= VALIDATION_RULES.titleMinLength.min) {
    results.push({ status: 'pass', text: `✓ Title length OK (${title.length} characters)` });
    passCount++;
  } else {
    results.push({ status: 'fail', text: `✗ Title too short (${title.length}/${VALIDATION_RULES.titleMinLength.min} characters)` });
  }

  totalChecks++;
  if (title.length <= VALIDATION_RULES.titleMaxLength.max) {
    results.push({ status: 'pass', text: `✓ Title within length limit` });
    passCount++;
  } else {
    results.push({ status: 'fail', text: `✗ Title too long (${title.length}/${VALIDATION_RULES.titleMaxLength.max} characters)` });
  }

  // Check content length
  totalChecks++;
  if (content.length >= VALIDATION_RULES.contentMinLength.min) {
    results.push({ status: 'pass', text: `✓ Content length OK (${content.length} characters)` });
    passCount++;
  } else {
    results.push({ status: 'fail', text: `✗ Content too short (${content.length}/${VALIDATION_RULES.contentMinLength.min} characters)` });
  }

  // Check for all caps
  totalChecks++;
  const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
  if (capsRatio < VALIDATION_RULES.noAllCaps.threshold) {
    results.push({ status: 'pass', text: `✓ Title capitalization appropriate` });
    passCount++;
  } else {
    results.push({ status: 'warning', text: `⚠ Excessive capitals in title (${(capsRatio * 100).toFixed(1)}%)` });
  }

  // Check for excessive punctuation
  totalChecks++;
  const punctRatio = (title.match(/[!?]{2,}|\.{2,}/g) || []).length;
  if (punctRatio === 0) {
    results.push({ status: 'pass', text: `✓ No excessive punctuation` });
    passCount++;
  } else {
    results.push({ status: 'warning', text: `⚠ Excessive punctuation detected` });
  }

  // Check for spam keywords
  totalChecks++;
  const lowerContent = (title + ' ' + content).toLowerCase();
  const spamFound = SPAM_KEYWORDS.filter(keyword => {
    return lowerContent.includes(keyword);
  });
  
  if (spamFound.length === 0) {
    results.push({ status: 'pass', text: `✓ No spam keywords detected` });
    passCount++;
  } else {
    const spamList = spamFound.slice(0, 3).join(', ');
    results.push({ status: 'warning', text: `⚠ Spam keywords found (${spamFound.length}): ${spamList}` });
  }

  // Check for proper spacing
  totalChecks++;
  const doubleNewlines = (content.match(/\n\n/g) || []).length;
  if (doubleNewlines >= 1 || content.split(' ').length > 100) {
    results.push({ status: 'pass', text: `✓ Content appears well-formatted` });
    passCount++;
  } else if (content.length > 200) {
    results.push({ status: 'warning', text: `⚠ Consider adding paragraph breaks` });
  } else {
    results.push({ status: 'pass', text: `✓ Length too short to require breaks` });
    passCount++;
  }

  // Check for excessive links
  totalChecks++;
  const linkCount = (content.match(/https?:\/\/|www\./g) || []).length;
  if (linkCount <= VALIDATION_RULES.noExcessiveLinks.max) {
    results.push({ status: 'pass', text: `✓ Link count appropriate (${linkCount} links)` });
    passCount++;
  } else {
    results.push({ status: 'warning', text: `⚠ Many links detected (${linkCount})` });
  }

  score = Math.round((passCount / totalChecks) * maxScore);

  return { results, score, totalChecks, passCount };
}

// Auto-fill title immediately when side panel opens
function autoFillTitle() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getPostContent' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Retrying title extraction...');
        setTimeout(autoFillTitle, 800);
        return;
      }
      
      if (response && response.title) {
        const titleField = document.getElementById('title');
        titleField.value = response.title;
      }
    });
  });
}

// Listen for tab updates to refresh title when page changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('reddit.com')) {
    // Clear old content and title
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    document.getElementById('results').classList.remove('show');
    document.getElementById('score').classList.remove('show');
    
    // Refresh title after page load
    setTimeout(autoFillTitle, 1000);
  }
});

// Listen for active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url.includes('reddit.com')) {
      // Clear old data
      document.getElementById('title').value = '';
      document.getElementById('content').value = '';
      document.getElementById('results').classList.remove('show');
      document.getElementById('score').classList.remove('show');
      
      // Refresh title
      setTimeout(autoFillTitle, 500);
    }
  });
});

// Call on page load
document.addEventListener('DOMContentLoaded', autoFillTitle);
// Also call immediately
autoFillTitle();

// Validate button
document.getElementById('validateBtn').addEventListener('click', () => {
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();

  if (!title) {
    alert('Please enter a post title');
    return;
  }
  if (!content) {
    alert('Please paste your post content');
    return;
  }

  const { results, score, passCount, totalChecks } = validatePost(title, content);

  const resultsList = document.getElementById('resultsList');
  resultsList.innerHTML = results
    .map(r => `<div class="result-item result-${r.status}">${r.text}</div>`)
    .join('');

  const scoreDiv = document.getElementById('score');
  const scoreClass = score >= 80 ? 'score-high' : score >= 60 ? 'score-medium' : 'score-low';
  scoreDiv.className = `score show ${scoreClass}`;
  scoreDiv.innerHTML = `<div class="score-number">${score}</div><div class="score-text">${passCount}/${totalChecks} checks passed</div>`;

  document.getElementById('results').classList.add('show');
});

// Close button
document.getElementById('closeBtn').addEventListener('click', () => {
  chrome.sidePanel.setOptions({ tabId: chrome.tabs.TAB_ID_NONE, enabled: false });
});

// Allow Ctrl+Enter to validate
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    document.getElementById('validateBtn').click();
  }
});