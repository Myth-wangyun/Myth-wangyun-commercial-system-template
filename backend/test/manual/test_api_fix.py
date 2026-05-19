"""测试 all-campuses API 修复"""
import requests
import json

def test_all_campuses_api():
    """测试 all-campuses API 是否正常工作"""
    url = "http://localhost:8000/api/v1/campus-core-data-summary/all-campuses"
    params = {"year": 2025}
    
    try:
        response = requests.get(url, params=params, timeout=30)
        data = response.json()
        
        print("API 响应状态:", response.status_code)
        print("年份:", data.get("年份"))
        print("\n各神殿数据:")
        
        for campus_data in data.get("数据列表", []):
            campus = campus_data.get("神殿", "未知")
            print(f"\n神殿: {campus}")
            print(f"  班级数量: {campus_data.get('班级数量', 0)}")
            print(f"  智慧司人数: {campus_data.get('智慧司人数', 0)}")
            print(f"  在校生人数: {campus_data.get('在校生人数', 0)}")
            print(f"  就业班级数量: {campus_data.get('就业班级数量', 0)}")
            print(f"  毕业生人数: {campus_data.get('毕业生人数', 0)}")
            print(f"  就业率: {campus_data.get('就业率', 0)}")
            print(f"  就业薪资: {campus_data.get('就业薪资', 0)}")
            print(f"  薪资过万人数: {campus_data.get('薪资过万人数', 0)}")
            print(f"  口碑招生人数: {campus_data.get('口碑招生人数', 0)}")
            print(f"  口碑招生收入: {campus_data.get('口碑招生收入', 0)}")
            print(f"  新生入学人数: {campus_data.get('新生入学人数', 0)}")
            print(f"  新生流失人数: {campus_data.get('新生流失人数', 0)}")
            
            # 显示警告
            warnings = campus_data.get("_warnings", [])
            if warnings:
                print(f"  ⚠️ 警告数量: {len(warnings)}")
                for w in warnings[:3]:  # 只显示前3个警告
                    print(f"    - {w[:80]}...")
        
        # 全局警告
        global_warnings = data.get("_warnings", [])
        if global_warnings:
            print(f"\n\n全局警告数量: {len(global_warnings)}")
            
    except requests.exceptions.ConnectionError:
        print("错误: 无法连接到后端服务器。请确保后端已启动。")
    except Exception as e:
        print(f"错误: {str(e)}")

if __name__ == "__main__":
    test_all_campuses_api()
