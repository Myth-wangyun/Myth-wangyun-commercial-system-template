#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单删除功能测试
"""

import sys
import io
import requests
import json

# 设置标准输出编码为UTF-8，避免Windows下的编码问题
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_delete_functions():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    print("🔍 测试删除功能")
    print("=" * 50)
    
    # 测试日投放数据删除
    print("1. 测试日投放数据删除端点")
    try:
        # 获取一条数据
        response = requests.get(f"{base_url}/market/daily?limit=1")
        if response.status_code == 200:
            data = response.json()
            items = data.get('data', [])
            if items:
                record_id = items[0].get('明细ID')
                print(f"   找到记录ID: {record_id}")
                
                # 尝试删除
                delete_response = requests.delete(f"{base_url}/market/daily/{record_id}")
                print(f"   删除请求状态码: {delete_response.status_code}")
                if delete_response.status_code == 200:
                    print("   ✅ 删除成功")
                else:
                    print(f"   ❌ 删除失败: {delete_response.text}")
            else:
                print("   ⚠️ 没有找到数据")
        else:
            print(f"   ❌ 获取数据失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 测试失败: {e}")
    
    print()
    
    # 测试合作方删除
    print("2. 测试合作方删除端点")
    try:
        # 获取一条合作方数据
        response = requests.get(f"{base_url}/partner/list?limit=1")
        if response.status_code == 200:
            data = response.json()
            items = data.get('data', [])
            if items:
                partner_id = items[0].get('合作方ID')
                print(f"   找到合作方ID: {partner_id}")
                
                # 尝试删除
                delete_response = requests.delete(f"{base_url}/partner/{partner_id}")
                print(f"   删除请求状态码: {delete_response.status_code}")
                if delete_response.status_code == 200:
                    print("   ✅ 删除成功")
                else:
                    print(f"   ❌ 删除失败: {delete_response.text}")
            else:
                print("   ⚠️ 没有找到合作方数据")
        else:
            print(f"   ❌ 获取合作方数据失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 测试失败: {e}")

if __name__ == "__main__":
    test_delete_functions()
