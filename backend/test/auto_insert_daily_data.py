"""
自动化测试脚本 - 生成日投放数据登记记录

功能：
1. 生成50个日投放数据记录
2. 通过API自动保存到数据库
3. 验证保存结果

使用方法：
    python test/auto_insert_daily_data.py
"""

import sys
import io
# 设置标准输出编码为UTF-8，避免Windows下的编码问题
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import random
from datetime import datetime, timedelta
import json


class DailyDataAutoTester:
    """日投放数据自动测试类"""
    
    def __init__(self):
        self.api_base_url = "http://127.0.0.1:8000/api/v1/market"
        self.media_sources = [
            "百度推广", 
            "360推广", 
            "搜狗推广", 
            "中心来电", 
            "TQ", 
            "网络", 
            "其他网络"
        ]
        self.success_count = 0
        self.failed_count = 0
        self.failed_records = []
    
    def generate_random_data(self, date_str):
        """
        生成随机的投放数据
        
        Args:
            date_str: 日期字符串 (YYYY-MM-DD)
        
        Returns:
            dict: 投放数据字典
        """
        media_source = random.choice(self.media_sources)
        
        # 生成合理的数据（保持业务逻辑的合理性）
        展现量 = random.randint(5000, 50000)  # 5千到5万
        点击量 = int(展现量 * random.uniform(0.02, 0.08))  # 点击率2%-8%
        消费金额 = round(点击量 * random.uniform(2, 8), 2)  # 平均点击价格2-8元
        
        IP = int(点击量 * random.uniform(0.8, 0.95))  # IP略少于点击量
        PV = int(点击量 * random.uniform(1.0, 1.5))  # PV略多于点击量
        
        对话量 = int(点击量 * random.uniform(0.05, 0.15))  # 对话转化率5%-15%
        有效对话 = int(对话量 * random.uniform(0.7, 0.95))  # 有效对话70%-95%
        咨询量 = int(有效对话 * random.uniform(0.5, 0.8))  # 留电率50%-80%
        
        return {
            "日期": date_str,
            "媒体来源": media_source,
            "消费金额": 消费金额,
            "展现量": 展现量,
            "点击量": 点击量,
            "IP": IP,
            "PV": PV,
            "对话量": 对话量,
            "有效对话": 有效对话,
            "咨询量": 咨询量
        }
    
    def create_daily_data(self, data):
        """
        调用API创建日投放数据
        
        Args:
            data: 投放数据字典
        
        Returns:
            bool: 是否创建成功
        """
        try:
            url = f"{self.api_base_url}/daily"
            headers = {"Content-Type": "application/json"}
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                print(f"✅ 成功创建记录：{data['日期']} - {data['媒体来源']} - ¥{data['消费金额']}")
                self.success_count += 1
                return True
            else:
                error_msg = response.text
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', error_msg)
                except:
                    pass
                
                print(f"❌ 创建失败：{data['日期']} - {data['媒体来源']} - {error_msg}")
                self.failed_count += 1
                self.failed_records.append({
                    "data": data,
                    "error": error_msg,
                    "status_code": response.status_code
                })
                return False
                
        except Exception as e:
            print(f"❌ 请求异常：{data['日期']} - {data['媒体来源']} - {str(e)}")
            self.failed_count += 1
            self.failed_records.append({
                "data": data,
                "error": str(e),
                "status_code": None
            })
            return False
    
    def generate_date_range(self, days=50):
        """
        生成日期范围（从今天往前推）
        
        Args:
            days: 天数
        
        Returns:
            list: 日期字符串列表
        """
        today = datetime.now().date()
        dates = []
        
        for i in range(days):
            date = today - timedelta(days=i)
            dates.append(date.strftime('%Y-%m-%d'))
        
        return dates
    
    def run(self, record_count=50):
        """
        运行自动化测试
        
        Args:
            record_count: 要生成的记录数量
        """
        print("=" * 70)
        print("🚀 日投放数据自动化测试脚本")
        print("=" * 70)
        print(f"📊 目标：生成并保存 {record_count} 条日投放数据记录")
        print(f"🔗 API地址：{self.api_base_url}")
        print("=" * 70)
        print()
        
        # 测试API连接
        print("🔍 测试API连接...")
        try:
            response = requests.get(f"{self.api_base_url}/daily", timeout=5)
            if response.status_code == 200:
                print("✅ API连接正常")
            else:
                print(f"⚠️ API响应状态码：{response.status_code}")
        except Exception as e:
            print(f"❌ API连接失败：{e}")
            print("请确保后端服务已启动！")
            return
        
        print()
        print("=" * 70)
        print("📝 开始生成并保存数据...")
        print("=" * 70)
        print()
        
        # 生成日期范围
        dates = self.generate_date_range(record_count)
        
        # 生成并保存数据
        for i, date_str in enumerate(dates, 1):
            # 生成随机数据
            data = self.generate_random_data(date_str)
            
            # 显示进度
            print(f"[{i}/{record_count}] 正在处理 {date_str}...", end=" ")
            
            # 调用API保存
            self.create_daily_data(data)
        
        # 打印总结
        print()
        print("=" * 70)
        print("📊 测试完成统计")
        print("=" * 70)
        print(f"✅ 成功创建：{self.success_count} 条")
        print(f"❌ 创建失败：{self.failed_count} 条")
        print(f"📈 成功率：{(self.success_count / record_count * 100):.2f}%")
        print("=" * 70)
        
        # 如果有失败记录，显示详情
        if self.failed_records:
            print()
            print("❌ 失败记录详情：")
            print("-" * 70)
            for idx, record in enumerate(self.failed_records, 1):
                print(f"{idx}. 日期：{record['data']['日期']} - {record['data']['媒体来源']}")
                print(f"   错误：{record['error']}")
                print(f"   状态码：{record['status_code']}")
                print("-" * 70)
        
        print()
        print("=" * 70)
        print("✅ 测试完成！")
        print("=" * 70)
        
        # 验证数据
        self.verify_data()
    
    def verify_data(self):
        """验证数据是否保存成功"""
        print()
        print("🔍 验证数据保存情况...")
        print("-" * 70)
        
        try:
            # 获取最近30天的按日统计数据
            url = f"{self.api_base_url}/statistics/daily?天数=30"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                data_list = result.get('data', [])
                
                if data_list:
                    # 计算汇总统计
                    总记录数 = sum(item.get('记录数', 0) for item in data_list)
                    总消费金额 = sum(item.get('总消费金额', 0) for item in data_list)
                    总点击量 = sum(item.get('总点击量', 0) for item in data_list)
                    总对话量 = sum(item.get('总对话量', 0) for item in data_list)
                    总有效对话 = sum(item.get('总有效对话', 0) for item in data_list)
                    总咨询量 = sum(item.get('总咨询量', 0) for item in data_list)
                    
                    print("📊 最近30天统计汇总：")
                    print(f"   总记录数：{总记录数}")
                    print(f"   总消费金额：¥{总消费金额:,.2f}")
                    print(f"   总点击量：{总点击量:,}")
                    print(f"   总对话量：{总对话量:,}")
                    print(f"   总有效对话：{总有效对话:,}")
                    print(f"   总咨询量：{总咨询量:,}")
                    print(f"   按日统计记录数：{len(data_list)}")
                    
                    print()
                    print("✅ 数据验证完成！")
                else:
                    print("⚠️ 未获取到统计数据")
            else:
                print(f"⚠️ 获取统计数据失败，状态码：{response.status_code}")
                
        except Exception as e:
            print(f"❌ 验证失败：{e}")
        
        print("-" * 70)


def main():
    """主函数"""
    # 创建测试实例
    tester = DailyDataAutoTester()
    
    # 运行测试（生成50条记录）
    tester.run(record_count=50)


if __name__ == "__main__":
    main()

