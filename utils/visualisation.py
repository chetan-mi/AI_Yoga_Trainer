import matplotlib.pyplot as plt
import cv2
import numpy as np

def plot_training_history(history):
    """Plot training history"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    # Plot accuracy
    ax1.plot(history.history['accuracy'], label='Training Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Validation Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    
    # Plot loss
    ax2.plot(history.history['loss'], label='Training Loss')
    ax2.plot(history.history['val_loss'], label='Validation Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    
    plt.tight_layout()
    plt.show()

def visualize_predictions(images, predictions, true_labels, class_names, num_samples=5):
    """Visualize model predictions"""
    fig, axes = plt.subplots(1, num_samples, figsize=(15, 5))
    
    if num_samples == 1:
        axes = [axes]
    
    for i in range(num_samples):
        if i < len(images):
            axes[i].imshow(images[i])
            pred_class = np.argmax(predictions[i])
            pred_prob = predictions[i][pred_class]
            true_class = true_labels[i]
            
            title = f'True: {class_names[true_class]}\nPred: {class_names[pred_class]}\nConf: {pred_prob:.2f}'
            axes[i].set_title(title)
            axes[i].axis('off')
    
    plt.tight_layout()
    plt.show()

def plot_confusion_matrix(cm, class_names):
    """Plot confusion matrix"""
    fig, ax = plt.subplots(figsize=(10, 8))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    
    # Set labels
    ax.set(xticks=np.arange(cm.shape[1]),
           yticks=np.arange(cm.shape[0]),
           xticklabels=class_names, yticklabels=class_names,
           title='Confusion Matrix',
           ylabel='True label',
           xlabel='Predicted label')
    
    # Rotate tick labels
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")
    
    # Add text annotations
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], 'd'),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black")
    
    fig.tight_layout()
    plt.show()