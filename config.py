import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-testing-only'
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/'
    DATABASE_NAME = 'yoga-trainer-database'
    
    # Session settings
    PERMANENT_SESSION_LIFETIME = 3600
    
    # Security settings
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_TIME = 900

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}