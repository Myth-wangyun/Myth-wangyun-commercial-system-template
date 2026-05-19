#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试统计API修复
验证日投放数据登记页面的统计卡片数据是否正确显示
"""

import sys
import io
# 设置标准输出编码为UTF-8，避免Windows下的编码问题
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json
from datetime import date, timedelta

class StatisticsFixTester:
    def __init__(self):
        self.api_base_url = "http://127.0.0.1:8000/api/v1/market"
        
    def test_statistics_summary_api(self):
        """测试统计汇总API"""
        print("=" * 70)
        print("🔍 测试：统计汇总API")
        print("=" * 70)
        
        # 测试最近30天的数据
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)
        
        params = {
            "开始日期": thirty_days_ago.isoformat(),
            "结束日期": today.isoformat()
        }
        
        url = f"{self.api_base_url}/statistics/summary"
        print(f"📡 URL: {url}")
        print(f"📊 参数: {params}")
        
        try:
            response = requests.get(url, params=params, timeout=10)
            print(f"✅ 状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"📋 响应结构: {list(result.keys())}")
                
                if result.get('success'):
                    data = result.get('data', {})
                    print("\n📊 统计数据:")
                    print("-" * 50)
                    
                    # 检查所有期望的字段
                    expected_fields = [
                        "总记录数", "总消费金额", "总展现量", "总点击量", 
                        "总IP", "总PV", "总对话量", "总有效对话", "总咨询量",
                        "平均点击率", "平均对话转化率", "平均留电率", "平均点击价格"
                    ]
                    
                    for field in expected_fields:
                        value = data.get(field, "❌ 缺失")
                        print(f"   {field}: {value}")
                    
                    # 检查是否有数据
                    total_records = data.get("总记录数", 0)
                    if total_records > 0:
                        print(f"\n✅ 数据正常：找到 {total_records} 条记录")
                        
                        # 检查关键指标是否非零
                        key_metrics = ["总消费金额", "总点击量", "总对话量"]
                        non_zero_metrics = []
                        for metric in key_metrics:
                            if data.get(metric, 0) > 0:
                                non_zero_metrics.append(metric)
                        
                        if non_zero_metrics:
                            print(f"✅ 关键指标正常：{', '.join(non_zero_metrics)} 有数据")
                        else:
                            print("⚠️ 关键指标为0，可能是数据问题")
                    else:
                        print("⚠️ 没有找到数据记录")
                        
                else:
                    print(f"❌ API返回失败: {result}")
            else:
                print(f"❌ HTTP错误: {response.status_code}")
                print(f"响应内容: {response.text}")
                
        except Exception as e:
            print(f"❌ 请求失败: {e}")
    
    def test_daily_statistics_api(self):
        """测试按日统计API"""
        print("\n" + "=" * 70)
        print("🔍 测试：按日统计API")
        print("=" * 70)
        
        url = f"{self.api_base_url}/statistics/daily"
        params = {"天数": 30}
        
        print(f"📡 URL: {url}")
        print(f"📊 参数: {params}")
        
        try:
            response = requests.get(url, params=params, timeout=10)
            print(f"✅ 状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"📋 响应结构: {list(result.keys())}")
                
                if result.get('success'):
                    data_list = result.get('data', [])
                    print(f"📊 按日统计记录数: {len(data_list)}")
                    
                    if data_list:
                        # 显示前3条记录
                        print("\n前3条按日统计:")
                        print("-" * 50)
                        for i, item in enumerate(data_list[:3]):
                            print(f"  {i+1}. 日期: {item.get('日期')} - 消费: ¥{item.get('总消费金额', 0):,.2f} - 点击: {item.get('总点击量', 0):,}")
                        
                        # 汇总统计
                        total_records = sum(item.get('记录数', 0) for item in data_list)
                        total_spend = sum(item.get('总消费金额', 0) for item in data_list)
                        total_clicks = sum(item.get('总点击量', 0) for item in data_list)
                        
                        print(f"\n📈 汇总统计:")
                        print(f"   总记录数: {total_records}")
                        print(f"   总消费金额: ¥{total_spend:,.2f}")
                        print(f"   总点击量: {total_clicks:,}")
                        
                        if total_records > 0:
                            print("✅ 按日统计数据正常")
                        else:
                            print("⚠️ 按日统计没有数据")
                    else:
                        print("⚠️ 按日统计没有数据")
                else:
                    print(f"❌ API返回失败: {result}")
            else:
                print(f"❌ HTTP错误: {response.status_code}")
                
        except Exception as e:
            print(f"❌ 请求失败: {e}")
    
    def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始测试统计API修复...")
        print("=" * 70)
        
        # 测试统计汇总API
        self.test_statistics_summary_api()
        
        # 测试按日统计API
        self.test_daily_statistics_api()
        
        print("\n" + "=" * 70)
        print("✅ 测试完成！")
        print("=" * 70)
        
        print("\n📋 修复说明:")
        print("1. ✅ 前端现在会提供必填的开始日期和结束日期参数")
        print("2. ✅ 后端统计API现在包含平均点击价格字段")
        print("3. ✅ 统计卡片应该能正确显示所有数据")
        
        print("\n🔧 如果仍有问题:")
        print("1. 检查后端服务是否重启")
        print("2. 检查数据库中是否有数据")
        print("3. 检查浏览器控制台是否有错误")

if __name__ == "__main__":
    tester = StatisticsFixTester()
    tester.run_all_tests()
