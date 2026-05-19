import requests

# 测试 class-list API
url = "http://localhost:8000/api/v1/teaching-quality/class-list"
headers = {"X-API-Key": "qm_system_2024_secret_key"}

try:
    res = requests.get(url, headers=headers)
    print(f"状态码: {res.status_code}")
    print(f"响应: {res.text[:500] if len(res.text) > 500 else res.text}")
except Exception as e:
    print(f"请求失败: {e}")
