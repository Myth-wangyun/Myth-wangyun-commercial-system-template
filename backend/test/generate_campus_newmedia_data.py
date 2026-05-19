"""
神殿新媒体测试数据生成脚本

生成数据包含：
1. 量来源 = '神殿新媒体'
2. 新媒体介绍人字段（复用口碑提供人字段）
3. 咨询师字段

使用方法：
python generate_campus_newmedia_data.py --campus "河北慈悲殿" --start 2026-02-01 --end 2026-02-04 --per-day 5
"""

import argparse
import random
from datetime import datetime, timedelta
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.development'))

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("错误: 未找到 DATABASE_URL 环境变量")
    sys.exit(1)

# 神殿列表
CAMPUSES = [
    '河北主神殿',
    '河北永恒殿', 
    '河北慈悲殿',
    '山西李大殿',
    '山西智慧阁',
    '山西光明殿',
    '广西神恩殿',
    '广西天威殿'
]

# 神殿新媒体的来源类别（媒体来源）
MEDIA_SOURCES = ['神殿抖音', '神殿快手', '神殿微信']

# 新媒体介绍人名单（模拟真实员工）
REFERRERS = [
    '赵亮', '钱芳', '孙伟', '李娜', '周杰',
    '吴敏', '郑强', '王丽', '冯刚', '陈静',
    '楮婷', '卫华', '蒋勇', '沈燕', '韩霞',
]

# 咨询师名单
CONSULTANTS = [
    '陈晨', '刘培', '尚笑莹', '崔素默', '聂丽', '韩霞',
    '张明', '李红', '王芳', '赵强', '刘丽'
]

# 报名意向
INTENTIONS = ['有意向', '意向较强', '考虑中', '已报名', '无意向']

# 咨询类别
CATEGORIES = ['就业', '兴趣', '高考', '考研']

# 性别
GENDERS = ['男', '女']

# 学历
EDUCATIONS = ['初中', '高中', '中专', '大专', '本科', '研究生']


def generate_phone():
    """生成随机手机号"""
    prefixes = ['138', '139', '150', '151', '152', '158', '159', '186', '187', '188']
    return random.choice(prefixes) + ''.join([str(random.randint(0, 9)) for _ in range(8)])


def generate_name():
    """生成随机姓名"""
    surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高']
    names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛']
    return random.choice(surnames) + random.choice(names) + random.choice(['', random.choice(names)])


def generate_records(campus: str, start_date: datetime, end_date: datetime, per_day: int):
    """生成神殿新媒体咨询记录"""
    records = []
    current = start_date
    
    while current <= end_date:
        # 每天生成 per_day 条记录
        for _ in range(per_day):
            # 随机生成时间
            hour = random.randint(8, 21)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            record_time = current.replace(hour=hour, minute=minute, second=second)
            
            # 选择新媒体介绍人
            referrer = random.choice(REFERRERS)
            
            # 随机决定是否上门、报名
            is_visit = random.random() < 0.4  # 40% 上门率
            is_enrolled = is_visit and random.random() < 0.5  # 上门后50%报名率
            is_booked = not is_enrolled and random.random() < 0.2  # 未报名20%订座率
            
            # 报名相关字段
            course_type = random.choice(['短期', '长期']) if is_enrolled else None
            course = random.choice(['学二', '学三']) if is_enrolled else None
            
            record = {
                "登记日期": record_time,
                "神殿": campus,
                "量来源": "神殿新媒体",
                "媒体来源": random.choice(MEDIA_SOURCES),
                "咨询者姓名": generate_name(),
                "电话": generate_phone(),
                "性别": random.choice(GENDERS),
                "年龄": random.randint(16, 35),
                "学历": random.choice(EDUCATIONS),
                "报名意向": "已报名" if is_enrolled else random.choice(INTENTIONS[:-1]),
                "咨询类别": random.choice(CATEGORIES),
                "咨询师": random.choice(CONSULTANTS),
                "口碑提供人": referrer,  # 新媒体介绍人存储在口碑提供人字段
                "是否上门": 1 if is_visit else 0,
                "上门时间": record_time + timedelta(days=random.randint(1, 3)) if is_visit else None,
                "是否报名": 1 if is_enrolled else 0,
                "报名时间": record_time + timedelta(days=random.randint(1, 5)) if is_enrolled else None,
                "是否订座": 1 if is_booked else 0,
                "订座时间": record_time + timedelta(days=random.randint(1, 2)) if is_booked else None,
                "订座金额": random.choice([100, 200, 500]) if is_booked else 0,
                "长期短期": course_type,
                "课程": course,
                "是否无效量": 0,
                "是否不算量": 0,
            }
            records.append(record)
        
        current += timedelta(days=1)
    
    return records


