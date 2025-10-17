import os
import cv2
import numpy as np
from tqdm import tqdm
import mediapipe as mp

class DataLoader:
    def __init__(self):
        # Initialize MediaPipe Pose
        mp_pose = mp.solutions.pose
        self.pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
    
    def extract_pose_landmarks(self, image_path):
        """Extract 33 pose landmarks from an image"""
        img = cv2.imread(image_path)
        if img is None:
            return None
        
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.pose.process(img_rgb)
        
        if not results.pose_landmarks:
            return None
        
        landmarks = []
        for lm in results.pose_landmarks.landmark:
            landmarks.extend([lm.x, lm.y, lm.z])
        
        return np.array(landmarks)
    
    def load_and_preprocess_image(self, image_path, target_size=(224, 224)):
        """Load and preprocess image for EfficientNet"""
        img = cv2.imread(image_path)
        if img is None:
            return None
        
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # If image is grayscale, convert to RGB
        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
        elif img.shape[2] == 1:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
        elif img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)

        img = cv2.resize(img, target_size)
        img = img / 255.0  # Normalize to [0,1]
        return img
    
    def load_data_from_folder(self, folder_path, extract_landmarks=True):
        """Load data from a folder"""
        X, y = [], []
        skipped = 0
        
        if not os.path.exists(folder_path):
            print(f"Error: Folder {folder_path} not found!")
            return None, None
        
        # Get all subdirectories (yoga poses)
        yoga_poses = [d for d in os.listdir(folder_path) 
                     if os.path.isdir(os.path.join(folder_path, d)) and not d.startswith('.')]
        
        if not yoga_poses:
            print(f"No pose folders found in {folder_path}")
            return None, None
        
        for pose_name in yoga_poses:
            pose_path = os.path.join(folder_path, pose_name)
            image_files = [f for f in os.listdir(pose_path) 
                          if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]
            
            print(f"Processing {pose_name}: {len(image_files)} images")
            
            for fname in tqdm(image_files, desc=pose_name):
                image_path = os.path.join(pose_path, fname)
                
                if extract_landmarks:
                    landmarks = self.extract_pose_landmarks(image_path)
                    if landmarks is not None:
                        X.append(landmarks)
                        y.append(pose_name)
                    else:
                        skipped += 1
                else:
                    img = self.load_and_preprocess_image(image_path)
                    if img is not None:
                        X.append(img)
                        y.append(pose_name)
                    else:
                        skipped += 1
        
        print(f"Loaded {len(X)} samples, skipped {skipped} images")
        return np.array(X), np.array(y)
    
    def load_hybrid_data_from_folder(self, folder_path):
        """Load both images and landmarks for hybrid approach"""
        X_images, X_landmarks, y = [], [], []
        skipped = 0
        
        if not os.path.exists(folder_path):
            print(f"Error: Folder {folder_path} not found!")
            return None, None, None
        
        # Get all subdirectories (yoga poses)
        yoga_poses = [d for d in os.listdir(folder_path) 
                     if os.path.isdir(os.path.join(folder_path, d)) and not d.startswith('.')]
        
        if not yoga_poses:
            print(f"No pose folders found in {folder_path}")
            return None, None, None
        
        for pose_name in yoga_poses:
            pose_path = os.path.join(folder_path, pose_name)
            image_files = [f for f in os.listdir(pose_path) 
                          if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]
            
            print(f"Processing {pose_name}: {len(image_files)} images")
            
            for fname in tqdm(image_files, desc=pose_name):
                image_path = os.path.join(pose_path, fname)
                
                # Extract landmarks
                landmarks = self.extract_pose_landmarks(image_path)
                
                # Load and preprocess image
                img = self.load_and_preprocess_image(image_path)
                
                if landmarks is not None and img is not None:
                    X_landmarks.append(landmarks)
                    X_images.append(img)
                    y.append(pose_name)
                else:
                    skipped += 1
        
        print(f"Loaded {len(X_images)} samples, skipped {skipped} images")
        return np.array(X_images), np.array(X_landmarks), np.array(y)