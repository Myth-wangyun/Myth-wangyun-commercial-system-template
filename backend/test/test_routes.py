import requests
import json
import time

def test_routes():
    base_url = "http://127.0.0.1:8000"
    
    print("🔍 测试路由访问...")
    
    # 等待服务器重启
    print("⏳ 等待服务器重启...")
    time.sleep(3)
    
    # 测试调试路由
    print("\n1️⃣ 测试调试路由...")
    try:
        response = requests.get(f"{base_url}/api/v1/market/debug")
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text}")
    except Exception as e:
        print(f"   ❌ 调试路由失败: {e}")
    
    # 测试获取数据
    print("\n2️⃣ 测试获取数据...")
    try:
        response = requests.get(f"{base_url}/api/v1/market/daily")
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            records = data.get('data', [])
            print(f"   记录数: {len(records)}")
            if records:
                record_id = records[0].get('明细ID')
                print(f"   第一条记录ID: {record_id}")
                
                # 测试删除
                print(f"\n3️⃣ 测试删除ID {record_id}...")
                try:
                    delete_response = requests.delete(f"{base_url}/api/v1/market/daily/{record_id}")
                    print(f"   删除状态码: {delete_response.status_code}")
                    print(f"   删除响应: {delete_response.text}")
                except Exception as e:
                    print(f"   ❌ 删除请求失败: {e}")
        else:
            print(f"   获取数据失败: {response.text}")
    except Exception as e:
        print(f"   ❌ 获取数据失败: {e}")

if __name__ == "__main__":
    test_routes()