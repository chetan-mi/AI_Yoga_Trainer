import os
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for,flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import config
from utils import db, User, get_user_sessions
from werkzeug.utils import secure_filename
import tensorflow as tf
from tensorflow.keras.models import load_model
import pickle
from utils.pose_utils import PoseUtils
import google.generativeai as genai
from dotenv import load_dotenv
import threading
import time
import base64
import json
from tts_system import AdvancedIndianTTSSystem

# Initialize Flask app
app = Flask(__name__, template_folder="app/templates", static_folder="app/static")
app.config['UPLOAD_FOLDER'] = 'app/static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size




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
        with open('asana_data.json', 'r', encoding='utf-8') as f:
            asana_data = json.load(f)
        print("Asana data loaded successfully")
    except Exception as e:
        print(f"Error loading asana data: {e}")
        asana_data = {}

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

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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

def get_pose_instructions_and_feedback(pose_name, language="en"):
    """Get instructions and feedback for a yoga pose using Gemini API"""
    try:
        # Get traditional name for the pose
        traditional_name = get_traditional_name(pose_name)
        
        # Check if Gemini model is available
        if not gemini_model:
            print("⚠️ Gemini model not available, using fallback instructions")
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
        # Fallback instructions - shorter and more focused
        fallback_instructions = f"""
        - Arms extended overhead
        - Legs hip-width apart
        - Head neutral
        - Engage core
        - Breathe steadily
        """
        fallback_feedback = f"Focus on your breathing and maintain steady alignment while performing {traditional_name}."
        return fallback_instructions, fallback_feedback

def speak_pose_feedback(pose_name, feedback, language="en"):
    """Speak only pose name using Indian TTS system - NON-BLOCKING"""
    try:
        if tts_system:
            # Get traditional name for the pose
            traditional_name = get_traditional_name(pose_name)
            
            # Use the non-blocking speak method directly - only speak pose name
            return tts_system.speak_pose_feedback(traditional_name, "", language)
        else:
            print("TTS system not available")
            return False
    except Exception as e:
        print(f"Error speaking pose name: {e}")
        return False

def speak_welcome_message(language="en"):
    """Speak welcome message using Indian TTS system - NON-BLOCKING"""
    try:
        if tts_system:
            # Use the non-blocking speak method directly
            return tts_system.speak_welcome(language)
        else:
            print("TTS system not available")
            return False
    except Exception as e:
        print(f"Error speaking welcome: {e}")
        return False

def speak_pose_name_tts(pose_name, language="en"):
    """Speak pose name using gTTS with female voice - NON-BLOCKING"""
    try:
        from gtts import gTTS
        import pygame
        import tempfile
        import os
        import threading
        
        # Language mapping for gTTS
        language_codes = {
            'en': 'en',
            'hi': 'hi',
            'kn': 'kn',
            'ta': 'ta',
            'te': 'te',
            'mr': 'mr',
            'bn': 'bn',
            'gu': 'gu',
            'pa': 'pa'
        }
        
        tts_lang = language_codes.get(language, 'en')
        
        def speak_async():
            try:
                # Create gTTS object with female voice (slower speed for more feminine sound)
                tts = gTTS(text=pose_name, lang=tts_lang, slow=False)
                
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                    tts.save(tmp_file.name)
                    
                    # Play the audio
                    pygame.mixer.init()
                    pygame.mixer.music.load(tmp_file.name)
                    pygame.mixer.music.play()
                    
                    # Wait for playback to complete
                    while pygame.mixer.music.get_busy():
                        pygame.time.wait(100)
                    
                    # Clean up
                    pygame.mixer.quit()
                    os.unlink(tmp_file.name)
                    
                print(f"✅ Spoke pose name: {pose_name} in {language}")
                
            except Exception as e:
                print(f"Error in async speak: {e}")
        
        # Run in separate thread to avoid blocking
        thread = threading.Thread(target=speak_async)
        thread.daemon = True
        thread.start()
        
        return True
        
    except Exception as e:
        print(f"Error speaking pose name: {e}")
        return False

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Handle image upload and prediction"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'})
    
    if file and allowed_file(file.filename):
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Read and process the image
        image = cv2.imread(filepath)
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
        
        # Draw landmarks on image
        annotated_image = pose_utils.draw_landmarks(image, results)
        annotated_filename = f"annotated_{filename}"
        annotated_filepath = os.path.join(app.config['UPLOAD_FOLDER'], annotated_filename)
        cv2.imwrite(annotated_filepath, annotated_image)
        
        # Return results
        return jsonify({
            'pose': pose_name,
            'confidence': float(confidence),
            'image_url': f"/static/uploads/{annotated_filename}"
        })
    
    return jsonify({'error': 'Invalid file type'})

