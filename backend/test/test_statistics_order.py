"""
测试统计API的数据顺序和正确性

检查按日/周/月/年统计的数据排序是否正确
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json


def test_api(endpoint, params_str=""):
    """测试API并显示结果"""
    url = f"http://127.0.0.1:8000/api/v1/market/statistics/{endpoint}"
    if params_str:
        url += f"?{params_str}"
    
    print(f"\n{'='*70}")
    print(f"🔍 测试：{endpoint}")
    print(f"📡 URL：{url}")
    print('='*70)
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', [])
            
            print(f"✅ 状态码：{response.status_code}")
            print(f"📊 数据条数：{len(data)}")
            
            if len(data) > 0:
                print(f"\n前5条数据（检查排序）：")
                print('-'*70)
                
                for idx, item in enumerate(data[:5], 1):
                    if endpoint == 'daily':
                        print(f"{idx}. 日期：{item.get('日期')} - 消费：¥{item.get('总消费金额', 0):,.2f} - 点击：{item.get('总点击量', 0):,}")
                    elif endpoint == 'weekly':
                        print(f"{idx}. {item.get('开始日期')} 至 {item.get('结束日期')} - 消费：¥{item.get('总消费金额', 0):,.2f}")
                    elif endpoint == 'monthly':
                        print(f"{idx}. {item.get('月份')} - 消费：¥{item.get('总消费金额', 0):,.2f}")
                    elif endpoint == 'yearly':
                        print(f"{idx}. {item.get('年份')}年 - 消费：¥{item.get('总消费金额', 0):,.2f}")
                
                # 检查排序是否正确
                print(f"\n排序检查：")
                print('-'*70)
                
                if endpoint == 'daily':
                    dates = [item.get('日期') for item in data if item.get('日期')]
                    is_ascending = dates == sorted(dates)
                    is_descending = dates == sorted(dates, reverse=True)
                    
                    if is_ascending:
                        print("✅ 日期排序：升序（从旧到新）- 正确！")
                    elif is_descending:
                        print("⚠️ 日期排序：降序（从新到旧）- 图表会乱序！")
                    else:
                        print("❌ 日期排序：无序 - 需要修复！")
                    
                    print(f"   第一条：{dates[0] if dates else 'N/A'}")
                    print(f"   最后一条：{dates[-1] if dates else 'N/A'}")
                
                elif endpoint == 'weekly':
                    start_dates = [item.get('开始日期') for item in data if item.get('开始日期')]
                    is_ascending = start_dates == sorted(start_dates)
                    is_descending = start_dates == sorted(start_dates, reverse=True)
                    
                    if is_ascending:
                        print("✅ 周排序：升序（从旧到新）- 正确！")
                    elif is_descending:
                        print("⚠️ 周排序：降序（从新到旧）- 可能影响图表")
                    else:
                        print("❌ 周排序：无序 - 需要修复！")
                    
                    print(f"   第一周：{start_dates[0] if start_dates else 'N/A'}")
                    print(f"   最后一周：{start_dates[-1] if start_dates else 'N/A'}")
                
                elif endpoint == 'monthly':
                    months = [item.get('月份') for item in data if item.get('月份')]
                    is_ascending = months == sorted(months)
                    is_descending = months == sorted(months, reverse=True)
                    
                    if is_ascending:
                        print("✅ 月份排序：升序（从旧到新）- 正确！")
                    elif is_descending:
                        print("⚠️ 月份排序：降序（从新到旧）- 可能影响图表")
                    else:
                        print("❌ 月份排序：无序 - 需要修复！")
                    
                    print(f"   第一月：{months[0] if months else 'N/A'}")
                    print(f"   最后一月：{months[-1] if months else 'N/A'}")
                
                elif endpoint == 'yearly':
                    years = [str(item.get('年份')) for item in data if item.get('年份')]
                    is_ascending = years == sorted(years)
                    is_descending = years == sorted(years, reverse=True)
                    
                    if is_ascending:
                        print("✅ 年份排序：升序（从旧到新）- 正确！")
                    elif is_descending:
                        print("⚠️ 年份排序：降序（从新到旧）- 可能影响图表")
                    else:
                        print("❌ 年份排序：无序 - 需要修复！")
                    
                    print(f"   第一年：{years[0] if years else 'N/A'}")
                    print(f"   最后一年：{years[-1] if years else 'N/A'}")
                
                # 检查关键字段是否完整
                print(f"\n数据完整性检查：")
                print('-'*70)
                
                first_item = data[0]
                required_fields = ['总消费金额', '总点击量', '总对话量', '总有效对话', '总咨询量', '点击率', '留电率']
                
                missing_fields = [f for f in required_fields if f not in first_item]
                
                if not missing_fields:
                    print("✅ 所有必需字段都存在")
                    
                    # 检查是否有值
                    has_data = any(first_item.get(f, 0) != 0 for f in required_fields)
                    if has_data:
                        print("✅ 字段有实际数据（不是全0）")
                    else:
                        print("⚠️ 所有字段都是0（可能是数据库没有数据）")
                else:
                    print(f"❌ 缺少字段：{', '.join(missing_fields)}")
                
            else:
                print("⚠️ 返回数据为空")
        else:
            print(f"❌ 请求失败，状态码：{response.status_code}")
            print(f"   错误信息：{response.text[:200]}")
    
    except Exception as e:
        print(f"❌ 请求异常：{e}")


def main():
    """主测试函数"""
    print("\n" + "="*70)
    print("📊 统计API数据顺序和正确性测试")
    print("="*70)
    
    # 测试各个统计API
    test_api('daily', '天数=7')
    test_api('weekly', '周数=4')
    test_api('monthly', '月数=6')
    test_api('yearly', '年数=3')
    
    print("\n" + "="*70)
    print("✅ 测试完成！")
    print("="*70)
    print("\n💡 建议：")
    print("   - 如果按日统计是降序，需要修改为升序（ASC）")
    print("   - 按周/月/年如果是升序，图表应该正常")
    print("   - 检查前端图表横轴是否按时间顺序显示")
    print()


if __name__ == "__main__":
    main()

