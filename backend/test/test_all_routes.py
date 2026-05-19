import requests

# 测试各种market相关的端点
endpoints = [
    ('GET', '/api/v1/market/'),
    ('GET', '/api/v1/market/daily'),
    ('GET', '/api/v1/market/daily/2'),
    ('POST', '/api/v1/market/daily'),
    ('PUT', '/api/v1/market/daily/2'),
    ('DELETE', '/api/v1/market/daily/2'),
]

for method, path in endpoints:
    url = f'http://127.0.0.1:8000{path}'
    print(f"\n{method} {path}")
    try:
        if method == 'GET':
            r = requests.get(url)
        elif method == 'DELETE':
            r = requests.delete(url)
        elif method == 'PUT':
            r = requests.put(url, json={})
        elif method == 'POST':
            r = requests.post(url, json={})
        
        print(f"  Status: {r.status_code}")
        if r.status_code != 404:
            print(f"  Response: {r.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")


