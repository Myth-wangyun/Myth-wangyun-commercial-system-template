"""
测试API权限保护是否生效
"""
import sys
import requests
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import SecurityManager

def test_api_with_user(username: str):
    """测试指定用户是否能访问企业文化API"""
    print(f"\n{'='*60}")
    print(f"测试用户 {username} 的API访问权限")
    print('='*60)
    
    db = SessionLocal()
    try:
        # 获取用户
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"❌ 用户 {username} 不存在")
            return
        
        print(f"\n用户信息：")
        print(f"  - 用户名: {user.username}")
        print(f"  - 真实姓名: {user.real_name}")
        print(f"  - 部门: {user.department}")
        print(f"  - 职位: {user.position}")
        print(f"  - 超级用户: {user.is_superuser}")
        
        # 生成token
        token = SecurityManager.create_access_token({"sub": str(user.user_id)})
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 测试API访问
        base_url = "http://localhost:8000/api/v1"
        
        # 测试1：获取企业文化宣讲计划列表
        print(f"\n测试1：获取企业文化宣讲计划列表")
        print(f"  API: GET {base_url}/academic/culture-presentation/list")
        try:
            response = requests.get(
                f"{base_url}/academic/culture-presentation/list",
                headers=headers,
                params={"skip": 0, "limit": 10}
            )
            print(f"  状态码: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ 访问成功 - 返回 {data.get('total', 0)} 条数据")
            elif response.status_code == 403:
                print(f"  ❌ 访问被拒绝 - {response.json().get('detail', '无权限')}")
            else:
                print(f"  ⚠️  其他错误 - {response.text}")
        except Exception as e:
            print(f"  ⚠️  请求失败: {e}")
        
        # 测试2：获取企业文化考试计划列表
        print(f"\n测试2：获取企业文化考试计划列表")
        print(f"  API: GET {base_url}/academic/culture-exam/list")
        try:
            response = requests.get(
                f"{base_url}/academic/culture-exam/list",
                headers=headers,
                params={"skip": 0, "limit": 10}
            )
            print(f"  状态码: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ 访问成功 - 返回 {data.get('total', 0)} 条数据")
            elif response.status_code == 403:
                print(f"  ❌ 访问被拒绝 - {response.json().get('detail', '无权限')}")
            else:
                print(f"  ⚠️  其他错误 - {response.text}")
        except Exception as e:
            print(f"  ⚠️  请求失败: {e}")
        
        print(f"\n{'='*60}\n")
    finally:
        db.close()

if __name__ == "__main__":
    # 测试admin用户（应该有权限）
    test_api_with_user("admin")
    
    # 测试普通员工（应该没有权限）
    test_api_with_user("chilingbo")
