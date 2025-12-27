# Retinitis Pigmentosa (RP) Detection Using Deep Learning on Mobile Devices

This repository contains a deep learning–based system for detecting **Retinitis Pigmentosa (RP)** from retinal images, along with a cross-platform mobile application for performing inference on user-supplied images.

The project investigates whether an automated image-based diagnostic system can achieve clinically meaningful accuracy while remaining **low-cost, portable, and accessible**, particularly for use in **low-resource settings** where conventional diagnostic tools are unavailable.

---

## Background and Motivation

Retinitis Pigmentosa (RP) is a group of inherited retinal disorders characterized by the progressive degeneration of photoreceptors, often leading to vision loss and blindness. Current diagnostic standards for RP include:

- Electroretinography (ERG)
- Visual field testing
- Genetic testing
- Retinal imaging interpreted by trained clinicians

These procedures require expensive equipment and specialized expertise, making them inaccessible to many patients worldwide.

At present, there is **no widely available automated system** that provides accurate RP detection directly from retinal images. This project aims to address that gap by developing a **deep learning–based diagnostic model** and embedding it into a **mobile application** capable of running inference on consumer devices.

---

## Research Objective

The central hypothesis of this work is that:

> A deep learning model can be trained to detect Retinitis Pigmentosa from retinal images with **greater than 85% accuracy**, and that such a model can be deployed effectively on a mobile platform.

The project was developed in consultation with university faculty, including:
- **Salman Asif** (UC Riverside)
- **Michael Beyeler** (UC Santa Barbara)
- **B. S. Manjunath** (UC Santa Barbara)

---

## Dataset

- **Source**: Tsukazaki Optos Public Dataset (anonymized, publicly available)
- **Classes**:
  - 258 normal retinal images
  - 258 retinal images exhibiting RP
- **Data Split**:
  - Training: 70%
  - Validation: 15%
  - Test: 15%

Both **segmented** and **non-segmented** retinal images were used to improve generalization by emphasizing retinal structures over background artifacts.

---

## Model Architecture and Training

### Model Design
- **Base model**: MobileNet (transfer learning, without top layers)
- **Architecture**:
  - MobileNet backbone
  - Global Average Pooling
  - Dense layer (1024 neurons, ReLU)
  - Dropout (rate = 0.2)
  - Output layer (2 neurons, softmax)

### Preprocessing
- Pixel normalization and standardization
- Image centering
- Data augmentation

### Optimization
- **Optimizer**: Adagrad
- **Learning rate**: 0.001
- **Loss function**: Binary cross entropy
- **Early stopping patience**: 20 epochs

Seven hyperparameters were tuned through sequential experimentation. In each tuning round, one hyperparameter was modified, the model was trained for three trials, and average validation accuracy was used to select optimal values.

---

## Evaluation and Results

### Train / Validation / Test Split (Average over 3 trials)
- **Accuracy**: ~90%
- **Recall**: ~82%
- **Precision**: ~97%
- **F1 Score**: ~0.89
- **Specificity**: ~97%

### 10-Fold Cross Validation
- **Mean accuracy**: ~96%
- **Mean loss**: ~0.128

To support the computational demands of cross-validation (30 total model runs), training was distributed across:
- Local compute resources
- AWS EC2 instances

A final model was then trained on the **entire dataset** using the tuned hyperparameters.

---

## Ensemble Model

An ensemble model was also developed by averaging predictions from the 10 models generated during 10-fold cross validation. Ensemble inference is known to reduce variance and improve robustness.

Future work includes a sensitivity analysis to determine the optimal subset of models for ensemble inclusion.

---

## Mobile Application

A cross-platform mobile application was developed using **Expo / React Native** to allow users to perform inference directly on retinal images.

### App Features
- Camera capture or gallery upload
- Automatic image format conversion to JPEG
- On-device preprocessing and inference using TensorFlow.js
- Prediction output with confidence score

The trained model was converted to TensorFlow.js format (`model.json` + shard files) for integration into the app.

---

## Repository Contents

Typical files include:

- `App.js` — App entry point
- `predict.js` — Image preprocessing and inference logic
- `model.json` + shard files — TensorFlow.js model
- `final_model.py` — Model training and export script
- `package.json`, `app.json`, `babel.config.js` — Project configuration

---

## Running the App

### Prerequisites
- Node.js
- Expo CLI

### Install and Run
```bash
npm install
npx expo start
