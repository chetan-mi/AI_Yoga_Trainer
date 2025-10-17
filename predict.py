import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import mediapipe as mp
import pickle

class YogaPosePredictor:
    def __init__(self, model_path, encoder_path, use_hybrid=True):
        self.model = load_model(model_path)
        with open(encoder_path, 'rb') as f:
            self.le = pickle.load(f)
        self.use_hybrid = use_hybrid
        
        # Initialize MediaPipe Pose
        mp_pose = mp.solutions.pose
        self.pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
    
    def extract_landmarks(self, image):
        """Extract pose landmarks from image"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            return None
        
        landmarks = []
        for lm in results.pose_landmarks.landmark:
            landmarks.extend([lm.x, lm.y, lm.z])
        
        return np.array(landmarks)
    
    def preprocess_image(self, image, target_size=(224, 224)):
        """Preprocess image for EfficientNet"""
        img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, target_size)
        img = tf.keras.applications.efficientnet.preprocess_input(img)
        return np.expand_dims(img, axis=0)
    
    def predict(self, image_path):
        """Predict yoga pose from image path"""
        image = cv2.imread(image_path)
        if image is None:
            return "Error: Could not load image"
        
        if self.use_hybrid:
            # Hybrid model prediction
            landmarks = self.extract_landmarks(image)
            if landmarks is None:
                return "No pose detected"
            
            processed_image = self.preprocess_image(image)
            landmarks = np.expand_dims(landmarks, axis=0)
            
            prediction = self.model.predict([processed_image, landmarks])
        else:
            # DNN model prediction
            landmarks = self.extract_landmarks(image)
            if landmarks is None:
                return "No pose detected"
            
            landmarks = np.expand_dims(landmarks, axis=0)
            prediction = self.model.predict(landmarks)
        
        class_idx = np.argmax(prediction)
        confidence = prediction[0][class_idx]
        class_name = self.le.inverse_transform([class_idx])[0]
        
        return class_name, confidence

# Example usage
if __name__ == "__main__":
    # # For hybrid model
    # predictor = YogaPosePredictor(
    #     "models/yoga_pose_hybrid_model.h5", 
    #     "models/label_encoder.pkl",
    #     use_hybrid=True
    # )
    
    #For DNN model
    predictor = YogaPosePredictor(
        "models/yoga_pose_dnn_model.h5", 
        "models/label_encoder_dnn.pkl",
        use_hybrid=False
    )
    
    # Test prediction
    image_path = "test_image.jpg"  # Replace with your test image path
    pose, confidence = predictor.predict(image_path)
    print(f"Predicted pose: {pose} with confidence: {confidence:.4f}")