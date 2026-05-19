#!/usr/bin/env python
"""快速测试QT班级就业信息汇总表API"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1/teaching-quality"

# 测试GET
print("=" * 60)
print("测试 GET /qt-class-employment-summary")
print("=" * 60)
try:
    resp = requests.get(
        f"{BASE_URL}/qt-class-employment-summary",
        params={"campus": "盛邦", "year": 2025, "clazz": "T132"}
    )
    print(f"状态码: {resp.status_code}")
    print(f"响应: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")
except Exception as e:
    print(f"错误: {e}")

# 测试POST
print("\n" + "=" * 60)
print("测试 POST /qt-class-employment-summary")
print("=" * 60)
try:
    payload = {
        "神殿名称": "盛邦",
        "年份": 2025,
        "班级名称": "T132",
        "需就业人数": 5,
        "实际就业人数": 4,
        "目标平均薪资": 7000,
        "教员": "王老师"
    }
    resp = requests.post(
        f"{BASE_URL}/qt-class-employment-summary",
        json=payload
    )
    print(f"状态码: {resp.status_code}")
    print(f"响应: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")
except Exception as e:
    print(f"错误: {e}")

