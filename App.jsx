import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Wallet, CreditCard, Receipt, CheckCircle, AlertCircle } from 'lucide-react'
import './App.css'

function App() {
  const [walletInfo, setWalletInfo] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const API_BASE = 'http://localhost:5000/api'

  // Fetch wallet info on component mount
  useEffect(() => {
    fetchWalletInfo()
    fetchReceipts()
  }, [])

  const fetchWalletInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/wallet/info`)
      const data = await response.json()
      setWalletInfo(data)
    } catch (error) {
      console.error('Error fetching wallet info:', error)
    }
  }

  const fetchReceipts = async () => {
    try {
      const response = await fetch(`${API_BASE}/receipts`)
      const data = await response.json()
      setReceipts(data.receipts || [])
    } catch (error) {
      console.error('Error fetching receipts:', error)
    }
  }

  const simulateAuth = async () => {
    setLoading(true)
    try {
      // Simulate wallet authentication
      const mockPublicKey = '02aaa7a5a2e386840889732be8d8264d42198f116903ed9f8f2cc9763c0e9958acac'
      const mockSignature = 'mock_signature_' + Date.now()
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_key: mockPublicKey,
          signature: mockSignature
        })
      })
      
      const data = await response.json()
      setAuthToken(data.auth_token)
      setMessage('Authentication successful!')
    } catch (error) {
      setMessage('Authentication failed: ' + error.message)
    }
    setLoading(false)
  }

  const callHelloEndpoint = async () => {
    setLoading(true)
    try {
      const headers = {}
      if (paymentId) {
        headers['X-Payment-ID'] = paymentId
      }

      const response = await fetch(`${API_BASE}/hello`, {
        headers
      })
      
      const data = await response.json()
      
      if (response.status === 402) {
        // Payment required
        setPaymentId(data.payment_id)
        setMessage(`Payment required: $${data.amount_usd} (${data.amount_satoshis} satoshis)`)
      } else if (response.ok) {
        // Success
        setMessage(data.message)
        fetchReceipts() // Refresh receipts
      } else {
        setMessage('Error: ' + data.message)
      }
    } catch (error) {
      setMessage('Error calling endpoint: ' + error.message)
    }
    setLoading(false)
  }

  const simulatePayment = async () => {
    if (!paymentId) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/payment/${paymentId}/complete`, {
        method: 'POST'
      })
      
      const data = await response.json()
      setMessage('Payment completed! You can now call the endpoint again.')
    } catch (error) {
      setMessage('Payment failed: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Babbage Developer Sandbox</h1>
          <p className="text-lg text-gray-600">Demonstrating Core Rails: Wallet, Auth, Payments & Receipts</p>
        </div>

        {/* Wallet Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Information
            </CardTitle>
            <CardDescription>BRC-100 Compatible Wallet Simulation</CardDescription>
          </CardHeader>
          <CardContent>
            {walletInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{walletInfo.wallet_type}</Badge>
                  {walletInfo.brc_100_compatible && (
                    <Badge variant="default">BRC-100 Compatible</Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Supported Methods:</h4>
                  <div className="flex flex-wrap gap-1">
                    {walletInfo.supported_methods.map((method, index) => (
                      <Badge key={index} variant="outline">{method}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Certificates:</h4>
                  <div className="flex flex-wrap gap-1">
                    {walletInfo.certificates.map((cert, index) => (
                      <Badge key={index} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading wallet information...</p>
            )}
          </CardContent>
        </Card>

        {/* Authentication Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Authentication (AuthFetch Simulation)
            </CardTitle>
            <CardDescription>Simulate wallet-based authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={simulateAuth} 
                disabled={loading}
                className="w-full"
              >
                {authToken ? 'Re-authenticate' : 'Authenticate with Wallet'}
              </Button>
              {authToken && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Authenticated!</strong> Token: {authToken.substring(0, 20)}...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Demo Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Demo (402 Flow)
            </CardTitle>
            <CardDescription>Test the $0.0002 "Hello World" endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={callHelloEndpoint} 
                disabled={loading}
                className="w-full"
              >
                Call Hello World Endpoint ($0.0002)
              </Button>
              
              {paymentId && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 mb-2">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    Payment Required: {paymentId.substring(0, 20)}...
                  </p>
                  <Button 
                    onClick={simulatePayment} 
                    disabled={loading}
                    size="sm"
                    variant="outline"
                  >
                    Simulate Payment (PeerPay)
                  </Button>
                </div>
              )}
              
              {message && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">{message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receipts Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipts (Overlay Service Simulation)
            </CardTitle>
            <CardDescription>Usage logs from the overlay service</CardDescription>
          </CardHeader>
          <CardContent>
            {receipts.length > 0 ? (
              <div className="space-y-3">
                {receipts.map((receipt, index) => (
                  <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{receipt.service}</p>
                        <p className="text-sm text-gray-600">{receipt.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(receipt.timestamp * 1000).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary">${receipt.amount_paid}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No receipts yet. Complete a payment to see receipts here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
