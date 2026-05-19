"""检查当前登录用户的token信息"""
import requests

# 测试URL
BASE_URL = "http://localhost:8000"

# 先登录获取token（使用李建峰的账号）
# 使用 OAuth2 格式（form data）
login_data = {
    "username": "lijianfeng",
    "password": "123456"
}

print("=== 测试登录 ===")
response = requests.post(
    f"{BASE_URL}/api/v1/auth/login", 
    data=login_data,  # 使用 data 而不是 json
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
print(f"状态码: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    user = data.get("user", {})
    print("\n用户信息:")
    print(f"  user_id: {user.get('user_id')}")
    print(f"  username: {user.get('username')}")
    print(f"  real_name: {user.get('real_name')}")
    print(f"  role: {user.get('role')}")
    print(f"  department: {user.get('department')}")
    print(f"  position: {user.get('position')}")  # 检查是否返回position字段
    print(f"  campus: {user.get('campus')}")
    print(f"  is_superuser: {user.get('is_superuser')}")
else:
    print(f"登录失败: {response.text}")
