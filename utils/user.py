from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime, timezone
from pymongo import DESCENDING
from .database import db
from datetime import datetime, timedelta, timezone
from bson.objectid import ObjectId
import pytz

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']
        self.email = user_data['email']
        self.password_hash = user_data['password_hash']
        self.user_data = user_data
    
    @staticmethod
    def create_user(username, email, password):
        """Create a new user in database"""
        password_hash = generate_password_hash(password)
        user_data = {
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "profile": {
                "first_name": "",
                "last_name": "",
                "avatar_url": "",
                "bio": ""
            },
            "preferences": {
                "theme": "light",
                "language": "en",
                "email_notifications": True
            },
            "status": {
                "is_active": True,
                "is_verified": False,
                "last_login": None,
                "login_count": 0
            },
            "security": {
                "password_changed_at": datetime.utcnow(),
                "failed_login_attempts": 0,
                "lock_until": None
            },
            "timestamps": {
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
        
        result = db.db.users.insert_one(user_data)
        return str(result.inserted_id)

    @staticmethod
    def _wrap(user_doc):
        return User(user_doc) if user_doc else None

    @staticmethod
    def find_by_username(username):
        """Find a user by username"""
        if db.db is None:
            return None
        user_doc = db.db.users.find_one({"username": username})
        return User._wrap(user_doc)

    @staticmethod
    def find_by_email(email):
        """Find a user by email"""
        if db.db is None:
            return None
        user_doc = db.db.users.find_one({"email": email})
        return User._wrap(user_doc)

    @staticmethod
    def find_by_id(user_id):
        """Find a user by id"""
        if db.db is None:
            return None
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return None
        user_doc = db.db.users.find_one({"_id": obj_id})
        return User._wrap(user_doc)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def update_login_stats(self):
        if db.db is None:
            return
        db.db.users.update_one(
            {"_id": ObjectId(self.id)},
            {
                "$set": {
                    "status.last_login": datetime.utcnow(),
                    "timestamps.updated_at": datetime.utcnow()
                },
                "$inc": {"status.login_count": 1}
            }
        )

def get_user_sessions(user_id):
    """Get all sessions for a user"""
    sessions = db.db.sessions.find({'user_id': ObjectId(user_id)}).sort('created_at', DESCENDING)
    return [{
        'session_id': str(session['_id']),
        'session_type': session.get('session_type', 'unknown'),
        'progress': session.get('progress', {}),
        'activity': session.get('activity', {}),
        'created_at': session['created_at'].isoformat()
    } for session in sessions]

def log_user_activity(user_id, pose_name, confidence, session_id=None, duration_seconds=0):
    """Log when a user performs a yoga asana"""
    try:
        # Use Indian Standard Time (IST, UTC+5:30)
        from datetime import timezone, timedelta
        ist = timezone(timedelta(hours=5, minutes=30))
        ist_time = datetime.now(ist)
        
        activity_data = {
            'user_id': ObjectId(user_id),
            'pose_name': pose_name,
            'traditional_name': get_traditional_name(pose_name),
            'confidence': float(confidence),
            'session_id': session_id or str(ObjectId()),
            'duration_seconds': duration_seconds,
            'timestamp': ist_time
        }
        
        result = db.db.user_activities.insert_one(activity_data)
        return str(result.inserted_id)
    except Exception as e:
        print(f"Error logging user activity: {e}")
        return None

def get_user_activity_stats(user_id, days=30):
    """Get user activity statistics for the last N days"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total asanas performed
        total_asanas = db.db.user_activities.count_documents({
            'user_id': ObjectId(user_id),
            'timestamp': {'$gte': start_date}
        })
        
        # Unique asanas performed
        unique_asanas = db.db.user_activities.distinct('pose_name', {
            'user_id': ObjectId(user_id),
            'timestamp': {'$gte': start_date}
        })
        
        # Daily activity (last 7 days)
        daily_activity = []
        for i in range(7):
            day = datetime.utcnow() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            day_count = db.db.user_activities.count_documents({
                'user_id': ObjectId(user_id),
                'timestamp': {'$gte': day_start, '$lte': day_end}
            })
            
            daily_activity.append({
                'date': day.strftime('%Y-%m-%d'),
                'day_name': day.strftime('%a'),
                'count': day_count
            })
        
        # Most practiced asanas
        pipeline = [
            {'$match': {
                'user_id': ObjectId(user_id),
                'timestamp': {'$gte': start_date}
            }},
            {'$group': {
                '_id': '$pose_name',
                'count': {'$sum': 1},
                'traditional_name': {'$first': '$traditional_name'},
                'last_practiced': {'$max': '$timestamp'}
            }},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ]
        
        top_asanas = list(db.db.user_activities.aggregate(pipeline))
        
        # Session statistics
        session_stats = db.db.user_activities.aggregate([
            {'$match': {
                'user_id': ObjectId(user_id),
                'timestamp': {'$gte': start_date}
            }},
            {'$group': {
                '_id': '$session_id',
                'asanas_count': {'$sum': 1},
                'total_duration': {'$sum': '$duration_seconds'},
                'session_date': {'$first': '$timestamp'}
            }},
            {'$sort': {'session_date': -1}},
            {'$limit': 10}
        ])
        
        sessions = list(session_stats)
        
        return {
            'total_asanas': total_asanas,
            'unique_asanas': len(unique_asanas),
            'daily_activity': list(reversed(daily_activity)),
            'top_asanas': top_asanas,
            'recent_sessions': sessions,
            'period_days': days
        }
        
    except Exception as e:
        print(f"Error getting user activity stats: {e}")
        return {
            'total_asanas': 0,
            'unique_asanas': 0,
            'daily_activity': [],
            'top_asanas': [],
            'recent_sessions': [],
            'period_days': days
        }

def get_user_streak(user_id):
    """Calculate user's current streak of consecutive days with activity"""
    try:
        # Check last 30 days for streak calculation
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        streak = 0
        
        for i in range(30):
            check_date = today - timedelta(days=i)
            day_start = check_date
            day_end = check_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            has_activity = db.db.user_activities.count_documents({
                'user_id': ObjectId(user_id),
                'timestamp': {'$gte': day_start, '$lte': day_end}
            }) > 0
            
            if has_activity:
                streak += 1
            else:
                break
        
        return streak
    except Exception as e:
        print(f"Error calculating streak: {e}")
        return 0

def get_traditional_name(pose_name):
    """Get traditional Sanskrit name for a pose"""
    traditional_names = {
        "Akarna_Dhanurasana": "Akarna Dhanurasana",
        "Bharadvajas_Twist_pose_or_Bharadvajasana_I_": "Bharadvajasana I",
        "Boat_Pose_or_Paripurna_Navasana_": "Paripurna Navasana",
        "Bound_Angle_Pose_or_Baddha_Konasana_": "Baddha Konasana",
        "Bow_Pose_or_Dhanurasana_": "Dhanurasana",
        "Bridge_Pose_or_Setu_Bandha_Sarvangasana_": "Setu Bandha Sarvangasana",
        "Camel_Pose_or_Ustrasana_": "Ustrasana",
        "Cat_Cow_Pose_or_Marjaryasana_": "Marjaryasana",
        "Chair_Pose_or_Utkatasana_": "Utkatasana",
        "Child_Pose_or_Balasana_": "Balasana",
        "Cobra_Pose_or_Bhujangasana_": "Bhujangasana",
        "Cockerel_Pose": "Kukkutasana",
        "Corpse_Pose_or_Savasana_": "Savasana",
        "Cow_Face_Pose_or_Gomukhasana_": "Gomukhasana",
        "Crane_(Crow)_Pose_or_Bakasana_": "Bakasana",
        "Dolphin_Plank_Pose_or_Makara_Adho_Mukha_Svanasana_": "Makara Adho Mukha Svanasana",
        "Dolphin_Pose_or_Ardha_Pincha_Mayurasana_": "Ardha Pincha Mayurasana",
        "Downward-Facing_Dog_pose_or_Adho_Mukha_Svanasana_": "Adho Mukha Svanasana",
        "Eagle_Pose_or_Garudasana_": "Garudasana",
        "Eight-Angle_Pose_or_Astavakrasana_": "Astavakrasana",
        "Extended_Puppy_Pose_or_Uttana_Shishosana_": "Uttana Shishosana",
        "Extended_Revolved_Side_Angle_Pose_or_Utthita_Parsvakonasana_": "Utthita Parsvakonasana",
        "Extended_Revolved_Triangle_Pose_or_Utthita_Trikonasana_": "Utthita Trikonasana",
        "Feathered_Peacock_Pose_or_Pincha_Mayurasana_": "Pincha Mayurasana",
        "Firefly_Pose_or_Tittibhasana_": "Tittibhasana",
        "Fish_Pose_or_Matsyasana_": "Matsyasana",
        "Four-Limbed_Staff_Pose_or_Chaturanga_Dandasana_": "Chaturanga Dandasana",
        "Frog_Pose_or_Bhekasana": "Bhekasana",
        "Garland_Pose_or_Malasana_": "Malasana",
        "Gate_Pose_or_Parighasana_": "Parighasana",
        "Half_Lord_of_the_Fishes_Pose_or_Ardha_Matsyendrasana_": "Ardha Matsyendrasana",
        "Half_Moon_Pose_or_Ardha_Chandrasana_": "Ardha Chandrasana",
        "Handstand_pose_or_Adho_Mukha_Vrksasana_": "Adho Mukha Vrksasana",
        "Happy_Baby_Pose_or_Ananda_Balasana_": "Ananda Balasana",
        "Head-to-Knee_Forward_Bend_pose_or_Janu_Sirsasana_": "Janu Sirsasana",
        "Heron_Pose_or_Krounchasana_": "Krounchasana",
        "Intense_Side_Stretch_Pose_or_Parsvottanasana_": "Parsvottanasana",
        "Legs-Up-the-Wall_Pose_or_Viparita_Karani_": "Viparita Karani",
        "Locust_Pose_or_Salabhasana_": "Salabhasana",
        "Lord_of_the_Dance_Pose_or_Natarajasana_": "Natarajasana",
        "Low_Lunge_pose_or_Anjaneyasana_": "Anjaneyasana",
        "Noose_Pose_or_Pasasana_": "Pasasana",
        "Peacock_Pose_or_Mayurasana_": "Mayurasana",
        "Pigeon_Pose_or_Kapotasana_": "Kapotasana",
        "Plank_Pose_or_Kumbhakasana_": "Kumbhakasana",
        "Plow_Pose_or_Halasana_": "Halasana",
        "Pose_Dedicated_to_the_Sage_Koundinya_or_Eka_Pada_Koundinyanasana_I_and_II": "Eka Pada Koundinyanasana",
        "Rajakapotasana": "Rajakapotasana",
        "Reclining_Hand-to-Big-Toe_Pose_or_Supta_Padangusthasana_": "Supta Padangusthasana",
        "Revolved_Head-to-Knee_Pose_or_Parivrtta_Janu_Sirsasana_": "Parivrtta Janu Sirsasana",
        "Scale_Pose_or_Tolasana_": "Tolasana",
        "Scorpion_pose_or_vrischikasana": "Vrischikasana",
        "Seated_Forward_Bend_pose_or_Paschimottanasana_": "Paschimottanasana",
        "Shoulder-Pressing_Pose_or_Bhujapidasana_": "Bhujapidasana",
        "Side-Reclining_Leg_Lift_pose_or_Anantasana_": "Anantasana",
        "Side_Crane_(Crow)_Pose_or_Parsva_Bakasana_": "Parsva Bakasana",
        "Side_Plank_Pose_or_Vasisthasana_": "Vasisthasana",
        "Sitting pose 1 (normal)": "Sukhasana",
        "Split pose": "Hanumanasana",
        "Staff_Pose_or_Dandasana_": "Dandasana",
        "Standing_Forward_Bend_pose_or_Uttanasana_": "Uttanasana",
        "Standing_Split_pose_or_Urdhva_Prasarita_Eka_Padasana_": "Urdhva Prasarita Eka Padasana",
        "Standing_big_toe_hold_pose_or_Utthita_Padangusthasana": "Utthita Padangusthasana",
        "Supported_Headstand_pose_or_Salamba_Sirsasana_": "Salamba Sirsasana",
        "Supported_Shoulderstand_pose_or_Salamba_Sarvangasana_": "Salamba Sarvangasana",
        "Supta_Baddha_Konasana_": "Supta Baddha Konasana",
        "Supta_Virasana_Vajrasana": "Supta Virasana",
        "Tortoise_Pose": "Kurmasana",
        "Tree_Pose_or_Vrksasana_": "Vrksasana",
        "Upward_Bow_(Wheel)_Pose_or_Urdhva_Dhanurasana_": "Urdhva Dhanurasana",
        "Upward_Facing_Two-Foot_Staff_Pose_or_Dwi_Pada_Viparita_Dandasana_": "Dwi Pada Viparita Dandasana",
        "Upward_Plank_Pose_or_Purvottanasana_": "Purvottanasana",
        "Virasana_or_Vajrasana": "Vajrasana",
        "Warrior_III_Pose_or_Virabhadrasana_III_": "Virabhadrasana III",
        "Warrior_II_Pose_or_Virabhadrasana_II_": "Virabhadrasana II",
        "Warrior_I_Pose_or_Virabhadrasana_I_": "Virabhadrasana I",
        "Wide-Angle_Seated_Forward_Bend_pose_or_Upavistha_Konasana_": "Upavistha Konasana",
        "Wide-Legged_Forward_Bend_pose_or_Prasarita_Padottanasana_": "Prasarita Padottanasana",
        "Wild_Thing_pose_or_Camatkarasana_": "Camatkarasana",
        "Wind_Relieving_pose_or_Pawanmuktasana": "Pawanmuktasana",
        "Yogic_sleep_pose": "Yoga Nidra",
        "viparita_virabhadrasana_or_reverse_warrior_pose": "Viparita Virabhadrasana"
    }
    
    return traditional_names.get(pose_name, pose_name)