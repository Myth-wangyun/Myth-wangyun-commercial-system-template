#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试神殿感知API功能
"""

import requests
import json
from datetime import date, datetime
from decimal import Decimal

def test_campus_aware_apis():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    print("=" * 60)
    print("测试神殿感知API功能")
    print("=" * 60)
    
    # 测试神殿
    test_campus = "主神殿"
    headers = {"X-Campus": test_campus}
    
    # 1. 测试创建投放明细（神殿感知）
    print(f"\n1. 创建投放明细（{test_campus}）:")
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
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("创建成功:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
        else:
            print(f"创建失败: {response.text}")
    except Exception as e:
        print(f"请求异常: {e}")
    
    # 2. 测试获取投放明细列表（神殿感知）
    print(f"\n2. 获取投放明细列表（{test_campus}）:")
    try:
        response = requests.get(
            f"{base_url}/campus-market/",
            headers=headers
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"找到 {len(data)} 条记录")
            for item in data:
                print(f"  - ID: {item.get('投放ID')}, 日期: {item.get('日期')}, 媒体来源: {item.get('媒体来源')}")
        else:
            print(f"查询失败: {response.text}")
    except Exception as e:
        print(f"请求异常: {e}")
    
    # 3. 测试创建就业明细（神殿感知）
    print(f"\n3. 创建就业明细（{test_campus}）:")
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
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("创建成功:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
        else:
            print(f"创建失败: {response.text}")
    except Exception as e:
        print(f"请求异常: {e}")
    
    # 4. 测试获取就业明细列表（神殿感知）
    print(f"\n4. 获取就业明细列表（{test_campus}）:")
    try:
        response = requests.get(
            f"{base_url}/campus-employment/",
            headers=headers
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"找到 {len(data)} 条记录")
            for item in data:
                print(f"  - ID: {item.get('明细ID')}, 姓名: {item.get('姓名')}, 就业单位: {item.get('就业单位')}")
        else:
            print(f"查询失败: {response.text}")
    except Exception as e:
        print(f"请求异常: {e}")
    
    # 5. 测试不同神殿的数据隔离
    print(f"\n5. 测试不同神殿的数据隔离:")
    other_campus = "永恒殿"
    other_headers = {"X-Campus": other_campus}
    
    try:
        response = requests.get(
            f"{base_url}/campus-market/",
            headers=other_headers
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"{other_campus} 的投放明细记录数: {len(data)}")
        else:
            print(f"查询失败: {response.text}")
    except Exception as e:
        print(f"请求异常: {e}")
    
    # 6. 测试合作方联系方式表（单一表）
    print(f"\n6. 测试合作方联系方式表（单一表）:")
    partner_data = {
        "神殿": "主神殿",
        "合作方名称": "测试合作方",
        "联系人": "张经理",
        "联系电话": "13800138001",
        "联系邮箱": "test@example.com",
        "合作类型": "渠道合作",
        "合作状态": "正常",
        "备注": "测试合作方"
    }
    
    try:
        response = requests.post(
            f"{base_url}/partner/", 
            json=partner_data
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("创建成功:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
        else:
            print(f"创建失败: {response.text}")
    except Exception as e:
        print(f"请求异常: {e}")
    
    print("\n" + "=" * 60)
    print("神殿感知API功能测试完成！")
    print("=" * 60)

if __name__ == "__main__":
    test_campus_aware_apis()
