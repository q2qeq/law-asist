import os
import io
import json
import traceback
from datetime import datetime, date, timedelta
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from sqlalchemy.orm import Session

import models
from models import Corporate
from database import engine, get_db

# 1. 스키마 정의
class ExecutiveSchema(BaseModel):
    name: str = Field(description="임원 이름")
    position: str = Field(description="직책")
    appointed_at: str = Field(description="취임 날짜 YYYY-MM-DD")
    expired_at: str = Field(description="만료 날짜 YYYY-MM-DD")
    phone: Optional[str] = ""
    is_handled: Optional[bool] = False

class CorporateDataSchema(BaseModel):
    corporate_name: str
    registration_number: str
    head_office_address: str
    capital_amount: str
    total_shares_to_issue: str
    total_shares_issued: str
    purposes: List[str]
    executives: List[ExecutiveSchema]

# 이사 임기 계산기
def get_legal_dates(appointed_at_str: str, position: str):
    clean_str = appointed_at_str.strip().replace(" ", "").replace(".", "-")
    if clean_str.endswith("-"): 
        clean_str = clean_str[:-1]
        
    try:
        appointed_date = datetime.strptime(clean_str, "%Y-%m-%d").date()
    except Exception:
        appointed_date = date.today()

    if "감사" in position:
        target_year = appointed_date.year + 3
        expired_date = date(target_year, 3, 31)
    else:
        try:
            expired_date = appointed_date.replace(year=appointed_date.year + 3)
        except ValueError:
            expired_date = date(appointed_date.year + 3, 2, 28)
            
    return appointed_date, expired_date


# 2. FastAPI 초기화 및 DB 테이블 생성
models.Base.metadata.create_all(bind=engine)
app = FastAPI()

@app.api_route("/", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok", "message": "Server is running perfectly!"}

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                 # 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],                 # 모든 HTTP 메서드 허용
    allow_headers=["*"],                 # 모든 헤더 허용
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"--- 상세 에러 발생: {exc.errors()} ---")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


# 3. PDF 파싱 엔드포인트
@app.post("/api/parse-registry")
async def parse_registry_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDF 파일만 가능합니다.")

    # 💡 Render 환경변수에서 GEMINI_API_KEY를 동적으로 읽어옵니다.
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ [ERROR] GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
        raise HTTPException(status_code=500, detail="서버에 GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
    
    # 디버깅용: 서버 로그에서 읽어온 키의 앞 5자리 확인
    print(f"✅ [DEBUG] 사용 중인 API Key (앞 5자리): {api_key[:5]}...")

    # 동적으로 가져온 API Key로 Gemini 클라이언트 생성
    client = genai.Client(api_key=api_key)

    pdf_content = await file.read()
    
    contents = [
        "이 등기부등본 문서를 분석하여 데이터를 추출하세요.",
        types.Part.from_bytes(
            data=pdf_content,
            mime_type='application/pdf'
        )
    ]

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',  # 👈 'gemini-2.0-flash'를 'gemini-1.5-flash'로 변경!
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CorporateDataSchema,
                temperature=0.1,
            ),
        )
        data = json.loads(response.text)
        
        for exec_data in data.get("executives", []):
            exec_data["phone"] = exec_data.get("phone") or ""
            exec_data["is_handled"] = bool(exec_data.get("is_handled", False))
            
            app_d, exp_d = get_legal_dates(exec_data.get("appointed_at", ""), exec_data.get("position", ""))
            exec_data["appointed_at"] = app_d.strftime("%Y-%m-%d")
            exec_data["expired_at"] = exp_d.strftime("%Y-%m-%d")
            
        return data
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini 분석 오류: {str(e)}")

# 4. 안전한 법인 데이터 저장 API
@app.post("/api/save-corporate")
async def save_corporate_data(data: CorporateDataSchema, db: Session = Depends(get_db)):
    try:
        existing = db.query(models.Corporate).filter(models.Corporate.registration_number == data.registration_number).first()
        if existing:
            db.query(models.CorporatePurpose).filter(models.CorporatePurpose.corporate_id == existing.id).delete()
            db.query(models.CorporateExecutive).filter(models.CorporateExecutive.corporate_id == existing.id).delete()
            db.delete(existing)
            db.commit()

        db_corporate = models.Corporate(
            corporate_name=data.corporate_name,
            registration_number=data.registration_number,
            head_office_address=data.head_office_address,
            capital_amount=data.capital_amount,
            total_shares_to_issue=data.total_shares_to_issue,
            total_shares_issued=data.total_shares_issued
        )
        db.add(db_corporate)
        db.flush()

        for p_text in data.purposes:
            db.add(models.CorporatePurpose(corporate_id=db_corporate.id, purpose_text=p_text))

        for exec_data in data.executives:
            appointed_date, expired_date = get_legal_dates(exec_data.appointed_at, exec_data.position)

            db.add(models.CorporateExecutive(
                corporate_id=db_corporate.id,
                name=exec_data.name,
                position=exec_data.position,
                appointed_at=appointed_date,
                expired_at=expired_date,
                phone=exec_data.phone,
                is_handled=exec_data.is_handled
            ))
            
        db.commit()
        return {"status": "success", "message": "성공적으로 저장되었습니다."}
    except Exception as e:
        db.rollback()
        print("=== [save-corporate] 에러 발생 로그 ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 저장 오류: {str(e)}")

