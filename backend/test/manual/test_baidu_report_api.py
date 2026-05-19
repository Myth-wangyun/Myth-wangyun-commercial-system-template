"""
百度一站式多渠道报告API测试脚本

使用方法:
    python test_baidu_report_api.py

测试前提:
    1. 后端服务已启动 (默认 http://localhost:8000)
    2. 已完成百度OAuth授权（获取到有效token）
"""

import asyncio
import httpx
import json
from datetime import datetime, timedelta


# ==================== 配置 ====================

# API基础地址
BASE_URL = "http://116.255.152.27:8000/api/v1/baidu-marketing"

# 测试用户信息（需要替换为实际已授权的用户）
TEST_USER_NAME = "石家庄清美动漫"  # 推广账户名称
TEST_USER_ID = 22939007  # 用户ID（从环境变量中获取的 BAIDU_MARKETING_DEVELOPER_USER_ID）


# ==================== 工具函数 ====================

def print_separator(title: str):
    """打印分隔线"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_response(response: dict):
    """格式化打印响应"""
    print(json.dumps(response, indent=2, ensure_ascii=False))


async def make_request(client: httpx.AsyncClient, method: str, url: str, data: dict = None):
    """发送HTTP请求"""
    try:
        if method == "GET":
            response = await client.get(url)
        else:
            response = await client.post(url, json=data)
        
        return {
            "status_code": response.status_code,
            "data": response.json()
        }
    except Exception as e:
        return {
            "status_code": -1,
            "error": str(e)
        }


# ==================== 测试函数 ====================

async def test_service_status(client: httpx.AsyncClient):
    """测试服务状态"""
    print_separator("1. 测试服务状态")
    
    # 获取所有已授权的Token列表
    result = await make_request(client, "GET", f"{BASE_URL}/tokens")
    print(f"状态码: {result['status_code']}")
    
    if result['status_code'] == 200:
        data = result['data']
        print(f"响应码: {data.get('code')}")
        print(f"消息: {data.get('message')}")
        tokens = data.get('data', [])
        print(f"已授权用户数: {len(tokens)}")
        
        if tokens:
            print("\n已授权用户列表:")
            for token in tokens:
                print(f"  - userId: {token.get('user_id')}, userName: {token.get('user_name')}")
        else:
            print("\n⚠️ 没有已授权的用户，请先完成OAuth授权")
            print("   授权流程:")
            print("   1. 调用 POST /auth/generate-url 获取授权链接")
            print("   2. 将链接发送给推广用户")
            print("   3. 用户完成授权后，系统会自动保存Token")
    else:
        print(f"请求失败: {result}")


async def test_generate_auth_url(client: httpx.AsyncClient):
    """测试生成授权链接"""
    print_separator("2. 生成授权链接")
    
    result = await make_request(client, "POST", f"{BASE_URL}/auth/generate-url", {
        "scope": "1007690",  # 报告权限
        "state": "test_state"
    })
    
    print(f"状态码: {result['status_code']}")
    if result['status_code'] == 200:
        data = result['data']
        print(f"响应码: {data.get('code')}")
        if data.get('code') == 0:
            auth_url = data.get('data', {}).get('auth_url')
            print(f"\n授权链接:\n{auth_url}")
            print("\n请将此链接发送给需要授权的推广用户")
        else:
            print(f"生成失败: {data.get('message')}")
    else:
        print(f"请求失败: {result}")


async def test_multi_channel_report(client: httpx.AsyncClient):
    """测试一站式多渠道报告"""
    print_separator("3. 测试一站式多渠道报告")
    
    # 获取最近7天的数据
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    print(f"查询日期范围: {start_date} ~ {end_date}")
    
    request_data = {
        "user_name": TEST_USER_NAME,
        "user_id": TEST_USER_ID,
        "start_date": start_date,
        "end_date": end_date,
        "time_unit": "DAY",
        "columns": ["product", "date", "cost", "impression", "click", "ctr", "cpc"],
        "products": [0, 1],  # 搜索推广和信息流推广
        "start_row": 0,
        "row_count": 100,
        "need_sum": False
    }
    
    print(f"\n请求参数:")
    print_response(request_data)
    
    result = await make_request(client, "POST", f"{BASE_URL}/api/report/multi-channel", request_data)
    
    print(f"\n响应状态码: {result['status_code']}")
    if result['status_code'] == 200:
        data = result['data']
        print(f"响应码: {data.get('code')}")
        print(f"消息: {data.get('message')}")
        
        if data.get('code') == 0:
            report_data = data.get('data', {})
            print(f"\n数据统计:")
            print(f"  总行数: {report_data.get('totalRowCount', 0)}")
            print(f"  返回行数: {report_data.get('rowCount', 0)}")
            
            rows = report_data.get('rows', [])
            if rows:
                print(f"\n数据详情:")
                for row in rows[:10]:  # 只显示前10条
                    product_name = {0: "搜索推广", 1: "信息流推广", 3: "阿拉丁", 4: "知识营销"}.get(row.get('product'), '未知')
                    print(f"  {row.get('date')} | {product_name} | "
                          f"展现:{row.get('impression', 0):,} | "
                          f"点击:{row.get('click', 0):,} | "
                          f"消费:¥{row.get('cost', 0):,.2f}")
        else:
            print(f"\n⚠️ API返回错误:")
            print_response(data)
    else:
        print(f"请求失败: {result}")


async def test_daily_cost_report(client: httpx.AsyncClient):
    """测试每日展点消报告"""
    print_separator("4. 测试每日展点消报告")
    
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
    
    print(f"查询日期范围: {start_date} ~ {end_date}")
    
    request_data = {
        "user_name": TEST_USER_NAME,
        "user_id": TEST_USER_ID,
        "start_date": start_date,
        "end_date": end_date,
        "products": [0, 1]
    }
    
    result = await make_request(client, "POST", f"{BASE_URL}/api/report/daily-cost", request_data)
    
    print(f"\n响应状态码: {result['status_code']}")
    if result['status_code'] == 200:
        data = result['data']
        print(f"响应码: {data.get('code')}")
        
        if data.get('code') == 0:
            report_data = data.get('data', {})
            rows = report_data.get('rows', [])
            print(f"返回 {len(rows)} 条数据")
            
            if rows:
                print("\n日期       | 渠道       | 展现      | 点击    | 消费")
                print("-" * 60)
                for row in rows:
                    product_name = {0: "搜索推广", 1: "信息流", 3: "阿拉丁", 4: "知识营销"}.get(row.get('product'), '未知')
                    print(f"{row.get('date')} | {product_name:8} | "
                          f"{row.get('impression', 0):>8,} | "
                          f"{row.get('click', 0):>6,} | "
                          f"¥{row.get('cost', 0):>10,.2f}")
        else:
            print(f"API返回错误: {data.get('message')}")
    else:
        print(f"请求失败: {result}")


async def test_hourly_cost_report(client: httpx.AsyncClient):
    """测试小时级展点消报告"""
    print_separator("5. 测试小时级展点消报告")
    
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"查询日期: {today}")
    
    request_data = {
        "user_name": TEST_USER_NAME,
        "user_id": TEST_USER_ID,
        "date": today,
        "products": [0]  # 只查搜索推广
    }
    
    result = await make_request(client, "POST", f"{BASE_URL}/api/report/hourly-cost", request_data)
    
    print(f"\n响应状态码: {result['status_code']}")
    if result['status_code'] == 200:
        data = result['data']
        print(f"响应码: {data.get('code')}")
        
        if data.get('code') == 0:
            report_data = data.get('data', {})
            rows = report_data.get('rows', [])
            print(f"返回 {len(rows)} 条数据")
            
            if rows:
                print("\n时间            | 展现      | 点击   | 消费")
                print("-" * 50)
                for row in rows[:12]:  # 显示前12小时
                    print(f"{row.get('date')} | "
                          f"{row.get('impression', 0):>8,} | "
                          f"{row.get('click', 0):>5,} | "
                          f"¥{row.get('cost', 0):>8,.2f}")
        else:
            print(f"API返回错误: {data.get('message')}")
    else:
        print(f"请求失败: {result}")


async def test_summary_cost_report(client: httpx.AsyncClient):
    """测试汇总展点消报告"""
    print_separator("6. 测试汇总展点消报告")
    
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    print(f"汇总日期范围: {start_date} ~ {end_date}")
    
    request_data = {
        "user_name": TEST_USER_NAME,
        "user_id": TEST_USER_ID,
        "start_date": start_date,
        "end_date": end_date,
        "products": [0, 1]
    }
    
    result = await make_request(client, "POST", f"{BASE_URL}/api/report/summary-cost", request_data)
    
    print(f"\n响应状态码: {result['status_code']}")
    if result['status_code'] == 200:
        data = result['data']
        print(f"响应码: {data.get('code')}")
        
        if data.get('code') == 0:
            report_data = data.get('data', {})
            rows = report_data.get('rows', [])
            
            if rows:
                print("\n30天汇总数据:")
                print("-" * 60)
                for row in rows:
                    product_name = {0: "搜索推广", 1: "信息流推广", 3: "阿拉丁", 4: "知识营销"}.get(row.get('product'), '未知')
                    print(f"\n渠道: {product_name}")
                    print(f"  时间段: {row.get('date')}")
                    print(f"  总展现: {row.get('impression', 0):,}")
                    print(f"  总点击: {row.get('click', 0):,}")
                    print(f"  总消费: ¥{row.get('cost', 0):,.2f}")
                    print(f"  点击率: {row.get('ctr', 0):.2%}" if row.get('ctr') else "  点击率: N/A")
                    print(f"  平均点击价格: ¥{row.get('cpc', 0):.2f}" if row.get('cpc') else "  平均点击价格: N/A")
        else:
            print(f"API返回错误: {data.get('message')}")
    else:
        print(f"请求失败: {result}")


async def main():
    """主测试函数"""
    print("\n" + "=" * 60)
    print("  百度一站式多渠道报告 API 测试")
    print("=" * 60)
    print(f"\nAPI地址: {BASE_URL}")
    print(f"测试用户ID: {TEST_USER_ID}")
    print(f"测试用户名: {TEST_USER_NAME}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. 测试服务状态
        await test_service_status(client)
        
        # 2. 生成授权链接
        await test_generate_auth_url(client)
        
        # 3-6. 测试报告接口（需要已授权）
        print("\n" + "-" * 60)
        input("\n按 Enter 继续测试报告接口（需要已完成OAuth授权）...")
        
        await test_multi_channel_report(client)
        await test_daily_cost_report(client)
        await test_hourly_cost_report(client)
        await test_summary_cost_report(client)
    
    print_separator("测试完成")


if __name__ == "__main__":
    asyncio.run(main())
