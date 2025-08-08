from flask import Blueprint, jsonify, request
import time
import uuid
import hashlib

ad_skip_bp = Blueprint('ad_skip', __name__)

# In-memory storage for demo purposes
ad_payments = {}
publisher_earnings = {}
page_certificates = {}

# Mock publisher certificates (in real implementation, these would be verified)
MOCK_PUBLISHERS = {
    'example.com': {
        'certificate': 'mock_cert_example_com',
        'revenue_share': 0.85,  # 85% to publisher
        'verified': True
    },
    'news-site.com': {
        'certificate': 'mock_cert_news_site',
        'revenue_share': 0.85,
        'verified': True
    }
}

@ad_skip_bp.route('/ad-skip/request', methods=['POST'])
def request_ad_skip():
    """
    Handle ad-skip payment request from browser extension.
    """
    data = request.json
    page_hash = data.get('page_hash')
    page_url = data.get('page_url', '')
    page_title = data.get('page_title', '')
    
    if not page_hash:
        return jsonify({'error': 'Missing page_hash'}), 400
    
    # Extract domain for publisher verification
    from urllib.parse import urlparse
    domain = urlparse(page_url).netloc
    
    # Check if publisher is verified (simplified)
    publisher_info = MOCK_PUBLISHERS.get(domain, {
        'certificate': 'unverified',
        'revenue_share': 0.85,
        'verified': False
    })
    
    # Check if already paid for this page
    existing_payment = ad_payments.get(page_hash)
    if existing_payment and existing_payment['status'] == 'completed':
        expiry_time = existing_payment['expires_at']
        if time.time() < expiry_time:
            remaining_time = int(expiry_time - time.time())
            return jsonify({
                'message': 'Already paid for ad-free access',
                'remaining_time': remaining_time,
                'expires_at': expiry_time
            })
    
    # Create new payment request
    payment_id = str(uuid.uuid4())
    amount_usd = 0.001  # $0.001 per page
    duration = 300  # 5 minutes
    
    ad_payments[payment_id] = {
        'page_hash': page_hash,
        'page_url': page_url,
        'page_title': page_title,
        'domain': domain,
        'publisher_info': publisher_info,
        'amount_usd': amount_usd,
        'duration': duration,
        'status': 'pending',
        'created_at': time.time(),
        'expires_at': time.time() + duration
    }
    
    return jsonify({
        'error': 'Payment Required',
        'payment_id': payment_id,
        'amount_usd': amount_usd,
        'amount_satoshis': int(amount_usd * 100000),  # Rough conversion
        'duration': duration,
        'publisher_verified': publisher_info['verified'],
        'message': f'Pay ${amount_usd} to skip ads for {duration//60} minutes'
    }), 402

@ad_skip_bp.route('/ad-skip/payment/<payment_id>/complete', methods=['POST'])
def complete_ad_skip_payment(payment_id):
    """
    Complete ad-skip payment and distribute revenue.
    """
    if payment_id not in ad_payments:
        return jsonify({'error': 'Payment request not found'}), 404
    
    payment_info = ad_payments[payment_id]
    
    if payment_info['status'] == 'completed':
        return jsonify({
            'message': 'Payment already completed',
            'expires_at': payment_info['expires_at']
        })
    
    # Mark payment as completed
    payment_info['status'] = 'completed'
    payment_info['completed_at'] = time.time()
    
    # Calculate revenue distribution
    total_amount = payment_info['amount_usd']
    publisher_share = total_amount * payment_info['publisher_info']['revenue_share']
    platform_share = total_amount * (1 - payment_info['publisher_info']['revenue_share'])
    
    # Record publisher earnings
    domain = payment_info['domain']
    if domain not in publisher_earnings:
        publisher_earnings[domain] = {
            'total_earned': 0,
            'payment_count': 0,
            'last_payment': None
        }
    
    publisher_earnings[domain]['total_earned'] += publisher_share
    publisher_earnings[domain]['payment_count'] += 1
    publisher_earnings[domain]['last_payment'] = time.time()
    
    return jsonify({
        'message': 'Ad-skip payment completed successfully',
        'payment_id': payment_id,
        'ad_free_duration': payment_info['duration'],
        'expires_at': payment_info['expires_at'],
        'publisher_share': publisher_share,
        'platform_share': platform_share
    })

@ad_skip_bp.route('/ad-skip/publisher-earnings/<domain>', methods=['GET'])
def get_publisher_earnings(domain):
    """
    Get earnings for a specific publisher domain.
    """
    earnings = publisher_earnings.get(domain, {
        'total_earned': 0,
        'payment_count': 0,
        'last_payment': None
    })
    
    return jsonify({
        'domain': domain,
        'earnings': earnings,
        'verified': MOCK_PUBLISHERS.get(domain, {}).get('verified', False)
    })

@ad_skip_bp.route('/ad-skip/publisher-earnings', methods=['GET'])
def get_all_publisher_earnings():
    """
    Get earnings for all publishers.
    """
    return jsonify({
        'publishers': publisher_earnings,
        'total_platform_revenue': sum(
            payment['amount_usd'] * (1 - payment['publisher_info']['revenue_share'])
            for payment in ad_payments.values()
            if payment['status'] == 'completed'
        )
    })

@ad_skip_bp.route('/ad-skip/verify-publisher', methods=['POST'])
def verify_publisher():
    """
    Verify publisher certificate (simplified implementation).
    """
    data = request.json
    domain = data.get('domain')
    certificate = data.get('certificate')
    
    if not domain or not certificate:
        return jsonify({'error': 'Missing domain or certificate'}), 400
    
    # In real implementation, this would verify the certificate signature
    # For demo, we'll just check if it matches our mock certificates
    expected_cert = MOCK_PUBLISHERS.get(domain, {}).get('certificate')
    
    if certificate == expected_cert:
        return jsonify({
            'verified': True,
            'domain': domain,
            'message': 'Publisher certificate verified'
        })
    else:
        return jsonify({
            'verified': False,
            'domain': domain,
            'message': 'Publisher certificate verification failed'
        }), 400

@ad_skip_bp.route('/ad-skip/stats', methods=['GET'])
def get_ad_skip_stats():
    """
    Get overall ad-skip statistics.
    """
    completed_payments = [p for p in ad_payments.values() if p['status'] == 'completed']
    
    total_revenue = sum(p['amount_usd'] for p in completed_payments)
    total_payments = len(completed_payments)
    unique_domains = len(set(p['domain'] for p in completed_payments))
    
    return jsonify({
        'total_payments': total_payments,
        'total_revenue': total_revenue,
        'unique_publishers': unique_domains,
        'average_payment': total_revenue / total_payments if total_payments > 0 else 0,
        'active_sessions': len([p for p in ad_payments.values() 
                               if p['status'] == 'completed' and time.time() < p['expires_at']])
    })

