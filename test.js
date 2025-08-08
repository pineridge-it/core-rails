const PayGAPIClient = require('./index.js');

async function testClient() {
  const client = new PayGAPIClient('http://localhost:5000/api');
  
  console.log('🧪 Testing @babbage/payg-api-client\n');
  
  // Test 1: Get available APIs
  console.log('1️⃣ Getting available APIs...');
  const apisResult = await client.getAvailableAPIs();
  if (apisResult.success) {
    console.log('✅ Available APIs:', JSON.stringify(apisResult.apis, null, 2));
  } else {
    console.log('❌ Failed to get APIs:', apisResult.error);
    return;
  }
  
  console.log('\n');
  
  // Test 2: Call free weather API
  console.log('2️⃣ Calling free weather API...');
  const weatherResult = await client.callAPI('weather', 'current', {
    params: { q: 'London' }
  });
  
  if (weatherResult.success) {
    console.log('✅ Weather API response:', JSON.stringify(weatherResult.data, null, 2));
  } else {
    console.log('❌ Weather API failed:', weatherResult.error);
  }
  
  console.log('\n');
  
  // Test 3: Call paid ML inference API (should require payment)
  console.log('3️⃣ Calling paid ML inference API...');
  const mlResult = await client.callAPI('ml-inference', 'predict');
  
  if (mlResult.paymentRequired) {
    console.log('💰 Payment required:', JSON.stringify(mlResult.paymentInfo, null, 2));
    
    // Complete payment
    console.log('4️⃣ Completing payment...');
    const paymentResult = await client.completePayment(mlResult.paymentInfo.payment_id);
    
    if (paymentResult.success) {
      console.log('✅ Payment completed:', paymentResult.data);
      
      // Retry API call
      console.log('5️⃣ Retrying ML inference API after payment...');
      const finalResult = await client.callAPI('ml-inference', 'predict');
      
      if (finalResult.success) {
        console.log('✅ ML inference response:', JSON.stringify(finalResult.data, null, 2));
      } else {
        console.log('❌ ML inference failed after payment:', finalResult.error);
      }
    } else {
      console.log('❌ Payment failed:', paymentResult.error);
    }
  } else if (mlResult.success) {
    console.log('✅ ML inference response (no payment required):', JSON.stringify(mlResult.data, null, 2));
  } else {
    console.log('❌ ML inference failed:', mlResult.error);
  }
  
  console.log('\n');
  
  // Test 4: Test automatic payment handling
  console.log('6️⃣ Testing automatic payment handling...');
  client.clearPayments(); // Clear any cached payment IDs
  
  const autoResult = await client.callAPIWithPayment(
    'ml-inference',
    'predict',
    {},
    async (paymentInfo) => {
      console.log(`💳 Auto-payment handler: Pay $${paymentInfo.amount_usd}? Auto-approving...`);
      return true; // Auto-approve for demo
    }
  );
  
  if (autoResult.success) {
    console.log('✅ Auto-payment ML inference response:', JSON.stringify(autoResult.data, null, 2));
  } else {
    console.log('❌ Auto-payment ML inference failed:', autoResult.error || autoResult.message);
  }
  
  console.log('\n🎉 Test completed!');
}

// Run tests
testClient().catch(console.error);

