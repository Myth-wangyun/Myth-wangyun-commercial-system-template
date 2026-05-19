"""
咨询量录入系统数据模式
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ==================== 咨询量主表模式 ====================

class 咨询量主表创建(BaseModel):
    """创建咨询量主表"""
    电话列表: List[str] = Field(default_factory=list, description="电话号码列表（只录入微信时可为空）")
    咨询日期列表: List[str] = Field(default_factory=list, description="咨询日期列表")
    最新咨询者姓名: Optional[str] = Field(None, max_length=50, description="最新咨询者姓名")
    最新状态: Optional[str] = Field(None, max_length=20, description="最新状态")
    首次登记时间: datetime = Field(..., description="首次登记时间")
    首次分量人: Optional[str] = Field(None, max_length=50, description="首次分量人")
    首次咨询师: Optional[str] = Field(None, max_length=50, description="首次咨询师")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 咨询量主表更新(BaseModel):
    """更新咨询量主表"""
    对象ID: int = Field(..., description="对象ID")
    电话列表: Optional[List[str]] = Field(None, description="电话号码列表")
    最新咨询者姓名: Optional[str] = Field(None, max_length=50, description="最新咨询者姓名")
    最新状态: Optional[str] = Field(None, max_length=20, description="最新状态")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 咨询量主表响应(BaseModel):
    """咨询量主表响应"""
    对象ID: int = Field(..., description="对象ID")
    电话列表: List[str] = Field(..., description="电话号码列表")
    咨询日期列表: List[str] = Field(default_factory=list, description="咨询日期列表")
    最新咨询者姓名: Optional[str] = Field(None, description="最新咨询者姓名")
    最新状态: Optional[str] = Field(None, description="最新状态")
    咨询次数: int = Field(..., description="咨询次数")
    首次登记时间: Optional[datetime] = Field(None, description="首次登记时间")
    首次分量人: Optional[str] = Field(None, description="首次分量人")
    首次咨询师: Optional[str] = Field(None, description="首次咨询师")
    最后更新时间: Optional[datetime] = Field(None, description="最后更新时间")
    神殿: Optional[str] = Field(None, description="神殿")

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 咨询量主表分页响应(BaseModel):
    """咨询量主表分页响应"""
    总记录数: int = Field(..., description="总记录数")
    总页数: int = Field(..., description="总页数")
    当前页: int = Field(..., description="当前页")
    每页数量: int = Field(..., description="每页数量")
    数据列表: List[咨询量主表响应] = Field(..., description="数据列表")


# ==================== 咨询量明细表模式 ====================

class 咨询量明细表创建(BaseModel):
    """创建咨询量明细记录"""
    对象ID: Optional[int] = Field(None, description="关联的对象ID，为空时自动创建")
    登记日期: datetime = Field(..., description="登记日期，精确到年月日时分秒")
    分量人: Optional[str] = Field(None, max_length=50, description="分量人")
    咨询师: Optional[str] = Field(None, max_length=50, description="咨询师")
    咨询者姓名: Optional[str] = Field(None, max_length=50, description="咨询者姓名")
    年龄: Optional[str] = Field(None, max_length=20, description="年龄")
    性别: Optional[str] = Field(None, max_length=10, description="性别")
    电话: Optional[str] = Field(None, max_length=20, description="电话（与微信二选一必填）")
    第二电话: Optional[str] = Field(None, max_length=20, description="第二电话")
    QQ: Optional[str] = Field(None, max_length=20, description="QQ")
    微信: Optional[str] = Field(None, max_length=50, description="微信（与电话二选一必填）")
    抖音: Optional[str] = Field(None, max_length=50, description="抖音")
    快手: Optional[str] = Field(None, max_length=50, description="快手")
    学历: Optional[str] = Field(None, max_length=20, description="学历")
    状态: Optional[str] = Field(None, max_length=20, description="状态")
    位置: Optional[str] = Field(None, max_length=100, description="位置")
    报名意向: Optional[str] = Field(None, max_length=50, description="报名意向")
    咨询类别: Optional[str] = Field(None, max_length=50, description="咨询类别")
    量来源: Optional[str] = Field(None, max_length=50, description="量来源")
    来源类别: Optional[str] = Field(None, max_length=50, description="来源类别（第二级分类）")
    媒体来源: Optional[str] = Field(None, max_length=50, description="媒体来源")
    关键字: Optional[str] = Field(None, max_length=50, description="关键字")
    口碑提供人: Optional[str] = Field(None, max_length=50, description="口碑提供人（量来源为口碑时填写）")
    备注: Optional[str] = Field(None, description="备注")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")
    录量人: Optional[str] = Field(None, max_length=50, description="录量人（当前登录用户的real_name）")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")
    
    # 标记字段
    是否无效量: Optional[int] = Field(0, description="是否无效量：0-否，1-是")
    无效原因: Optional[str] = Field(None, max_length=100, description="无效原因")
    是否不算量: Optional[int] = Field(0, description="是否不算量：0-否，1-是")
    不算量原因: Optional[str] = Field(None, max_length=100, description="不算量原因")
    是否上门: Optional[int] = Field(0, description="是否上门：0-否，1-是")
    上门时间: Optional[datetime] = Field(None, description="上门时间")
    是否报名: Optional[int] = Field(0, description="是否报名：0-否，1-是")
    报名时间: Optional[datetime] = Field(None, description="报名时间")
    是否订座: Optional[int] = Field(0, description="是否订座：0-否，1-是")
    是否校园量: Optional[int] = Field(0, description="是否校园量：0-否，1-是")
    
    # 网聊专员/渠道专员/县办/乡办/信息员
    网聊专员: Optional[str] = Field(None, max_length=50, description="网聊专员")
    渠道专员: Optional[str] = Field(None, max_length=50, description="渠道专员")
    县办: Optional[str] = Field(None, max_length=50, description="县办")
    乡办: Optional[str] = Field(None, max_length=50, description="乡办")
    信息员: Optional[str] = Field(None, max_length=50, description="信息员")
    咨询结果: Optional[str] = Field(None, description="咨询结果")
    
    # 上门情况统计相关
    代咨: Optional[str] = Field(None, max_length=50, description="代咨")
    网转上门: Optional[int] = Field(0, description="网转上门")
    网络新媒体: Optional[int] = Field(0, description="网络新媒体")
    口碑上门: Optional[int] = Field(0, description="口碑上门")
    渠道上门: Optional[int] = Field(0, description="渠道上门")
    校园新渠道: Optional[int] = Field(0, description="校园新渠道")
    新媒体来源: Optional[int] = Field(0, description="新媒体来源")
    就读学校: Optional[str] = Field(None, max_length=100, description="就读学校")
    目前状态: Optional[str] = Field(None, max_length=50, description="目前状态")
    地区: Optional[str] = Field(None, max_length=50, description="地区")
    县: Optional[str] = Field(None, max_length=50, description="县")
    报名专业: Optional[str] = Field(None, max_length=100, description="报名专业")
    咨询时间: Optional[str] = Field(None, max_length=50, description="咨询时间")

    # 报名相关新字段
    长期短期: Optional[str] = Field(None, max_length=20, description="长期/短期")
    课程: Optional[str] = Field(None, max_length=100, description="课程")
    全款: Optional[int] = Field(0, description="全款金额")
    分期: Optional[int] = Field(0, description="分期金额")
    分期备注: Optional[str] = Field(None, max_length=200, description="分期备注")
    注册: Optional[int] = Field(0, description="注册金额")
    贷款: Optional[int] = Field(0, description="贷款金额")
    详细地址: Optional[str] = Field(None, max_length=200, description="详细地址")

    # 订座相关新字段
    订座时间: Optional[datetime] = Field(None, description="订座时间")
    订座金额: Optional[int] = Field(0, description="订座金额")
    
    # 缴费金额（报名或订座后填写）
    缴费金额: Optional[int] = Field(0, description="缴费金额")
    已交学费: Optional[str] = Field(None, max_length=50, description="已交学费金额")
    
    # 退费相关新字段
    是否退费: Optional[int] = Field(0, description="是否退费：0-否，1-是（需先勾选报名或订座）")
    退费原因: Optional[str] = Field(None, max_length=200, description="退费原因")
    退费金额: Optional[int] = Field(0, description="退费金额")

    @model_validator(mode='after')
    def validate_phone_or_wechat(self):
        """电话和微信至少填写一个"""
        phone = self.电话
        wechat = self.微信
        
        phone_empty = not phone or not phone.strip()
        wechat_empty = not wechat or not wechat.strip()
        
        if phone_empty and wechat_empty:
            raise ValueError('电话和微信至少填写一个')
        
        # 清理空白字符
        if phone:
            self.电话 = phone.strip()
        if wechat:
            self.微信 = wechat.strip()
            
        return self

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 咨询量明细表更新(BaseModel):
    """更新咨询量明细记录"""
    记录ID: int = Field(..., description="记录ID")
    登记日期: Optional[datetime] = Field(None, description="登记日期")
    分量人: Optional[str] = Field(None, max_length=50, description="分量人")
    咨询师: Optional[str] = Field(None, max_length=50, description="咨询师")
    咨询者姓名: Optional[str] = Field(None, max_length=50, description="咨询者姓名")
    年龄: Optional[str] = Field(None, max_length=20, description="年龄")
    性别: Optional[str] = Field(None, max_length=10, description="性别")
    电话: Optional[str] = Field(None, max_length=20, description="电话")
    第二电话: Optional[str] = Field(None, max_length=20, description="第二电话")
    QQ: Optional[str] = Field(None, max_length=20, description="QQ")
    微信: Optional[str] = Field(None, max_length=50, description="微信")
    抖音: Optional[str] = Field(None, max_length=50, description="抖音")
    快手: Optional[str] = Field(None, max_length=50, description="快手")
    学历: Optional[str] = Field(None, max_length=20, description="学历")
    状态: Optional[str] = Field(None, max_length=20, description="状态")
    位置: Optional[str] = Field(None, max_length=100, description="位置")
    报名意向: Optional[str] = Field(None, max_length=50, description="报名意向")
    咨询类别: Optional[str] = Field(None, max_length=50, description="咨询类别")
    量来源: Optional[str] = Field(None, max_length=50, description="量来源")
    来源类别: Optional[str] = Field(None, max_length=50, description="来源类别（第二级分类）")
    媒体来源: Optional[str] = Field(None, max_length=50, description="媒体来源")
    关键字: Optional[str] = Field(None, max_length=50, description="关键字")
    口碑提供人: Optional[str] = Field(None, max_length=50, description="口碑提供人（量来源为口碑时填写）")
    备注: Optional[str] = Field(None, description="备注")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")
    
    # 标记字段
    是否无效量: Optional[int] = Field(None, description="是否无效量：0-否，1-是")
    无效原因: Optional[str] = Field(None, max_length=100, description="无效原因")
    是否不算量: Optional[int] = Field(None, description="是否不算量：0-否，1-是")
    不算量原因: Optional[str] = Field(None, max_length=100, description="不算量原因")
    是否上门: Optional[int] = Field(None, description="是否上门：0-否，1-是")
    上门时间: Optional[datetime] = Field(None, description="上门时间")
    是否报名: Optional[int] = Field(None, description="是否报名：0-否，1-是")
    报名时间: Optional[datetime] = Field(None, description="报名时间")
    是否订座: Optional[int] = Field(None, description="是否订座：0-否，1-是")
    是否校园量: Optional[int] = Field(None, description="是否校园量：0-否，1-是")
    
    # 网聊专员/渠道专员/县办/乡办/信息员
    网聊专员: Optional[str] = Field(None, max_length=50, description="网聊专员")
    渠道专员: Optional[str] = Field(None, max_length=50, description="渠道专员")
    县办: Optional[str] = Field(None, max_length=50, description="县办")
    乡办: Optional[str] = Field(None, max_length=50, description="乡办")
    信息员: Optional[str] = Field(None, max_length=50, description="信息员")
    渠道代理: Optional[str] = Field(None, max_length=50, description="渠道代理（旧字段，保留兼容）")
    咨询结果: Optional[str] = Field(None, description="咨询结果")
    
    # 上门情况统计相关
    代咨: Optional[str] = Field(None, max_length=50, description="代咨")
    网转上门: Optional[int] = Field(None, description="网转上门")
    网络新媒体: Optional[int] = Field(None, description="网络新媒体")
    口碑上门: Optional[int] = Field(None, description="口碑上门")
    渠道上门: Optional[int] = Field(None, description="渠道上门")
    校园新渠道: Optional[int] = Field(None, description="校园新渠道")
    新媒体来源: Optional[int] = Field(None, description="新媒体来源")
    就读学校: Optional[str] = Field(None, max_length=100, description="就读学校")
    目前状态: Optional[str] = Field(None, max_length=50, description="目前状态")
    地区: Optional[str] = Field(None, max_length=50, description="地区")
    县: Optional[str] = Field(None, max_length=50, description="县")
    报名专业: Optional[str] = Field(None, max_length=100, description="报名专业")
    咨询时间: Optional[str] = Field(None, max_length=50, description="咨询时间")

    # 报名相关新字段
    长期短期: Optional[str] = Field(None, max_length=20, description="长期/短期")
    课程: Optional[str] = Field(None, max_length=100, description="课程")
    全款: Optional[int] = Field(None, description="全款金额")
    分期: Optional[int] = Field(None, description="分期金额")
    分期备注: Optional[str] = Field(None, max_length=200, description="分期备注")
    注册: Optional[int] = Field(None, description="注册金额")
    贷款: Optional[int] = Field(None, description="贷款金额")
    详细地址: Optional[str] = Field(None, max_length=200, description="详细地址")

    # 订座相关新字段
    订座时间: Optional[datetime] = Field(None, description="订座时间")
    订座金额: Optional[int] = Field(None, description="订座金额")
    
    # 缴费金额（报名或订座后填写）
    缴费金额: Optional[int] = Field(None, description="缴费金额")
    已交学费: Optional[str] = Field(None, max_length=50, description="已交学费金额")
    
    # 退费相关新字段
    是否退费: Optional[int] = Field(None, description="是否退费：0-否，1-是（需先勾选报名或订座）")
    退费原因: Optional[str] = Field(None, max_length=200, description="退费原因")
    退费金额: Optional[int] = Field(None, description="退费金额")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 咨询量明细表响应(BaseModel):
    """咨询量明细表响应"""
    记录ID: int = Field(..., description="记录ID")
    对象ID: int = Field(..., description="对象ID")
    登记日期: Optional[datetime] = Field(None, description="登记日期")
    登记时间: Optional[datetime] = Field(None, description="系统登记时间")
    分量人: Optional[str] = Field(None, description="分量人")
    咨询师: Optional[str] = Field(None, description="咨询师")
    咨询者姓名: Optional[str] = Field(None, description="咨询者姓名")
    年龄: Optional[str] = Field(None, description="年龄")
    性别: Optional[str] = Field(None, description="性别")
    电话: Optional[str] = Field(None, description="电话（与微信二选一）")
    QQ: Optional[str] = Field(None, description="QQ")
    微信: Optional[str] = Field(None, description="微信（与电话二选一）")
    抖音: Optional[str] = Field(None, description="抖音")
    快手: Optional[str] = Field(None, description="快手")
    学历: Optional[str] = Field(None, description="学历")
    状态: Optional[str] = Field(None, description="状态")
    位置: Optional[str] = Field(None, description="位置")
    报名意向: Optional[str] = Field(None, description="报名意向")
    咨询类别: Optional[str] = Field(None, description="咨询类别")
    量来源: Optional[str] = Field(None, description="量来源")
    来源类别: Optional[str] = Field(None, description="来源类别（第二级分类）")
    媒体来源: Optional[str] = Field(None, description="媒体来源")
    关键字: Optional[str] = Field(None, description="关键字")
    口碑提供人: Optional[str] = Field(None, description="口碑提供人（量来源为口碑时填写）")
    备注: Optional[str] = Field(None, description="备注")
    神殿: Optional[str] = Field(None, description="神殿")
    录量人: Optional[str] = Field(None, description="录量人（当前登录用户的real_name）")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")
    
    # 标记字段
    是否无效量: Optional[int] = Field(None, description="是否无效量：0-否，1-是")
    无效原因: Optional[str] = Field(None, description="无效原因")
    是否不算量: Optional[int] = Field(None, description="是否不算量：0-否，1-是")
    不算量原因: Optional[str] = Field(None, description="不算量原因")
    是否上门: Optional[int] = Field(None, description="是否上门：0-否，1-是")
    上门时间: Optional[datetime] = Field(None, description="上门时间")
    是否报名: Optional[int] = Field(None, description="是否报名：0-否，1-是")
    报名时间: Optional[datetime] = Field(None, description="报名时间")
    是否订座: Optional[int] = Field(None, description="是否订座：0-否，1-是")
    是否校园量: Optional[int] = Field(None, description="是否校园量：0-否，1-是")
    
    # 网聊专员/渠道专员/县办/乡办/信息员
    网聊专员: Optional[str] = Field(None, description="网聊专员")
    渠道专员: Optional[str] = Field(None, description="渠道专员")
    县办: Optional[str] = Field(None, description="县办")
    乡办: Optional[str] = Field(None, description="乡办")
    信息员: Optional[str] = Field(None, description="信息员")
    渠道代理: Optional[str] = Field(None, description="渠道代理（旧字段）")
    咨询结果: Optional[str] = Field(None, description="咨询结果")
    
    # 上门情况统计相关
    代咨: Optional[str] = Field(None, description="代咨")
    网转上门: Optional[int] = Field(None, description="网转上门")
    网络新媒体: Optional[int] = Field(None, description="网络新媒体")
    口碑上门: Optional[int] = Field(None, description="口碑上门")
    渠道上门: Optional[int] = Field(None, description="渠道上门")
    校园新渠道: Optional[int] = Field(None, description="校园新渠道")
    新媒体来源: Optional[int] = Field(None, description="新媒体来源")
    就读学校: Optional[str] = Field(None, description="就读学校")
    目前状态: Optional[str] = Field(None, description="目前状态")
    地区: Optional[str] = Field(None, description="地区")
    县: Optional[str] = Field(None, description="县")
    报名专业: Optional[str] = Field(None, description="报名专业")
    咨询时间: Optional[str] = Field(None, description="咨询时间")

    # 报名相关新字段
    长期短期: Optional[str] = Field(None, description="长期/短期")
    课程: Optional[str] = Field(None, description="课程")
    全款: Optional[int] = Field(None, description="全款金额")
    分期: Optional[int] = Field(None, description="分期金额")
    注册: Optional[int] = Field(None, description="注册金额")
    贷款: Optional[int] = Field(None, description="贷款金额")
    详细地址: Optional[str] = Field(None, description="详细地址")

    # 订座相关新字段
    订座时间: Optional[datetime] = Field(None, description="订座时间")
    订座金额: Optional[int] = Field(None, description="订座金额")
    
    # 缴费金额
    缴费金额: Optional[int] = Field(None, description="缴费金额")
    
    # 退费相关新字段
    是否退费: Optional[int] = Field(None, description="是否退费：0-否，1-是")
    退费原因: Optional[str] = Field(None, description="退费原因")
    退费金额: Optional[int] = Field(None, description="退费金额")
    
    # 已交学费
    已交学费: Optional[str] = Field(None, description="已交学费金额")
    
    # 交接相关字段
    是否已交接: Optional[int] = Field(None, description="是否已交接给教质：0-否，1-是")
    交接时间: Optional[datetime] = Field(None, description="交接时间")
    交接人: Optional[str] = Field(None, description="交接人")

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 咨询量明细表分页响应(BaseModel):
    """咨询量明细表分页响应"""
    总记录数: int = Field(..., description="总记录数")
    总页数: int = Field(..., description="总页数")
    当前页: int = Field(..., description="当前页")
    每页数量: int = Field(..., description="每页数量")
    数据列表: List[咨询量明细表响应] = Field(..., description="数据列表")


# ==================== 联合查询响应 ====================

class 咨询量完整响应(BaseModel):
    """咨询量完整响应（包含主表和明细）"""
    主表信息: 咨询量主表响应 = Field(..., description="主表信息")
    明细列表: List[咨询量明细表响应] = Field(..., description="明细列表")


class 咨询量查询参数(BaseModel):
    """咨询量查询参数"""
    电话: Optional[str] = Field(None, description="电话号码")
    咨询者姓名: Optional[str] = Field(None, description="咨询者姓名")
    分量人: Optional[str] = Field(None, description="分量人")
    咨询师: Optional[str] = Field(None, description="咨询师")
    状态: Optional[str] = Field(None, description="状态")
    量来源: Optional[str] = Field(None, description="量来源")
    媒体来源: Optional[str] = Field(None, description="媒体来源")
    神殿: Optional[str] = Field(None, description="神殿")
    开始日期: Optional[str] = Field(None, description="开始日期 YYYY-MM-DD")
    结束日期: Optional[str] = Field(None, description="结束日期 YYYY-MM-DD")
    页码: int = Field(1, ge=1, description="页码")
    每页数量: int = Field(20, ge=1, le=100, description="每页数量")


class 重量检查响应(BaseModel):
    """重量检查响应"""
    是否重量: bool = Field(..., description="是否重量")
    对象ID: Optional[int] = Field(None, description="已存在的对象ID")
    咨询次数: Optional[int] = Field(None, description="已咨询次数")
    最新咨询信息: Optional[咨询量明细表响应] = Field(None, description="最新咨询信息")
    电话列表: Optional[List[str]] = Field(None, description="已有电话列表")
    咨询日期列表: Optional[List[str]] = Field(None, description="咨询日期列表")
    重量神殿: Optional[str] = Field(None, description="重量所属神殿")
    重量类型: Optional[str] = Field(None, description="重量类型：电话重复/微信重复")
    重量微信: Optional[str] = Field(None, description="重复的微信号")


# ==================== 导入相关模式 ====================

class 咨询量导入行(BaseModel):
    """单条导入数据"""
    咨询者姓名: Optional[str] = Field(None, max_length=50, description="咨询者姓名")
    电话: Optional[str] = Field(None, max_length=20, description="电话")
    微信: Optional[str] = Field(None, max_length=50, description="微信")
    
    # 旧量导入专属字段
    旧量日期: Optional[str] = Field(None, description="旧量导入的登记日期，支持多种格式")
    
    # 口碑来源专属字段
    口碑提供人: Optional[str] = Field(None, max_length=50, description="口碑提供人（口碑来源必填）")
    
    # 渠道来源专属字段
    渠道专员: Optional[str] = Field(None, max_length=50, description="渠道专员（渠道来源必填）")
    县办: Optional[str] = Field(None, max_length=50, description="县办（渠道来源可选）")
    乡办: Optional[str] = Field(None, max_length=50, description="乡办（渠道来源可选）")
    信息员: Optional[str] = Field(None, max_length=50, description="信息员（渠道来源可选）")
    
    # 网络来源专属字段
    网聊专员: Optional[str] = Field(None, max_length=50, description="网聊专员（网络来源填写）")
    
    # 通用字段
    年龄: Optional[str] = Field(None, max_length=20, description="年龄")
    性别: Optional[str] = Field(None, max_length=10, description="性别")
    学历: Optional[str] = Field(None, max_length=20, description="学历")
    位置: Optional[str] = Field(None, max_length=100, description="位置/家庭住址")
    报名意向: Optional[str] = Field(None, max_length=50, description="报名意向")
    咨询类别: Optional[str] = Field(None, max_length=50, description="咨询类别")
    来源类别: Optional[str] = Field(None, max_length=50, description="来源类别（第二级）")
    具体来源: Optional[str] = Field(None, max_length=50, description="具体来源/媒体来源（第三级）")
    关键字: Optional[str] = Field(None, description="关键字")
    备注: Optional[str] = Field(None, description="备注")
    
    # 任意导入扩展字段
    量来源: Optional[str] = Field(None, max_length=50, description="量来源（任意导入时可指定）")
    咨询师: Optional[str] = Field(None, max_length=50, description="咨询师")
    分量人: Optional[str] = Field(None, max_length=50, description="分量人")
    状态: Optional[str] = Field(None, max_length=20, description="状态")
    QQ: Optional[str] = Field(None, max_length=20, description="QQ")
    抖音: Optional[str] = Field(None, max_length=50, description="抖音")
    快手: Optional[str] = Field(None, max_length=50, description="快手")
    就读学校: Optional[str] = Field(None, max_length=100, description="就读学校")
    目前状态: Optional[str] = Field(None, max_length=50, description="目前状态")
    地区: Optional[str] = Field(None, max_length=50, description="地区")
    报名专业: Optional[str] = Field(None, max_length=100, description="报名专业")
    咨询结果: Optional[str] = Field(None, description="咨询结果")
    是否上门: Optional[int] = Field(None, description="是否上门：0-否，1-是")
    是否报名: Optional[int] = Field(None, description="是否报名：0-否，1-是")
    是否订座: Optional[int] = Field(None, description="是否订座：0-否，1-是")
    
    # 报名旧量导入扩展字段
    长期短期: Optional[str] = Field(None, max_length=20, description="长期/短期")
    课程: Optional[str] = Field(None, max_length=100, description="课程")
    全款: Optional[int] = Field(None, description="是否全款：0-否，1-是")
    分期: Optional[int] = Field(None, description="是否分期：0-否，1-是")
    分期备注: Optional[str] = Field(None, max_length=200, description="分期备注")
    注册: Optional[int] = Field(None, description="是否注册：0-否，1-是")
    贷款: Optional[int] = Field(None, description="是否贷款：0-否，1-是")
    已交学费: Optional[str] = Field(None, max_length=50, description="已交学费金额")
    详细地址: Optional[str] = Field(None, max_length=200, description="详细地址")
    缴费金额: Optional[int] = Field(None, description="缴费金额")
    报名时间: Optional[str] = Field(None, description="报名时间，支持多种日期格式")
    
    # 订座旧量导入扩展字段
    订座时间: Optional[str] = Field(None, description="订座时间，支持多种日期格式")
    订座金额: Optional[int] = Field(None, description="订座金额")
    
    # 上门旧量导入扩展字段
    上门时间: Optional[str] = Field(None, description="上门时间，支持多种日期格式")
    代咨: Optional[str] = Field(None, max_length=50, description="代咨")
    网转上门: Optional[int] = Field(None, description="网转上门：0-否，1-是")
    口碑上门: Optional[int] = Field(None, description="口碑上门：0-否，1-是")
    渠道上门: Optional[int] = Field(None, description="渠道上门：0-否，1-是")
    校园新渠道: Optional[int] = Field(None, description="校园新渠道：0-否，1-是")
    新媒体来源: Optional[int] = Field(None, description="新媒体来源：0-否，1-是")
    网络新媒体: Optional[int] = Field(None, description="网络新媒体：0-否，1-是")
    县: Optional[str] = Field(None, max_length=50, description="县")
    
    @model_validator(mode='after')
    def validate_phone_or_wechat(self):
        if not self.电话 and not self.微信:
            raise ValueError('电话和微信至少填写一项')
        return self


class 咨询量批量导入请求(BaseModel):
    """批量导入请求"""
    量来源: str = Field(..., description="量来源：口碑、渠道、网络 或 任意")
    数据列表: List[咨询量导入行] = Field(..., min_length=1, description="导入数据列表")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")
    导入人ID: Optional[int] = Field(None, description="导入人ID（用于与当前登录用户校验）")
    导入人姓名: Optional[str] = Field(None, max_length=50, description="导入人姓名（用于与当前登录用户校验）")
    
    @field_validator('量来源')
    @classmethod
    def validate_source(cls, v):
        valid_sources = ['口碑', '渠道', '网络', '任意', '旧量', '报名旧量', '订座旧量', '上门旧量']
        if v not in valid_sources:
            raise ValueError(f'量来源必须是以下之一：{",".join(valid_sources)}')
        return v


class 导入结果项(BaseModel):
    """单条导入结果"""
    行号: int = Field(..., description="数据行号")
    成功: bool = Field(..., description="是否成功")
    消息: str = Field(..., description="结果消息")
    记录ID: Optional[int] = Field(None, description="创建的记录ID")
    对象ID: Optional[int] = Field(None, description="关联的对象ID")
    是否重量: bool = Field(False, description="是否重量")


class 咨询量批量导入响应(BaseModel):
    """批量导入响应"""
    成功数量: int = Field(..., description="成功导入数量")
    失败数量: int = Field(..., description="失败数量")
    重量数量: int = Field(..., description="重量数量")
    结果列表: List[导入结果项] = Field(..., description="详细结果列表")
