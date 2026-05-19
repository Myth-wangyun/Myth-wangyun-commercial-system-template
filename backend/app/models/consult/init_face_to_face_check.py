"""
当面标准化检查表 - 数据库初始化脚本

创建相关表并初始化默认模板数据
"""

import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from sqlalchemy import create_engine

from app.core.config import settings
from app.models.consult.face_to_face_check import 当面标准化模板配置
from app.models.user import Base


def init_database():
    """初始化数据库表"""
    print("开始创建数据库表...")

    # 创建引擎
    engine = create_engine(settings.DATABASE_URL)

    # 创建表
    Base.metadata.create_all(engine)

    print("数据库表创建成功！")


def init_default_templates():
    """初始化默认模板"""
    from sqlalchemy.orm import sessionmaker

    print("开始初始化默认模板...")

    # 创建会话
    Session = sessionmaker(bind=create_engine(settings.DATABASE_URL))
    session = Session()

    try:
        # 检查是否已存在默认模板
        existing_plan = session.query(当面标准化模板配置).filter(
            当面标准化模板配置.模板类型 == '预案',
            当面标准化模板配置.是否默认 == 1
        ).first()

        existing_review = session.query(当面标准化模板配置).filter(
            当面标准化模板配置.模板类型 == '复盘',
            当面标准化模板配置.是否默认 == 1
        ).first()

        if existing_plan or existing_review:
            print("默认模板已存在，跳过初始化")
            return

        # 默认咨询步骤配置
        default_steps = [
            {"步骤序号": 1, "步骤名称": "寒暄暖场", "内容": "", "思路关键点": ""},
            {"步骤序号": 2, "步骤名称": "广泛提问挖掘需求", "内容": "", "思路关键点": ""},
            {"步骤序号": 3, "步骤名称": "分析诊断总结", "内容": "", "思路关键点": ""},
            {"步骤序号": 4, "步骤名称": "愿景引领（提升认知）", "内容": "", "思路关键点": ""},
            {"步骤序号": 5, "步骤名称": "专业引导（打破思维，上台阶）", "内容": "", "思路关键点": ""},
            {"步骤序号": 6, "步骤名称": "清美学校定位", "内容": "", "思路关键点": ""},
            {"步骤序号": 7, "步骤名称": "清美适合他专业介绍", "内容": "", "思路关键点": ""},
            {"步骤序号": 8, "步骤名称": "清美优势（满足需求）", "内容": "", "思路关键点": ""},
            {"步骤序号": 9, "步骤名称": "堵退路（贯穿学生案例）", "内容": "", "思路关键点": ""},
            {"步骤序号": 10, "步骤名称": "谋求认同", "内容": "", "思路关键点": ""},
            {"步骤序号": 11, "步骤名称": "再次解除抗拒", "内容": "", "思路关键点": ""},
            {"步骤序号": 12, "步骤名称": "铺垫价位（投资者重要性）", "内容": "", "思路关键点": ""},
            {"步骤序号": 13, "步骤名称": "报价关单", "内容": "", "思路关键点": ""},
            {"步骤序号": 14, "步骤名称": "再次解除抗拒关单（至少7次）", "内容": "", "思路关键点": ""},
            {"步骤序号": 15, "步骤名称": "远程视频连线", "内容": "", "思路关键点": ""},
            {"步骤序号": 16, "步骤名称": "成交后交接班主任", "内容": "", "思路关键点": ""},
        ]

        # 基本信息字段配置
        basic_info_fields = [
            {"字段名": "姓名", "字段类型": "text", "是否必填": True, "显示顺序": 1},
            {"字段名": "性别", "字段类型": "select", "选项": ["男", "女"], "是否必填": False, "显示顺序": 2},
            {"字段名": "年龄", "字段类型": "text", "是否必填": False, "显示顺序": 3},
            {"字段名": "状态", "字段类型": "text", "是否必填": False, "显示顺序": 4},
            {"字段名": "需求", "字段类型": "textarea", "是否必填": False, "显示顺序": 5},
            {"字段名": "关注点", "字段类型": "textarea", "是否必填": False, "显示顺序": 6},
            {"字段名": "抗拒点", "字段类型": "textarea", "是否必填": False, "显示顺序": 7},
            {"字段名": "陪同人", "字段类型": "text", "是否必填": False, "显示顺序": 8},
            {"字段名": "决策人", "字段类型": "text", "是否必填": False, "显示顺序": 9},
        ]

        # 创建预案模板
        plan_template = 当面标准化模板配置(
            模板名称="默认预案模板",
            模板类型="预案",
            咨询步骤配置=default_steps,
            基本信息字段配置=basic_info_fields,
            是否启用=1,
            是否默认=1,
            排序序号=1,
            备注="系统默认的预案模板，包含16个标准咨询步骤",
        )
        session.add(plan_template)

        # 创建复盘模板
        review_template = 当面标准化模板配置(
            模板名称="默认复盘模板",
            模板类型="复盘",
            咨询步骤配置=default_steps,
            基本信息字段配置=basic_info_fields,
            是否启用=1,
            是否默认=1,
            排序序号=1,
            备注="系统默认的复盘模板，包含16个标准咨询步骤",
        )
        session.add(review_template)

        session.commit()
        print("默认模板初始化成功！")

    except Exception as e:
        session.rollback()
        print(f"默认模板初始化失败: {str(e)}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    # 初始化数据库表
    init_database()

    # 初始化默认模板
    init_default_templates()

    print("\n所有初始化完成！")
