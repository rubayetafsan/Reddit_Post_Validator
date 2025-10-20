// content.js - Runs on Reddit pages to extract post content

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPostContent') {
    const postData = extractPostContent();
    sendResponse(postData);
  }
});

function extractPostContent() {
  let title = '';

  try {
    // Extract ONLY title using multiple selectors
    let titleEl = document.querySelector('h1');
    if (!titleEl) {
      titleEl = document.querySelector('[data-test-id="post-title"]');
    }
    if (!titleEl) {
      titleEl = document.querySelector('.Post h1');
    }
    if (!titleEl) {
      const headings = document.querySelectorAll('h1, h2, h3');
      for (let h of headings) {
        if (h.textContent.length > 5 && h.textContent.length < 500) {
          titleEl = h;
          break;
        }
      }
    }

    if (titleEl) {
      title = titleEl.textContent.trim();
    }

  } catch (error) {
    console.error('Error extracting title:', error);
  }

  return {
    title: title,
    content: '',
    success: !!title
  };
}