import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.preprocessing import LabelEncoder
from tqdm import tqdm
import pickle
import mediapipe as mp

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)

def extract_pose_landmarks(image_path):
    """Extract 33 pose landmarks from an image"""
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = pose.process(img_rgb)
    
    if not results.pose_landmarks:
        return None
    
    landmarks = []
    for lm in results.pose_landmarks.landmark:
        landmarks.extend([lm.x, lm.y, lm.z])
    
    return np.array(landmarks)

def load_data_from_folder(folder_path):
    """Load data from a specific folder (train/test/valid)"""
    X, y = [], []
    skipped = 0
    
    print(f"Loading data from: {folder_path}")
    
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
            landmarks = extract_pose_landmarks(image_path)
            
            if landmarks is not None:
                X.append(landmarks)
                y.append(pose_name)
            else:
                skipped += 1
    
    print(f"Loaded {len(X)} samples, skipped {skipped} images")
    return np.array(X), np.array(y)

def create_dnn_model(input_dim, num_classes):
    """Create DNN model for pose landmarks"""
    model = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax')
    ])
    return model

def main():
    # Path to your dataset
    dataset_path = "/home/chinmay/coding-ubuntu/hybrid_approach/data"
    
    # Load training data
    train_path = os.path.join(dataset_path, "train")
    X_train, y_train = load_data_from_folder(train_path)
    
    if X_train is None:
        print("Error loading training data!")
        return
    
    # Load test data
    test_path = os.path.join(dataset_path, "test")
    X_test, y_test = load_data_from_folder(test_path)
    
    if X_test is None:
        print("Error loading test data!")
        return
    
    # Encode labels
    le = LabelEncoder()
    y_train_encoded = le.fit_transform(y_train)
    y_test_encoded = le.transform(y_test)
    
    num_classes = len(le.classes_)
    
    print(f"\nDataset Summary:")
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Number of classes: {num_classes}")
    print("Classes:", le.classes_)
    
    # Create DNN model
    model = create_dnn_model(X_train.shape[1], num_classes)
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.summary()
    
    # Train model
    print("\nTraining DNN model...")
    history = model.fit(
        X_train, y_train_encoded,
        epochs=60,
        batch_size=32,
        validation_data=(X_test, y_test_encoded),
        verbose=1
    )
    
    # Evaluate on test set
    print("\nEvaluating on test set...")
    test_loss, test_acc = model.evaluate(X_test, y_test_encoded, verbose=1)
    print(f"\nTest Accuracy: {test_acc:.4f}")
    print(f"Test Loss: {test_loss:.4f}")
    
    # Save model and label encoder
    model.save("models/yoga_pose_dnn_model.h5")
    with open("models/label_encoder_dnn.pkl", "wb") as f:
        pickle.dump(le, f)
    
    print("\nModel saved as 'models/yoga_pose_dnn_model.h5'")
    print("Label encoder saved as 'models/label_encoder_dnn.pkl'")

if __name__ == "__main__":
    main()