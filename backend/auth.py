"""
Authentication module with JWT token management and password hashing
"""
import jwt
import bcrypt
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
import logging

logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRES_IN = os.environ.get('JWT_EXPIRES_IN', '7d')

class TokenData(BaseModel):
    user_id: str
    email: str
    user_type: str

class AuthManager:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    @staticmethod
    def create_access_token(user_data: Dict[str, Any]) -> str:
        """Create a JWT access token"""
        try:
            # Calculate expiration time
            if JWT_EXPIRES_IN.endswith('d'):
                days = int(JWT_EXPIRES_IN[:-1])
                expire = datetime.now(timezone.utc) + timedelta(days=days)
            elif JWT_EXPIRES_IN.endswith('h'):
                hours = int(JWT_EXPIRES_IN[:-1])
                expire = datetime.now(timezone.utc) + timedelta(hours=hours)
            else:
                # Default to 7 days
                expire = datetime.now(timezone.utc) + timedelta(days=7)
            
            # Create token payload
            payload = {
                'user_id': str(user_data['id']),
                'email': user_data['email'],
                'user_type': user_data.get('user_type', 'pending'),
                'exp': expire,
                'iat': datetime.now(timezone.utc),
                'type': 'access'
            }
            
            # Generate token
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            return token
            
        except Exception as e:
            logger.error(f"Token creation error: {e}")
            raise
    
    @staticmethod
    def verify_token(token: str) -> Optional[TokenData]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Check token type
            if payload.get('type') != 'access':
                return None
            
            return TokenData(
                user_id=payload['user_id'],
                email=payload['email'],
                user_type=payload.get('user_type', 'pending')
            )
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None
    
    @staticmethod
    def extract_token_from_header(authorization_header: str) -> Optional[str]:
        """Extract token from Authorization header"""
        if not authorization_header:
            return None
        
        parts = authorization_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
        
        return parts[1]

# Password validation
class PasswordValidator:
    @staticmethod
    def validate_password(password: str) -> tuple[bool, str]:
        """Validate password strength"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        
        if not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        
        if not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
        
        if not any(c.isdigit() for c in password):
            return False, "Password must contain at least one number"
        
        return True, "Password is valid"

# Email validation
def is_valid_email(email: str) -> bool:
    """Basic email validation"""
    try:
        EmailStr.validate(email)
        return True
    except:
        return False