@app.route('/get_instructions', methods=['POST'])
def get_instructions():
    """Get instructions and feedback for a pose"""
    data = request.get_json()
    pose_name = data.get('pose_name', '')
    language = data.get('language', 'en-in')
    
    if not pose_name:
        return jsonify({'error': 'No pose name provided'})
    
    instructions, feedback = get_pose_instructions_and_feedback(pose_name, language)
    
    return jsonify({
        'instructions': instructions,
        'feedback': feedback
    })

@app.route('/speak_feedback', methods=['POST'])
def speak_feedback():
    """Speak pose feedback using Indian TTS"""
    data = request.get_json()
    pose_name = data.get('pose_name', '')
    feedback = data.get('feedback', '')
    language = data.get('language', 'en-in')
    
    if not pose_name or not feedback:
        return jsonify({'error': 'Missing pose name or feedback'})
    
    success = speak_pose_feedback(pose_name, feedback, language)
    
    return jsonify({
        'success': success,
        'message': 'Feedback spoken' if success else 'Failed to speak feedback'
    })

@app.route('/speak_welcome', methods=['POST'])
def speak_welcome():
    """Speak welcome message using Indian TTS"""
    data = request.get_json()
    language = data.get('language', 'en-in')
    
    success = speak_welcome_message(language)
    
    return jsonify({
        'success': success,
        'message': 'Welcome message spoken' if success else 'Failed to speak welcome message'
    })

