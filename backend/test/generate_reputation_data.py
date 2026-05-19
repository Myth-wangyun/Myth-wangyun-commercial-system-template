"""
生成口碑来源的咨询量测试数据

用于测试口碑子表的展示效果，包含：
1. 各种口碑子来源（市场口碑、咨询口碑、教质口碑、教学口碑、校园口碑、总部口碑、其他口碑）
2. 口碑提供人字段
3. 各种状态（上门、报名、订座等）
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import random
from datetime import datetime, timedelta
import json


class ReputationDataGenerator:
    """口碑数据生成器"""
    
    def __init__(self, campus: str = "河北慈悲殿"):
        self.api_base_url = "http://127.0.0.1:8000/api/v1/consult"
        self.campus = campus
        
        # 神殿列表
        self.campuses = [
            "河北主神殿",
            "河北永恒殿", 
            "河北慈悲殿",
            "山西李大殿",
            "山西智慧阁",
            "山西光明殿",
            "广西神恩殿",
            "广西天威殿"
        ]
        
        # 口碑子来源配置
        self.reputation_sources = [
            "市场口碑",
            "咨询口碑", 
            "教质口碑",
            "教学口碑",
            "校园口碑",
            "总部口碑",
            "其他口碑"
        ]
        
        # 口碑提供人名单（模拟真实员工）
        self.reputation_providers = [
            "张三", "李四", "王五", "赵六", "钱七",
            "孙八", "周九", "吴十", "郑十一", "王晓明",
            "李小红", "张伟", "刘芳", "陈静", "杨勇",
            "黄丽", "赵敏", "周杰", "吴雪", "郑涛"
        ]
        
        # 咨询师列表
        self.consultants = [
            "张咨询", "李咨询", "王咨询", "赵咨询", "钱咨询"
        ]
        
        # 分量人列表
        self.distributors = [
            "分量员A", "分量员B", "分量员C"
        ]
        
        # 姓氏列表（用于生成随机姓名）
        self.last_names = ["张", "李", "王", "赵", "钱", "孙", "周", "吴", "郑", "陈", 
                          "刘", "杨", "黄", "胡", "林", "何", "高", "马", "罗", "郭"]
        self.first_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋",
                           "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "华", "丹"]
        
        # 学历
        self.educations = ["初中", "高中", "中专", "大专", "本科"]
        
        # 报名意向
        self.intentions = ["美发", "美甲", "化妆", "美容", "纹绣", "形象设计"]
        
        # 咨询类别
        self.consult_categories = ["就业", "创业", "兴趣"]
        
        # 状态
        self.statuses = ["待跟进", "跟进中", "意向强", "意向弱"]
        
        # 长期短期
        self.term_types = ["长期", "短期", "学三", "学二"]
        
        self.success_count = 0
        self.failed_count = 0
        
    def generate_phone(self):
        """生成随机手机号"""
        prefixes = ["130", "131", "132", "133", "134", "135", "136", "137", "138", "139",
                   "150", "151", "152", "153", "155", "156", "157", "158", "159",
                   "180", "181", "182", "183", "185", "186", "187", "188", "189"]
        return random.choice(prefixes) + "".join([str(random.randint(0, 9)) for _ in range(8)])
    
    def generate_name(self):
        """生成随机姓名"""
        return random.choice(self.last_names) + random.choice(self.first_names)
    
    def generate_record(self, register_date: datetime):
        """
        生成单条口碑咨询记录
        
        Args:
            register_date: 登记日期
        """
        # 随机决定状态
        is_visit = random.random() < 0.45  # 45%上门率
        is_enrolled = is_visit and random.random() < 0.35  # 上门后35%报名率
        is_booked = is_visit and not is_enrolled and random.random() < 0.2  # 20%订座
        
        # 选择口碑来源（媒体来源）
        media_source = random.choice(self.reputation_sources)
        
        # 选择口碑提供人
        provider = random.choice(self.reputation_providers)
        
        # 长期短期（报名时才有）
        term_type = random.choice(self.term_types) if is_enrolled else None
        
        # 基础数据
        record = {
            "登记日期": register_date.strftime("%Y-%m-%dT%H:%M:%S"),
            "咨询者姓名": self.generate_name(),
            "电话": self.generate_phone(),
            "年龄": str(random.randint(16, 35)),
            "性别": random.choice(["男", "女"]),
            "学历": random.choice(self.educations),
            "位置": f"{random.choice(['河北', '山西', '河南', '山东'])}省{random.choice(['石家庄', '保定', '邯郸', '太原', '郑州', '济南'])}市",
            "报名意向": random.choice(self.intentions),
            "咨询类别": random.choice(self.consult_categories),
            "量来源": "口碑",  # 固定为口碑
            "媒体来源": media_source,
            "口碑提供人": provider,
            "分量人": random.choice(self.distributors),
            "咨询师": random.choice(self.consultants),
            "状态": random.choice(self.statuses),
            "神殿": self.campus,
            "录量人": "系统生成",
            "备注": f"口碑来源: {media_source}, 介绍人: {provider}",
            
            # 上门相关
            "是否上门": 1 if is_visit else 0,
            "上门时间": (register_date + timedelta(days=random.randint(1, 5))).strftime("%Y-%m-%dT%H:%M:%S") if is_visit else None,
            
            # 报名相关
            "是否报名": 1 if is_enrolled else 0,
            "报名时间": (register_date + timedelta(days=random.randint(2, 10))).strftime("%Y-%m-%dT%H:%M:%S") if is_enrolled else None,
            "长期短期": term_type,
            "课程": random.choice(self.intentions) if is_enrolled else None,
            "全款": random.choice([5000, 8000, 10000, 15000, 20000]) if is_enrolled and random.random() < 0.6 else 0,
            "分期": random.choice([3000, 5000, 8000]) if is_enrolled and random.random() < 0.3 else 0,
            "缴费金额": random.choice([5000, 8000, 10000, 15000]) if is_enrolled else 0,
            
            # 订座相关
            "是否订座": 1 if is_booked else 0,
            "订座时间": (register_date + timedelta(days=random.randint(1, 3))).strftime("%Y-%m-%dT%H:%M:%S") if is_booked else None,
            "订座金额": random.choice([500, 1000, 2000]) if is_booked else 0,
            
            # 无效量（小概率）
            "是否无效量": 1 if random.random() < 0.08 else 0,
            "无效原因": "号码错误" if random.random() < 0.08 else None,
        }
        
        return record
    
    def create_record(self, record: dict) -> bool:
        """
        调用API创建记录
        
        Args:
            record: 记录数据
            
        Returns:
            bool: 是否成功
        """
        try:
            response = requests.post(
                f"{self.api_base_url}/consultation/record",
                json=record,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                self.success_count += 1
                return True
            else:
                self.failed_count += 1
                print(f"创建失败: {response.status_code} - {response.text[:200]}")
                return False
                
        except Exception as e:
            self.failed_count += 1
            print(f"请求异常: {e}")
            return False
    
    def generate_batch(self, start_date: datetime, end_date: datetime, records_per_day: int = 5):
        """
        批量生成口碑数据
        
        Args:
            start_date: 开始日期
            end_date: 结束日期
            records_per_day: 每天生成的记录数
        """
        print(f"=" * 60)
        print(f"开始生成口碑数据")
        print(f"神殿: {self.campus}")
        print(f"日期范围: {start_date.date()} 到 {end_date.date()}")
        print(f"每天记录数: {records_per_day}")
        print(f"=" * 60)
        
        current_date = start_date
        total_days = 0
        
        while current_date <= end_date:
            # 随机生成当天的记录数（带波动）
            daily_count = max(1, records_per_day + random.randint(-2, 3))
            
            print(f"\n日期: {current_date.date()}, 生成 {daily_count} 条口碑记录")
            
            for i in range(daily_count):
                # 随机生成当天的时间
                hour = random.randint(8, 20)
                minute = random.randint(0, 59)
                register_time = current_date.replace(hour=hour, minute=minute, second=0)
                
                record = self.generate_record(register_time)
                success = self.create_record(record)
                
                if success:
                    provider = record['口碑提供人']
                    source = record['媒体来源']
                    visit = "✓上门" if record['是否上门'] else ""
                    enrolled = "✓报名" if record['是否报名'] else ""
                    booked = "✓订座" if record['是否订座'] else ""
                    print(f"  [{i+1}] {source} - {provider} {visit} {enrolled} {booked}")
            
            current_date += timedelta(days=1)
            total_days += 1
        
        print(f"\n" + "=" * 60)
        print(f"生成完成!")
        print(f"总天数: {total_days}")
        print(f"成功: {self.success_count} 条")
        print(f"失败: {self.failed_count} 条")
        print(f"=" * 60)


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="生成口碑来源的咨询量测试数据")
    parser.add_argument("--campus", type=str, default="石美", help="神殿名称")
    parser.add_argument("--start", type=str, default=None, help="开始日期 (YYYY-MM-DD)")
    parser.add_argument("--end", type=str, default=None, help="结束日期 (YYYY-MM-DD)")
    parser.add_argument("--per-day", type=int, default=8, help="每天生成的记录数")
    
    args = parser.parse_args()
    
    # 默认日期：当月1号到今天
    today = datetime.now()
    if args.start:
        start_date = datetime.strptime(args.start, "%Y-%m-%d")
    else:
        start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    if args.end:
        end_date = datetime.strptime(args.end, "%Y-%m-%d")
    else:
        end_date = today
    
    # 创建生成器并执行
    generator = ReputationDataGenerator(campus=args.campus)
    generator.generate_batch(start_date, end_date, args.per_day)


if __name__ == "__main__":
    main()
