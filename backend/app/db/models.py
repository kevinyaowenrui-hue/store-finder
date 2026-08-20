import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True) # e.g. "New Balance"
    name_en = Column(String(100), nullable=True)                      # e.g. "New Balance"
    code = Column(String(50), nullable=False, unique=True, index=True) # e.g. "new-balance"
    logo_url = Column(String(500), nullable=True)
    official_site = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    stores = relationship("Store", back_populates="brand", cascade="all, delete-orphan")


class Mall(Base):
    __tablename__ = "malls"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, index=True)             # e.g. "上海静安嘉里中心"
    province = Column(String(50), nullable=False, index=True)          # e.g. "上海市"
    city = Column(String(50), nullable=False, index=True)              # e.g. "上海市"
    district = Column(String(50), nullable=True, index=True)           # e.g. "静安区"
    address = Column(String(300), nullable=True)                       # e.g. "南京西路1515号"
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    stores = relationship("Store", back_populates="mall", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_mall_location", "province", "city", "district"),
    )


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    mall_id = Column(Integer, ForeignKey("malls.id", ondelete="CASCADE"), nullable=False, index=True)
    
    store_name = Column(String(200), nullable=False, index=True)       # e.g. "上海静安嘉里中心概念店"
    floor = Column(String(100), nullable=True)                         # e.g. "3层 L3-08"
    phone = Column(String(50), nullable=True)                          # e.g. "021-62881234"
    business_hours = Column(String(100), nullable=True)                # e.g. "10:00 - 22:00"
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    source_url = Column(String(500), nullable=True)                    # e.g. 官网数据来源链接
    tags = Column(String(200), nullable=True)                          # e.g. "旗舰店,跑步专营,限量发售"
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    last_verified_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    brand = relationship("Brand", back_populates="stores")
    mall = relationship("Mall", back_populates="stores")

    __table_args__ = (
        Index("idx_store_brand_mall", "brand_id", "mall_id"),
    )
