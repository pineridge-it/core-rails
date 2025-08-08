# @babbage/payg-api-client

A simple client library for accessing Babbage pay-as-you-go monetized APIs.

## Installation

```bash
npm install @babbage/payg-api-client
```

## Usage

```javascript
const PayGAPIClient = require('@babbage/payg-api-client');

const client = new PayGAPIClient('http://localhost:5000/api');

// Example 1: Simple API call (free API)
const weatherResult = await client.callAPI('weather', 'current', {
  params: { q: 'London' }
});

if (weatherResult.success) {
  console.log('Weather data:', weatherResult.data);
}

// Example 2: Paid API with manual payment handling
const mlResult = await client.callAPI('ml-inference', 'predict');

if (mlResult.paymentRequired) {
  console.log(`Payment required: $${mlResult.paymentInfo.amount_usd}`);
  
  // Complete payment
  const paymentResult = await client.completePayment(mlResult.paymentInfo.payment_id);
  
  if (paymentResult.success) {
    // Retry API call
    const finalResult = await client.callAPI('ml-inference', 'predict');
    console.log('ML prediction:', finalResult.data);
  }
}

// Example 3: API call with automatic payment handling
const autoResult = await client.callAPIWithPayment(
  'ml-inference', 
  'predict',
  {},
  async (paymentInfo) => {
    console.log(`Pay $${paymentInfo.amount_usd}? (y/n)`);
    // In real app, show payment UI and return user's choice
    return true; // Auto-approve for demo
  }
);

// Example 4: Get available APIs
const apisResult = await client.getAvailableAPIs();
if (apisResult.success) {
  console.log('Available APIs:', apisResult.apis);
}
```

## API Reference

### `callAPI(apiName, endpoint, options)`

Call a monetized API endpoint.

- `apiName`: Name of the API (e.g., 'weather', 'ml-inference')
- `endpoint`: API endpoint path
- `options`: Request options (method, params, data, headers)

Returns: Promise resolving to response object with `success`, `data`, or `paymentRequired` fields.

### `completePayment(paymentId)`

Complete payment for API access.

- `paymentId`: Payment ID from payment requirement response

Returns: Promise resolving to payment completion result.

### `getAvailableAPIs()`

Get list of available APIs and their pricing.

Returns: Promise resolving to object with available APIs and costs.

### `callAPIWithPayment(apiName, endpoint, options, paymentHandler)`

Call API with automatic payment handling.

- `paymentHandler`: Function called when payment is required. Should return boolean indicating whether to proceed with payment.

## License

MIT

