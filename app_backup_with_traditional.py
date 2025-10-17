import os
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify
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
from tts_system import AdvancedIndianTTSSystem

# Initialize Flask app
app = Flask(__name__, template_folder="app/templates", static_folder="app/static")
app.config['UPLOAD_FOLDER'] = 'app/static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp'}

load_dotenv('/home/chinmay/coding-ubuntu/hybrid_approach/.env')

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

def get_pose_instructions_and_feedback(pose_name, language='en-in'):
    """Get instructions and feedback for a yoga pose using Gemini API"""
    try:
        language_names = {
            'en-in': 'Indian English',
            'hi': 'Hindi',
            'kn': 'Kannada', 
            'ta': 'Tamil',
            'te': 'Telugu',
            'mr': 'Marathi'
        }
        
        target_lang_name = language_names.get(language, 'Indian English')
        
        instructions_prompt = f"""
        Provide very brief, key-point instructions for the yoga pose: {pose_name}
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
        Provide a very brief feedback tip for the yoga pose: {pose_name}
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
        fallback_feedback = f"Focus on your breathing and maintain steady alignment while performing {pose_name}."
        return fallback_instructions, fallback_feedback

def speak_pose_feedback(pose_name, feedback, language='en-in'):
    """Speak pose feedback using Indian TTS system"""
    try:
        if tts_system and tts_system.engine:
            # Speak in a separate thread to avoid blocking
            def speak_thread():
                tts_system.speak_pose_feedback(pose_name, feedback, language)
            
            thread = threading.Thread(target=speak_thread)
            thread.daemon = True
            thread.start()
            return True
        else:
            print("TTS system not available")
            return False
    except Exception as e:
        print(f"Error speaking feedback: {e}")
        return False

def speak_welcome_message(language='en-in'):
    """Speak welcome message using Indian TTS system"""
    try:
        if tts_system and tts_system.engine:
            # Speak in a separate thread to avoid blocking
            def speak_thread():
                tts_system.speak_welcome(language)
            
            thread = threading.Thread(target=speak_thread)
            thread.daemon = True
            thread.start()
            return True
        else:
            print("TTS system not available")
            return False
    except Exception as e:
        print(f"Error speaking welcome: {e}")
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

@app.route('/webcam')
def webcam():
    """Webcam pose detection page"""
    return render_template('webcam.html')

if __name__ == '__main__':
    # Load model before starting the server
    load_model_and_encoder()
    
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5001)
