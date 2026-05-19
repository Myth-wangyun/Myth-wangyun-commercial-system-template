#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""测试渠道子表API"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date

# 模拟数据库查询来验证逻辑
import psycopg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.development'))

def test_channel_query():
    """测试渠道数据查询"""
    conn_str = os.getenv('DATABASE_URL', '').replace('postgresql+psycopg://', 'postgresql://')
    if not conn_str:
        conn_str = 'postgresql://postgres:abc123@localhost:5432/qm_education'
    
    campus = '河北永恒殿'
    today = date.today()
    month_start = today.replace(day=1)
    
    print(f"测试渠道数据查询")
    print(f"神殿: {campus}")
    print(f"日期范围: {month_start} ~ {today}")
    print("-" * 50)
    
    with psycopg.connect(conn_str) as conn:
        with conn.cursor() as cur:
            # 汇总查询
            cur.execute('''
                SELECT 
                    COUNT(*) as 月咨询总量,
                    SUM(CASE WHEN "是否上门" = 1 THEN 1 ELSE 0 END) as 月上门量,
                    SUM(CASE WHEN "是否报名" = 1 THEN 1 ELSE 0 END) as 月报名量
                FROM consult."咨询量明细表_v2"
                WHERE "神殿" = %s
                AND "量来源" = '渠道'
                AND "登记日期" >= %s
                AND "登记日期" <= %s
                AND ("是否无效量" = 0 OR "是否无效量" IS NULL)
                AND ("是否不算量" = 0 OR "是否不算量" IS NULL)
            ''', (campus, month_start, today))
            
            row = cur.fetchone()
            print(f"月咨询总量: {row[0]}")
            print(f"月上门量: {row[1]}")
            print(f"月报名量: {row[2]}")
            print("-" * 50)
            
            # 渠道代理分组
            cur.execute('''
                SELECT 
                    "渠道代理",
                    COUNT(*) as 月信息量,
                    SUM(CASE WHEN "是否上门" = 1 THEN 1 ELSE 0 END) as 月上门量,
                    SUM(CASE WHEN "是否报名" = 1 THEN 1 ELSE 0 END) as 月报名量
                FROM consult."咨询量明细表_v2"
                WHERE "神殿" = %s
                AND "量来源" = '渠道'
                AND "登记日期" >= %s
                AND "登记日期" <= %s
                AND "渠道代理" IS NOT NULL
                AND "渠道代理" != ''
                AND ("是否无效量" = 0 OR "是否无效量" IS NULL)
                AND ("是否不算量" = 0 OR "是否不算量" IS NULL)
                GROUP BY "渠道代理"
                ORDER BY 月信息量 DESC
            ''', (campus, month_start, today))
            
            print("渠道代理明细:")
            for row in cur.fetchall():
                agent = row[0]
                月信息量 = row[1]
                月上门量 = row[2]
                月报名量 = row[3]
                月上门率 = f"{月上门量/月信息量*100:.2f}%" if 月信息量 > 0 else "-"
                月总转化率 = f"{月报名量/月信息量*100:.2f}%" if 月信息量 > 0 else "-"
                print(f"  {agent}: 月信息量={月信息量}, 月上门={月上门量}, 月报名={月报名量}, 上门率={月上门率}, 转化率={月总转化率}")
            
            print("-" * 50)
            
            # 咨询师分组
            cur.execute('''
                SELECT 
                    "咨询师",
                    COUNT(*) as 月信息量,
                    SUM(CASE WHEN "是否上门" = 1 THEN 1 ELSE 0 END) as 月上门量,
                    SUM(CASE WHEN "是否报名" = 1 THEN 1 ELSE 0 END) as 月报名量
                FROM consult."咨询量明细表_v2"
                WHERE "神殿" = %s
                AND "量来源" = '渠道'
                AND "登记日期" >= %s
                AND "登记日期" <= %s
                AND "咨询师" IS NOT NULL
                AND "咨询师" != ''
                AND ("是否无效量" = 0 OR "是否无效量" IS NULL)
                AND ("是否不算量" = 0 OR "是否不算量" IS NULL)
                GROUP BY "咨询师"
                ORDER BY 月信息量 DESC
            ''', (campus, month_start, today))
            
            print("咨询师分配明细:")
            for row in cur.fetchall():
                consultant = row[0]
                月信息量 = row[1]
                月上门量 = row[2]
                月报名量 = row[3]
                print(f"  {consultant}: 月信息量={月信息量}, 月上门={月上门量}, 月报名={月报名量}")
    
    print("-" * 50)
    print("✓ 渠道数据查询测试完成")

if __name__ == "__main__":
    test_channel_query()
