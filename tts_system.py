from gtts import gTTS
import pygame
import threading
import time
import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv
import io
import tempfile

# Load environment variables
load_dotenv()

class AdvancedIndianTTSSystem:
    def __init__(self):
        self.is_speaking = False
        self.current_language = 'en'
        self.tld = 'co.in'  # Use Indian domain for more natural Indian English
        self.current_thread = None
        self.current_temp_file = None
        
        # Initialize Gemini API
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
            print("✅ Gemini API initialized successfully")
        else:
            print("⚠️ GEMINI_API_KEY not found in environment variables")
            self.gemini_model = None
        
        # Initialize pygame for audio playback with optimized settings
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=256)  # Smaller buffer for faster response
            print("✅ Pygame audio initialized")
        except Exception as e:
            print(f"⚠️ Pygame audio initialization failed: {e}")
        
        print("✅ gTTS system initialized with non-blocking audio")
        
    def translate_with_gemini(self, text, target_language):
        """Use Gemini to translate text to target language"""
        if not self.gemini_model:
            print("⚠️ Gemini model not available, using original text")
            return text
            
        try:
            language_names = {
                'en': 'Indian English',
                'hi': 'Hindi',
                'kn': 'Kannada', 
                'ta': 'Tamil',
                'te': 'Telugu',
                'mr': 'Marathi'
            }
            
            target_lang_name = language_names.get(target_language, 'English')
            
            prompt = f"""
            Translate the following text to {target_lang_name}. 
            Make it natural and easy to understand for voice synthesis.
            Keep it concise and clear.
            
            Text: {text}
            
            Translation:
            """
            
            response = self.gemini_model.generate_content(prompt)
            translated_text = response.text.strip()
            
            # Clean up the response
            if "Translation:" in translated_text:
                translated_text = translated_text.split("Translation:")[1].strip()
            
            print(f"🌍 Translated to {target_lang_name}: {translated_text}")
            return translated_text
            
        except Exception as e:
            print(f"Error translating with Gemini: {e}")
            print("Using original text as fallback")
            return text
    
    def stop_speaking(self):
        """Stop current speech and clean up"""
        try:
            if self.is_speaking:
                pygame.mixer.music.stop()
                self.is_speaking = False
                
            # Clean up current temp file
            if self.current_temp_file and os.path.exists(self.current_temp_file):
                try:
                    os.unlink(self.current_temp_file)
                except:
                    pass
                self.current_temp_file = None
                
            print("🔇 Speech stopped")
        except Exception as e:
            print(f"Error stopping speech: {e}")

    def speak(self, text, language='en'):
        """Speak text using gTTS with female voice - NON-BLOCKING version"""
        try:
            # Stop any current speech
            self.stop_speaking()
            
            # Translate text if needed (only for Hindi)
            if language == 'hi':
                translated_text = self.translate_with_gemini(text, language)
            else:
                translated_text = text
            
            print(f"🎤 Speaking ({language}): {translated_text}")
            
            # Create gTTS object with optimized settings for speed
            tts = gTTS(
                text=translated_text, 
                lang=language, 
                slow=False,  # Fast speech
                tld=self.tld  # Indian domain for more natural pronunciation
            )
            
            # Create a temporary file to store the audio
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
                temp_filename = temp_file.name
                tts.save(temp_filename)
            
            self.current_temp_file = temp_filename
            self.is_speaking = True
            
            # Play the audio using pygame (non-blocking)
            pygame.mixer.music.load(temp_filename)
            pygame.mixer.music.play()
            
            # Start a thread to monitor playback completion
            def monitor_playback():
                while pygame.mixer.music.get_busy() and self.is_speaking:
                    time.sleep(0.1)
                
                # Clean up when done
                if self.is_speaking:  # Only clean up if we weren't interrupted
                    try:
                        os.unlink(temp_filename)
                    except:
                        pass
                    self.current_temp_file = None
                    self.is_speaking = False
                    print("✅ Speech completed")
            
            self.current_thread = threading.Thread(target=monitor_playback)
            self.current_thread.daemon = True
            self.current_thread.start()
            
            return True
            
        except Exception as e:
            print(f"Error speaking: {e}")
            self.is_speaking = False
            return False
    
    def speak_welcome(self, language='en'):
        """Speak welcome message"""
        welcome_text = "Welcome to the yoga session. Let's begin your practice with mindful breathing."
        return self.speak(welcome_text, language)
    
    def speak_pose_feedback(self, pose_name, feedback, language='en'):
        """Speak only the pose name"""
        return self.speak(pose_name, language)
    
    def get_available_languages(self):
        """Get available languages - optimized for English and Hindi only"""
        return ['en', 'hi']
    
    def set_language(self, language):
        """Set current language"""
        if language in self.get_available_languages():
            self.current_language = language
            print(f"🎤 Language set to: {language}")
            return True
        return False
    
    def stop_speaking(self):
        """Stop current speech"""
        try:
            pygame.mixer.music.stop()
            self.is_speaking = False
            print("🛑 Speech stopped")
        except Exception as e:
            print(f"Error stopping speech: {e}")

if __name__ == "__main__":
    tts = AdvancedIndianTTSSystem()
    
    print("\n🧪 Testing welcome messages...")
    tts.speak_welcome('en')
    time.sleep(2)
    tts.speak_welcome('hi')
    time.sleep(2)
    tts.speak_welcome('kn')
    
    print("\n🧪 Testing pose feedback...")
    tts.speak_pose_feedback("Tree Pose", "Keep your spine straight and shoulders relaxed. Breathe deeply.", 'ta')
