"""
祈福司员工功能分析服务层
"""

from typing import Dict, List

from app.crud.consult.staff_function import 员工功能分析评分CRUD
from app.schemas.consult.staff_function import SCORE_NO_TO_FIELD
from sqlalchemy.orm import Session


class StaffFunctionService:
    """员工功能分析服务"""

    @staticmethod
    def get_campus_staff_with_scores(db: Session, year: int, campus: str) -> Dict:
        """
        获取神殿员工列表并附带评分数据
        """
        # 获取员工列表
        staff_data = 员工功能分析评分CRUD.get_campus_staff_from_users(db, campus)
        
        # 获取评分数据
        records = 员工功能分析评分CRUD.get_by_year_campus(db, year, campus)
        score_map = 员工功能分析评分CRUD.build_score_map(records)
        
        # 计算每个员工的总分
        def calc_staff_total(staff_id: str) -> int:
            total = 0
            for item_no in SCORE_NO_TO_FIELD.keys():
                key = f"{staff_id}_{item_no}"
                total += score_map.get(key, 0)
            return total
        
        # 附加总分到员工信息
        if staff_data.get("principal"):
            staff_data["principal"]["total_score"] = calc_staff_total(staff_data["principal"]["id"])
        
        for m in staff_data.get("managers", []):
            m["total_score"] = calc_staff_total(m["id"])
        
        for c in staff_data.get("consultants", []):
            c["total_score"] = calc_staff_total(c["id"])
        
        staff_data["score_map"] = score_map
        staff_data["year"] = year
        
        return staff_data

    @staticmethod
    def batch_save_scores(db: Session, year: int, campus: str, 
                         scores_data: Dict[str, Dict[str, int]]) -> Dict:
        """
        批量保存员工评分
        scores_data: {员工ID: {字段名: 分数, ...}, ...}
        """
        # 获取员工信息
        staff_data = 员工功能分析评分CRUD.get_campus_staff_from_users(db, campus)
        
        # 构建员工ID到信息的映射
        staff_info_map = {}
        if staff_data.get("principal"):
            p = staff_data["principal"]
            staff_info_map[p["id"]] = {
                "name": p["name"],
                "position": p.get("position", "校长"),
                "role": "principal"
            }
        for m in staff_data.get("managers", []):
            staff_info_map[m["id"]] = {
                "name": m["name"],
                "position": m.get("position", "干部"),
                "role": "manager"
            }
        for c in staff_data.get("consultants", []):
            staff_info_map[c["id"]] = {
                "name": c["name"],
                "position": c.get("position", "咨询师"),
                "role": "consultant"
            }
        
        saved_count = 0
        errors = []
        
        for staff_id, scores in scores_data.items():
            try:
                staff_info = staff_info_map.get(staff_id, {
                    "name": "未知",
                    "position": "未知",
                    "role": "consultant"
                })
                
                员工功能分析评分CRUD.upsert(
                    db=db,
                    year=year,
                    campus=campus,
                    staff_id=staff_id,
                    staff_name=staff_info["name"],
                    staff_position=staff_info["position"],
                    staff_role=staff_info["role"],
                    scores=scores
                )
                saved_count += 1
            except Exception as e:
                errors.append({"staff_id": staff_id, "error": str(e)})
        
        return {
            "success": len(errors) == 0,
            "saved_count": saved_count,
            "errors": errors
        }

    @staticmethod
    def get_campus_ranking(db: Session, year: int, campus: str) -> List[Dict]:
        """
        获取神殿员工功能评分排名
        """
        records = 员工功能分析评分CRUD.get_by_year_campus(db, year, campus)
        
        rankings = []
        for record in records:
            rankings.append({
                "staff_id": record.员工ID,
                "staff_name": record.员工姓名,
                "staff_position": record.员工岗位,
                "staff_role": record.员工角色,
                "total_score": record.总分 or 0
            })
        
        # 按总分降序排列
        rankings.sort(key=lambda x: x["total_score"], reverse=True)
        
        # 添加排名
        for i, item in enumerate(rankings):
            item["rank"] = i + 1
        
        return rankings

    @staticmethod
    def get_all_campus_summary(db: Session, year: int) -> List[Dict]:
        """
        获取所有神殿的员工功能评分汇总
        """
        records = 员工功能分析评分CRUD.get_by_year(db, year)
        
        # 按神殿分组
        campus_data = {}
        for record in records:
            campus = record.神殿
            if campus not in campus_data:
                campus_data[campus] = {
                    "campus": campus,
                    "staff_count": 0,
                    "total_score": 0,
                    "avg_score": 0
                }
            campus_data[campus]["staff_count"] += 1
            campus_data[campus]["total_score"] += record.总分 or 0
        
        # 计算平均分
        for data in campus_data.values():
            if data["staff_count"] > 0:
                data["avg_score"] = round(data["total_score"] / data["staff_count"], 2)
        
        # 转换为列表并排序
        result = list(campus_data.values())
        result.sort(key=lambda x: x["avg_score"], reverse=True)
        
        return result
