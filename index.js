const axios = require('axios');

class PayGAPIClient {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.activePayments = new Map();
  }

  /**
   * Function 1: Call a monetized API endpoint
   * @param {string} apiName - Name of the API (e.g., 'weather', 'ml-inference')
   * @param {string} endpoint - API endpoint path
   * @param {object} options - Request options (method, params, data, headers)
   * @returns {Promise<object>} API response or payment requirement
   */
  async callAPI(apiName, endpoint, options = {}) {
    const { method = 'GET', params = {}, data = null, headers = {} } = options;
    
    // Check if we have an active payment for this API
    const paymentKey = `${apiName}:${endpoint}`;
    const paymentId = this.activePayments.get(paymentKey);
    
    if (paymentId) {
      headers['X-Payment-ID'] = paymentId;
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}/api-proxy/${apiName}/${endpoint}`,
        params,
        data,
        headers,
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      if (response.status === 402) {
        // Payment required
        const paymentInfo = response.data;
        this.activePayments.set(paymentKey, paymentInfo.payment_id);
        
        return {
          success: false,
          paymentRequired: true,
          paymentInfo,
          message: `Payment of $${paymentInfo.amount_usd} required for ${apiName} API`
        };
      }

      // Success - clear any stored payment ID
      this.activePayments.delete(paymentKey);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Function 2: Complete payment for API access
   * @param {string} paymentId - Payment ID from payment requirement response
   * @returns {Promise<object>} Payment completion result
   */
  async completePayment(paymentId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api-proxy/payment/${paymentId}/complete`
      );

      return {
        success: true,
        data: response.data,
        message: 'Payment completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Payment completion failed'
      };
    }
  }

  /**
   * Function 3: Get available APIs and their pricing
   * @returns {Promise<object>} List of available APIs with pricing
   */
  async getAvailableAPIs() {
    try {
      const response = await axios.get(`${this.baseURL}/available-apis`);
      
      return {
        success: true,
        apis: response.data.apis
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convenience method: Call API with automatic payment handling
   * @param {string} apiName - Name of the API
   * @param {string} endpoint - API endpoint path
   * @param {object} options - Request options
   * @param {function} paymentHandler - Function to handle payment (should return true to proceed)
   * @returns {Promise<object>} API response
   */
  async callAPIWithPayment(apiName, endpoint, options = {}, paymentHandler = null) {
    let result = await this.callAPI(apiName, endpoint, options);
    
    if (result.paymentRequired) {
      if (paymentHandler) {
        const shouldPay = await paymentHandler(result.paymentInfo);
        if (shouldPay) {
          const paymentResult = await this.completePayment(result.paymentInfo.payment_id);
          if (paymentResult.success) {
            // Retry the API call after payment
            result = await this.callAPI(apiName, endpoint, options);
          } else {
            return paymentResult;
          }
        } else {
          return { success: false, message: 'Payment declined by user' };
        }
      } else {
        return result; // Return payment requirement for manual handling
      }
    }
    
    return result;
  }

  /**
   * Clear stored payment IDs (useful for testing)
   */
  clearPayments() {
    this.activePayments.clear();
  }
}

module.exports = PayGAPIClient;

