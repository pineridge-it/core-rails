// Background service worker for Babbage Ad-Free Web extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Babbage Ad-Free Web extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    defaultPayment: 0.001,
    autoPayment: false
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['enabled', 'defaultPayment', 'autoPayment'], (result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'updateSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'logPayment') {
    // Log payment for analytics
    console.log('Payment logged:', request.data);
    
    // Store payment history
    chrome.storage.local.get(['paymentHistory'], (result) => {
      const history = result.paymentHistory || [];
      history.push({
        ...request.data,
        timestamp: Date.now()
      });
      
      // Keep only last 100 payments
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      chrome.storage.local.set({ paymentHistory: history });
    });
    
    sendResponse({ success: true });
    return true;
  }
});

// Update badge with payment count
chrome.storage.local.get(['paymentHistory'], (result) => {
  const history = result.paymentHistory || [];
  const todayPayments = history.filter(payment => {
    const today = new Date().toDateString();
    const paymentDate = new Date(payment.timestamp).toDateString();
    return today === paymentDate;
  });
  
  if (todayPayments.length > 0) {
    chrome.action.setBadgeText({ text: todayPayments.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  }
});

// Handle tab updates to refresh badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could implement per-site payment tracking here
  }
});

