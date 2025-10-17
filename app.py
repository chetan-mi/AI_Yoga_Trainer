import os
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, flash, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
import tensorflow as tf
from tensorflow.keras.models import load_model
import pickle
import google.generativeai as genai
from dotenv import load_dotenv
import threading
import time
import base64
import json
from datetime import datetime
from bson.objectid import ObjectId

# Import from new structure
from config import config
from utils.database import db
from utils.user import User, get_user_sessions
from utils.pose_utils import PoseUtils
from services.tts_service import AdvancedIndianTTSSystem
from utils.user import log_user_activity, get_user_activity_stats, get_user_streak

# Initialize Flask app with CORRECT paths
app = Flask(__name__, 
           template_folder="app/templates", 
           static_folder="app/static")
app.config['UPLOAD_FOLDER'] = 'app/static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configuration
app.config.from_object(config['development'])

# Initialize extensions
db.init_app(app)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp'}

load_dotenv('.env')

# Load model and utilities
model = None
le = None
pose_utils = PoseUtils()

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY_HERE')
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

# Initialize TTS system
tts_system = AdvancedIndianTTSSystem()

# Load asana data
asana_data = None

def load_asana_data():
    """Load asana data from JSON file"""
    global asana_data
    try:
        with open('app/static/asana_data.json', 'r', encoding='utf-8') as f:  # Updated path
            asana_data = json.load(f)
        print("Asana data loaded successfully")
    except Exception as e:
        print(f"Error loading asana data: {e}")
        asana_data = {}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_temp_files():
    """Clean up temporary webcam files"""
    upload_folder = app.config['UPLOAD_FOLDER']
    temp_files = ['frame.jpg', 'annotated_frame.jpg']
    
    for temp_file in temp_files:
        file_path = os.path.join(upload_folder, temp_file)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Cleaned up: {temp_file}")
            except Exception as e:
                print(f"Error cleaning up {temp_file}: {e}")