@app.route('/speak_pose_name', methods=['POST'])
def speak_pose_name():
    """Speak pose name using Indian TTS with female voice"""
    data = request.get_json()
    pose_name = data.get('pose_name', '')
    language = data.get('language', 'en')
    
    if not pose_name:
        return jsonify({'error': 'No pose name provided'})
    
    try:
        # Get traditional name for the pose
        traditional_name = get_traditional_name(pose_name)
        
        # Use gTTS with female voice for Indian languages
        success = speak_pose_name_tts(traditional_name, language)
        
        return jsonify({
            'success': success,
            'message': 'Pose name spoken' if success else 'Failed to speak pose name'
        })
    except Exception as e:
        print(f"Error speaking pose name: {e}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@app.route('/get_languages', methods=['GET'])
def get_languages():
    """Get available Indian languages"""
    if tts_system:
        languages = tts_system.get_available_languages()
        return jsonify({
            'languages': languages,
            'current': tts_system.current_language
        })
    else:
        return jsonify({'error': 'TTS system not available'})

@app.route('/set_language', methods=['POST'])
def set_language():
    """Set the TTS language"""
    data = request.get_json()
    language = data.get('language', 'en-in')
    
    if tts_system:
        success = tts_system.set_language(language)
        return jsonify({
            'success': success,
            'language': language,
            'message': f'Language set to {language}' if success else f'Language {language} not available'
        })
    else:
        return jsonify({'error': 'TTS system not available'})

@app.route('/get_pose_benefits', methods=['POST'])
def get_pose_benefits():
    """Get detailed benefits for a yoga pose from asana_data.json"""
    data = request.get_json()
    pose_name = data.get('pose_name', '')
    language = data.get('language', 'en')
    
    if not pose_name:
        return jsonify({'error': 'No pose name provided'})
    
    try:
        traditional_name = get_traditional_name(pose_name)
        
        # First try to get data from asana_data.json
        if asana_data and pose_name in asana_data:
            pose_info = asana_data[pose_name]
            benefits_list = pose_info.get('benefits', [])
            warnings_list = pose_info.get('warnings', [])
            
            # Format benefits as a single string
            benefits_text = '\n'.join([f"• {benefit}" for benefit in benefits_list])
            contraindications_text = '\n'.join([f"• {warning}" for warning in warnings_list])
            
            return jsonify({
                'benefits': benefits_text,
                'contraindications': contraindications_text,
                'timing': f"Best timing for {traditional_name} will be displayed here"
            })
        
        # Fallback to Gemini API if pose not found in asana_data.json
        if not gemini_model:
            return jsonify({
                'benefits': f"Benefits for {traditional_name} will be displayed here",
                'contraindications': f"Contraindications for {traditional_name} will be displayed here",
                'timing': f"Best timing for {traditional_name} will be displayed here"
            })
        
        language_names = {
            "en": "Indian English",
            "hi": "Hindi",
            "kn": "Kannada", 
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi"
        }
        
        target_lang_name = language_names.get(language, "Indian English")
        
        benefits_prompt = f"""
        Provide detailed benefits for the yoga pose: {traditional_name}
        Language: {target_lang_name}
        
        Format as a clear, concise list of 3-5 key benefits.
        Focus on physical, mental, and spiritual benefits.
        Keep each benefit under 15 words.
        """
        
        contraindications_prompt = f"""
        Provide contraindications (when to avoid) for the yoga pose: {traditional_name}
        Language: {target_lang_name}
        
        Format as a clear, concise list of 2-4 key contraindications.
        Focus on medical conditions, injuries, and situations to avoid.
        Keep each contraindication under 15 words.
        """
        
        timing_prompt = f"""
        Provide timing recommendations for the yoga pose: {traditional_name}
        Language: {target_lang_name}
        
        Include: best time of day, duration to hold, frequency, and any dietary considerations.
        Keep it concise and practical.
        """
        
        benefits_response = gemini_model.generate_content(benefits_prompt)
        contraindications_response = gemini_model.generate_content(contraindications_prompt)
        timing_response = gemini_model.generate_content(timing_prompt)
        
        return jsonify({
            'benefits': benefits_response.text.strip(),
            'contraindications': contraindications_response.text.strip(),
            'timing': timing_response.text.strip()
        })
        
    except Exception as e:
        print(f"Error getting pose benefits: {e}")
        return jsonify({
            'benefits': f"Benefits for {traditional_name} will be displayed here",
            'contraindications': f"Contraindications for {traditional_name} will be displayed here",
            'timing': f"Best timing for {traditional_name} will be displayed here"
        })

@app.route('/get_body_measurements', methods=['POST'])
def get_body_measurements():
    """Get body part measurements and analysis for a pose"""
    data = request.get_json()
    pose_name = data.get('pose_name', '')
    landmarks = data.get('landmarks', [])
    
    if not pose_name or not landmarks:
        return jsonify({'error': 'No pose name or landmarks provided'})
    
    try:
        # Calculate body measurements from landmarks
        measurements = calculate_body_measurements(landmarks, pose_name)
        return jsonify(measurements)
    except Exception as e:
        print(f"Error calculating body measurements: {e}")
        return jsonify({'error': 'Failed to calculate measurements'})

def calculate_body_measurements(landmarks, pose_name):
    """Calculate body part measurements from pose landmarks"""
    if len(landmarks) < 33:  # MediaPipe pose has 33 landmarks
        return {
            'spine_angle': 0,
            'knee_angle': 0,
            'hip_angle': 0,
            'shoulder_angle': 0,
            'arm_span': 0,
            'leg_length': 0,
            'torso_length': 0,
            'balance_score': 0
        }
    
    # Convert landmarks to numpy array for easier calculation
    import numpy as np
    landmarks = np.array(landmarks).reshape(-1, 3)
    
    # Key landmark indices for MediaPipe pose
    # 11: left_shoulder, 12: right_shoulder, 13: left_elbow, 14: right_elbow
    # 15: left_wrist, 16: right_wrist, 23: left_hip, 24: right_hip
    # 25: left_knee, 26: right_knee, 27: left_ankle, 28: right_ankle
    # 0: nose, 1: left_eye_inner, 2: left_eye, 3: left_eye_outer
    
    def calculate_angle(p1, p2, p3):
        """Calculate angle between three points"""
        v1 = p1 - p2
        v2 = p3 - p2
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        return np.degrees(np.arccos(cos_angle))
    
    def calculate_distance(p1, p2):
        """Calculate distance between two points"""
        return np.linalg.norm(p1 - p2)
    
    # Calculate spine angle (using shoulder and hip alignment)
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_hip = landmarks[23]
    right_hip = landmarks[24]
    
    shoulder_center = (left_shoulder + right_shoulder) / 2
    hip_center = (left_hip + right_hip) / 2
    
    # Spine angle relative to vertical
    spine_vector = shoulder_center - hip_center
    vertical_vector = np.array([0, 1, 0])
    spine_angle = calculate_angle(spine_vector, np.array([0, 0, 0]), vertical_vector)
    
    # Calculate knee angles
    left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])  # hip-knee-ankle
    right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])
    knee_angle = (left_knee_angle + right_knee_angle) / 2
    
    # Calculate hip angles
    left_hip_angle = calculate_angle(landmarks[11], landmarks[23], landmarks[25])  # shoulder-hip-knee
    right_hip_angle = calculate_angle(landmarks[12], landmarks[24], landmarks[26])
    hip_angle = (left_hip_angle + right_hip_angle) / 2
    
    # Calculate shoulder angles
    left_shoulder_angle = calculate_angle(landmarks[13], landmarks[11], landmarks[12])  # elbow-shoulder-shoulder
    right_shoulder_angle = calculate_angle(landmarks[14], landmarks[12], landmarks[11])
    shoulder_angle = (left_shoulder_angle + right_shoulder_angle) / 2
    
    # Calculate body measurements
    arm_span = calculate_distance(landmarks[15], landmarks[16])  # wrist to wrist
    left_leg_length = calculate_distance(landmarks[23], landmarks[27])  # hip to ankle
    right_leg_length = calculate_distance(landmarks[24], landmarks[28])
    leg_length = (left_leg_length + right_leg_length) / 2
    
    torso_length = calculate_distance(shoulder_center, hip_center)
    
    # Calculate balance score (symmetry between left and right sides)
    left_side_balance = abs(left_knee_angle - right_knee_angle) + abs(left_hip_angle - right_hip_angle)
    right_side_balance = abs(left_shoulder_angle - right_shoulder_angle)
    balance_score = max(0, 100 - (left_side_balance + right_side_balance) * 2)
    
    return {
        'spine_angle': round(spine_angle, 1),
        'knee_angle': round(knee_angle, 1),
        'hip_angle': round(hip_angle, 1),
        'shoulder_angle': round(shoulder_angle, 1),
        'arm_span': round(arm_span * 100, 1),  # Convert to cm
        'leg_length': round(leg_length * 100, 1),  # Convert to cm
        'torso_length': round(torso_length * 100, 1),  # Convert to cm
        'balance_score': round(balance_score, 1)
    }

@app.route('/webcam')
def webcam():
    """Webcam pose detection page"""
    return render_template('webcam.html')

@app.route('/test')
def test():
    """Test button functionality"""
    return send_file('test_button.html')

if __name__ == '__main__':
    # Load model before starting the server
    load_model_and_encoder()
    
    # Load asana data
    load_asana_data()
    
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
