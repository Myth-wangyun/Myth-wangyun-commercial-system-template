"""
测试神殿核心年度数据API
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1/market/campus-core-annual"

def test_save_month_data():
    """测试保存单月数据"""
    print("\n=== 测试保存单月数据 ===")
    
    data = {
        "campus": "主神殿",
        "year": "2026",
        "month": 1,
        "plan_income": 1000000,
        "actual_income": 950000,
        "investment_ratio": "1:5.2",
        "enrollment_conversion_rate": "15.5%",
        "refund_count": 5,
        "refund_rate": "2.3%",
        "plan_enrollment": 100,
        "gross_enrollment": 95,
        "net_enrollment": 90,
        "order_count": 85,
        "enrollment_progress": "95%",
        "net_cost": 10555.56,
        "visit_count": 120,
        "visit_rate": "75%",
        "plan_consult_volume": 500,
        "actual_consult_volume": 480,
        "consult_completion_progress": "96%",
        "consult_cost": 1979.17,
        "plan_cost": 950000,
        "actual_cost": 950000
    }
    
    try:
        response = requests.post(f"{BASE_URL}/save-month", json=data)
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {str(e)}")
        return False


def test_get_data():
    """测试获取数据"""
    print("\n=== 测试获取数据 ===")
    
    params = {
        "campus": "主神殿",
        "year": "2026"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/data", params=params)
        print(f"状态码: {response.status_code}")
        result = response.json()
        print(f"成功: {result.get('success')}")
        
        if result.get('success'):
            data = result.get('data', {})
            print(f"返回月份数: {len(data)}")
            
            # 显示1月份的数据
            if 1 in data:
                print(f"\n1月份数据:")
                print(json.dumps(data[1], indent=2, ensure_ascii=False))
        
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {str(e)}")
        return False


def test_save_batch_data():
    """测试批量保存数据"""
    print("\n=== 测试批量保存数据 ===")
    
    months_data = []
    for month in range(1, 13):
        months_data.append({
            "month": month,
            "plan_income": 1000000 * month,
            "actual_income": 950000 * month,
            "investment_ratio": "1:5.2",
            "plan_enrollment": 100,
            "gross_enrollment": 95,
            "net_enrollment": 90,
            "actual_consult_volume": 480,
            "plan_cost": 950000,
            "actual_cost": 950000
        })
    
    data = {
        "campus": "主神殿",
        "year": "2026",
        "months": months_data
    }
    
    try:
        response = requests.post(f"{BASE_URL}/save", json=data)
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {str(e)}")
        return False


def test_delete_data():
    """测试删除数据"""
    print("\n=== 测试删除单月数据 ===")
    
    params = {
        "campus": "主神殿",
        "year": "2026",
        "month": 1
    }
    
    try:
        response = requests.delete(f"{BASE_URL}/delete", params=params)
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {str(e)}")
        return False


def main():
    """主测试流程"""
    print("=" * 60)
    print("神殿核心年度数据API测试")
    print("=" * 60)
    
    results = []
    
    # 1. 测试保存单月数据
    results.append(("保存单月数据", test_save_month_data()))
    
    # 2. 测试获取数据
    results.append(("获取数据", test_get_data()))
    
    # 3. 测试批量保存数据
    results.append(("批量保存数据", test_save_batch_data()))
    
    # 4. 再次获取数据验证
    results.append(("验证批量保存", test_get_data()))
    
    # 5. 测试删除数据
    # results.append(("删除数据", test_delete_data()))
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
    
    total = len(results)
    passed = sum(1 for _, r in results if r)
    print(f"\n总计: {passed}/{total} 通过")


if __name__ == "__main__":
    main()

