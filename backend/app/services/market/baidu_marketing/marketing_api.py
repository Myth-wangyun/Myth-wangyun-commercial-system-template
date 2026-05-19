"""
百度营销API - API调用服务

提供百度营销API的统一调用封装
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

from .token_service import BaiduTokenService

logger = logging.getLogger(__name__)


class BaiduMarketingAPI:
    """
    百度营销API调用服务
    
    封装搜索广告、信息流广告等API调用
    """
    
    # API基础URL
    BASE_URL = "https://api.baidu.com/json/sms/service"
    
    # 常见错误码
    ERROR_CODES = {
        89403: "header中缺少accessToken信息",
        89405: "accessToken校验异常",
        89406: "accessToken校验不通过",
        894061: "accessToken已过期",
        894062: "授权已失效，需要重新授权",
        894063: "应用已重置，需要重新授权",
        894064: "推广用户已解除授权",
        89407: "应用ID不可用",
    }
    
    def __init__(self, token_service: BaiduTokenService):
        """
        初始化API服务
        
        Args:
            token_service: Token管理服务实例
        """
        self.token_service = token_service
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """获取HTTP客户端"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client
    
    async def close(self):
        """关闭HTTP客户端"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def _call_api(
        self,
        service: str,
        method: str,
        user_name: str,
        user_id: int,
        body: Dict[str, Any],
        db=None
    ) -> Dict[str, Any]:
        """
        统一API调用方法
        
        Args:
            service: 服务名称（如 AccountService）
            method: 方法名称（如 getAccountInfo）
            user_name: 推广账户名称
            user_id: 用户ID
            body: 请求体
            db: 数据库会话（可选）
            
        Returns:
            API返回结果
        """
        # 获取有效的accessToken
        access_token = await self.token_service.get_valid_access_token(user_id, db)
        
        if access_token is None:
            return {
                "header": {
                    "status": -1,
                    "desc": "无法获取有效的accessToken",
                },
                "body": None,
            }
        
        # 构建请求
        url = f"{self.BASE_URL}/{service}/{method}"
        payload = {
            "header": {
                "userName": user_name,
                "accessToken": access_token,
            },
            "body": body,
        }
        
        client = await self._get_client()
        
        try:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()
            
            # 检查错误码
            header = result.get("header", {})
            status = header.get("status", 0)
            
            if status != 0:
                error_desc = self.ERROR_CODES.get(
                    status,
                    header.get("desc", f"未知错误: {status}")
                )
                logger.error(f"API调用失败: {service}/{method}, status={status}, desc={error_desc}")
                
                # 如果是Token相关错误，可能需要特殊处理
                if status == 894061:  # accessToken已过期
                    logger.warning("accessToken已过期，尝试刷新...")
                    # 强制刷新Token
                    await self.token_service.refresh_token(user_id, db)
            else:
                logger.info(f"API调用成功: {service}/{method}")
            
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"API调用HTTP错误: {service}/{method}, error={e}")
            return {
                "header": {
                    "status": -1,
                    "desc": f"HTTP错误: {str(e)}",
                },
                "body": None,
            }
        except Exception as e:
            logger.error(f"API调用异常: {service}/{method}, error={e}")
            return {
                "header": {
                    "status": -1,
                    "desc": f"异常: {str(e)}",
                },
                "body": None,
            }
    
    # ==================== 账户管理 API ====================
    
    async def get_account_info(
        self,
        user_name: str,
        user_id: int,
        account_fields: Optional[List[str]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取账户信息
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            account_fields: 要返回的字段列表
            db: 数据库会话（可选）
            
        Returns:
            账户信息
        """
        if account_fields is None:
            account_fields = [
                "userId",
                "balance",
                "pcBalance",
                "mobileBalance",
                "cost",
                "payment",
                "budgetType",
                "budget",
            ]
        
        body = {"accountFields": account_fields}
        
        return await self._call_api(
            "AccountService",
            "getAccountInfo",
            user_name,
            user_id,
            body,
            db
        )
    
    async def update_account_info(
        self,
        user_name: str,
        user_id: int,
        account_info: Dict[str, Any],
        db=None
    ) -> Dict[str, Any]:
        """
        更新账户信息
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            account_info: 账户信息
            db: 数据库会话（可选）
            
        Returns:
            更新结果
        """
        body = {"accountInfo": account_info}
        
        return await self._call_api(
            "AccountService",
            "updateAccountInfo",
            user_name,
            user_id,
            body,
            db
        )
    
    # ==================== 搜索广告推广计划 API ====================
    
    async def get_campaign(
        self,
        user_name: str,
        user_id: int,
        campaign_ids: Optional[List[int]] = None,
        campaign_fields: Optional[List[str]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取推广计划
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            campaign_ids: 计划ID列表（为空则获取所有）
            campaign_fields: 要返回的字段列表
            db: 数据库会话（可选）
            
        Returns:
            计划信息
        """
        if campaign_fields is None:
            campaign_fields = [
                "campaignId",
                "campaignName",
                "budget",
                "status",
                "pauseStatus",
            ]
        
        body: dict[str, list[str] | list[int]] = {
            "campaignFields": campaign_fields,
        }
        
        if campaign_ids:
            body["ids"] = campaign_ids
        
        return await self._call_api(
            "CampaignService",
            "getCampaign",
            user_name,
            user_id,
            body,
            db
        )
    
    async def add_campaign(
        self,
        user_name: str,
        user_id: int,
        campaigns: List[Dict[str, Any]],
        db=None
    ) -> Dict[str, Any]:
        """
        添加推广计划
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            campaigns: 计划列表
            db: 数据库会话（可选）
            
        Returns:
            添加结果
        """
        body = {"campaignTypes": campaigns}
        
        return await self._call_api(
            "CampaignService",
            "addCampaign",
            user_name,
            user_id,
            body,
            db
        )
    
    async def update_campaign(
        self,
        user_name: str,
        user_id: int,
        campaigns: List[Dict[str, Any]],
        db=None
    ) -> Dict[str, Any]:
        """
        更新推广计划
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            campaigns: 计划列表
            db: 数据库会话（可选）
            
        Returns:
            更新结果
        """
        body = {"campaignTypes": campaigns}
        
        return await self._call_api(
            "CampaignService",
            "updateCampaign",
            user_name,
            user_id,
            body,
            db
        )
    
    async def delete_campaign(
        self,
        user_name: str,
        user_id: int,
        campaign_ids: List[int],
        db=None
    ) -> Dict[str, Any]:
        """
        删除推广计划
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            campaign_ids: 计划ID列表
            db: 数据库会话（可选）
            
        Returns:
            删除结果
        """
        body = {"campaignIds": campaign_ids}
        
        return await self._call_api(
            "CampaignService",
            "deleteCampaign",
            user_name,
            user_id,
            body,
            db
        )
    
    # ==================== 搜索广告推广单元 API ====================
    
    async def get_adgroup(
        self,
        user_name: str,
        user_id: int,
        adgroup_ids: Optional[List[int]] = None,
        campaign_ids: Optional[List[int]] = None,
        adgroup_fields: Optional[List[str]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取推广单元
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            adgroup_ids: 单元ID列表
            campaign_ids: 计划ID列表
            adgroup_fields: 要返回的字段列表
            db: 数据库会话（可选）
            
        Returns:
            单元信息
        """
        if adgroup_fields is None:
            adgroup_fields = [
                "adgroupId",
                "adgroupName",
                "campaignId",
                "status",
                "pauseStatus",
                "maxPrice",
            ]
        
        body: dict[str, list[str] | list[int]] = {
            "adgroupFields": adgroup_fields,
        }
        
        if adgroup_ids:
            body["ids"] = adgroup_ids
        if campaign_ids:
            body["campaignIds"] = campaign_ids
        
        return await self._call_api(
            "AdgroupService",
            "getAdgroup",
            user_name,
            user_id,
            body,
            db
        )
    
    # ==================== 搜索广告关键词 API ====================
    
    async def get_word(
        self,
        user_name: str,
        user_id: int,
        word_ids: Optional[List[int]] = None,
        adgroup_ids: Optional[List[int]] = None,
        word_fields: Optional[List[str]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取关键词
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            word_ids: 关键词ID列表
            adgroup_ids: 单元ID列表
            word_fields: 要返回的字段列表
            db: 数据库会话（可选）
            
        Returns:
            关键词信息
        """
        if word_fields is None:
            word_fields = [
                "wordId",
                "word",
                "adgroupId",
                "campaignId",
                "price",
                "status",
                "pauseStatus",
                "matchType",
            ]
        
        body: dict[str, list[str] | list[int]] = {
            "wordFields": word_fields,
        }
        
        if word_ids:
            body["ids"] = word_ids
        if adgroup_ids:
            body["adgroupIds"] = adgroup_ids
        
        return await self._call_api(
            "WordService",
            "getWord",
            user_name,
            user_id,
            body,
            db
        )
    
    async def update_word(
        self,
        user_name: str,
        user_id: int,
        words: List[Dict[str, Any]],
        db=None
    ) -> Dict[str, Any]:
        """
        更新关键词（可用于改价）
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            words: 关键词列表，每个包含 wordId 和要更新的字段
            db: 数据库会话（可选）
            
        Returns:
            更新结果
        """
        body = {"wordTypes": words}
        
        return await self._call_api(
            "WordService",
            "updateWord",
            user_name,
            user_id,
            body,
            db
        )
    
    # ==================== 数据报告 API ====================
    
    async def get_real_time_data(
        self,
        user_name: str,
        user_id: int,
        report_type: int,
        level_of_details: int,
        start_date: str,
        end_date: str,
        stat_ids: Optional[List[int]] = None,
        device: Optional[int] = None,
        performance_data: Optional[List[str]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取实时数据报告
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            report_type: 报告类型（2: 账户, 3: 计划, 5: 单元, 7: 关键词, 11: 创意）
            level_of_details: 时间粒度（1: 按月, 2: 按周, 3: 按日, 5: 按小时）
            start_date: 开始日期（YYYY-MM-DD）
            end_date: 结束日期（YYYY-MM-DD）
            stat_ids: 统计对象ID列表
            device: 设备类型（0: 全部, 1: PC, 2: 移动）
            performance_data: 指标列表
            db: 数据库会话（可选）
            
        Returns:
            报告数据
        """
        if performance_data is None:
            performance_data = [
                "impression",
                "click",
                "cost",
                "ctr",
                "cpc",
            ]
        
        req_type: dict[str, int | str | list[str] | list[int]] = {
            "reportType": report_type,
            "levelOfDetails": level_of_details,
            "startDate": start_date,
            "endDate": end_date,
            "performanceData": performance_data,
        }
        
        if stat_ids:
            req_type["statIds"] = stat_ids
        if device is not None:
            req_type["device"] = device

        body: dict[str, dict[str, int | str | list[str] | list[int]]] = {
            "realTimeRequestType": req_type,
        }
        
        return await self._call_api(
            "ReportService",
            "getRealTimeData",
            user_name,
            user_id,
            body,
            db
        )
    
    async def get_professional_report_id(
        self,
        user_name: str,
        user_id: int,
        report_type: int,
        start_date: str,
        end_date: str,
        level_of_details: int = 3,
        stat_range: int = 2,
        unit_of_time: int = 5,
        performance_data: Optional[List[str]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取专业报告ID（异步报告）
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            report_type: 报告类型
            start_date: 开始日期
            end_date: 结束日期
            level_of_details: 数据层级
            stat_range: 统计范围
            unit_of_time: 时间粒度
            performance_data: 指标列表
            db: 数据库会话（可选）
            
        Returns:
            包含reportId的结果
        """
        if performance_data is None:
            performance_data = [
                "impression",
                "click",
                "cost",
                "ctr",
                "cpc",
                "conversion",
            ]
        
        body = {
            "reportRequestType": {
                "reportType": report_type,
                "startDate": start_date,
                "endDate": end_date,
                "levelOfDetails": level_of_details,
                "statRange": stat_range,
                "unitOfTime": unit_of_time,
                "performanceData": performance_data,
            }
        }
        
        return await self._call_api(
            "ReportService",
            "getProfessionalReportId",
            user_name,
            user_id,
            body,
            db
        )
    
    async def get_report_state(
        self,
        user_name: str,
        user_id: int,
        report_id: str,
        db=None
    ) -> Dict[str, Any]:
        """
        获取专业报告状态
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            report_id: 报告ID
            db: 数据库会话（可选）
            
        Returns:
            报告状态（3: 生成中, 2: 已完成）
        """
        body = {"reportId": report_id}
        
        return await self._call_api(
            "ReportService",
            "getReportState",
            user_name,
            user_id,
            body,
            db
        )
    
    async def get_report_file_url(
        self,
        user_name: str,
        user_id: int,
        report_id: str,
        db=None
    ) -> Dict[str, Any]:
        """
        获取专业报告文件URL
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            report_id: 报告ID
            db: 数据库会话（可选）
            
        Returns:
            报告文件URL
        """
        body = {"reportId": report_id}
        
        return await self._call_api(
            "ReportService",
            "getReportFileUrl",
            user_name,
            user_id,
            body,
            db
        )
    
    # ==================== 一站式多渠道报告 API ====================
    
    async def get_multi_channel_report(
        self,
        user_name: str,
        user_id: int,
        start_date: str,
        end_date: str,
        time_unit: str = "DAY",
        columns: Optional[List[str]] = None,
        products: Optional[List[int]] = None,
        start_row: int = 0,
        row_count: int = 200,
        need_sum: bool = False,
        db=None
    ) -> Dict[str, Any]:
        """
        获取一站式多渠道报告数据
        
        获取账户粒度的多渠道数据（包括搜索推广、信息流推广、阿拉丁推广、知识营销）
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            start_date: 开始日期（格式: YYYY-MM-DD）
            end_date: 结束日期（格式: YYYY-MM-DD）
            time_unit: 时间单位
                - HOUR: 小时
                - DAY: 天
                - WEEK: 周
                - MONTH: 月
                - SUMMARY: 时间段汇总
            columns: 要返回的字段列表，可选值:
                - date: 日期
                - userName: 账户名
                - userId: 账户ID
                - product: 投放渠道
                - impression: 展现
                - click: 点击
                - cost: 消费
                - ctr: 点击率
                - cpc: 平均点击价格
            products: 投放渠道过滤，可选值:
                - 0: 搜索推广
                - 1: 信息流推广
                - 3: 阿拉丁推广
                - 4: 知识营销
            start_row: 起始行（分页）
            row_count: 返回行数（最大200）
            need_sum: 是否需要汇总
            db: 数据库会话（可选）
            
        Returns:
            报告数据
            
        Note:
            支持的最大时间区间: 824天
        """
        # 默认返回字段：展点消
        if columns is None:
            columns = [
                "product",
                "date",
                "cost",
                "impression",
                "click",
            ]
        
        # 构建请求体
        body: dict[str, object] = {
            "reportType": 1783967,  # 一站式多渠道报告固定类型
            "startDate": start_date,
            "endDate": end_date,
            "timeUnit": time_unit,
            "columns": columns,
            "startRow": start_row,
            "rowCount": min(row_count, 200),  # 最大200
            "needSum": need_sum,
        }
        
        # 添加渠道过滤
        if products is not None:
            body["filters"] = [
                {
                    "column": "product",
                    "operator": "IN",
                    "values": products,
                }
            ]
        
        return await self._call_open_api_report(
            user_name,
            user_id,
            body,
            db
        )
    
    async def _call_open_api_report(
        self,
        user_name: str,
        user_id: int,
        body: Dict[str, Any],
        db=None
    ) -> Dict[str, Any]:
        """
        调用OpenApiReportService报告接口
        
        这是专门用于一站式报告的API调用方法
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            body: 请求体
            db: 数据库会话（可选）
            
        Returns:
            API返回结果
        """
        # 获取有效的accessToken
        access_token = await self.token_service.get_valid_access_token(user_id, db)
        
        if access_token is None:
            return {
                "status": -1,
                "success": False,
                "data": None,
                "message": "无法获取有效的accessToken",
            }
        
        # 构建请求 - OpenApiReportService使用不同的请求格式
        url = f"{self.BASE_URL}/OpenApiReportService/getReportData"
        
        # 注意：这个接口的请求格式与其他接口不同
        payload = {
            "header": {
                "userName": user_name,
                "accessToken": access_token,
            },
            "body": body,
        }
        
        client = await self._get_client()
        
        try:
            logger.info(f"调用一站式报告API: {url}")
            logger.debug(f"请求体: {payload}")
            
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()
            
            # OpenApiReportService返回格式: {status: 200, success: true, data: {...}}
            status = result.get("status", 0)
            success = result.get("success", False)
            
            if status != 200 or not success:
                logger.error(f"一站式报告API调用失败: status={status}, result={result}")
            else:
                data = result.get("data", {})
                logger.info(f"一站式报告API调用成功: totalRowCount={data.get('totalRowCount', 0)}")
            
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"一站式报告API HTTP错误: {e}")
            return {
                "status": -1,
                "success": False,
                "data": None,
                "message": f"HTTP错误: {str(e)}",
            }
        except Exception as e:
            logger.error(f"一站式报告API调用异常: {e}")
            return {
                "status": -1,
                "success": False,
                "data": None,
                "message": f"异常: {str(e)}",
            }
    
    async def get_daily_cost_report(
        self,
        user_name: str,
        user_id: int,
        start_date: str,
        end_date: str,
        products: Optional[List[int]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取每日展点消数据（便捷方法）
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            start_date: 开始日期（格式: YYYY-MM-DD）
            end_date: 结束日期（格式: YYYY-MM-DD）
            products: 投放渠道过滤
            db: 数据库会话（可选）
            
        Returns:
            报告数据
        """
        return await self.get_multi_channel_report(
            user_name=user_name,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            time_unit="DAY",
            columns=["product", "date", "cost", "impression", "click", "ctr", "cpc"],
            products=products,
            db=db,
        )
    
    async def get_hourly_cost_report(
        self,
        user_name: str,
        user_id: int,
        date: str,
        products: Optional[List[int]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取小时级展点消数据（便捷方法）
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            date: 日期（格式: YYYY-MM-DD）
            products: 投放渠道过滤
            db: 数据库会话（可选）
            
        Returns:
            报告数据
        """
        return await self.get_multi_channel_report(
            user_name=user_name,
            user_id=user_id,
            start_date=date,
            end_date=date,
            time_unit="HOUR",
            columns=["product", "date", "cost", "impression", "click"],
            products=products,
            db=db,
        )
    
    async def get_summary_cost_report(
        self,
        user_name: str,
        user_id: int,
        start_date: str,
        end_date: str,
        products: Optional[List[int]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取时间段汇总展点消数据（便捷方法）
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            start_date: 开始日期（格式: YYYY-MM-DD）
            end_date: 结束日期（格式: YYYY-MM-DD）
            products: 投放渠道过滤
            db: 数据库会话（可选）
            
        Returns:
            报告数据
        """
        return await self.get_multi_channel_report(
            user_name=user_name,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            time_unit="SUMMARY",
            columns=["product", "date", "cost", "impression", "click", "ctr", "cpc"],
            products=products,
            need_sum=True,
            db=db,
        )
    
    # ==================== 信息流广告 API ====================
    
    async def get_feed_campaign(
        self,
        user_name: str,
        user_id: int,
        campaign_ids: Optional[List[int]] = None,
        campaign_fields: Optional[List[str]] = None,
        db=None
    ) -> Dict[str, Any]:
        """
        获取信息流推广计划
        
        Args:
            user_name: 推广账户名称
            user_id: 用户ID
            campaign_ids: 计划ID列表
            campaign_fields: 要返回的字段列表
            db: 数据库会话（可选）
            
        Returns:
            计划信息
        """
        if campaign_fields is None:
            campaign_fields = [
                "campaignId",
                "campaignName",
                "budget",
                "status",
            ]
        
        body: dict[str, list[str] | list[int]] = {
            "campaignFields": campaign_fields,
        }
        
        if campaign_ids:
            body["campaignIds"] = campaign_ids
        
        return await self._call_api(
            "FeedCampaignService",
            "getFeedCampaign",
            user_name,
            user_id,
            body,
            db
        )
