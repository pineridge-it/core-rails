from flask import Blueprint, jsonify, request, Response
import requests
import time
import uuid
import json

api_gateway_bp = Blueprint('api_gateway', __name__)

# In-memory storage for demo purposes
api_calls = []
balance_snapshots = []
active_payments = {}

# Mock upstream APIs for demonstration
MOCK_APIS = {
    'weather': {
        'url': 'https://api.openweathermap.org/data/2.5/weather',
        'cost_per_call': 0.001,  # $0.001 per call
        'free': True
    },
    'ml-inference': {
        'url': 'https://api.example-ml.com/predict',
        'cost_per_call': 0.01,  # $0.01 per call
        'free': False
    }
}

@api_gateway_bp.route('/api-proxy/<api_name>/<path:endpoint>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_proxy(api_name, endpoint):
    """
    API proxy that wraps upstream APIs with payment requirements.
    """
    if api_name not in MOCK_APIS:
        return jsonify({'error': 'API not found'}), 404
    
    api_config = MOCK_APIS[api_name]
    
    # Check if payment is required
    if not api_config['free']:
        payment_id = request.headers.get('X-Payment-ID')
        
        if not payment_id or payment_id not in active_payments:
            # Generate payment request
            payment_id = str(uuid.uuid4())
            active_payments[payment_id] = {
                'api_name': api_name,
                'endpoint': endpoint,
                'amount_usd': api_config['cost_per_call'],
                'amount_satoshis': int(api_config['cost_per_call'] * 100000),  # Rough conversion
                'status': 'pending',
                'created_at': time.time()
            }
            
            return jsonify({
                'error': 'Payment Required',
                'payment_id': payment_id,
                'api_name': api_name,
                'endpoint': endpoint,
                'amount_usd': api_config['cost_per_call'],
                'amount_satoshis': int(api_config['cost_per_call'] * 100000),
                'message': f'Payment required to access {api_name} API'
            }), 402
        
        # Check payment status
        payment_info = active_payments[payment_id]
        if payment_info['status'] != 'completed':
            return jsonify({
                'error': 'Payment Pending',
                'payment_id': payment_id,
                'status': payment_info['status'],
                'message': 'Payment is still being processed'
            }), 402
    
    # Log the API call
    call_record = {
        'id': str(uuid.uuid4()),
        'api_name': api_name,
        'endpoint': endpoint,
        'method': request.method,
        'timestamp': time.time(),
        'user_ip': request.remote_addr,
        'cost': api_config['cost_per_call'],
        'payment_id': request.headers.get('X-Payment-ID') if not api_config['free'] else None
    }
    api_calls.append(call_record)
    
    # Mock API response based on API type
    if api_name == 'weather':
        mock_response = {
            'location': request.args.get('q', 'London'),
            'temperature': 22,
            'description': 'Partly cloudy',
            'humidity': 65,
            'timestamp': time.time()
        }
    elif api_name == 'ml-inference':
        mock_response = {
            'prediction': 'positive',
            'confidence': 0.87,
            'model_version': '1.2.3',
            'processing_time_ms': 45,
            'timestamp': time.time()
        }
    else:
        mock_response = {'message': 'API response', 'data': {}}
    
    return jsonify({
        'api_name': api_name,
        'endpoint': endpoint,
        'cost': api_config['cost_per_call'],
        'response': mock_response,
        'call_id': call_record['id']
    })

@api_gateway_bp.route('/api-proxy/payment/<payment_id>/complete', methods=['POST'])
def complete_api_payment(payment_id):
    """
    Complete payment for API access.
    """
    if payment_id not in active_payments:
        return jsonify({'error': 'Payment request not found'}), 404
    
    active_payments[payment_id]['status'] = 'completed'
    active_payments[payment_id]['completed_at'] = time.time()
    
    # Record balance snapshot
    balance_snapshot = {
        'id': str(uuid.uuid4()),
        'payment_id': payment_id,
        'amount_debited': active_payments[payment_id]['amount_usd'],
        'api_name': active_payments[payment_id]['api_name'],
        'timestamp': time.time()
    }
    balance_snapshots.append(balance_snapshot)
    
    return jsonify({
        'message': 'API payment completed successfully',
        'payment_id': payment_id,
        'api_access_granted': True
    })

@api_gateway_bp.route('/api-calls', methods=['GET'])
def get_api_calls():
    """
    Get API call logs.
    """
    return jsonify({
        'api_calls': api_calls,
        'total_count': len(api_calls)
    })

@api_gateway_bp.route('/balance-snapshots', methods=['GET'])
def get_balance_snapshots():
    """
    Get balance snapshots.
    """
    return jsonify({
        'balance_snapshots': balance_snapshots,
        'total_count': len(balance_snapshots)
    })

@api_gateway_bp.route('/available-apis', methods=['GET'])
def get_available_apis():
    """
    List available APIs and their pricing.
    """
    return jsonify({
        'apis': {
            name: {
                'cost_per_call': config['cost_per_call'],
                'free': config['free'],
                'description': f'{name.title()} API service'
            }
            for name, config in MOCK_APIS.items()
        }
    })

