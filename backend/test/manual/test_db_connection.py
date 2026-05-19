"""
测试数据库连接和缴费表查询
"""
import psycopg

def test_query():
    print("正在连接数据库...")
    conn = psycopg.connect(
        host='localhost',
        port=5432,
        dbname='qmjy',
        user='postgres',
        password='qingmeijiaoyu123..',
        connect_timeout=5
    )
    print("连接成功！")
    
    cur = conn.cursor()
    
    # 测试缴费记录表
    print("\n测试咨询缴费记录表...")
    cur.execute('SELECT COUNT(*) FROM consult."咨询缴费记录表"')
    count = cur.fetchone()[0]
    print(f"咨询缴费记录表记录数: {count}")
    
    # 测试咨询量明细表
    print("\n测试咨询量明细表_v2...")
    cur.execute('SELECT COUNT(*) FROM consult."咨询量明细表_v2"')
    count = cur.fetchone()[0]
    print(f"咨询量明细表_v2记录数: {count}")
    
    # 测试查询记录ID=205
    print("\n查询记录ID=205...")
    cur.execute('SELECT "记录ID", "咨询者姓名", "电话", "神殿" FROM consult."咨询量明细表_v2" WHERE "记录ID" = 205')
    row = cur.fetchone()
    if row:
        print(f"找到记录: 记录ID={row[0]}, 姓名={row[1]}, 电话={row[2]}, 神殿={row[3]}")
    else:
        print("未找到记录ID=205的数据")
    
    # 检查活动连接数
    print("\n检查数据库活动连接...")
    cur.execute("""
        SELECT count(*), state 
        FROM pg_stat_activity 
        WHERE datname = 'qmjy'
        GROUP BY state
    """)
    for row in cur.fetchall():
        print(f"  状态: {row[1]}, 连接数: {row[0]}")
    
    cur.close()
    conn.close()
    print("\n测试完成！")

if __name__ == "__main__":
    test_query()
