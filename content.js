// Content script for ad detection and replacement
class BabbageAdBlocker {
  constructor() {
    this.API_BASE = 'http://localhost:5000/api';
    this.pageHash = this.generatePageHash();
    this.adElements = [];
    this.paymentActive = false;
    
    this.init();
  }

  init() {
    console.log('🚀 Babbage Ad-Free Web initialized');
    this.detectAds();
    this.setupPaymentUI();
  }

  generatePageHash() {
    // Generate a simple hash of the page URL and title
    const content = window.location.href + document.title;
    return btoa(content).substring(0, 16);
  }

  detectAds() {
    // Common ad selectors (simplified for demo)
    const adSelectors = [
      '[id*="ad"]',
      '[class*="ad"]',
      '[id*="banner"]',
      '[class*="banner"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      '.advertisement',
      '.ad-container',
      '.banner-ad'
    ];

    adSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Skip if element is too small (likely not a real ad)
        const rect = element.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 50) {
          this.adElements.push(element);
          this.replaceAdWithPaywall(element);
        }
      });
    });

    // Also detect common ad sizes
    this.detectAdsBySize();
  }

  detectAdsBySize() {
    // Common ad sizes
    const adSizes = [
      { width: 728, height: 90 },   // Leaderboard
      { width: 300, height: 250 },  // Medium Rectangle
      { width: 320, height: 50 },   // Mobile Banner
      { width: 160, height: 600 },  // Wide Skyscraper
      { width: 300, height: 600 }   // Half Page
    ];

    adSizes.forEach(size => {
      const elements = document.querySelectorAll('div, iframe');
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (Math.abs(rect.width - size.width) < 10 && 
            Math.abs(rect.height - size.height) < 10) {
          if (!this.adElements.includes(element)) {
            this.adElements.push(element);
            this.replaceAdWithPaywall(element);
          }
        }
      });
    });
  }

  replaceAdWithPaywall(adElement) {
    // Create paywall overlay
    const paywall = document.createElement('div');
    paywall.className = 'babbage-paywall';
    paywall.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        position: relative;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      ">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
          🚫 Ad Blocked
        </div>
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">
          Support this publisher with a micropayment
        </div>
        <button class="babbage-pay-btn" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
           onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          Pay $0.001 to skip ads
        </button>
      </div>
    `;

    // Replace ad with paywall
    adElement.style.display = 'none';
    adElement.parentNode.insertBefore(paywall, adElement);

    // Add click handler
    const payBtn = paywall.querySelector('.babbage-pay-btn');
    payBtn.addEventListener('click', () => this.handlePayment(paywall, adElement));
  }

  async handlePayment(paywall, adElement) {
    if (this.paymentActive) return;
    
    this.paymentActive = true;
    const payBtn = paywall.querySelector('.babbage-pay-btn');
    payBtn.textContent = 'Processing...';
    payBtn.disabled = true;

    try {
      // Send page hash to server
      const response = await fetch(`${this.API_BASE}/ad-skip/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_hash: this.pageHash,
          page_url: window.location.href,
          page_title: document.title
        })
      });

      const data = await response.json();

      if (response.status === 402) {
        // Payment required
        payBtn.textContent = `Pay $${data.amount_usd}`;
        
        // Simulate payment completion after 2 seconds
        setTimeout(async () => {
          const paymentResponse = await fetch(`${this.API_BASE}/ad-skip/payment/${data.payment_id}/complete`, {
            method: 'POST'
          });

          if (paymentResponse.ok) {
            this.hideAdsForDuration(300); // 5 minutes
            payBtn.textContent = '✅ Paid - Ads hidden';
            payBtn.style.background = 'rgba(34, 197, 94, 0.8)';
            
            // Hide paywall after success
            setTimeout(() => {
              paywall.style.display = 'none';
            }, 2000);
          } else {
            payBtn.textContent = '❌ Payment failed';
            payBtn.style.background = 'rgba(239, 68, 68, 0.8)';
          }
        }, 2000);

      } else if (response.ok) {
        // Already paid
        this.hideAdsForDuration(data.remaining_time || 300);
        payBtn.textContent = '✅ Already paid';
        payBtn.style.background = 'rgba(34, 197, 94, 0.8)';
      }

    } catch (error) {
      console.error('Payment error:', error);
      payBtn.textContent = '❌ Error';
      payBtn.style.background = 'rgba(239, 68, 68, 0.8)';
    }

    this.paymentActive = false;
  }

  hideAdsForDuration(seconds) {
    // Hide all detected ads
    this.adElements.forEach(ad => {
      ad.style.display = 'none';
    });

    // Hide all paywalls
    document.querySelectorAll('.babbage-paywall').forEach(paywall => {
      paywall.style.display = 'none';
    });

    // Show success message
    this.showSuccessMessage(seconds);

    // Store payment in local storage
    const expiry = Date.now() + (seconds * 1000);
    localStorage.setItem(`babbage_ad_free_${this.pageHash}`, expiry.toString());
  }

  showSuccessMessage(seconds) {
    const message = document.createElement('div');
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
        🎉 Ads hidden for ${Math.floor(seconds/60)} minutes!<br>
        <small>Supporting publisher with micropayment</small>
      </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }

  setupPaymentUI() {
    // Check if already paid for this page
    const stored = localStorage.getItem(`babbage_ad_free_${this.pageHash}`);
    if (stored && parseInt(stored) > Date.now()) {
      // Already paid and not expired
      this.hideAdsForDuration(Math.floor((parseInt(stored) - Date.now()) / 1000));
    }
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BabbageAdBlocker();
  });
} else {
  new BabbageAdBlocker();
}

