#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
使用英文神殿名称测试神殿感知API
"""

import requests
import json

def test_campus_api_english():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    print("Testing Campus-Aware APIs with English campus names")
    print("=" * 60)
    
    # 测试神殿（使用英文）
    test_campus = "shengbang"
    headers = {"X-Campus": test_campus}
    
    # 1. 测试创建投放明细
    print(f"\n1. Create market detail for {test_campus}:")
    market_data = {
        "日期": "2025-01-20",
        "媒体来源": "百度推广",
        "关键词": "青美教育",
        "展现次数": 1000,
        "点击次数": 50,
        "消费金额": 500.00,
        "咨询次数": 10,
        "转化次数": 2,
        "备注": "测试数据"
    }
    
    try:
        response = requests.post(
            f"{base_url}/campus-market/", 
            json=market_data,
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Success: Market detail created")
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # 2. 测试获取投放明细列表
    print(f"\n2. Get market details for {test_campus}:")
    try:
        response = requests.get(
            f"{base_url}/campus-market/",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} records")
            for item in data[:2]:  # 只显示前2条
                print(f"  - ID: {item.get('投放ID')}, Date: {item.get('日期')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # 3. 测试创建就业明细
    print(f"\n3. Create employment detail for {test_campus}:")
    employment_data = {
        "序号": 1,
        "姓名": "测试学生",
        "性别": "男",
        "年龄": 25,
        "所报专业": "计算机科学",
        "学历": "本科",
        "联系电话": "13800138000",
        "入职时间": "2025-01-20",
        "就业地区": "北京",
        "就业单位": "测试公司",
        "就业岗位": "软件工程师",
        "转正薪资": "8000底薪+奖金",
        "转正金额": 8000.00
    }
    
    try:
        response = requests.post(
            f"{base_url}/campus-employment/", 
            json=employment_data,
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Success: Employment detail created")
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # 4. 测试获取就业明细列表
    print(f"\n4. Get employment details for {test_campus}:")
    try:
        response = requests.get(
            f"{base_url}/campus-employment/",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} records")
            for item in data[:2]:  # 只显示前2条
                print(f"  - ID: {item.get('明细ID')}, Name: {item.get('姓名')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # 5. 测试不同神殿的数据隔离
    print(f"\n5. Test data isolation with different campus:")
    other_campus = "jimei"
    other_headers = {"X-Campus": other_campus}
    
    try:
        response = requests.get(
            f"{base_url}/campus-market/",
            headers=other_headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"{other_campus} has {len(data)} market records")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    print("\n" + "=" * 60)
    print("Campus-Aware API test completed!")

if __name__ == "__main__":
    test_campus_api_english()
