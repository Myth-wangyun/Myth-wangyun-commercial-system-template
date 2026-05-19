"""
日投放数据API测试脚本
"""

import requests
from datetime import datetime

# API基础URL
BASE_URL = "http://127.0.0.1:8000"

def test_api():
    """测试API端点"""
    
    print("开始测试日投放数据API...")
    
    # 测试数据
    test_data = {
        "日期": "2025-01-15",
        "媒体来源": "百度",
        "消费金额": 1000.50,
        "展现量": 50000,
        "点击量": 2000,
        "IP": 1500,
        "PV": 3000,
        "对话量": 100,
        "有效对话": 80,
        "咨询量": 60
    }

    try:
        # 等待后端服务可用（最多重试 10 次）
        max_attempts = 10
        for attempt in range(1, max_attempts + 1):
            try:
                ping = requests.get(f"{BASE_URL}/health", timeout=2)
                if ping.status_code == 200:
                    print(f"后端健康检查成功 (尝试 {attempt}/{max_attempts})")
                    break
            except Exception:
                print(f"后端暂不可用，等待重试 {attempt}/{max_attempts}...")
                import time
                time.sleep(1.5)
        else:
            print("后端始终不可用，退出测试。")
            return

            # 1. 根路径
            print("\n1. 测试根路径...")
            response = requests.get(f"{BASE_URL}/")
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.json()}")

            # 2. 市场模块根路径
            print("\n2. 测试市场模块根路径...")
            response = requests.get(f"{BASE_URL}/api/v1/market/")
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.json()}")

            # 3. OPTIONS 预检
            print("\n3. 测试 /api/v1/market/daily OPTIONS 预检...")
            opt_resp = requests.options(f"{BASE_URL}/api/v1/market/daily", headers={"Origin": "http://localhost:3000"})
            print(f"状态码: {opt_resp.status_code}")
            if opt_resp.status_code not in (200, 204):
                print(f"⚠️ 预检异常: {opt_resp.text}")
            else:
                print("✅ 预检通过")

            # 4. 创建日投放数据
            print("\n4. 测试创建日投放数据...")
            response = requests.post(
                f"{BASE_URL}/api/v1/market/daily",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                created_data = response.json()
                print(f"创建成功: {created_data}")
                record_id = created_data["明细ID"]
            else:
                print(f"创建失败: {response.text}")
                return

            # 5. 列表获取
            print("\n5. 测试获取日投放数据列表...")
            response = requests.get(f"{BASE_URL}/api/v1/market/daily")
            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                data_list = response.json()
                print(f"获取到 {len(data_list)} 条记录")
                if data_list:
                    print(f"第一条记录: {data_list[0]}")

            # 6. 单条记录
            print(f"\n6. 测试获取单条记录 (ID: {record_id})...")
            response = requests.get(f"{BASE_URL}/api/v1/market/daily/{record_id}")
            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                single_data = response.json()
                print(f"单条记录: {single_data}")

            # 7. 更新记录
            print(f"\n7. 测试更新记录 (ID: {record_id})...")
            update_data = {"消费金额": 1200.00, "点击量": 2500}
            response = requests.put(
                f"{BASE_URL}/api/v1/market/daily/{record_id}",
                json=update_data,
                headers={"Content-Type": "application/json"}
            )
            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                updated_data = response.json()
                print(f"更新成功: {updated_data}")

            # 8. 统计汇总
            print("\n8. 测试统计汇总...")
            response = requests.get(
                f"{BASE_URL}/api/v1/market/statistics/summary",
                params={"开始日期": "2025-01-01", "结束日期": "2025-01-31"}
            )
            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                stats = response.json()
                print(f"统计汇总: {stats}")

            # 9. 按日统计
            print("\n9. 测试按日统计...")
            response = requests.get(
                f"{BASE_URL}/api/v1/market/statistics/daily",
                params={"天数": 7}
            )
            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                daily_stats = response.json()
                print(f"按日统计: {daily_stats}")

            # 10. 按渠道统计
            print("\n10. 测试按渠道统计...")
            response = requests.get(
                f"{BASE_URL}/api/v1/market/statistics/channel",
                params={"开始日期": "2025-01-01", "结束日期": "2025-01-31"}
            )
            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                channel_stats = response.json()
                print(f"按渠道统计: {channel_stats}")

            # 11. 删除记录
            print(f"\n11. 测试删除记录 (ID: {record_id})...")
            response = requests.delete(f"{BASE_URL}/api/v1/market/daily/{record_id}")
            print(f"状态码: {response.status_code}")
            if response.status_code == 200:
                delete_result = response.json()
                print(f"删除成功: {delete_result}")

            print("\nAPI测试完成！")

    except requests.exceptions.ConnectionError:
        print("连接失败，请确保后端服务正在运行")
        print("启动命令: cd backend && python main.py")
    except Exception as e:
        print(f"测试过程中出现错误: {e}")

if __name__ == "__main__":
    test_api()
