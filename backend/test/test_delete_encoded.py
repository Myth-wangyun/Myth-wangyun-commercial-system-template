import requests
from urllib.parse import quote

test_id = 2

# 测试不同的URL格式
urls = [
    f'http://127.0.0.1:8000/api/v1/market/daily/{test_id}',
    f'http://127.0.0.1:8000/api/v1/market/daily/%E6%98%8E%E7%BB%86ID/{test_id}',  # URL编码的"明细ID"
]

for url in urls:
    print(f"\n=== Testing URL: {url} ===")
    try:
        r = requests.delete(url)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

# 测试GET请求，看看能否获取单条记录
print(f"\n=== Testing GET for ID {test_id} ===")
r = requests.get(f'http://127.0.0.1:8000/api/v1/market/daily/{test_id}')
print(f"GET Status: {r.status_code}")
print(f"GET Response: {r.text[:200]}")