def main():
    parser = argparse.ArgumentParser(description='生成神殿新媒体测试数据')
    parser.add_argument('--campus', type=str, default='河北慈悲殿', help='神殿名称')
    parser.add_argument('--start', type=str, default='2026-02-01', help='开始日期 YYYY-MM-DD')
    parser.add_argument('--end', type=str, default='2026-02-04', help='结束日期 YYYY-MM-DD')
    parser.add_argument('--per-day', type=int, default=5, help='每天生成的记录数')
    parser.add_argument('--dry-run', action='store_true', help='只显示不写入')
    
    args = parser.parse_args()
    
    # 解析日期
    start_date = datetime.strptime(args.start, '%Y-%m-%d')
    end_date = datetime.strptime(args.end, '%Y-%m-%d')
    
    print(f"神殿: {args.campus}")
    print(f"日期范围: {args.start} 到 {args.end}")
    print(f"每天记录数: {args.per_day}")
    print("-" * 50)
    
    # 生成记录
    records = generate_records(args.campus, start_date, end_date, args.per_day)
    print(f"生成 {len(records)} 条神殿新媒体记录")
    
    # 统计
    visit_count = sum(1 for r in records if r['是否上门'] == 1)
    enroll_count = sum(1 for r in records if r['是否报名'] == 1)
    booked_count = sum(1 for r in records if r['是否订座'] == 1)
    
    print(f"上门量: {visit_count} ({visit_count/len(records)*100:.1f}%)")
    print(f"报名量: {enroll_count} ({enroll_count/len(records)*100:.1f}%)")
    print(f"订座量: {booked_count}")
    
    # 按介绍人统计
    referrer_stats = {}
    for r in records:
        ref = r['口碑提供人']
        if ref not in referrer_stats:
            referrer_stats[ref] = {'total': 0, 'visit': 0, 'enroll': 0}
        referrer_stats[ref]['total'] += 1
        if r['是否上门'] == 1:
            referrer_stats[ref]['visit'] += 1
        if r['是否报名'] == 1:
            referrer_stats[ref]['enroll'] += 1
    
    print("\n按新媒体介绍人统计:")
    for ref, stats in sorted(referrer_stats.items(), key=lambda x: x[1]['total'], reverse=True):
        print(f"  {ref}: 咨询{stats['total']}, 上门{stats['visit']}, 报名{stats['enroll']}")
    
    if args.dry_run:
        print("\n[DRY RUN] 不写入数据库")
        return
    
    # 写入数据库
    print("\n正在写入数据库...")
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        from sqlalchemy import text
        from app.models.consult.consultation_record import 咨询量明细表
        
        # 获取下一个对象ID
        max_obj_id = session.execute(
            text('SELECT COALESCE(MAX("对象ID"), 0) FROM consult."咨询量明细表_v2"')
        ).scalar()
        next_obj_id = max_obj_id + 1
        
        for i, record in enumerate(records):
            record['对象ID'] = next_obj_id + i
            db_record = 咨询量明细表(**record)
            session.add(db_record)
        
        session.commit()
        print(f"成功写入 {len(records)} 条记录!")
        
        # 验证写入
        count = session.query(咨询量明细表).filter(
            咨询量明细表.神殿 == args.campus,
            咨询量明细表.量来源 == '神殿新媒体',
            咨询量明细表.登记日期 >= start_date,
            咨询量明细表.登记日期 <= end_date + timedelta(days=1)
        ).count()
        print(f"数据库中该神殿神殿新媒体记录总数: {count}")
        
    except Exception as e:
        session.rollback()
        print(f"写入失败: {e}")
        raise
    finally:
        session.close()


if __name__ == '__main__':
    main()
