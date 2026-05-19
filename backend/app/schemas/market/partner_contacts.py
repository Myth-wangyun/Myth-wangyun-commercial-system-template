from typing import List, Optional

from pydantic import BaseModel, Field


class PartnerContactRowIn(BaseModel):
    id: Optional[int] = None

    campus: str = Field(default='')
    partner_name: str = Field(default='')
    official_website: str = Field(default='')
    partner_address: str = Field(default='')
    landline: str = Field(default='')
    contact_person: str = Field(default='')
    phone: str = Field(default='')
    wechat: str = Field(default='')
    contract_signer: str = Field(default='')
    contract_sign_date: str = Field(default='')
    contract_expire_date: str = Field(default='')
    negotiation_key_points: str = Field(default='')
    notes: str = Field(default='')


class PartnerContactRowOut(PartnerContactRowIn):
    id: int

    @classmethod
    def model_validate(cls, obj):
        # SQLAlchemy model -> pydantic
        return cls(
            id=obj.id,
            campus=obj.campus,
            partner_name=obj.partner_name,
            official_website=obj.official_website,
            partner_address=obj.partner_address,
            landline=obj.landline,
            contact_person=obj.contact_person,
            phone=obj.phone,
            wechat=obj.wechat,
            contract_signer=obj.contract_signer,
            contract_sign_date=obj.contract_sign_date,
            contract_expire_date=obj.contract_expire_date,
            negotiation_key_points=obj.negotiation_key_points,
            notes=obj.notes,
        )


class PartnerContactListResponse(BaseModel):
    items: List[PartnerContactRowOut]


class PartnerContactBulkSaveRequest(BaseModel):
    campus: str
    rows: List[PartnerContactRowIn]


class PartnerContactBulkSaveResponse(BaseModel):
    saved_count: int
    items: List[PartnerContactRowOut]

