"""
Database initialization and management module
"""
import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import CollectionInvalid
import os
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, mongo_url: str, db_name: str):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        
    async def initialize_collections(self):
        """Initialize all required collections with proper indexes"""
        try:
            # Users collection
            try:
                await self.db.create_collection("users")
                logger.info("Created users collection")
            except CollectionInvalid:
                logger.info("Users collection already exists")
            
            # Create indexes for users
            await self.db.users.create_index("email", unique=True)
            await self.db.users.create_index("created_at")
            
            # Bookings collection
            try:
                await self.db.create_collection("bookings")
                logger.info("Created bookings collection")
            except CollectionInvalid:
                logger.info("Bookings collection already exists")
                
            # Create indexes for bookings
            await self.db.bookings.create_index("email")
            await self.db.bookings.create_index("date")
            await self.db.bookings.create_index("created_at")
            
            # Email subscriptions collection
            try:
                await self.db.create_collection("email_subscriptions")
                logger.info("Created email_subscriptions collection")
            except CollectionInvalid:
                logger.info("Email subscriptions collection already exists")
                
            # Create indexes for email subscriptions
            await self.db.email_subscriptions.create_index("email", unique=True)
            await self.db.email_subscriptions.create_index("created_at")
            
            logger.info("Database initialization completed successfully")
            
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise
    
    async def health_check(self):
        """Check database connection health"""
        try:
            await self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def close(self):
        """Close database connection"""
        self.client.close()

# Global database instance
db_instance = None

async def get_database():
    """Get database instance"""
    global db_instance
    if db_instance is None:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'yeyo_lab')
        db_instance = Database(mongo_url, db_name)
        await db_instance.initialize_collections()
    return db_instance.db

async def init_database():
    """Initialize database on startup"""
    try:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'yeyo_lab')
        
        db = Database(mongo_url, db_name)
        await db.initialize_collections()
        
        # Test connection
        health = await db.health_check()
        if health:
            logger.info("Database connection established successfully")
        else:
            logger.error("Database connection failed")
            
        return db
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

if __name__ == "__main__":
    # Run database initialization
    async def main():
        await init_database()
        
    asyncio.run(main())