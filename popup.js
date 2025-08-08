// Popup script for Babbage Ad-Free Web extension

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadSettings();
  setupEventListeners();
});

async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['paymentHistory']);
    const history = result.paymentHistory || [];
    
    // Calculate today's stats
    const today = new Date().toDateString();
    const todayPayments = history.filter(payment => {
      const paymentDate = new Date(payment.timestamp).toDateString();
      return today === paymentDate;
    });
    
    const todayAmount = todayPayments.reduce((sum, payment) => sum + (payment.amount || 0.001), 0);
    const uniquePublishers = new Set(todayPayments.map(p => p.publisher || p.page_url)).size;
    
    // Update UI
    document.getElementById('todayPayments').textContent = todayPayments.length;
    document.getElementById('amountSpent').textContent = `$${todayAmount.toFixed(3)}`;
    document.getElementById('publishersSupported').textContent = uniquePublishers;
    
    // Update badge
    if (todayPayments.length > 0) {
      chrome.action.setBadgeText({ text: todayPayments.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    }
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['enabled', 'defaultPayment', 'autoPayment']);
    
    // Update toggles
    const enableToggle = document.getElementById('enableToggle');
    const autoPayToggle = document.getElementById('autoPayToggle');
    const defaultPaymentInput = document.getElementById('defaultPayment');
    
    if (result.enabled !== false) {
      enableToggle.classList.add('active');
    }
    
    if (result.autoPayment) {
      autoPayToggle.classList.add('active');
    }
    
    if (result.defaultPayment) {
      defaultPaymentInput.value = result.defaultPayment;
    }
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function setupEventListeners() {
  // Enable toggle
  document.getElementById('enableToggle').addEventListener('click', async (e) => {
    const toggle = e.target;
    const isActive = toggle.classList.contains('active');
    
    if (isActive) {
      toggle.classList.remove('active');
      await chrome.storage.sync.set({ enabled: false });
    } else {
      toggle.classList.add('active');
      await chrome.storage.sync.set({ enabled: true });
    }
  });
  
  // Auto-pay toggle
  document.getElementById('autoPayToggle').addEventListener('click', async (e) => {
    const toggle = e.target;
    const isActive = toggle.classList.contains('active');
    
    if (isActive) {
      toggle.classList.remove('active');
      await chrome.storage.sync.set({ autoPayment: false });
    } else {
      toggle.classList.add('active');
      await chrome.storage.sync.set({ autoPayment: true });
    }
  });
  
  // Default payment input
  document.getElementById('defaultPayment').addEventListener('change', async (e) => {
    const value = parseFloat(e.target.value);
    if (value >= 0.001) {
      await chrome.storage.sync.set({ defaultPayment: value });
    }
  });
  
  // View history link
  document.getElementById('viewHistory').addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
      const result = await chrome.storage.local.get(['paymentHistory']);
      const history = result.paymentHistory || [];
      
      if (history.length === 0) {
        alert('No payment history yet.');
        return;
      }
      
      // Create a simple history display
      let historyText = 'Recent Payments:\n\n';
      history.slice(-10).reverse().forEach(payment => {
        const date = new Date(payment.timestamp).toLocaleString();
        const amount = payment.amount || 0.001;
        const url = payment.page_url || 'Unknown';
        historyText += `${date}: $${amount.toFixed(3)} - ${url}\n`;
      });
      
      alert(historyText);
      
    } catch (error) {
      console.error('Error viewing history:', error);
      alert('Error loading payment history.');
    }
  });
  
  // Settings link
  document.getElementById('settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  });
}

// Refresh stats every few seconds while popup is open
setInterval(loadStats, 3000);

