"""
生成真实的市场投放数据

时间范围：2025年9月1日 到 2025年10月15日（45天）
数据特点：
1. 工作日和周末数据不同
2. 每天有2-4个不同媒体来源的记录
3. 数据符合实际业务规律
4. 包含一些波动和趋势
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import random
from datetime import datetime, timedelta
import json


class RealisticDataGenerator:
    """真实数据生成器"""
    
    def __init__(self):
        self.api_base_url = "http://127.0.0.1:8000/api/v1/market"
        
        # 主要媒体来源及其权重（模拟实际投放比例）
        self.media_config = {
            "百度推广": {
                "权重": 0.30,  # 30%的投放
                "日消费范围": (3000, 8000),
                "展现量范围": (20000, 60000),
                "点击率范围": (0.03, 0.06),  # 3%-6%
                "平均点击价格": (3, 6)
            },
            "360推广": {
                "权重": 0.25,
                "日消费范围": (2000, 6000),
                "展现量范围": (15000, 50000),
                "点击率范围": (0.025, 0.055),
                "平均点击价格": (2.5, 5.5)
            },
            "搜狗推广": {
                "权重": 0.15,
                "日消费范围": (1000, 4000),
                "展现量范围": (10000, 40000),
                "点击率范围": (0.02, 0.05),
                "平均点击价格": (2, 5)
            },
            "中心来电": {
                "权重": 0.20,
                "日消费范围": (500, 2000),
                "展现量范围": (0, 0),  # 来电没有展现量
                "点击率范围": (0, 0),
                "平均点击价格": (0, 0)
            },
            "其他网络": {
                "权重": 0.10,
                "日消费范围": (500, 3000),
                "展现量范围": (5000, 30000),
                "点击率范围": (0.02, 0.05),
                "平均点击价格": (2, 4)
            }
        }
        
        self.success_count = 0
        self.failed_count = 0
        self.failed_records = []
    
    def is_weekend(self, date):
        """判断是否是周末"""
        return date.weekday() >= 5  # Saturday=5, Sunday=6
    
    def is_holiday(self, date):
        """判断是否是节假日（简化版，实际可以用更完整的节假日库）"""
        # 2025年中秋节：9月6日
        # 2025年国庆节：10月1-7日
        holidays = [
            datetime(2025, 9, 6).date(),  # 中秋
            datetime(2025, 10, 1).date(),  # 国庆
            datetime(2025, 10, 2).date(),
            datetime(2025, 10, 3).date(),
            datetime(2025, 10, 4).date(),
            datetime(2025, 10, 5).date(),
            datetime(2025, 10, 6).date(),
            datetime(2025, 10, 7).date(),
        ]
        return date in holidays
    
    def get_day_factor(self, date):
        """
        获取日期系数（影响投放量）
        工作日系数：1.0
        周末系数：0.6
        节假日系数：0.4
        """
        if self.is_holiday(date):
            return 0.4
        elif self.is_weekend(date):
            return 0.6
        else:
            return 1.0
    
    def generate_realistic_record(self, date, media_source, config):
        """
        生成真实的投放数据记录
        
        Args:
            date: 日期
            media_source: 媒体来源
            config: 该媒体的配置
        
        Returns:
            dict: 投放数据
        """
        day_factor = self.get_day_factor(date)
        
        # 添加一些随机波动（±20%）
        波动系数 = random.uniform(0.8, 1.2)
        最终系数 = day_factor * 波动系数
        
        # 生成消费金额
        消费范围 = config["日消费范围"]
        消费金额 = round(random.uniform(消费范围[0], 消费范围[1]) * 最终系数, 2)
        
        # 生成展现量
        展现范围 = config["展现量范围"]
        if 展现范围[0] == 0 and 展现范围[1] == 0:
            # 中心来电没有展现量
            展现量 = 0
            点击量 = 0
            IP = 0
            PV = 0
            # 中心来电的对话量直接基于消费金额
            对话量 = max(1, int(消费金额 / random.uniform(15, 30)))
        else:
            展现量 = int(random.uniform(展现范围[0], 展现范围[1]) * 最终系数)
            
            # 生成点击量（基于点击率）
            点击率范围 = config["点击率范围"]
            点击率 = random.uniform(点击率范围[0], 点击率范围[1])
            点击量 = int(展现量 * 点击率)
            
            # 调整消费金额以匹配点击单价
            价格范围 = config["平均点击价格"]
            平均点击价格 = random.uniform(价格范围[0], 价格范围[1])
            消费金额 = round(点击量 * 平均点击价格, 2)
            
            # IP和PV
            IP = int(点击量 * random.uniform(0.85, 0.95))
            PV = int(点击量 * random.uniform(1.1, 1.4))
            
            # 对话量（对话转化率5%-12%）
            对话转化率 = random.uniform(0.05, 0.12)
            对话量 = max(1, int(点击量 * 对话转化率))
        
        # 有效对话（有效率75%-90%）
        有效对话率 = random.uniform(0.75, 0.90)
        有效对话 = max(1, int(对话量 * 有效对话率))
        
        # 咨询量（留电率55%-75%）
        留电率 = random.uniform(0.55, 0.75)
        咨询量 = max(1, int(有效对话 * 留电率))
        
        return {
            "日期": date.strftime('%Y-%m-%d'),
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
    
    def select_media_for_day(self, date):
        """
        为某一天选择要投放的媒体来源
        工作日：2-4个媒体
        周末：1-2个媒体
        节假日：0-2个媒体
        """
        if self.is_holiday(date):
            # 节假日：可能不投放或少量投放
            count = random.choices([0, 1, 2], weights=[0.3, 0.5, 0.2])[0]
        elif self.is_weekend(date):
            # 周末：1-2个媒体
            count = random.choices([1, 2], weights=[0.6, 0.4])[0]
        else:
            # 工作日：2-4个媒体
            count = random.choices([2, 3, 4], weights=[0.3, 0.5, 0.2])[0]
        
        if count == 0:
            return []
        
        # 根据权重选择媒体
        media_list = list(self.media_config.keys())
        weights = [self.media_config[m]["权重"] for m in media_list]
        
        selected = []
        for _ in range(count):
            # 避免重复选择
            available_media = [m for m in media_list if m not in selected]
            if not available_media:
                break
            
            available_weights = [self.media_config[m]["权重"] for m in available_media]
            media = random.choices(available_media, weights=available_weights)[0]
            selected.append(media)
        
        return selected
    
    def create_daily_data(self, data):
        """调用API创建数据"""
        try:
            url = f"{self.api_base_url}/daily"
            headers = {"Content-Type": "application/json"}
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                self.success_count += 1
                return True
            else:
                # 如果是409（重复），不算失败
                if response.status_code == 409:
                    print(f"  ⏭️ 跳过重复记录")
                else:
                    self.failed_count += 1
                    error_msg = response.text[:100]
                    print(f"  ❌ 失败：{error_msg}")
                return False
                
        except Exception as e:
            self.failed_count += 1
            print(f"  ❌ 异常：{str(e)[:100]}")
            return False
    
    def run(self, start_date_str, end_date_str):
        """
        生成指定时间范围的数据
        
        Args:
            start_date_str: 开始日期（YYYY-MM-DD）
            end_date_str: 结束日期（YYYY-MM-DD）
        """
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        total_days = (end_date - start_date).days + 1
        
        print("="*70)
        print("🎯 真实市场投放数据生成器")
        print("="*70)
        print(f"📅 时间范围：{start_date} 到 {end_date}（{total_days}天）")
        print(f"🔗 API地址：{self.api_base_url}")
        print("="*70)
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
        print("="*70)
        print("📝 开始生成数据...")
        print("="*70)
        print()
        
        current_date = start_date
        day_number = 1
        total_records = 0
        
        while current_date <= end_date:
            # 判断日期类型
            day_type = "节假日" if self.is_holiday(current_date) else \
                      "周末" if self.is_weekend(current_date) else "工作日"
            
            # 选择当天投放的媒体
            selected_media = self.select_media_for_day(current_date)
            
            if not selected_media:
                print(f"[{day_number}/{total_days}] {current_date} ({day_type}) - 🚫 不投放")
            else:
                print(f"[{day_number}/{total_days}] {current_date} ({day_type}) - {len(selected_media)}个媒体")
                
                # 为每个媒体生成数据
                for media in selected_media:
                    config = self.media_config[media]
                    data = self.generate_realistic_record(current_date, media, config)
                    
                    print(f"  📊 {media:8s} - ", end="")
                    
                    # 保存数据
                    if self.create_daily_data(data):
                        print(f"✅ ¥{data['消费金额']:>8,.2f} | 点击:{data['点击量']:>5,} | 对话:{data['对话量']:>3}")
                        total_records += 1
            
            current_date += timedelta(days=1)
            day_number += 1
        
        # 打印总结
        print()
        print("="*70)
        print("📊 数据生成完成统计")
        print("="*70)
        print(f"📅 时间范围：{start_date} 到 {end_date}（{total_days}天）")
        print(f"📝 尝试创建：{total_records} 条记录")
        print(f"✅ 成功创建：{self.success_count} 条")
        print(f"❌ 创建失败：{self.failed_count} 条")
        print(f"📈 成功率：{(self.success_count / total_records * 100) if total_records > 0 else 0:.2f}%")
        print("="*70)
        
        # 验证数据
        self.verify_data(start_date, end_date)
    
    def verify_data(self, start_date, end_date):
        """验证生成的数据"""
        print()
        print("🔍 验证数据质量...")
        print("-"*70)
        
        try:
            # 计算天数
            days = (end_date - start_date).days + 1
            
            # 获取按日统计
            url = f"{self.api_base_url}/statistics/daily?天数={days}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                data_list = result.get('data', [])
                
                # 筛选指定日期范围的数据
                filtered_data = [
                    item for item in data_list 
                    if start_date.strftime('%Y-%m-%d') <= item.get('日期', '') <= end_date.strftime('%Y-%m-%d')
                ]
                
                if filtered_data:
                    # 计算统计
                    总记录数 = sum(item.get('记录数', 0) for item in filtered_data)
                    总消费金额 = sum(item.get('总消费金额', 0) for item in filtered_data)
                    总点击量 = sum(item.get('总点击量', 0) for item in filtered_data)
                    总对话量 = sum(item.get('总对话量', 0) for item in filtered_data)
                    总有效对话 = sum(item.get('总有效对话', 0) for item in filtered_data)
                    总咨询量 = sum(item.get('总咨询量', 0) for item in filtered_data)
                    
                    # 计算平均指标
                    平均点击率 = (总点击量 / sum(item.get('总展现量', 1) for item in filtered_data) * 100) if sum(item.get('总展现量', 0) for item in filtered_data) > 0 else 0
                    平均留电率 = (总咨询量 / 总有效对话 * 100) if 总有效对话 > 0 else 0
                    平均对话转化率 = (总对话量 / 总点击量 * 100) if 总点击量 > 0 else 0
                    
                    print(f"📊 指定范围统计汇总（{start_date} 至 {end_date}）：")
                    print(f"   📅 有数据的天数：{len(filtered_data)} 天")
                    print(f"   📝 总记录数：{总记录数} 条")
                    print(f"   💰 总消费金额：¥{总消费金额:,.2f}")
                    print(f"   🖱️ 总点击量：{总点击量:,}")
                    print(f"   💬 总对话量：{总对话量:,}")
                    print(f"   ✅ 总有效对话：{总有效对话:,}")
                    print(f"   📞 总咨询量：{总咨询量:,}")
                    print()
                    print(f"   📈 平均点击率：{平均点击率:.2f}%")
                    print(f"   📈 平均对话转化率：{平均对话转化率:.2f}%")
                    print(f"   📈 平均留电率：{平均留电率:.2f}%")
                    print()
                    
                    # 数据分布
                    print("📊 数据分布情况：")
                    工作日数据 = [d for d in filtered_data if not self.is_weekend(datetime.strptime(d['日期'], '%Y-%m-%d').date()) and not self.is_holiday(datetime.strptime(d['日期'], '%Y-%m-%d').date())]
                    周末数据 = [d for d in filtered_data if self.is_weekend(datetime.strptime(d['日期'], '%Y-%m-%d').date())]
                    
                    print(f"   工作日：{len(工作日数据)} 天")
                    print(f"   周末：{len(周末数据)} 天")
                    
                    # 排序检查
                    dates = [item.get('日期') for item in data_list if item.get('日期')]
                    if dates == sorted(dates):
                        print(f"\n   ✅ 数据排序：升序（从旧到新）- 正确！")
                    elif dates == sorted(dates, reverse=True):
                        print(f"\n   ⚠️ 数据排序：降序（从新到旧）- 需要重启后端服务！")
                    
                    print()
                    print("✅ 数据验证完成！")
                else:
                    print("⚠️ 指定范围内没有数据")
            else:
                print(f"⚠️ 获取统计失败，状态码：{response.status_code}")
        
        except Exception as e:
            print(f"❌ 验证失败：{e}")
        
        print("-"*70)


def main():
    """主函数"""
    print()
    print("🚀 启动真实数据生成器")
    print()
    
    generator = RealisticDataGenerator()
    
    # 生成2025年9月1日到10月15日的数据
    generator.run(
        start_date_str="2025-09-01",
        end_date_str="2025-10-15"
    )
    
    print()
    print("="*70)
    print("💡 提示")
    print("="*70)
    print("1. 数据已生成，现在可以在前端查看统计图表")
    print("2. 访问：http://localhost:3000")
    print("3. 点击：市场 → 统计分析 → 按日统计")
    print("4. 如果图表横轴仍然乱序，请重启后端服务")
    print("="*70)
    print()


if __name__ == "__main__":
    main()

