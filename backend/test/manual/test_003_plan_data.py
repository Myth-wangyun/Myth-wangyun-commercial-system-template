"""
测试003表计划数据的保存和汇总功能
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1/consult/consultant-data-summary-v3"
LOGIN_URL = "http://localhost:8000/api/v1/auth/login"

# 测试账户
USERNAME = "admin"
PASSWORD = "qingmeijiaoyu123.."

def login():
    """登录获取token"""
    # 使用form data格式登录
    response = requests.post(LOGIN_URL, data={
        "username": USERNAME,
        "password": PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None

def save_plan_data(token, campus, year, month, consultant, plan_income, plan_enrollment, data_type):
    """保存计划数据"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "campus": campus,
        "year": year,
        "month": month,
        "consultant": consultant,
        "plan_income": plan_income,
        "plan_enrollment": plan_enrollment,
        "data_type": data_type
    }
    response = requests.post(f"{BASE_URL}/save-plan", json=data, headers=headers)
    return response.json()

def get_full_data(token, campus, year):
    """获取完整数据"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/full-data", params={"campus": campus, "year": year}, headers=headers)
    return response.json()

def test_plan_data_flow():
    """测试计划数据流"""
    print("=" * 80)
    print("Test 003 Plan Data Save and Aggregation")
    print("=" * 80)

    # 1. 登录
    print("\n[1] Login...")
    token = login()
    if not token:
        print("[FAIL] Login failed, test aborted")
        return
    print("[OK] Login successful")

    # 2. 测试数据
    campus = "主神殿"  # 使用实际存在的神殿
    year = 2026
    consultant = "测试咨询师"

    # 3. 保存网络类型的计划数据（TAB2 子表3）
    print(f"\n[2] Save network plan data...")
    print(f"   Campus: {campus}, Year: {year}, Consultant: {consultant}")

    # 保存1月到3月的数据
    for month in range(1, 4):
        result = save_plan_data(
            token, campus, year, month, consultant,
            plan_income=10000 * month,
            plan_enrollment=5 * month,
            data_type="SEM"
        )
        print(f"   Month {month} SEM: {result}")

    # 4. 保存渠道类型的计划数据（TAB3 子表3）
    print(f"\n[3] Save channel plan data...")
    for month in range(1, 4):
        result = save_plan_data(
            token, campus, year, month, consultant,
            plan_income=8000 * month,
            plan_enrollment=4 * month,
            data_type="渠道"
        )
        print(f"   Month {month} Channel: {result}")

    # 5. 保存口碑类型的计划数据（TAB4 子表3）
    print(f"\n[4] Save koubei plan data...")
    for month in range(1, 4):
        result = save_plan_data(
            token, campus, year, month, consultant,
            plan_income=6000 * month,
            plan_enrollment=3 * month,
            data_type="口碑"
        )
        print(f"   Month {month} Koubei: {result}")

    # 6. 获取完整数据并验证汇总
    print(f"\n[5] Get full data and verify aggregation...")
    full_data = get_full_data(token, campus, year)

    # 验证TAB2（网络）子表3的月度数据
    print(f"\n[6] Verify TAB2 (Network) monthly data:")
    tab2_monthly = full_data.get("tab2_network_monthly_rows", [])
    found = False
    for row in tab2_monthly:
        if row.get("咨询师") == consultant:
            found = True
            month_str = row.get('月份', '')
            plan_income = row.get('网络媒体', {}).get('计划收入', 0)
            plan_enrollment = row.get('网络媒体', {}).get('计划招生', 0)
            print(f"   {month_str} {consultant}: income={plan_income}, enrollment={plan_enrollment}")

    if not found:
        print(f"   [WARN] No data found for consultant: {consultant}")

    # 验证TAB2年度汇总
    print(f"\n[7] Verify TAB2 (Network) annual aggregation:")
    tab2_annual = full_data.get("tab2_network_annual_rows", [])
    for row in tab2_annual:
        if row.get("咨询师") == consultant:
            plan_income = row.get('网络媒体', {}).get('计划收入', 0)
            plan_enrollment = row.get('网络媒体', {}).get('计划招生', 0)
            print(f"   {consultant}: income={plan_income}, enrollment={plan_enrollment}")
            print(f"   Expected: income=60000 (10k+20k+30k), enrollment=30 (5+10+15)")

    print("\n" + "=" * 80)
    print("Test completed")
    print("=" * 80)

if __name__ == "__main__":
    test_plan_data_flow()