def load_model_and_encoder():
    """Load the trained model and label encoder"""
    global model, le
    try:
        model = load_model('models/yoga_pose_dnn_model.h5')
        with open('models/label_encoder_dnn.pkl', 'rb') as f:
            le = pickle.load(f)
        print("Model and encoder loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None
        le = None

# Traditional Sanskrit pose names mapping
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


def get_traditional_name(pose_name):
    """Get traditional Sanskrit name for a pose"""
    return traditional_names.get(pose_name, pose_name)

def get_pose_names(pose_name):
    """Get both English and Sanskrit names for a pose"""
    # Get Sanskrit name from mapping
    sanskrit_name = traditional_names.get(pose_name, pose_name)
    
    # Extract English name from the original pose_name
    # Format: "English_Name_or_Sanskrit_Name_" or just "Sanskrit_Name"
    english_name = pose_name.replace('_', ' ').strip()
    
    # If the pose name contains "or", split and get the English part
    if '_or_' in pose_name:
        parts = pose_name.split('_or_')
        english_name = parts[0].replace('_', ' ').strip()
    else:
        # If no "or", use the cleaned up version
        english_name = english_name.rstrip('_').strip()
    
    return {
        'sanskrit': sanskrit_name,
        'english': english_name
    }

def get_pose_instructions_and_feedback(pose_name, language="en"):
    """Get instructions and feedback for a yoga pose using Gemini API"""
    try:
        traditional_name = get_traditional_name(pose_name)
        
        if not gemini_model:
            fallback_instructions = f"""
            - Arms extended overhead
            - Legs hip-width apart
            - Head neutral
            - Engage core
            - Breathe steadily
            """
            fallback_feedback = f"Focus on your breathing and maintain steady alignment while performing {traditional_name}."
            return fallback_instructions, fallback_feedback
        
        language_names = {
            "en": "Indian English",
            "hi": "Hindi",
            "kn": "Kannada", 
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi"
        }
        
        target_lang_name = language_names.get(language, "Indian English")
        
        instructions_prompt = f"""
        Provide very brief, key-point instructions for the yoga pose: {traditional_name}
        Language: {target_lang_name}
        
        Focus ONLY on the most essential elements:
        - Arms position (up, down, extended, etc.)
        - Legs position (straight, bent, apart, etc.) 
        - Head position (neutral, looking up/down, etc.)
        - Core engagement
        - Breathing
        
        Format as simple bullet points. Keep each point under 8 words.
        Make it suitable for text-to-speech - clear and concise.
        
        Example format:
        - Arms extended overhead
        - Legs hip-width apart
        - Head neutral
        - Engage core
        - Breathe steadily
        """
        
        feedback_prompt = f"""
        Provide a very brief feedback tip for the yoga pose: {traditional_name}
        Language: {target_lang_name}
        
        Give ONE key tip focusing on the most common mistake or important alignment point.
        Keep it under 15 words and make it encouraging.
        
        Example: "Keep your spine straight and shoulders relaxed"
        """
        instructions_response = gemini_model.generate_content(instructions_prompt)
        feedback_response = gemini_model.generate_content(feedback_prompt)
        
        instructions_text = instructions_response.text
        feedback_text = feedback_response.text
        
        # Clean up the responses
        if "INSTRUCTIONS:" in instructions_text:
            instructions_text = instructions_text.split("INSTRUCTIONS:")[1].strip()
        if "FEEDBACK:" in feedback_text:
            feedback_text = feedback_text.split("FEEDBACK:")[1].strip()
            
        return instructions_text, feedback_text
        
          
    except Exception as e:
        print(f"Error getting Gemini response: {e}")
        fallback_instructions = f"""
        - Arms extended overhead
        - Legs hip-width apart
        - Head neutral
        - Engage core
        - Breathe steadily
        """
        fallback_feedback = f"Focus on your breathing and maintain steady alignment while performing {traditional_name}."
        return fallback_instructions, fallback_feedback

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.find_by_id(user_id)

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/')
def index():
    """Render the main page"""
    # Check if user is logged in
    user_info = None
    if current_user.is_authenticated:
        try:
            # Get user data from database
            user_doc = db.db.users.find_one({'_id': ObjectId(current_user.id)})
            if user_doc:
                profile = user_doc.get('profile', {})
                user_info = {
                    'username': user_doc.get('username', ''),
                    'email': user_doc.get('email', ''),
                    'avatar_url': profile.get('avatar_url', '')
                }
        except Exception as e:
            print(f"Error getting user info for index: {e}")
            # Fallback to basic info
            user_info = {
                'username': current_user.username,
                'email': current_user.email,
                'avatar_url': ''
            }
    
    return render_template('index.html', user=user_info)

@app.route('/favicon.ico')
def favicon():
    """Serve favicon"""
    return send_from_directory('app/static/uploads', 'yogologo.jpg', mimetype='image/jpeg')

@app.route('/yoga-manual')
def yoga_manual():
    """Yoga manual page - no login required"""
    return render_template('yoga-manual.html')

@app.route('/update-image-predictor')
@login_required
def update_image_predictor():
    """Image upload and prediction page"""
    return render_template('update-image-predictor.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Check if user exists
        if User.find_by_username(username) or User.find_by_email(email):
            flash('Username or email already exists', 'error')
            return render_template('register.html')
        
        # Create new user
        User.create_user(username, email, password)
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Check if user is already logged in
    if current_user.is_authenticated:
        next_page = request.args.get('next')
        if next_page and next_page.startswith('/') and not next_page.startswith('//'):
            return redirect(next_page)
        else:
            return redirect(url_for('dashboard'))
    
    # Get the next parameter from either form data or URL args
    next_page = request.form.get('next') or request.args.get('next')
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if not username or not password:
            flash('Please enter both username and password', 'error')
            if next_page:
                return redirect(url_for('login', next=next_page))
            return render_template('login.html')
        
        user = User.find_by_username(username)
        
        if user and user.check_password(password):
            login_user(user, remember=True)
            user.update_login_stats()
            
            # Handle the 'next' parameter for proper redirection
            if next_page and next_page.startswith('/') and not next_page.startswith('//'):
                return redirect(next_page)
            else:
                return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
            # Preserve the next parameter in the URL when there's an error
            if next_page:
                return redirect(url_for('login', next=next_page))
    
    return render_template('login.html')

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Forgot password page"""
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']
        
        # Validate passwords match
        if new_password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('forgot-password.html')
        
        # Validate password length
        if len(new_password) < 6:
            flash('Password must be at least 6 characters long', 'error')
            return render_template('forgot-password.html')
        
        # Find user by username
        user = User.find_by_username(username)
        if not user:
            flash('Username not found', 'error')
            return render_template('forgot-password.html')
        
        # Verify email matches
        if user.email.lower() != email.lower():
            flash('Email does not match the registered email for this username', 'error')
            return render_template('forgot-password.html')
        
        try:
            # Update password
            new_password_hash = generate_password_hash(new_password)
            result = db.db.users.update_one(
                {'_id': ObjectId(user.id)},
                {'$set': {
                    'password_hash': new_password_hash,
                    'security.password_changed_at': datetime.utcnow()
                }}
            )
            
            if result.modified_count > 0:
                flash('Password reset successfully! You can now login with your new password.', 'success')
                return redirect(url_for('login'))
            else:
                flash('Failed to reset password. Please try again.', 'error')
                
        except Exception as e:
            print(f"Error resetting password: {e}")
            flash('An error occurred. Please try again.', 'error')
    
    return render_template('forgot-password.html')

@app.route('/dashboard')
@login_required
def dashboard():
    try:
        # Get complete user data from database including profile
        user_doc = db.db.users.find_one({'_id': ObjectId(current_user.id)})
        if user_doc:
            # Create a user object with all data
            user_data = {
                'id': str(user_doc['_id']),
                'username': user_doc.get('username', ''),
                'email': user_doc.get('email', ''),
                'user_data': user_doc
            }
        else:
            # Fallback to current_user if database query fails
            user_data = current_user
    except Exception as e:
        print(f"Error getting user data for dashboard: {e}")
        user_data = current_user
    
    return render_template('dashboard.html', user=user_data)

@app.route('/api/user/progress')
@login_required
def user_progress():
    user_sessions = get_user_sessions(current_user.id)
    return jsonify(user_sessions)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    
    # Check if there's a 'next' parameter to redirect to
    next_page = request.args.get('next')
    if next_page:
        # Validate that the next_page is safe (starts with /)
        if next_page.startswith('/') and not next_page.startswith('//'):
            return redirect(next_page)
    
    # Default redirect to login page
    return redirect(url_for('login'))

# ==================== YOGA POSE DETECTION ROUTES ====================

@app.route('/predict', methods=['POST'])
def predict():
    """Handle image upload and prediction"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'})
    
    if file and allowed_file(file.filename):
        # Process image directly from memory without saving to disk
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'error': 'Could not read image'})
        
        # Extract landmarks only (DNN model uses only landmarks)
        landmarks, results = pose_utils.extract_landmarks(image)
        if landmarks is None:
            return jsonify({'error': 'No pose detected in the image'})
        
        # Prepare landmarks for prediction
        landmarks = np.expand_dims(landmarks, axis=0)
        
        # Make prediction using only landmarks
        prediction = model.predict(landmarks)
        class_idx = np.argmax(prediction)
        confidence = prediction[0][class_idx]
        pose_name = le.inverse_transform([class_idx])[0]
        
        # No need to save annotated image for real-time webcam processing
        # Only save if specifically requested or for debugging
        
        # NOTE: DO NOT log activity here! The /api/log_activity endpoint handles logging
        # with proper deduplication, confidence checks, and duration tracking.
        # Logging here would create duplicate entries for every detection (every 1.5 seconds).
        
        # Get both Sanskrit and English names
        pose_names = get_pose_names(pose_name)
        
        # Return results without image_url since we're not saving files
        return jsonify({
            'pose': pose_name,
            'sanskrit_name': pose_names['sanskrit'],
            'english_name': pose_names['english'],
            'confidence': float(confidence)
        })
    
    return jsonify({'error': 'Invalid file type'})

