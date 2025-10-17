import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import Model, layers, models
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

def load_image_paths_and_landmarks(folder_path):
    """Load only image paths and landmarks, not the actual images"""
    image_paths, landmarks, y = [], [], []
    
    print(f"Loading paths and landmarks from: {folder_path}")
    
    if not os.path.exists(folder_path):
        print(f"Error: Folder {folder_path} not found!")
        return None, None, None
    
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
            landmark = extract_pose_landmarks(image_path)
            
            if landmark is not None:
                image_paths.append(image_path)
                landmarks.append(landmark)
                y.append(pose_name)
    
    print(f"Loaded {len(image_paths)} image paths and landmarks")
    return image_paths, np.array(landmarks), np.array(y)

class HybridDataGenerator(tf.keras.utils.Sequence):
    """Data generator that loads images in batches to save memory"""
    def __init__(self, image_paths, landmark_data, labels, batch_size=16, target_size=(224, 224)):
        self.image_paths = image_paths
        self.landmark_data = landmark_data
        self.labels = labels
        self.batch_size = batch_size
        self.target_size = target_size
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
        
        # Convert to TensorFlow tensors with proper types
        batch_images_tf = tf.convert_to_tensor(batch_images, dtype=tf.float32)
        batch_landmarks_tf = tf.convert_to_tensor(batch_landmarks, dtype=tf.float32)
        batch_labels_tf = tf.convert_to_tensor(batch_labels, dtype=tf.int32)
        
        return [batch_images_tf, batch_landmarks_tf], batch_labels_tf
    
    def on_epoch_end(self):
        # Shuffle indices after each epoch
        np.random.shuffle(self.indices)

def create_hybrid_model(landmark_dim, num_classes):
    """Create hybrid model with MobileNetV2 backbone"""
    # Pre-trained image backbone (MobileNetV2)
    base_model = MobileNetV2(weights='imagenet', include_top=False, 
                            input_shape=(224, 224, 3), pooling='avg')
    base_model.trainable = False  # Freeze initially
    
    # Image input branch
    image_input = layers.Input(shape=(224, 224, 3), name='image_input')
    image_features = base_model(image_input)
    image_features = layers.Dense(128, activation='relu', name='image_dense')(image_features)
    image_features = layers.Dropout(0.3)(image_features)
    
    # Landmark input branch
    landmark_input = layers.Input(shape=(landmark_dim,), name='landmark_input')
    landmark_features = layers.Dense(256, activation='relu')(landmark_input)
    landmark_features = layers.Dropout(0.3)(landmark_features)
    landmark_features = layers.Dense(128, activation='relu')(landmark_features)
    
    # Combine both branches
    combined = layers.concatenate([image_features, landmark_features])
    
    # Classification head
    x = layers.Dense(256, activation='relu')(combined)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(128, activation='relu')(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=[image_input, landmark_input], outputs=outputs)
    return model

def main():
    # Disable GPU if CUDA is causing issues
    os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Use CPU only
    
    # Path to your dataset
    dataset_path = "/home/chinmay/coding-ubuntu/trial_project/project/datasets"
    
    # Load only paths and landmarks, not images (to save memory)
    train_path = os.path.join(dataset_path, "train")
    train_image_paths, train_landmarks, y_train = load_image_paths_and_landmarks(train_path)
    
    if train_image_paths is None:
        print("Error loading training data!")
        return
    
    # Load test data
    test_path = os.path.join(dataset_path, "test")
    test_image_paths, test_landmarks, y_test = load_image_paths_and_landmarks(test_path)
    
    if test_image_paths is None:
        print("Error loading test data!")
        return
    
    # Encode labels
    le = LabelEncoder()
    y_train_encoded = le.fit_transform(y_train)
    y_test_encoded = le.transform(y_test)
    
    num_classes = len(le.classes_)
    
    print(f"\nDataset Summary:")
    print(f"Training samples: {len(train_image_paths)}")
    print(f"Test samples: {len(test_image_paths)}")
    print(f"Number of classes: {num_classes}")
    print("Classes:", le.classes_)
    
    # Create hybrid model
    model = create_hybrid_model(train_landmarks.shape[1], num_classes)
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.summary()
    
    # Create data generators (this will prevent memory issues)
    train_generator = HybridDataGenerator(train_image_paths, train_landmarks, y_train_encoded, batch_size=16)
    test_generator = HybridDataGenerator(test_image_paths, test_landmarks, y_test_encoded, batch_size=16)
    
    # Train model using generators
    print("\nTraining hybrid model with data generators...")
    history = model.fit(
        train_generator,
        epochs=10,
        validation_data=test_generator,
        verbose=1
    )
    
    # For final evaluation, we can use a smaller batch or evaluate in chunks
    print("\nEvaluating on test set...")
    
    # Evaluate using the generator to avoid memory issues
    test_loss, test_acc = model.evaluate(test_generator, verbose=1)
    print(f"\nTest Accuracy: {test_acc:.4f}")
    print(f"Test Loss: {test_loss:.4f}")
    
    # Save model and label encoder
    os.makedirs("models", exist_ok=True)
    model.save("models/yoga_pose_hybrid_model.h5")
    with open("models/label_encoder.pkl", "wb") as f:
        pickle.dump(le, f)
    
    # Save training history
    with open("models/training_history.pkl", "wb") as f:
        pickle.dump(history.history, f)
    
    print("\nModel saved as 'models/yoga_pose_hybrid_model.h5'")
    print("Label encoder saved as 'models/label_encoder.pkl'")

if __name__ == "__main__":
    main()