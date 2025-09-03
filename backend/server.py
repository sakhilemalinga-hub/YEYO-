from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    user_type: str  # "investor" or "founder"
    company: Optional[str] = None
    additional_info: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    user_type: str
    company: Optional[str] = None
    additional_info: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    session_token: Optional[str] = None

class BookingCreate(BaseModel):
    name: str
    email: EmailStr
    date: str  # ISO date string
    time: str  # time string like "10:00"
    message: Optional[str] = None

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    date: str
    time: str
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionData(BaseModel):
    session_id: str

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if key.endswith('_at') and isinstance(value, str):
                try:
                    item[key] = datetime.fromisoformat(value)
                except:
                    pass
    return item

# Authentication endpoints
@api_router.post("/auth/session")
async def create_session(session_data: SessionData, response: Response):
    """Handle session creation after OAuth redirect"""
    try:
        # Call Emergent auth API to get user data
        headers = {"X-Session-ID": session_data.session_id}
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers=headers
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = auth_response.json()
        
        # Check if user exists, if not create new user
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if not existing_user:
            # Create new user with basic info from OAuth
            new_user = User(
                name=user_data["name"],
                email=user_data["email"],
                user_type="pending",  # Will be updated when they complete registration
                picture=user_data.get("picture"),
                session_token=user_data["session_token"]
            )
            user_dict = prepare_for_mongo(new_user.dict())
            await db.users.insert_one(user_dict)
            user = new_user
        else:
            # Update session token for existing user
            await db.users.update_one(
                {"email": user_data["email"]},
                {"$set": {"session_token": user_data["session_token"]}}
            )
            user = User(**parse_from_mongo(existing_user))
            user.session_token = user_data["session_token"]
        
        # Set session cookie
        response.set_cookie(
            key="session_token",
            value=user_data["session_token"],
            max_age=7*24*60*60,  # 7 days
            httponly=True,
            secure=True,
            samesite="none"
        )
        
        return {"user": user.dict(), "session_token": user_data["session_token"]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/profile")
async def get_profile(request: Request):
    """Get current user profile"""
    session_token = request.cookies.get("session_token")
    auth_header = request.headers.get("authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="No session token")
    
    user = await db.users.find_one({"session_token": session_token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return User(**parse_from_mongo(user))

# Registration endpoints
@api_router.post("/register/investor", response_model=User)
async def register_investor(user_data: UserCreate, request: Request):
    """Complete investor registration"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user = await db.users.find_one({"session_token": session_token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Update user with investor details
    update_data = {
        "user_type": "investor",
        "company": user_data.company,
        "additional_info": user_data.additional_info
    }
    
    await db.users.update_one(
        {"session_token": session_token},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"session_token": session_token})
    return User(**parse_from_mongo(updated_user))

@api_router.post("/register/founder", response_model=User)
async def register_founder(user_data: UserCreate, request: Request):
    """Complete founder registration"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user = await db.users.find_one({"session_token": session_token})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Update user with founder details
    update_data = {
        "user_type": "founder",
        "company": user_data.company,
        "additional_info": user_data.additional_info
    }
    
    await db.users.update_one(
        {"session_token": session_token},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"session_token": session_token})
    return User(**parse_from_mongo(updated_user))

# Booking endpoints
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    """Create a new call booking"""
    booking_obj = Booking(**booking.dict())
    booking_dict = prepare_for_mongo(booking_obj.dict())
    await db.bookings.insert_one(booking_dict)
    return booking_obj

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    """Get all bookings (admin endpoint)"""
    bookings = await db.bookings.find().to_list(1000)
    return [Booking(**parse_from_mongo(booking)) for booking in bookings]

# Email subscription endpoints
@api_router.post("/email-subscribe")
async def subscribe_email(email_data: dict):
    """Subscribe email for document download"""
    email = email_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # Check if email already exists
    existing = await db.email_subscriptions.find_one({"email": email})
    if not existing:
        subscription = EmailSubscription(email=email)
        subscription_dict = prepare_for_mongo(subscription.dict())
        await db.email_subscriptions.insert_one(subscription_dict)
    
    # Return download link (for now just a placeholder)
    return {"download_url": "https://example.com/yeyo-thesis.pdf", "message": "Thank you! Your download will begin shortly."}

# Basic endpoints
@api_router.get("/")
async def root():
    return {"message": "YEYO LAB API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()