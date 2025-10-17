import numpy as np
import tensorflow as tf
from tensorflow.keras.utils import Sequence
import cv2
import os
from .pose_utils import PoseUtils

class HybridDataGenerator(Sequence):
    def __init__(self, image_paths, landmark_data, labels, batch_size=16, target_size=(224, 224)):
        self.image_paths = image_paths
        self.landmark_data = landmark_data
        self.labels = labels
        self.batch_size = batch_size
        self.target_size = target_size
        self.pose_utils = PoseUtils()
        self.indices = np.arange(len(self.image_paths))
        
    def __len__(self):
        return int(np.ceil(len(self.image_paths) / self.batch_size))
    
    def __getitem__(self, index):
        batch_indices = self.indices[index * self.batch_size:(index + 1) * self.batch_size]
        
        batch_images = []
        batch_landmarks = []
        batch_labels = []
        
        for i in batch_indices:
            # Load and preprocess image
            img = cv2.imread(self.image_paths[i])
            if img is not None:
                # Convert to RGB and ensure 3 channels
                if len(img.shape) == 2:
                    img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
                elif img.shape[2] == 1:
                    img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
                elif img.shape[2] == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
                else:
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                
                img = cv2.resize(img, self.target_size)
                img = img.astype(np.float32) / 255.0
                batch_images.append(img)
                
                # Get landmarks and labels
                batch_landmarks.append(self.landmark_data[i])
                batch_labels.append(self.labels[i])
        
        return [np.array(batch_images), np.array(batch_landmarks)], np.array(batch_labels)
    
    def on_epoch_end(self):
        # Shuffle indices after each epoch
        np.random.shuffle(self.indices)