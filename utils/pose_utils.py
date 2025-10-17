import cv2
import numpy as np
import mediapipe as mp

class PoseUtils:
    def __init__(self):
        # Initialize MediaPipe Pose
        mp_pose = mp.solutions.pose
        self.pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
    
    def extract_landmarks(self, image):
        """Extract pose landmarks from image"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            return None, None
        
        landmarks = []
        for lm in results.pose_landmarks.landmark:
            landmarks.extend([lm.x, lm.y, lm.z])
        
        return np.array(landmarks), results
    
    def draw_landmarks(self, image, results):
        """Draw pose landmarks on image"""
        annotated_image = image.copy()
        self.mp_drawing.draw_landmarks(
            annotated_image,
            results.pose_landmarks,
            mp.solutions.pose.POSE_CONNECTIONS,
            landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style())
        return annotated_image
    
    def preprocess_image(self, image, target_size=(224, 224)):
        """Preprocess image for model input"""
            # Convert to RGB if needed
        if len(image.shape) == 2:
            img = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 1:
            img = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            img = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        else:
            img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            
        img = cv2.resize(img, target_size)
        img = img / 255.0  # Normalize to [0,1]
        return img