import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras import Model, layers, models

def create_hybrid_model(landmark_dim, num_classes):
    """Create hybrid model with EfficientNet backbone and landmark features"""
    # Pre-trained image backbone (EfficientNetB0)
    base_model = EfficientNetB0(weights='imagenet', include_top=False, 
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

def create_cnn_model(input_shape, num_classes):
    """Create CNN model for image classification"""
    model = models.Sequential([
        layers.Input(shape=input_shape),
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])
    return model