# 5. 임기 만료 예정 임원 조회 API
@app.get("/api/upcoming-expirations")
def get_upcoming_expirations(db: Session = Depends(get_db)):
    try:
        today = date.today()
        ninety_days_later = today + timedelta(days=90)
        
        expired_executives = (
            db.query(models.CorporateExecutive, models.Corporate.corporate_name)
            .join(models.Corporate, models.CorporateExecutive.corporate_id == models.Corporate.id)
            .filter(models.CorporateExecutive.expired_at >= today)
            .filter(models.CorporateExecutive.expired_at <= ninety_days_later)
            .filter(models.CorporateExecutive.is_handled == False)
            .order_by(models.CorporateExecutive.expired_at.asc())
            .all()
        )
        
        result = []
        for exec_data, corp_name in expired_executives:
            d_day = (exec_data.expired_at - today).days
            result.append({
                "id": exec_data.id,
                "corporate_name": corp_name,
                "name": exec_data.name,
                "position": exec_data.position,
                "expired_at": exec_data.expired_at.strftime("%Y-%m-%d"),
                "phone": exec_data.phone or "",
                "d_day": d_day
            })
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 데이터 조회 중 오류 발생: {str(e)}")

# 6. 전체 법인 대장 조회 API (검색 기능 포함)
@app.get("/api/corporates")
def get_all_corporates(search: str = "", db: Session = Depends(get_db)):
    try:
        query = db.query(models.Corporate)
        if search:
            query = query.filter(
                (models.Corporate.corporate_name.like(f"%{search}%")) |
                (models.Corporate.registration_number.like(f"%{search}%"))
            )
        corporates = query.order_by(models.Corporate.corporate_name.asc()).all()

        result = []
        for corp in corporates:
            executives = db.query(models.CorporateExecutive).filter(models.CorporateExecutive.corporate_id == corp.id).all()
            purposes = db.query(models.CorporatePurpose).filter(models.CorporatePurpose.corporate_id == corp.id).all()
            
            result.append({
                "id": corp.id,
                "corporate_name": corp.corporate_name,
                "registration_number": corp.registration_number,
                "head_office_address": corp.head_office_address,
                "capital_amount": corp.capital_amount,
                "total_shares_to_issue": corp.total_shares_to_issue,
                "total_shares_issued": corp.total_shares_issued,
                "executives": [{
                    "id": e.id,
                    "name": e.name,
                    "position": e.position,
                    "appointed_at": e.appointed_at.strftime("%Y-%m-%d"),
                    "expired_at": e.expired_at.strftime("%Y-%m-%d"),
                    "phone": e.phone or ""
                } for e in executives],
                "purposes": [p.purpose_text for p in purposes]
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"법인 대장 조회 중 오류: {str(e)}")

# 7. 법인 대장 삭제 API
@app.delete("/api/corporates/{corp_id}")
def delete_corporate(corp_id: int, db: Session = Depends(get_db)):
    corp = db.query(Corporate).filter(Corporate.id == corp_id).first()
    if not corp:
        raise HTTPException(status_code=404, detail="대상을 찾을 수 없습니다.")
        
    db.delete(corp)
    db.commit()
    return {"status": "success", "message": "삭제되었습니다."}

# 8. 법인 대장 수정 반영 API
@app.put("/api/corporates/{corp_id}")
def update_corporate_data(corp_id: int, updated_data: dict, db: Session = Depends(get_db)):
    try:
        corp = db.query(models.Corporate).filter(models.Corporate.id == corp_id).first()
        if not corp:
            raise HTTPException(status_code=404, detail="법인을 찾을 수 없습니다.")
        
        corp.corporate_name = updated_data.get("corporate_name", corp.corporate_name)
        corp.registration_number = updated_data.get("registration_number", corp.registration_number)
        corp.head_office_address = updated_data.get("head_office_address", corp.head_office_address)
        corp.capital_amount = updated_data.get("capital_amount", corp.capital_amount)
        corp.total_shares_to_issue = updated_data.get("total_shares_to_issue", corp.total_shares_to_issue)
        corp.total_shares_issued = updated_data.get("total_shares_issued", corp.total_shares_issued)
        
        for exec_item in updated_data.get("executives", []):
            exec_db = db.query(models.CorporateExecutive).filter(models.CorporateExecutive.id == exec_item.get("id")).first()
            if exec_db:
                exec_db.name = exec_item.get("name", exec_db.name)
                exec_db.position = exec_item.get("position", exec_db.position)
                exec_db.phone = exec_item.get("phone", exec_db.phone)
                
                if exec_item.get("appointed_at"):
                    exec_db.appointed_at = datetime.strptime(exec_item["appointed_at"], "%Y-%m-%d").date()
                if exec_item.get("expired_at"):
                    exec_db.expired_at = datetime.strptime(exec_item["expired_at"], "%Y-%m-%d").date()

        db.commit()
        return {"status": "success", "message": "데이터베이스 수정 사항이 성공적으로 영구 반영되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB 수정 중 오류 발생: {str(e)}")