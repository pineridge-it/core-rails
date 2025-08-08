from flask import Blueprint, jsonify, request
import time
import uuid
import json

babbage_bp = Blueprint('babbage', __name__)

# In-memory storage for demo purposes
payment_requests = {}
receipts = []

@babbage_bp.route('/hello', methods=['GET'])
def hello_world():
    """
    Hello World endpoint that costs $0.0002 per call.
    Demonstrates the 402 Payment Required flow.
    """
    # Check if payment has been made
    payment_id = request.headers.get('X-Payment-ID')
    
    if not payment_id or payment_id not in payment_requests:
        # Generate a new payment request
        payment_id = str(uuid.uuid4())
        payment_requests[payment_id] = {
            'amount': 0.0002,  # $0.0002 in USD
            'satoshis': 20,    # Approximate satoshi equivalent (assuming $1000/BSV)
            'status': 'pending',
            'created_at': time.time()
        }
        
        return jsonify({
            'error': 'Payment Required',
            'payment_id': payment_id,
            'amount_usd': 0.0002,
            'amount_satoshis': 20,
            'message': 'Please complete payment to access this endpoint'
        }), 402
    
    # Check if payment is completed
    payment_info = payment_requests[payment_id]
    if payment_info['status'] != 'completed':
        return jsonify({
            'error': 'Payment Pending',
            'payment_id': payment_id,
            'status': payment_info['status'],
            'message': 'Payment is still being processed'
        }), 402
    
    # Payment completed, provide the service
    receipt = {
        'id': str(uuid.uuid4()),
        'payment_id': payment_id,
        'service': 'hello_world',
        'amount_paid': payment_info['amount'],
        'timestamp': time.time(),
        'message': 'Hello World! Payment successful.'
    }
    
    receipts.append(receipt)
    
    return jsonify({
        'message': 'Hello World! This cost you $0.0002',
        'receipt': receipt
    })

@babbage_bp.route('/payment/<payment_id>/complete', methods=['POST'])
def complete_payment(payment_id):
    """
    Simulate payment completion.
    In a real implementation, this would be called by PeerPay.
    """
    if payment_id not in payment_requests:
        return jsonify({'error': 'Payment request not found'}), 404
    
    payment_requests[payment_id]['status'] = 'completed'
    payment_requests[payment_id]['completed_at'] = time.time()
    
    return jsonify({
        'message': 'Payment completed successfully',
        'payment_id': payment_id
    })

@babbage_bp.route('/receipts', methods=['GET'])
def get_receipts():
    """
    Get all receipts (usage logs from overlay service simulation).
    """
    return jsonify({
        'receipts': receipts,
        'total_count': len(receipts)
    })

@babbage_bp.route('/auth/login', methods=['POST'])
def auth_login():
    """
    Simulate AuthFetch login functionality.
    """
    data = request.json
    public_key = data.get('public_key')
    signature = data.get('signature')
    
    if not public_key or not signature:
        return jsonify({'error': 'Missing public_key or signature'}), 400
    
    # In a real implementation, this would verify the signature
    # For demo purposes, we'll just return a mock auth token
    auth_token = str(uuid.uuid4())
    
    return jsonify({
        'message': 'Authentication successful',
        'auth_token': auth_token,
        'public_key': public_key,
        'expires_in': 3600  # 1 hour
    })

@babbage_bp.route('/wallet/info', methods=['GET'])
def wallet_info():
    """
    Simulate wallet information endpoint.
    """
    return jsonify({
        'wallet_type': 'Metanet Desktop (Simulated)',
        'brc_100_compatible': True,
        'supported_methods': [
            'createAction',
            'signAction', 
            'getPublicKey',
            'encrypt',
            'decrypt',
            'createSignature'
        ],
        'certificates': [
            'SocialCert (email)',
            'CoolCert (basic profile)'
        ]
    })

