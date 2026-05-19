import requests
import json

def full_backend_test():
    base_url = "http://127.0.0.1:8000"
    
    print("=" * 50)
    print("🔍 开始完整后端测试")
    print("=" * 50)
    
    # 测试1: 根路径
    print("\n1️⃣ 测试根路径...")
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text[:100]}...")
    except Exception as e:
        print(f"   ❌ 失败: {e}")
        return
    
    # 测试2: 获取数据列表
    print("\n2️⃣ 测试获取数据列表...")
    try:
        response = requests.get(f"{base_url}/api/v1/market/daily", timeout=5)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   数据条数: {len(data.get('data', []))}")
            if data.get('data'):
                print(f"   第一条记录ID: {data['data'][0].get('明细ID')}")
                print(f"   所有记录ID: {[item.get('明细ID') for item in data['data']]}")
        else:
            print(f"   错误响应: {response.text}")
    except Exception as e:
        print(f"   ❌ 失败: {e}")
    
    # 测试3: 删除操作
    print("\n3️⃣ 测试删除操作...")
    test_id = 2
    try:
        delete_url = f"{base_url}/api/v1/market/daily/{test_id}"
        print(f"   删除URL: {delete_url}")
        
        response = requests.delete(delete_url, timeout=5)
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text}")
        
        if response.status_code == 404:
            print("   ℹ️ 可能是记录不存在或路由问题")
        
    except Exception as e:
        print(f"   ❌ 失败: {e}")
    
    # 测试4: 测试API文档
    print("\n4️⃣ 测试API文档...")
    try:
        response = requests.get(f"{base_url}/docs", timeout=5)
        print(f"   API文档状态码: {response.status_code}")
    except Exception as e:
        print(f"   ❌ API文档访问失败: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 测试完成")
    print("=" * 50)

if __name__ == "__main__":
    full_backend_test()