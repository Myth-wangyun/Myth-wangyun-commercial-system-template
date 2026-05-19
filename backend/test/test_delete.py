#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def test_delete_api():
    """测试删除API"""
    base_url = "http://127.0.0.1:8000"
    
    # 1. 先获取数据列表，看看有什么记录
    print("=== 获取数据列表 ===")
    try:
        response = requests.get(f"{base_url}/api/v1/market/daily?limit=5")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"返回数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            # 检查是否有记录
            if data.get('data') and len(data['data']) > 0:
                first_record = data['data'][0]
                record_id = first_record.get('明细ID')
                print(f"\n第一个记录的ID: {record_id}")
                
                # 2. 测试删除这个记录
                print(f"\n=== 测试删除记录 {record_id} ===")
                delete_response = requests.delete(f"{base_url}/api/v1/market/daily/{record_id}")
                print(f"删除状态码: {delete_response.status_code}")
                print(f"删除响应: {delete_response.text}")
                
                # 3. 再次获取列表，确认删除
                print(f"\n=== 删除后重新获取列表 ===")
                response2 = requests.get(f"{base_url}/api/v1/market/daily?limit=5")
                if response2.status_code == 200:
                    data2 = response2.json()
                    print(f"删除后数据: {json.dumps(data2, indent=2, ensure_ascii=False)}")
            else:
                print("没有找到任何记录")
        else:
            print(f"获取列表失败: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    test_delete_api()
