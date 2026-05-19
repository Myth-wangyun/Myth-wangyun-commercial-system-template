import requests

# 测试获取列表
print("=== 测试获取数据列表 ===")
r = requests.get('http://127.0.0.1:8000/api/v1/market/daily?limit=10')
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"Total: {data.get('total', 0)}")
    print(f"Records count: {len(data.get('data', []))}")
    if data.get('data'):
        first = data['data'][0]
        print(f"First record ID: {first.get('明细ID')}")

# 测试删除（如果还有记录的话）
print("\n=== 测试删除API ===")
if r.status_code == 200 and data.get('data'):
    test_id = data['data'][0].get('明细ID')
    print(f"Trying to delete ID: {test_id}")
    r2 = requests.delete(f'http://127.0.0.1:8000/api/v1/market/daily/{test_id}')
    print(f"Delete Status: {r2.status_code}")
    print(f"Delete Response: {r2.text}")
else:
    print("No records to delete")


