"""
Model loader service - loads and manages AI models for classification
and counterfeit detection.
"""

import torch
import numpy as np
from torchvision import models, transforms
from transformers import AutoTokenizer, AutoModel
from loguru import logger
from typing import Optional

from app.core.config import get_settings


class ModelLoader:
    """Manages loading and access to AI models."""

    def __init__(self):
        self.settings = get_settings()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Models
        self.resnet_model: Optional[torch.nn.Module] = None
        self.bert_tokenizer = None
        self.bert_model = None

        # Image transforms
        self.image_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

    async def load_models(self):
        """Load all AI models."""
        logger.info(f"Loading models on device: {self.device}")

        try:
            # Load ResNet-50 for image feature extraction
            logger.info("Loading ResNet-50 for image feature extraction...")
            self.resnet_model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            # Remove the final classification layer to get features
            self.resnet_model = torch.nn.Sequential(
                *list(self.resnet_model.children())[:-1]
            )
            self.resnet_model.to(self.device)
            self.resnet_model.eval()
            logger.info("ResNet-50 loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load ResNet-50: {e}. Image features will be unavailable.")

        try:
            # Load AraBERT for Arabic text processing
            model_name = self.settings.CLASSIFIER_MODEL
            logger.info(f"Loading AraBERT model: {model_name}...")
            self.bert_tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.bert_model = AutoModel.from_pretrained(model_name)
            self.bert_model.to(self.device)
            self.bert_model.eval()
            logger.info("AraBERT loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load AraBERT: {e}. Text classification will use fallback.")

    def extract_image_features(self, image) -> Optional[np.ndarray]:
        """Extract feature vector from an image using ResNet-50."""
        if self.resnet_model is None:
            return None

        try:
            img_tensor = self.image_transform(image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                features = self.resnet_model(img_tensor)
            return features.squeeze().cpu().numpy()
        except Exception as e:
            logger.error(f"Error extracting image features: {e}")
            return None

    def get_text_embedding(self, text: str) -> Optional[np.ndarray]:
        """Get text embedding using AraBERT."""
        if self.bert_tokenizer is None or self.bert_model is None:
            return None

        try:
            inputs = self.bert_tokenizer(
                text,
                return_tensors="pt",
                max_length=128,
                truncation=True,
                padding=True,
            ).to(self.device)

            with torch.no_grad():
                outputs = self.bert_model(**inputs)

            # Use CLS token embedding
            embedding = outputs.last_hidden_state[:, 0, :].squeeze().cpu().numpy()
            return embedding
        except Exception as e:
            logger.error(f"Error getting text embedding: {e}")
            return None

    def compute_cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Compute cosine similarity between two vectors."""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(dot_product / (norm1 * norm2))