@app.route('/get_instructions', methods=['POST'])
def get_instructions():
    """Get instructions and feedback for a pose"""
    data = request.get_json()
    pose_name = data.get('pose_name', '')
    language = data.get('language', 'en')
    
    if not pose_name:
        return jsonify({'error': 'No pose name provided'})
    
    instructions, feedback = get_pose_instructions_and_feedback(pose_name, language)
    
    return jsonify({
        'instructions': instructions,
        'feedback': feedback
    })
#actual webcam application request handling
@app.route('/webcam')
@login_required
def webcam():
    """Webcam pose detection page"""
    return render_template('webcam.html')

@app.route('/speak_feedback', methods=['POST'])
@login_required
def speak_feedback():
    """Speak pose feedback using TTS"""
    try:
        data = request.get_json()
        pose_name = data.get('pose_name', '')
        feedback = data.get('feedback', '')
        language = data.get('language', 'en')
        
        if not pose_name:
            return jsonify({'success': False, 'message': 'No pose name provided'})
        
        # Use TTS system to speak
        success = tts_system.speak_pose_feedback(pose_name, feedback, language)
        
        if success:
            return jsonify({'success': True, 'message': 'Feedback spoken successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to speak feedback'})
            
    except Exception as e:
        print(f"Error in speak_feedback: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/speak_welcome', methods=['POST'])
@login_required
def speak_welcome():
    """Speak welcome message using TTS"""
    try:
        data = request.get_json()
        language = data.get('language', 'en')
        
        # Use TTS system to speak welcome
        success = tts_system.speak_welcome(language)
        
        if success:
            return jsonify({'success': True, 'message': 'Welcome spoken successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to speak welcome'})
            
    except Exception as e:
        print(f"Error in speak_welcome: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/set_language', methods=['POST'])
@login_required
def set_tts_language():
    """Set TTS language"""
    try:
        data = request.get_json()
        language = data.get('language', 'en')
        
        success = tts_system.set_language(language)
        
        if success:
            return jsonify({'success': True, 'message': f'Language set to {language}'})
        else:
            return jsonify({'success': False, 'message': 'Invalid language'})
            
    except Exception as e:
        print(f"Error in set_language: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/current_user')
@login_required
def get_current_user():
    """Get current user information"""
    avatar_url = ""
    if hasattr(current_user, 'user_data') and 'profile' in current_user.user_data:
        avatar_url = current_user.user_data['profile'].get('avatar_url', '')
    
    return jsonify({
        'user_id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'avatar': avatar_url
    })

@app.route('/api/auth_check')
def check_authentication():
    """Check if user is authenticated without requiring login"""
    if current_user.is_authenticated:
        avatar_url = ""
        if hasattr(current_user, 'user_data') and 'profile' in current_user.user_data:
            avatar_url = current_user.user_data['profile'].get('avatar_url', '')
        
        return jsonify({
            'authenticated': True,
            'user_id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'avatar': avatar_url
        })
    else:
        return jsonify({'authenticated': False}), 401


@app.route('/test')
def test():
    """Test button functionality"""
    return send_file('test_button.html')

@app.route('/test_google_tts')
def test_google_tts():
    """Google TTS test page"""
    return send_file('test_google_tts.html')

#=========================user tracking system starts here=======================================
@app.route('/api/log_activity', methods=['POST'])
@login_required
def log_activity():
    """Log user activity when they perform an asana"""
    try:
        data = request.get_json()
        pose_name = data.get('pose_name')
        confidence = data.get('confidence', 0)
        duration = data.get('duration_seconds', 0)
        session_id = data.get('session_id')
        
        if not pose_name:
            return jsonify({'error': 'Pose name required'}), 400
        
        # Log the activity
        activity_id = log_user_activity(
            current_user.id, 
            pose_name, 
            confidence,
            session_id=session_id,
            duration_seconds=duration
        )
        
        if activity_id:
            return jsonify({
                'success': True,
                'activity_id': activity_id,
                'message': 'Activity logged successfully'
            })
        else:
            return jsonify({'error': 'Failed to log activity'}), 500
            
    except Exception as e:
        print(f"Error logging activity: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/stats')
@login_required
def get_user_stats():
    """Get user statistics for dashboard"""
    try:
        days = request.args.get('days', 30, type=int)
        stats = get_user_activity_stats(current_user.id, days)
        streak = get_user_streak(current_user.id)
        
        stats['current_streak'] = streak
        stats['user_level'] = calculate_user_level(stats['total_asanas'])
        
        return jsonify(stats)
    except Exception as e:
        print(f"Error getting user stats: {e}")
        return jsonify({'error': 'Failed to get user stats'}), 500

@app.route('/api/leaderboard')
@login_required
def get_leaderboard():
    """Get global leaderboard ranked by total asanas (all-time)"""
    try:
        print(f"Getting leaderboard for user: {current_user.id}")
        
        # Check if database connection exists
        if db.db is None:
            print("Database connection is None!")
            return jsonify({'error': 'Database not connected'}), 500
        
        # Get all users who have activities
        users_with_activities = db.db.user_activities.distinct('user_id')
        print(f"Users with activities: {len(users_with_activities)}")
        
        if not users_with_activities:
            return jsonify([])
        
        leaderboard = []
        
        # For each user, count their total activities (same logic as dashboard stats)
        for user_id in users_with_activities:
            # Count total asanas for this user (all-time)
            total_asanas = db.db.user_activities.count_documents({
                'user_id': user_id
            })
            
            # Get user info
            user = db.db.users.find_one({'_id': user_id})
            if user:
                leaderboard.append({
                    'user_id': str(user_id),
                    'username': user['username'],
                    'total_asanas': total_asanas,
                    'is_current_user': str(user_id) == current_user.id
                })
                print(f"User {user['username']}: {total_asanas} asanas")
        
        # Sort by total asanas descending (highest first)
        leaderboard.sort(key=lambda x: x['total_asanas'], reverse=True)
        
        # Limit to top 20
        leaderboard = leaderboard[:20]
        
        print(f"Final leaderboard: {len(leaderboard)} users")
        return jsonify(leaderboard)
        
    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to get leaderboard: {str(e)}'}), 500

@app.route('/api/debug/activities')
@login_required
def debug_activities():
    """Debug endpoint to check user activities"""
    try:
        print(f"Debug endpoint called for user: {current_user.id}")
        
        # Check if database connection exists
        if db.db is None:
            return jsonify({'error': 'Database not connected', 'db_status': 'None'}), 500
        
        print("Database connection OK, checking collections...")
        
        # List all collections to see what exists
        collections = db.db.list_collection_names()
        print(f"Available collections: {collections}")
        
        # Check total count of activities
        total_count = db.db.user_activities.count_documents({})
        print(f"Total activities: {total_count}")
        
        # Check activities for current user
        user_count = db.db.user_activities.count_documents({'user_id': ObjectId(current_user.id)})
        print(f"User activities: {user_count}")
        
        # Get sample activities
        sample_activities = list(db.db.user_activities.find().limit(5))
        print(f"Sample activities found: {len(sample_activities)}")
        
        # Convert ObjectIds to strings for JSON serialization
        for activity in sample_activities:
            activity['_id'] = str(activity['_id'])
            activity['user_id'] = str(activity['user_id'])
        
        return jsonify({
            'database_status': 'connected',
            'collections': collections,
            'total_activities': total_count,
            'current_user_activities': user_count,
            'current_user_id': current_user.id,
            'sample_activities': sample_activities
        })
    except Exception as e:
        print(f"Error in debug endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'type': type(e).__name__}), 500

def calculate_user_level(total_asanas):
    """Calculate user level based on total asanas performed"""
    if total_asanas >= 5000:
        return "Yoga Master 🏆"
    elif total_asanas >= 2500:
        return "Advanced Yogi 🌟"
    elif total_asanas >= 1000:
        return "Intermediate Yogi 💫"
    elif total_asanas >= 500:
        return "Beginner Yogi 🌱"
    else:
        return "New Yogi 🎯"
    
#update profile section
@app.route('/api/user/profile', methods=['GET', 'PUT'])
@login_required
def user_profile():
    """Get or update user profile data"""
    if request.method == 'GET':
        try:
            # Get current user data
            user_doc = db.db.users.find_one({'_id': ObjectId(current_user.id)})
            if not user_doc:
                return jsonify({'error': 'User not found'}), 404
            
            # Return user profile data
            profile_data = {
                'username': user_doc.get('username', ''),
                'email': user_doc.get('email', ''),
                'profile': user_doc.get('profile', {
                    'first_name': '',
                    'last_name': '',
                    'gender': '',
                    'age': None,
                    'avatar_url': '',
                    'bio': ''
                })
            }
            
            return jsonify(profile_data)
            
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return jsonify({'error': 'Internal server error'}), 500
    
    elif request.method == 'PUT':
        try:
            data = request.get_json()
            
            update_data = {
                'profile.first_name': data.get('first_name', ''),
                'profile.last_name': data.get('last_name', ''),
                'profile.gender': data.get('gender', ''),
                'profile.age': data.get('age'),
                'profile.avatar_url': data.get('avatar_url', ''),
                'profile.bio': data.get('bio', ''),
                'timestamps.updated_at': datetime.utcnow()
            }
            
            # Remove empty fields to avoid setting them to empty strings
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            result = db.db.users.update_one(
                {'_id': ObjectId(current_user.id)},
                {'$set': update_data}
            )
            
            if result.modified_count > 0:
                return jsonify({'success': True, 'message': 'Profile updated successfully'})
            else:
                return jsonify({'success': True, 'message': 'No changes made'})
                
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return jsonify({'error': 'Internal server error'}), 500
    
#========================update profile section starts here ======================================
@app.route('/profile')
@login_required
def profile():
    """User profile page"""
    return render_template('profile.html', user=current_user)

@app.route('/account-settings')
@login_required
def account_settings():
    """Account settings page"""
    return render_template('account-settings.html', user=current_user)

@app.route('/api/user/username', methods=['PUT'])
@login_required
def change_username():
    """Change username"""
    try:
        data = request.get_json()
        new_username = data.get('new_username')
        password = data.get('password')
        
        if not new_username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Verify current password
        user = User.find_by_id(current_user.id)
        if not user or not user.check_password(password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Check if username already exists
        if User.find_by_username(new_username):
            return jsonify({'error': 'Username already exists'}), 400
        
        # Update username
        result = db.db.users.update_one(
            {'_id': ObjectId(current_user.id)},
            {'$set': {'username': new_username}}
        )
        
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': 'Username updated successfully'})
        else:
            return jsonify({'error': 'Failed to update username'}), 500
            
    except Exception as e:
        print(f"Error changing username: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/password', methods=['PUT'])
@login_required
def change_password():
    """Change password"""
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        # Verify current password
        user = User.find_by_id(current_user.id)
        if not user or not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Update password
        new_password_hash = generate_password_hash(new_password)
        result = db.db.users.update_one(
            {'_id': ObjectId(current_user.id)},
            {'$set': {
                'password_hash': new_password_hash,
                'security.password_changed_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': 'Password updated successfully'})
        else:
            return jsonify({'error': 'Failed to update password'}), 500
            
    except Exception as e:
        print(f"Error changing password: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/account', methods=['DELETE'])
@login_required
def delete_account():
    """Delete user account"""
    try:
        user_id = current_user.id
        
        # Delete user activities
        db.db.user_activities.delete_many({'user_id': ObjectId(user_id)})
        
        # Delete user sessions
        db.db.sessions.delete_many({'user_id': ObjectId(user_id)})
        
        # Delete user account
        result = db.db.users.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count > 0:
            logout_user()
            return jsonify({'success': True, 'message': 'Account deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete account'}), 500
            
    except Exception as e:
        print(f"Error deleting account: {e}")
        return jsonify({'error': 'Internal server error'}), 500

#=========================end of user profile edit section=======================================


#=========================user tracking system ends here ========================================

# Add this to handle MongoDB connection errors gracefully
@app.before_request
def check_db_connection():
    """Check if database is connected before each request"""
    if request.endpoint and request.endpoint not in ['static', 'index']:
        if db.db is None:
            flash('Database connection unavailable. Some features may not work.', 'warning')

@app.route('/cleanup_temp_files', methods=['POST'])
def cleanup_temp_files_route():
    """API endpoint to clean up temporary files"""
    try:
        cleanup_temp_files()
        return jsonify({'success': True, 'message': 'Temporary files cleaned up'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    # Load model before starting the server
    load_model_and_encoder()
    
    # Load asana data
    load_asana_data()
    
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Clean up any existing temp files on startup
    cleanup_temp_files()
    
    try:
        # Run the Flask app
        app.run(debug=True, host='0.0.0.0', port=5000)
    finally:
        # Clean up temp files on shutdown
        cleanup_temp_files()