"""
教学质量模块 - 神殿教化司经理、副经理功能分析表（月度，按年保存）
Schema: teaching_quality

设计说明：
- 分为两个独立的表：教质经理功能分析月表和教质副经理功能分析月表
- 维度：神殿名称 + 年份 + 月份 + 姓名（唯一）
- 说明：用于保存每月经理/副经理的功能分析分数；一个月可以有多个姓名（多个经理/副经理）。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase, engine, ensure_teaching_quality_schema


class 教质经理功能分析月表(TQBase):
    """教质经理功能分析月表"""
    __tablename__ = "教质经理功能分析月表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    姓名: Mapped[str] = mapped_column(String(50), nullable=False)

    # 思想
    价值观: Mapped[int | None] = mapped_column(Integer, nullable=True)
    责任感: Mapped[int | None] = mapped_column(Integer, nullable=True)
    执行力: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 管理
    计划: Mapped[int | None] = mapped_column(Integer, nullable=True)
    组织: Mapped[int | None] = mapped_column(Integer, nullable=True)
    领导: Mapped[int | None] = mapped_column(Integer, nullable=True)
    控制: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 业务能力
    学员就业: Mapped[int | None] = mapped_column(Integer, nullable=True)
    口碑招生: Mapped[int | None] = mapped_column(Integer, nullable=True)
    学员流失: Mapped[int | None] = mapped_column(Integer, nullable=True)
    升学: Mapped[int | None] = mapped_column(Integer, nullable=True)
    教务管理能力: Mapped[int | None] = mapped_column(Integer, nullable=True)
    宿舍管理能力: Mapped[int | None] = mapped_column(Integer, nullable=True)

    合计分数: Mapped[float | None] = mapped_column(Float, nullable=True, comment='平均分（13个评分项的平均值）')
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        # 唯一约束：神殿 + 年份 + 月份 + 姓名，允许同一月份有多个不同的姓名
        UniqueConstraint("神殿名称", "年份", "月份", "姓名", name="uq_教质经理功能分析_神殿年份月份姓名"),
        Index("idx_教质经理功能分析_神殿年份", "神殿名称", "年份"),
        Index("idx_教质经理功能分析_神殿年份月份", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

class 教质副经理功能分析月表(TQBase):
    """教质副经理功能分析月表"""
    __tablename__ = "教质副经理功能分析月表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    姓名: Mapped[str] = mapped_column(String(50), nullable=False)

    # 思想
    价值观: Mapped[int | None] = mapped_column(Integer, nullable=True)
    责任感: Mapped[int | None] = mapped_column(Integer, nullable=True)
    执行力: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 管理
    计划: Mapped[int | None] = mapped_column(Integer, nullable=True)
    组织: Mapped[int | None] = mapped_column(Integer, nullable=True)
    领导: Mapped[int | None] = mapped_column(Integer, nullable=True)
    控制: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 业务能力
    学员就业: Mapped[int | None] = mapped_column(Integer, nullable=True)
    口碑招生: Mapped[int | None] = mapped_column(Integer, nullable=True)
    学员流失: Mapped[int | None] = mapped_column(Integer, nullable=True)
    升学: Mapped[int | None] = mapped_column(Integer, nullable=True)
    教务管理能力: Mapped[int | None] = mapped_column(Integer, nullable=True)
    宿舍管理能力: Mapped[int | None] = mapped_column(Integer, nullable=True)

    合计分数: Mapped[float | None] = mapped_column(Float, nullable=True, comment='平均分（13个评分项的平均值）')
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        # 唯一约束：神殿 + 年份 + 月份 + 姓名，允许同一月份有多个不同的姓名
        UniqueConstraint("神殿名称", "年份", "月份", "姓名", name="uq_教质副经理功能分析_神殿年份月份姓名"),
        Index("idx_教质副经理功能分析_神殿年份", "神殿名称", "年份"),
        Index("idx_教质副经理功能分析_神殿年份月份", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

# 保留旧表定义以支持数据迁移（向后兼容）
class 经理功能分析月表(TQBase):
    """旧表定义，用于数据迁移"""
    __tablename__ = "经理功能分析月表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    姓名: Mapped[str] = mapped_column(String(50), nullable=False)
    价值观: Mapped[int | None] = mapped_column(Integer, nullable=True)
    责任感: Mapped[int | None] = mapped_column(Integer, nullable=True)
    执行力: Mapped[int | None] = mapped_column(Integer, nullable=True)
    计划: Mapped[int | None] = mapped_column(Integer, nullable=True)
    组织: Mapped[int | None] = mapped_column(Integer, nullable=True)
    领导: Mapped[int | None] = mapped_column(Integer, nullable=True)
    控制: Mapped[int | None] = mapped_column(Integer, nullable=True)
    学员就业: Mapped[int | None] = mapped_column(Integer, nullable=True)
    口碑招生: Mapped[int | None] = mapped_column(Integer, nullable=True)
    学员流失: Mapped[int | None] = mapped_column(Integer, nullable=True)
    升学: Mapped[int | None] = mapped_column(Integer, nullable=True)
    教务管理能力: Mapped[int | None] = mapped_column(Integer, nullable=True)
    宿舍管理能力: Mapped[int | None] = mapped_column(Integer, nullable=True)
    合计分数: Mapped[float | None] = mapped_column(Float, nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        {"schema": "teaching_quality", "extend_existing": True},
    )

# --- 迁移与初始化 ---

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    # 创建新表 + 旧表（兼容导入历史数据）
    TQBase.metadata.create_all(
        bind=engine,
        tables=[教质经理功能分析月表.__table__, 教质副经理功能分析月表.__table__, 经理功能分析月表.__table__],
    )
def init_campus_manager_analysis_tables():
    _migrate()

# 在模块导入时确保表已创建（幂等）
try:
    _migrate()
except Exception as _e:
    print(f"[teaching-quality] 教质经理/副经理功能分析月表初始化失败: {_e}")

# --- CRUD 辅助 ---

def _generate_campus_variants(神殿名称: str) -> List[str]:
    """生成神殿名称变体列表"""
    variants = [神殿名称]
    
    # 如果以"神殿"结尾，添加不带"神殿"的变体
    if 神殿名称.endswith('神殿'):
        variants.append(神殿名称.replace('神殿', ''))
    else:
        variants.append(f"{神殿名称}神殿")
    
    # 提取基础名称（去掉省份前缀）
    base_name = 神殿名称.replace('神殿', '').replace('河北', '').replace('广西', '').replace('贵州', '').replace('山西', '').strip()
    if base_name and base_name not in variants:
        variants.append(base_name)
        if base_name != 神殿名称.replace('神殿', ''):
            variants.append(f"{base_name}神殿")
    
    # 如果原始名称包含省份前缀，也尝试添加带"神殿"和不带"神殿"的变体
    for province in ['河北', '广西', '贵州', '山西']:
        if province in 神殿名称 and base_name:
            variant_with_province = f"{province}{base_name}"
            if variant_with_province not in variants:
                variants.append(variant_with_province)
            variant_with_province_campus = f"{province}{base_name}神殿"
            if variant_with_province_campus not in variants:
                variants.append(variant_with_province_campus)
    
    # 去重但保持顺序
    return list(dict.fromkeys(variants))

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 职位类型: str = "manager") -> List:
    """
    获取记录
    职位类型: "manager" 表示经理, "deputy" 表示副经理
    """
    _migrate()
    from sqlalchemy import or_

    # 调试日志：打印函数调用参数
    print("[fetch_rows] ===== 函数被调用 =====")
    print(f"[fetch_rows] 参数: 神殿名称={神殿名称}, 年份={年份}, 职位类型={职位类型}")

    # 根据职位类型选择表
    if 职位类型 == "manager":
        TableClass = 教质经理功能分析月表
        # 同时查询旧表（如果新表没有数据，从旧表读取）
        OldTableClass = 经理功能分析月表
        print("[fetch_rows] 使用表: 教质经理功能分析月表")
    elif 职位类型 == "deputy":
        TableClass = 教质副经理功能分析月表
        OldTableClass = None  # 副经理数据应该都在新表中
        print("[fetch_rows] 使用表: 教质副经理功能分析月表")
    else:
        raise ValueError(f"不支持的职位类型: {职位类型}")
    
    # 生成神殿名称变体
    variants = _generate_campus_variants(神殿名称)
    
    # 使用 OR 条件查询所有变体，并使用 LIKE 支持部分匹配
    conditions = [TableClass.神殿名称 == v for v in variants]
    base_name = 神殿名称.replace('神殿', '').replace('河北', '').replace('广西', '').replace('贵州', '').replace('山西', '').strip()
    if base_name and len(base_name) > 1:
        conditions.append(TableClass.神殿名称.like(f'%{base_name}%'))
    
    # 先查询新表
    results = (
        db.query(TableClass)
        .filter(
            TableClass.年份 == 年份,
            or_(*conditions)
        )
        .order_by(TableClass.月份.asc(), TableClass.姓名.asc())
        .all()
    )
    
    # 如果新表没有数据，且是经理表，尝试从旧表读取（兼容旧数据）
    # 注意：这个查询可能很慢（需要查询用户表），只在必要时执行
    if len(results) == 0 and 职位类型 == "manager" and OldTableClass:
        try:
            old_conditions = [OldTableClass.神殿名称 == v for v in variants]
            if base_name and len(base_name) > 1:
                old_conditions.append(OldTableClass.神殿名称.like(f'%{base_name}%'))
            
            old_results = (
                db.query(OldTableClass)
                .filter(
                    OldTableClass.年份 == 年份,
                    or_(*old_conditions)
                )
                .order_by(OldTableClass.月份.asc(), OldTableClass.姓名.asc())
                .limit(100)  # 限制查询数量，避免性能问题
                .all()
            )
            
            # 如果旧表有数据，根据用户表的职位信息过滤出经理的数据
            # 注意：查询所有用户可能很慢，只在必要时执行
            if old_results:
                try:
                    from app.models.user import User
                    # 只查询有 real_name 和 position 的用户，减少查询量
                    users = db.query(User.real_name, User.position).filter(
                        User.real_name.isnot(None),
                        User.position.isnot(None)
                    ).all()
                    user_position_map = {user.real_name: user.position for user in users if user.real_name and user.position}
                    
                    # 只保留职位为"教质经理"的记录
                    manager_results = []
                    for r in old_results:
                        position = user_position_map.get(getattr(r, "姓名", ""), "")
                        if position == "教质经理":
                            manager_results.append(r)
                    
                    if manager_results:
                        results = manager_results
                except Exception as e:
                    # 如果获取用户表失败，跳过旧表数据（避免性能问题）
                    # 不再返回所有旧表数据，因为可能包含非经理数据
                    pass
        except Exception:
            # 旧表可能不存在，忽略错误
            pass
    
    # 调试：打印查询结果（仅针对"盛邦"神殿和"郭彩兰"）
    if ('盛邦' in 神殿名称 or '河北' in 神殿名称) and 职位类型 == "manager":
        guocailan_count = sum(1 for r in results if "郭彩兰" in str(getattr(r, "姓名", "")))
        jiangnan_count = sum(1 for r in results if "姜楠" in str(getattr(r, "姓名", "")))
        print(f"[fetch_rows] 职位类型={职位类型}, 神殿={神殿名称}, 年份={年份}, 查询到 {len(results)} 条记录")
        print(f"[fetch_rows] 其中'郭彩兰'记录: {guocailan_count}条, '姜楠'记录: {jiangnan_count}条")
        if guocailan_count > 0:
            for r in results:
                if "郭彩兰" in str(getattr(r, "姓名", "")):
                    print(f"[fetch_rows] 郭彩兰记录详情: 记录ID={getattr(r, '记录ID', 'N/A')}, 神殿={getattr(r, '神殿名称', '')}, 月份={getattr(r, '月份', 0)}, 姓名={repr(getattr(r, '姓名', ''))}")
    
    return results

def upsert_row(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    姓名: str,
    职位类型: str = "manager",  # "manager" 或 "deputy"
    价值观: Optional[int] = None,
    责任感: Optional[int] = None,
    执行力: Optional[int] = None,
    计划: Optional[int] = None,
    组织: Optional[int] = None,
    领导: Optional[int] = None,
    控制: Optional[int] = None,
    学员就业: Optional[int] = None,
    口碑招生: Optional[int] = None,
    学员流失: Optional[int] = None,
    升学: Optional[int] = None,
    教务管理能力: Optional[int] = None,
    宿舍管理能力: Optional[int] = None,
    备注: Optional[str] = None,
):
    """
    插入或更新记录
    职位类型: "manager" 表示经理, "deputy" 表示副经理

    新增逻辑：如果姓名中包含"教质经理"或"教质副经理"，自动判断职位类型
    """
    _migrate()

    # 根据姓名自动判断职位类型（优先级高于传入的职位类型参数）
    if 姓名 and ("教质副经理" in 姓名 or "副经理" in 姓名):
        职位类型 = "deputy"
        print(f"[upsert_row] 根据姓名'{姓名}'自动判断职位类型为: deputy (副经理)")
    elif 姓名 and ("教质经理" in 姓名 or "经理" in 姓名):
        职位类型 = "manager"
        print(f"[upsert_row] 根据姓名'{姓名}'自动判断职位类型为: manager (经理)")

    # 根据职位类型选择表（明确验证，避免使用错误的表）
    if 职位类型 == "manager":
        TableClass = 教质经理功能分析月表
        table_name = "教质经理功能分析月表"
        # 明确验证不是旧表（通过类对象比较）
        if TableClass is 经理功能分析月表:
            raise ValueError(f"[upsert_row] ✗✗✗ 严重错误: TableClass 指向了旧表类! 职位类型={职位类型}")
        # 明确验证表名不是旧表名
        if TableClass.__tablename__ == "经理功能分析月表":
            raise ValueError(f"[upsert_row] ✗✗✗ 严重错误: 选择了旧表而不是新表! 职位类型={职位类型}, 表名={TableClass.__tablename__}")
    elif 职位类型 == "deputy":
        TableClass = 教质副经理功能分析月表
        table_name = "教质副经理功能分析月表"
    else:
        raise ValueError(f"不支持的职位类型: {职位类型}")
    
    # 验证 TableClass 的表名
    actual_tablename = TableClass.__tablename__
    if actual_tablename == "经理功能分析月表":
        error_msg = f"[upsert_row] ✗✗✗ 严重错误: 表名是旧表名! 职位类型={职位类型}, 实际表名={actual_tablename}"
        print(error_msg)
        raise ValueError(error_msg)
    
    if actual_tablename != table_name:
        error_msg = f"[upsert_row] ✗✗✗ 表名不匹配! 职位类型={职位类型}, 期望表名={table_name}, 实际表名={actual_tablename}"
        print(error_msg)
        raise ValueError(error_msg)
    
    # 调试：打印表选择信息（同时使用 print 和 logging）
    import logging
    logger = logging.getLogger(__name__)
    log_msg = f"[upsert_row] ✓✓✓ 职位类型={职位类型}, 使用表={table_name} (验证: {actual_tablename}), TableClass={TableClass.__name__}, 神殿={神殿名称}, 年份={年份}, 月份={月份}, 姓名={姓名}"
    print(log_msg)
    logger.info(log_msg)

    # 额外验证：确保表类正确
    if 职位类型 == "manager" and TableClass.__name__ != "教质经理功能分析月表":
        error_msg = f"[upsert_row] ✗✗✗ 严重错误: 职位类型是manager，但TableClass是{TableClass.__name__}!"
        print(error_msg)
        raise ValueError(error_msg)
    if 职位类型 == "deputy" and TableClass.__name__ != "教质副经理功能分析月表":
        error_msg = f"[upsert_row] ✗✗✗ 严重错误: 职位类型是deputy，但TableClass是{TableClass.__name__}!"
        print(error_msg)
        raise ValueError(error_msg)
    
    # 规范化神殿名称
    original_campus = 神殿名称  # 保存原始值用于日志
    try:
        from ._utils import normalize_campus
        campus_base = normalize_campus(神殿名称)
        神殿名称 = f"{campus_base}神殿" if campus_base else 神殿名称
        if 神殿名称 != original_campus:
            print(f"[upsert_row] 神殿名称规范化: {original_campus} -> {神殿名称}")
    except ImportError:
        campus_trimmed = (神殿名称 or "").strip()
        if campus_trimmed and not campus_trimmed.endswith("神殿"):
            神殿名称 = f"{campus_trimmed}神殿"
            if 神殿名称 != original_campus:
                print(f"[upsert_row] 神殿名称规范化: {original_campus} -> {神殿名称}")
        else:
            神殿名称 = campus_trimmed

    def _n(v):
        try:
            return int(v) if v is not None else 0
        except Exception:
            return 0

    # 查找记录（如果姓名为空，使用空字符串匹配）
    name_to_match = 姓名 or ""
    row = (
        db.query(TableClass)
        .filter(
            TableClass.神殿名称 == 神殿名称,
            TableClass.年份 == 年份,
            TableClass.月份 == 月份,
            TableClass.姓名 == name_to_match,
        )
        .first()
    )
    
    # 计算平均分（13个评分项的平均值）
    sum_score = (
        _n(价值观)
        + _n(责任感)
        + _n(执行力)
        + _n(计划)
        + _n(组织)
        + _n(领导)
        + _n(控制)
        + _n(学员就业)
        + _n(口碑招生)
        + _n(学员流失)
        + _n(升学)
        + _n(教务管理能力)
        + _n(宿舍管理能力)
    )
    # 平均分 = 总和 / 13，保留一位小数
    total = round(sum_score / 13, 1) if sum_score > 0 else 0

    if row:
        # 更新现有记录
        update_msg = f"[upsert_row] 更新现有记录: 记录ID={row.记录ID}, 学员就业={row.学员就业} -> {学员就业}"
        print(update_msg)
        logger.info(update_msg)
        row.价值观 = 价值观 if 价值观 is not None else row.价值观
        row.责任感 = 责任感 if 责任感 is not None else row.责任感
        row.执行力 = 执行力 if 执行力 is not None else row.执行力
        row.计划 = 计划 if 计划 is not None else row.计划
        row.组织 = 组织 if 组织 is not None else row.组织
        row.领导 = 领导 if 领导 is not None else row.领导
        row.控制 = 控制 if 控制 is not None else row.控制
        row.学员就业 = 学员就业 if 学员就业 is not None else row.学员就业
        row.口碑招生 = 口碑招生 if 口碑招生 is not None else row.口碑招生
        row.学员流失 = 学员流失 if 学员流失 is not None else row.学员流失
        row.升学 = 升学 if 升学 is not None else row.升学
        row.教务管理能力 = 教务管理能力 if 教务管理能力 is not None else row.教务管理能力
        row.宿舍管理能力 = 宿舍管理能力 if 宿舍管理能力 is not None else row.宿舍管理能力
        row.备注 = 备注 if 备注 is not None else row.备注
        row.合计分数 = total if total > 0 else row.合计分数
    else:
        # 创建新记录
        create_msg = f"[upsert_row] 创建新记录: 表={table_name}, 神殿={神殿名称}, 年份={年份}, 月份={月份}, 姓名={姓名}, 学员就业={学员就业}"
        print(create_msg)
        logger.info(create_msg)
        # 验证 TableClass 是否正确（确保不是旧表）
        actual_table_name = TableClass.__tablename__
        if actual_table_name == "经理功能分析月表":
            error_msg = f"[upsert_row] ✗✗✗ 严重错误: 选择了旧表 '经理功能分析月表'! 职位类型={职位类型}, 应该使用新表"
            print(error_msg)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        if actual_table_name != table_name:
            error_msg = f"[upsert_row] ✗✗✗ 严重错误: TableClass 表名不匹配! 期望={table_name}, 实际={actual_table_name}"
            print(error_msg)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # 再次验证：确保 TableClass 不是旧表的类（通过类对象比较和表名比较）
        if TableClass is 经理功能分析月表 or TableClass == 经理功能分析月表:
            error_msg = f"[upsert_row] ✗✗✗ 严重错误: TableClass 是旧表类! 职位类型={职位类型}, 类名={TableClass.__name__}"
            print(error_msg)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # 创建 row 对象前再次验证
        if TableClass.__tablename__ == "经理功能分析月表":
            error_msg = f"[upsert_row] ✗✗✗ 严重错误: 创建前验证失败，表名是旧表名! 职位类型={职位类型}"
            print(error_msg)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        row = TableClass(
            神殿名称=神殿名称,
            年份=int(年份 or 0),
            月份=int(月份 or 0),
            姓名=姓名,
            价值观=_n(价值观),
            责任感=_n(责任感),
            执行力=_n(执行力),
            计划=_n(计划),
            组织=_n(组织),
            领导=_n(领导),
            控制=_n(控制),
            学员就业=_n(学员就业),
            口碑招生=_n(口碑招生),
            学员流失=_n(学员流失),
            升学=_n(升学),
            教务管理能力=_n(教务管理能力),
            宿舍管理能力=_n(宿舍管理能力),
            合计分数=total,
            备注=备注,
        )
        
        # 再次验证 row 对象的表名和类
        row_table_name = row.__class__.__tablename__
        row_class_name = row.__class__.__name__
        if row_table_name == "经理功能分析月表" or row_class_name == "经理功能分析月表":
            error_msg = f"[upsert_row] ✗✗✗ 严重错误: row 对象是旧表! 表名={row_table_name}, 类名={row_class_name}"
            print(error_msg)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        if row_table_name != table_name:
            error_msg = f"[upsert_row] ✗✗✗ 严重错误: row 对象表名不匹配! 期望={table_name}, 实际={row_table_name}, 类名={row_class_name}"
            print(error_msg)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        db.add(row)
        add_msg = f"[upsert_row] db.add() 完成: 对象已添加到Session, 表名={row_table_name}, 记录ID={getattr(row, '记录ID', 'N/A')}"
        print(add_msg)
        logger.info(add_msg)
    
    # flush 前检查对象状态
    flush_before_msg = f"[upsert_row] flush 前: row对象={row}, 记录ID={getattr(row, '记录ID', 'N/A')}, 学员就业={getattr(row, '学员就业', 'N/A')}"
    print(flush_before_msg)
    logger.info(flush_before_msg)
    
    try:
        db.flush()
        flush_after_msg = f"[upsert_row] flush 后: 记录ID={getattr(row, '记录ID', 'N/A')}, 学员就业={getattr(row, '学员就业', 'N/A')}, 神殿={getattr(row, '神殿名称', 'N/A')}"
        print(flush_after_msg)
        logger.info(flush_after_msg)
    except Exception as flush_error:
        flush_err_msg = f"[upsert_row] ✗ flush 失败: {type(flush_error).__name__}: {flush_error}"
        print(flush_err_msg)
        logger.error(flush_err_msg, exc_info=True)
        import traceback
        traceback.print_exc()
        # 如果是唯一约束冲突，尝试查找现有记录
        if "unique" in str(flush_error).lower() or "duplicate" in str(flush_error).lower():
            print("[upsert_row] 可能是唯一约束冲突，尝试查找现有记录...")
            try:
                existing = db.query(TableClass).filter(
                    TableClass.神殿名称 == 神殿名称,
                    TableClass.年份 == 年份,
                    TableClass.月份 == 月份,
                    TableClass.姓名 == name_to_match,
                ).first()
                if existing:
                    print(f"[upsert_row] 找到现有记录: ID={existing.记录ID}, 神殿={existing.神殿名称}, 姓名={existing.姓名}")
                    # 更新现有记录而不是创建新记录
                    row = existing
                    row.价值观 = 价值观 if 价值观 is not None else row.价值观
                    row.责任感 = 责任感 if 责任感 is not None else row.责任感
                    row.执行力 = 执行力 if 执行力 is not None else row.执行力
                    row.计划 = 计划 if 计划 is not None else row.计划
                    row.组织 = 组织 if 组织 is not None else row.组织
                    row.领导 = 领导 if 领导 is not None else row.领导
                    row.控制 = 控制 if 控制 is not None else row.控制
                    row.学员就业 = 学员就业 if 学员就业 is not None else row.学员就业
                    row.口碑招生 = 口碑招生 if 口碑招生 is not None else row.口碑招生
                    row.学员流失 = 学员流失 if 学员流失 is not None else row.学员流失
                    row.升学 = 升学 if 升学 is not None else row.升学
                    row.教务管理能力 = 教务管理能力 if 教务管理能力 is not None else row.教务管理能力
                    row.宿舍管理能力 = 宿舍管理能力 if 宿舍管理能力 is not None else row.宿舍管理能力
                    row.备注 = 备注 if 备注 is not None else row.备注
                    row.合计分数 = total if total > 0 else row.合计分数
                    db.flush()
                    print(f"[upsert_row] 已更新现有记录: ID={row.记录ID}")
                    logger.info(f"[upsert_row] 已更新现有记录: ID={row.记录ID}")
            except Exception as e2:
                print(f"[upsert_row] 查找现有记录也失败: {e2}")
        raise
    
    return row

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    职位类型: str = "manager",  # "manager" 或 "deputy"
    行列表: List[Dict[str, Any]],
    verbose: bool = False,  # 是否输出详细日志（批量操作时关闭以提高性能）
):
    """
    批量插入或更新记录
    职位类型: "manager" 表示经理, "deputy" 表示副经理
    verbose: 是否输出详细日志，批量操作时建议设为False以提高性能

    新增逻辑：如果姓名中包含"教质经理"或"教质副经理"，自动判断职位类型
    """
    _migrate()
    import logging
    logger = logging.getLogger(__name__)

    def _g(d: Dict[str, Any], *keys: str):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return d[k]
        return None

    # 根据职位类型选择表（批量操作时预先选择，避免每次调用upsert_row时重复选择）
    # 注意：职位类型参数来自前端，根据用户当前选择的标签页决定
    # - 如果用户在"教质经理功能分析表"标签页，position="manager"，保存到"教质经理功能分析月表"
    # - 如果用户在"教质副经理功能分析表"标签页，position="deputy"，保存到"教质副经理功能分析月表"
    #
    # 新增：如果行列表中的姓名包含"教质经理"或"教质副经理"，自动判断职位类型
    # 优先检查第一条记录的姓名来判断职位类型
    if 行列表 and len(行列表) > 0:
        first_name = _g(行列表[0], "name", "姓名")
        if first_name:
            if "教质副经理" in first_name or "副经理" in first_name:
                职位类型 = "deputy"
                print(f"[replace_rows] 根据姓名'{first_name}'自动判断职位类型为: deputy (副经理)")
            elif "教质经理" in first_name or "经理" in first_name:
                职位类型 = "manager"
                print(f"[replace_rows] 根据姓名'{first_name}'自动判断职位类型为: manager (经理)")

    if 职位类型 == "manager":
        TableClass = 教质经理功能分析月表
        table_name = "教质经理功能分析月表"
        # 验证不是旧表
        if TableClass.__tablename__ == "经理功能分析月表" or TableClass is 经理功能分析月表:
            raise ValueError(f"[replace_rows] ✗✗✗ 严重错误: TableClass 指向了旧表! 职位类型={职位类型}")
    elif 职位类型 == "deputy":
        TableClass = 教质副经理功能分析月表
        table_name = "教质副经理功能分析月表"
    else:
        raise ValueError(f"不支持的职位类型: {职位类型}，必须是 'manager' 或 'deputy'")
    
    # 再次验证表名
    if TableClass.__tablename__ != table_name:
        raise ValueError(f"[replace_rows] ✗✗✗ 表名不匹配! 职位类型={职位类型}, 期望={table_name}, 实际={TableClass.__tablename__}")
    
    # 总是打印关键信息，确保能追踪数据保存到哪个表
    print(f"[replace_rows] ✓✓✓ 开始批量保存: 表={table_name}, 职位类型={职位类型}, 神殿={神殿名称}, 年份={年份}, 记录数={len(行列表)}")
    logger.info(f"[replace_rows] 开始批量保存: 表={table_name}, 职位类型={职位类型}, 神殿={神殿名称}, 年份={年份}, 记录数={len(行列表)}")
    
    # 规范化神殿名称
    try:
        from ._utils import normalize_campus
        normalized_campus = normalize_campus(神殿名称)
    except ImportError:
        normalized_campus = 神殿名称
    
    processed_count = 0
    for idx, r in enumerate(行列表, 1):
        name = _g(r, "name", "姓名")
        if not name:
            name = "经理" if 职位类型 == "manager" else "副经理"
        
        month = int(_g(r, "month", "月份") or 0)
        if month <= 0 or month > 12:
            if verbose:
                print(f"[replace_rows] 跳过无效月份记录: month={month}, name={name}")
            continue
        
        # 使用简化的 upsert_row 逻辑（避免重复验证和日志）
        name_to_match = name.strip()
        existing = db.query(TableClass).filter(
            TableClass.神殿名称 == normalized_campus,
            TableClass.年份 == 年份,
            TableClass.月份 == month,
            TableClass.姓名 == name_to_match,
        ).first()
        
        def _n(v: Any) -> Optional[int]:
            if v is None or v == "":
                return None
            try:
                return int(v)
            except (ValueError, TypeError):
                return None
        
        # 计算平均分（13个评分项的平均值）
        sum_score = (
            (_n(_g(r, "values", "价值观")) or 0) +
            (_n(_g(r, "responsibility", "责任感")) or 0) +
            (_n(_g(r, "execution", "执行力")) or 0) +
            (_n(_g(r, "planning", "计划")) or 0) +
            (_n(_g(r, "organization", "组织")) or 0) +
            (_n(_g(r, "leadership", "领导")) or 0) +
            (_n(_g(r, "control", "控制")) or 0) +
            (_n(_g(r, "studentEmployment", "学员就业")) or 0) +
            (_n(_g(r, "reputationEnrollment", "口碑招生")) or 0) +
            (_n(_g(r, "studentAttrition", "学员流失")) or 0) +
            (_n(_g(r, "furtherEducation", "升学")) or 0) +
            (_n(_g(r, "academicManagement", "教务管理能力")) or 0) +
            (_n(_g(r, "dormitoryManagement", "宿舍管理能力")) or 0)
        )
        # 平均分 = 总和 / 13，保留一位小数
        total = round(sum_score / 13, 1) if sum_score > 0 else 0
        
        if existing:
            # 更新现有记录
            existing.价值观 = _n(_g(r, "values", "价值观")) if _g(r, "values", "价值观") is not None else existing.价值观
            existing.责任感 = _n(_g(r, "responsibility", "责任感")) if _g(r, "responsibility", "责任感") is not None else existing.责任感
            existing.执行力 = _n(_g(r, "execution", "执行力")) if _g(r, "execution", "执行力") is not None else existing.执行力
            existing.计划 = _n(_g(r, "planning", "计划")) if _g(r, "planning", "计划") is not None else existing.计划
            existing.组织 = _n(_g(r, "organization", "组织")) if _g(r, "organization", "组织") is not None else existing.组织
            existing.领导 = _n(_g(r, "leadership", "领导")) if _g(r, "leadership", "领导") is not None else existing.领导
            existing.控制 = _n(_g(r, "control", "控制")) if _g(r, "control", "控制") is not None else existing.控制
            existing.学员就业 = _n(_g(r, "studentEmployment", "学员就业")) if _g(r, "studentEmployment", "学员就业") is not None else existing.学员就业
            existing.口碑招生 = _n(_g(r, "reputationEnrollment", "口碑招生")) if _g(r, "reputationEnrollment", "口碑招生") is not None else existing.口碑招生
            existing.学员流失 = _n(_g(r, "studentAttrition", "学员流失")) if _g(r, "studentAttrition", "学员流失") is not None else existing.学员流失
            existing.升学 = _n(_g(r, "furtherEducation", "升学")) if _g(r, "furtherEducation", "升学") is not None else existing.升学
            existing.教务管理能力 = _n(_g(r, "academicManagement", "教务管理能力")) if _g(r, "academicManagement", "教务管理能力") is not None else existing.教务管理能力
            existing.宿舍管理能力 = _n(_g(r, "dormitoryManagement", "宿舍管理能力")) if _g(r, "dormitoryManagement", "宿舍管理能力") is not None else existing.宿舍管理能力
            existing.合计分数 = total if total > 0 else existing.合计分数
            existing.备注 = _g(r, "remark", "备注") if _g(r, "remark", "备注") is not None else existing.备注
            if verbose and idx % 10 == 0:
                print(f"[replace_rows] 已更新 {idx}/{len(行列表)} 条记录")
        else:
            # 创建新记录
            # 验证新记录的类确实是正确的表类
            if TableClass.__tablename__ != table_name:
                raise ValueError(f"[replace_rows] ✗✗✗ 创建新记录时表名不匹配! 职位类型={职位类型}, 期望表={table_name}, 实际表={TableClass.__tablename__}")
            
            new_row = TableClass(
                神殿名称=normalized_campus,
                年份=int(年份 or 0),
                月份=month,
                姓名=name_to_match,
                价值观=_n(_g(r, "values", "价值观")),
                责任感=_n(_g(r, "responsibility", "责任感")),
                执行力=_n(_g(r, "execution", "执行力")),
                计划=_n(_g(r, "planning", "计划")),
                组织=_n(_g(r, "organization", "组织")),
                领导=_n(_g(r, "leadership", "领导")),
                控制=_n(_g(r, "control", "控制")),
                学员就业=_n(_g(r, "studentEmployment", "学员就业")),
                口碑招生=_n(_g(r, "reputationEnrollment", "口碑招生")),
                学员流失=_n(_g(r, "studentAttrition", "学员流失")),
                升学=_n(_g(r, "furtherEducation", "升学")),
                教务管理能力=_n(_g(r, "academicManagement", "教务管理能力")),
                宿舍管理能力=_n(_g(r, "dormitoryManagement", "宿舍管理能力")),
                合计分数=total,
                备注=_g(r, "remark", "备注"),
            )
            # 再次验证 new_row 对象的表名
            row_table_name = new_row.__class__.__tablename__
            if row_table_name != table_name:
                raise ValueError(f"[replace_rows] ✗✗✗ 新记录对象表名不匹配! 职位类型={职位类型}, 期望表={table_name}, 实际表={row_table_name}")
            
            db.add(new_row)
            if idx % 10 == 0 or idx == 1 or idx == len(行列表):
                print(f"[replace_rows] ✓ 已添加到表 {table_name}: {idx}/{len(行列表)} 条记录 (职位类型={职位类型}, 姓名={name_to_match}, 月份={month})")
        
        processed_count += 1
    
    try:
        db.flush()
        if verbose:
            print(f"[replace_rows] flush 完成: 处理了 {processed_count} 条记录")
            logger.info(f"[replace_rows] flush 完成: 处理了 {processed_count} 条记录")
    except Exception as flush_error:
        error_msg = f"[replace_rows] ✗ flush 失败: {type(flush_error).__name__}: {flush_error}"
        print(error_msg)
        logger.error(error_msg, exc_info=True)
        raise

def migrate_old_data(db: Session):
    """
    数据迁移：将旧表（经理功能分析月表）的数据迁移到新表
    根据姓名匹配用户表中的职位，决定迁移到哪个表
    """
    _migrate()
    from sqlalchemy import text
    
    try:
        # 检查旧表是否存在
        with engine.begin() as conn:
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'teaching_quality' 
                    AND table_name = '经理功能分析月表'
                )
            """))
            if not result.scalar():
                print("[数据迁移] 旧表不存在，跳过迁移")
                return
        
        # 获取旧表数据
        old_records = db.query(经理功能分析月表).all()
        
        if not old_records:
            print("[数据迁移] 旧表无数据，跳过迁移")
            return
        
        print(f"[数据迁移] 开始迁移 {len(old_records)} 条记录")
        
        # 获取用户表数据，用于判断职位
        try:
            from app.models.user import User
            users = db.query(User).all()
            user_position_map = {}
            for user in users:
                # 使用 real_name 作为 key，position 作为 value
                if user.real_name and user.position:
                    user_position_map[user.real_name] = user.position
                    # 调试：打印用户信息
                    if "郭彩兰" in user.real_name or "姜楠" in user.real_name:
                        print(f"[数据迁移] 用户: {user.real_name}, 职位: {user.position}, 神殿: {getattr(user, 'campus', 'N/A')}")
        except Exception as e:
            print(f"[数据迁移] 获取用户表数据失败: {e}")
            import traceback
            traceback.print_exc()
            user_position_map = {}
        
        print(f"[数据迁移] 用户职位映射表大小: {len(user_position_map)}")
        # 打印"郭彩兰"的职位信息
        if "郭彩兰" in user_position_map:
            print(f"[数据迁移] 郭彩兰的职位: {user_position_map['郭彩兰']}")
        else:
            print("[数据迁移] 警告: 未找到'郭彩兰'的用户记录")
        
        migrated_manager = 0
        migrated_deputy = 0
        skipped = 0
        
        for old_record in old_records:
            # 根据用户表中的职位判断应该迁移到哪个表
            position = user_position_map.get(old_record.姓名, "")
            
            if position == "教质经理":
                # 迁移到经理表
                upsert_row(
                    db,
                    神殿名称=old_record.神殿名称,
                    年份=old_record.年份,
                    月份=old_record.月份,
                    姓名=old_record.姓名,
                    职位类型="manager",
                    价值观=old_record.价值观,
                    责任感=old_record.责任感,
                    执行力=old_record.执行力,
                    计划=old_record.计划,
                    组织=old_record.组织,
                    领导=old_record.领导,
                    控制=old_record.控制,
                    学员就业=old_record.学员就业,
                    口碑招生=old_record.口碑招生,
                    学员流失=old_record.学员流失,
                    升学=old_record.升学,
                    教务管理能力=old_record.教务管理能力,
                    宿舍管理能力=old_record.宿舍管理能力,
                    备注=old_record.备注,
                )
                migrated_manager += 1
            elif position == "教质副经理":
                # 迁移到副经理表
                upsert_row(
                    db,
                    神殿名称=old_record.神殿名称,
                    年份=old_record.年份,
                    月份=old_record.月份,
                    姓名=old_record.姓名,
                    职位类型="deputy",
                    价值观=old_record.价值观,
                    责任感=old_record.责任感,
                    执行力=old_record.执行力,
                    计划=old_record.计划,
                    组织=old_record.组织,
                    领导=old_record.领导,
                    控制=old_record.控制,
                    学员就业=old_record.学员就业,
                    口碑招生=old_record.口碑招生,
                    学员流失=old_record.学员流失,
                    升学=old_record.升学,
                    教务管理能力=old_record.教务管理能力,
                    宿舍管理能力=old_record.宿舍管理能力,
                    备注=old_record.备注,
                )
                migrated_deputy += 1
            else:
                # 无法确定职位，跳过
                skipped += 1
                print(f"[数据迁移] 跳过记录: {old_record.姓名} (职位: {position or '未知'})")
        
        db.commit()
        print(f"[数据迁移] 迁移完成: 经理表 {migrated_manager} 条, 副经理表 {migrated_deputy} 条, 跳过 {skipped} 条")
        
    except Exception as e:
        db.rollback()
        print(f"[数据迁移] 迁移失败: {e}")
        raise
