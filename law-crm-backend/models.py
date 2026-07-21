from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey # 💡 Boolean 추가!
from sqlalchemy.orm import relationship
from database import Base

class Corporate(Base):
    __tablename__ = "corporates"

    id = Column(Integer, primary_key=True, index=True)
    corporate_name = Column(String, nullable=False, index=True)
    registration_number = Column(String, unique=True, nullable=False)
    head_office_address = Column(String, nullable=False)
    capital_amount = Column(String, nullable=False)
    total_shares_to_issue = Column(String, nullable=False)
    total_shares_issued = Column(String, nullable=False)
    
    # 💡 [추가] 관리 담당자 컬럼
    manager_name = Column(String, nullable=True)
    manager_phone = Column(String, nullable=True)

    purposes = relationship("CorporatePurpose", back_populates="corporate", cascade="all, delete-orphan")
    executives = relationship("CorporateExecutive", back_populates="corporate", cascade="all, delete-orphan")
    
class CorporatePurpose(Base):
    __tablename__ = "corporate_purposes"

    id = Column(Integer, primary_key=True, index=True)
    corporate_id = Column(Integer, ForeignKey("corporates.id"))
    purpose_text = Column(String, nullable=False)

    corporate = relationship("Corporate", back_populates="purposes")

class CorporateExecutive(Base):
    __tablename__ = "corporate_executives"

    id = Column(Integer, primary_key=True, index=True)
    corporate_id = Column(Integer, ForeignKey("corporates.id"))
    name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    appointed_at = Column(Date, nullable=False)
    expired_at = Column(Date, nullable=False)
    phone = Column(String, nullable=True)        # 💡 이게 있는지
    is_handled = Column(Boolean, default=False)

    corporate = relationship("Corporate", back_populates="executives")