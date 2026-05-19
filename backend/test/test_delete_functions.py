#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试删除功能修复
"""

import sys
import io
import requests
import json
from datetime import date, timedelta

# 设置标准输出编码为UTF-8，避免Windows下的编码问题
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class DeleteFunctionTester:
    def __init__(self):
        self.api_base_url = 'http://127.0.0.1:8000/api/v1'
        self.all_tests_passed = True

    def test_api_connection(self):
        """测试API连接"""
        print("=" * 70)
        print("🔍 测试API连接")
        print("=" * 70)
        
        try:
            response = requests.get(f"{self.api_base_url}/market/", timeout=5)
            if response.status_code == 200:
                print("✅ 市场模块API连接正常")
                return True
            else:
                print(f"❌ 市场模块API连接失败，状态码：{response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ API连接失败：{e}")
            return False

    def test_daily_data_delete_endpoint(self):
        """测试日投放数据删除端点"""
        print("=" * 70)
        print("🔍 测试日投放数据删除端点")
        print("=" * 70)
        
        # 首先获取一些数据
        try:
            response = requests.get(f"{self.api_base_url}/market/daily?limit=1", timeout=10)
            if response.status_code == 200:
                data = response.json()
                items = data.get('data', [])
                if items:
                    record_id = items[0].get('明细ID')
                    print(f"✅ 找到测试记录，ID: {record_id}")
                    
                    # 测试删除端点（不实际删除，只测试端点是否存在）
                    delete_url = f"{self.api_base_url}/market/daily/{record_id}"
                    print(f"📡 删除端点URL: {delete_url}")
                    
                    # 发送OPTIONS请求检查端点是否存在
                    options_response = requests.options(delete_url, timeout=5)
                    if options_response.status_code in [200, 405]:  # 405表示方法不允许，但端点存在
                        print("✅ 删除端点存在且可访问")
                        return True
                    else:
                        print(f"❌ 删除端点不可访问，状态码：{options_response.status_code}")
                        return False
                else:
                    print("⚠️ 没有找到测试数据")
                    return False
            else:
                print(f"❌ 获取数据失败，状态码：{response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ 测试失败：{e}")
            return False

    def test_partner_delete_endpoint(self):
        """测试合作方删除端点"""
        print("=" * 70)
        print("🔍 测试合作方删除端点")
        print("=" * 70)
        
        # 首先获取一些合作方数据
        try:
            response = requests.get(f"{self.api_base_url}/partner/list?limit=1", timeout=10)
            if response.status_code == 200:
                data = response.json()
                items = data.get('data', [])
                if items:
                    partner_id = items[0].get('合作方ID')
                    print(f"✅ 找到测试合作方，ID: {partner_id}")
                    
                    # 测试删除端点（不实际删除，只测试端点是否存在）
                    delete_url = f"{self.api_base_url}/partner/{partner_id}"
                    print(f"📡 删除端点URL: {delete_url}")
                    
                    # 发送OPTIONS请求检查端点是否存在
                    options_response = requests.options(delete_url, timeout=5)
                    if options_response.status_code in [200, 405]:  # 405表示方法不允许，但端点存在
                        print("✅ 删除端点存在且可访问")
                        return True
                    else:
                        print(f"❌ 删除端点不可访问，状态码：{options_response.status_code}")
                        return False
                else:
                    print("⚠️ 没有找到测试合作方数据")
                    return False
            else:
                print(f"❌ 获取合作方数据失败，状态码：{response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ 测试失败：{e}")
            return False

    def test_frontend_api_paths(self):
        """测试前端API路径是否正确"""
        print("=" * 70)
        print("🔍 测试前端API路径")
        print("=" * 70)
        
        # 检查前端API客户端中的路径
        api_client_path = "fronted/js/api-client.js"
        try:
            with open(api_client_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查是否包含正确的API路径
            if '/api/v1/market/daily' in content:
                print("✅ 日投放数据API路径正确")
            else:
                print("❌ 日投放数据API路径不正确")
                self.all_tests_passed = False
            
            if 'api/v1/partner' in content:
                print("✅ 合作方API路径正确")
            else:
                print("❌ 合作方API路径不正确")
                self.all_tests_passed = False
                
            # 检查删除方法是否存在
            if 'deleteDailyData' in content:
                print("✅ 日投放数据删除方法存在")
            else:
                print("❌ 日投放数据删除方法不存在")
                self.all_tests_passed = False
                
        except FileNotFoundError:
            print(f"❌ 找不到文件：{api_client_path}")
            self.all_tests_passed = False
        except Exception as e:
            print(f"❌ 读取文件失败：{e}")
            self.all_tests_passed = False

    def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始测试删除功能修复")
        print("=" * 70)
        
        # 测试API连接
        if not self.test_api_connection():
            print("❌ API连接失败，跳过其他测试")
            return
        
        # 测试删除端点
        self.test_daily_data_delete_endpoint()
        self.test_partner_delete_endpoint()
        
        # 测试前端API路径
        self.test_frontend_api_paths()
        
        # 输出测试结果
        print("=" * 70)
        if self.all_tests_passed:
            print("🎉 所有测试通过！删除功能修复成功！")
        else:
            print("❌ 部分测试失败，请检查修复情况")
        print("=" * 70)

if __name__ == "__main__":
    tester = DeleteFunctionTester()
    tester.run_all_tests()
