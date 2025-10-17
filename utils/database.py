from pymongo import MongoClient, ASCENDING, DESCENDING
from config import Config

class Database:
    def __init__(self):
        self.client = None
        self.db = None
    
    def init_app(self, app):
        """Initialize database connection"""
        self.client = MongoClient(Config.MONGODB_URI)
        self.db = self.client[Config.DATABASE_NAME]
        self.create_indexes()
    
    def create_indexes(self):
        """Create all necessary database indexes"""
        if self.db is None:
            print("⚠️  Cannot create indexes - no database connection")
            return
        try:
            # Users collection
            self.db.users.create_index([("username", ASCENDING)], unique=True)
            self.db.users.create_index([("email", ASCENDING)], unique=True)
            self.db.users.create_index([("status.last_login", DESCENDING)])
            self.db.users.create_index([("timestamps.created_at", DESCENDING)])
            
            # Sessions collection
            self.db.sessions.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
            self.db.sessions.create_index([("session_type", ASCENDING)])
            self.db.sessions.create_index([("activity.start_time", DESCENDING)])
            
            # ML predictions collection (new!)
            self.db.predictions.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
            self.db.predictions.create_index([("model_name", ASCENDING)])
            
            # Login attempts
            self.db.login_attempts.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
            self.db.login_attempts.create_index([("ip_address", ASCENDING), ("timestamp", DESCENDING)])
            self.db.login_attempts.create_index([("timestamp", ASCENDING)], expireAfterSeconds=2592000)
            
            # Password resets
            self.db.password_resets.create_index([("token", ASCENDING)], unique=True)
            self.db.password_resets.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)

            self.db.user_activities.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
            self.db.user_activities.create_index([("pose_name", ASCENDING)])
            self.db.user_activities.create_index([("session_id", ASCENDING)])        

            print("✅ Database indexes created!")
        
        except Exception as e:
            print(f"❌ Error creating indexes: {e}")

# Create global database instance
db = Database()