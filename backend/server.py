from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Annotated
import uuid
from datetime import datetime, timezone, timedelta

# Import our custom modules
from database import get_database, init_database
from auth import AuthManager, PasswordValidator, TokenData

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

# Security
security = HTTPBearer(auto_error=False)

# Define Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    user_type: str  # "investor" or "founder"
    company: Optional[str] = None
    additional_info: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    additional_info: Optional[str] = None
    user_type: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    user_type: str
    company: Optional[str] = None
    additional_info: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

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

# Authentication dependency
async def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]) -> User:
    """Get current authenticated user"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token_data = AuthManager.verify_token(credentials.credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Get user from database
    user_doc = await db.users.find_one({"id": token_data.user_id})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**parse_from_mongo(user_doc))

# Optional authentication dependency
async def get_current_user_optional(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)] = None) -> Optional[User]:
    """Get current user if authenticated, otherwise None"""
    if not credentials:
        return None
    
    token_data = AuthManager.verify_token(credentials.credentials)
    if not token_data:
        return None
    
    # Get user from database
    user_doc = await db.users.find_one({"id": token_data.user_id})
    if not user_doc:
        return None
    
    return User(**parse_from_mongo(user_doc))

# Authentication endpoints
@api_router.post("/auth/register")
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        # Validate password
        is_valid, message = PasswordValidator.validate_password(user_data.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = AuthManager.hash_password(user_data.password)
        
        # Create new user
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            user_type=user_data.user_type,
            company=user_data.company,
            additional_info=user_data.additional_info
        )
        
        # Prepare user data for MongoDB
        user_dict = prepare_for_mongo(new_user.dict())
        user_dict['password_hash'] = hashed_password
        
        # Insert user
        await db.users.insert_one(user_dict)
        
        # Create access token
        token = AuthManager.create_access_token(user_dict)
        
        # Remove password hash from response
        user_dict.pop('password_hash', None)
        
        return {
            "user": User(**parse_from_mongo(user_dict)),
            "access_token": token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    """Login user with email and password"""
    try:
        # Find user by email
        user_doc = await db.users.find_one({"email": login_data.email})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not AuthManager.verify_password(login_data.password, user_doc['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user is active
        if not user_doc.get('is_active', True):
            raise HTTPException(status_code=401, detail="Account is deactivated")
        
        # Create access token
        token = AuthManager.create_access_token(user_doc)
        
        # Remove password hash from response
        user_doc.pop('password_hash', None)
        
        return {
            "user": User(**parse_from_mongo(user_doc)),
            "access_token": token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.get("/auth/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@api_router.put("/auth/profile")
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        # Prepare update data
        update_data = {}
        if user_update.name is not None:
            update_data['name'] = user_update.name
        if user_update.company is not None:
            update_data['company'] = user_update.company
        if user_update.additional_info is not None:
            update_data['additional_info'] = user_update.additional_info
        if user_update.user_type is not None:
            update_data['user_type'] = user_update.user_type
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        # Update user in database
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
        
        # Get updated user
        updated_user_doc = await db.users.find_one({"id": current_user.id})
        updated_user_doc.pop('password_hash', None)
        
        return User(**parse_from_mongo(updated_user_doc))
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Profile update failed")

# Registration endpoints (for backward compatibility)
@api_router.post("/register/investor", response_model=User)
async def register_investor(user_data: UserUpdate, current_user: User = Depends(get_current_user)):
    """Complete investor registration (update existing user)"""
    user_data.user_type = "investor"
    return await update_profile(user_data, current_user)

@api_router.post("/register/founder", response_model=User)
async def register_founder(user_data: UserUpdate, current_user: User = Depends(get_current_user)):
    """Complete founder registration (update existing user)"""
    user_data.user_type = "founder"
    return await update_profile(user_data, current_user)

# Booking endpoints
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    """Create a new call booking"""
    booking_obj = Booking(**booking.dict())
    booking_dict = prepare_for_mongo(booking_obj.dict())
    await db.bookings.insert_one(booking_dict)
    return booking_obj

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(current_user: User = Depends(get_current_user)):
    """Get all bookings (admin endpoint)"""
    # For now, allow any authenticated user to see bookings
    # In production, you might want to restrict this to admin users
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
    
    # Return actual thesis document download link
    return {"download_url": "https://customer-assets.emergentagent.com/job_saas-launchpad/artifacts/x9nuwx94_YEYO%20LAB%20Building%20Africa%E2%80%99s%20AI-SaaS%20Exit%20Engine.pdf", "message": "Thank you! Your download will begin shortly."}

# Basic endpoints
@api_router.get("/")
async def root():
    return {"message": "YEYO LAB API"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

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

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        await init_database()
        logger.info("Application startup completed")
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()