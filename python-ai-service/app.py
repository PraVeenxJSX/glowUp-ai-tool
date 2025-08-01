import os
import cv2
import numpy as np
import mediapipe as mp
from flask import Flask, request, jsonify
from PIL import Image
import io
import math

# Initialize Flask app
app = Flask(__name__)

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, min_detection_confidence=0.5)

def get_angle(p1, p2, p3):
    """Calculates the angle between three points."""
    a = np.linalg.norm(p2 - p3)
    b = np.linalg.norm(p1 - p3)
    c = np.linalg.norm(p1 - p2)
    angle = math.acos((a**2 + c**2 - b**2) / (2 * a * c))
    return math.degrees(angle)

def analyze_image(image_bytes):
    """
    Analyzes an image to determine face shape, skin tone, and other features
    using more advanced geometric analysis.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(image.convert('RGB'))
        h, w, _ = image_np.shape

        results = face_mesh.process(image_np)

        if not results.multi_face_landmarks:
            return {"error": "No face detected in the image."}

        face_landmarks = results.multi_face_landmarks[0]
        
        # Get landmarks in pixel coordinates for color sampling
        landmarks_pixel = np.array([(int(lm.x * w), int(lm.y * h)) for lm in face_landmarks.landmark])
        # Get landmarks in normalized coordinates for shape analysis
        landmarks_norm = np.array([(lm.x, lm.y) for lm in face_landmarks.landmark])

        # --- 1. ADVANCED Face Shape Analysis ---
        # Key landmark indices
        jaw_top = landmarks_norm[10]      # Top of forehead
        jaw_bottom = landmarks_norm[152]   # Chin
        jaw_left = landmarks_norm[234]     # Left jaw corner
        jaw_right = landmarks_norm[454]    # Right jaw corner
        cheek_left = landmarks_norm[132]   # Left cheek
        cheek_right = landmarks_norm[361]  # Right cheek
        jaw_mid_left = landmarks_norm[172] # Midpoint of left jawline
        jaw_mid_right = landmarks_norm[397]# Midpoint of right jawline

        # Calculate dimensions
        face_length = np.linalg.norm(jaw_top - jaw_bottom)
        face_width = np.linalg.norm(jaw_left - jaw_right)
        cheek_width = np.linalg.norm(cheek_left - cheek_right)
        
        # NEW: Calculate jaw angle
        jaw_angle = get_angle(jaw_bottom, jaw_mid_left, jaw_left)
        
        # NEW: More sophisticated logic
        face_shape = "Oval" # Start with a default
        if face_length > face_width * 1.05:
            face_shape = "Oblong"
        if cheek_width > face_width:
             face_shape = "Round"
        if jaw_angle < 75: # Sharper jaw angle
            if abs(face_width - np.linalg.norm(landmarks_norm[54] - landmarks_norm[284])) < 0.1:
                face_shape = "Square"
            else:
                face_shape = "Heart" # Wider forehead, sharp chin
        
        # Refine based on ratios
        ratio = face_length / face_width
        if ratio > 1.5:
            face_shape = "Oblong"
        elif ratio < 1.1 and face_shape != "Square":
            face_shape = "Round"


        # --- 2. Skin Tone Analysis (Unchanged for now) ---
        cheek_left_point = landmarks_pixel[117]
        cheek_right_point = landmarks_pixel[346]
        forehead_point = landmarks_pixel[10]
        
        skin_tone_regions = [
            image_np[cheek_left_point[1]-10:cheek_left_point[1]+10, cheek_left_point[0]-10:cheek_left_point[0]+10],
            image_np[cheek_right_point[1]-10:cheek_right_point[1]+10, cheek_right_point[0]-10:cheek_right_point[0]+10],
            image_np[forehead_point[1]-10:forehead_point[1]+10, forehead_point[0]-10:forehead_point[0]+10]
        ]
        
        avg_colors = [np.mean(region, axis=(0, 1)) for region in skin_tone_regions if region.size > 0]
        avg_skin_color = np.mean(avg_colors, axis=0)
        r, g, b = avg_skin_color

        skin_tone = "Neutral"
        if r > g and r > b and r > 1.1 * g:
            skin_tone = "Warm"
        elif b > r and b > g and b > 1.1 * g:
            skin_tone = "Cool"

        # --- 3. Jawline and Pose Analysis (Unchanged) ---
        jaw_strength = "Average"
        if jaw_angle < 78:
            jaw_strength = "Strong"
        else:
            jaw_strength = "Soft"
            
        nose_tip = landmarks_norm[1]
        left_eye = landmarks_norm[33]
        right_eye = landmarks_norm[263]
        chin = landmarks_norm[152]

        pose = "Front-facing"
        eye_center = (left_eye + right_eye) / 2
        if abs(nose_tip[0] - eye_center[0]) > 0.03:
            pose = "Slightly Turned"
        if abs(chin[1] - nose_tip[1]) < abs(nose_tip[1] - eye_center[1]) * 0.8:
            pose = "Tilted Up"

        return {
            "faceShape": face_shape,
            "skinTone": skin_tone,
            "jawType": jaw_strength,
            "poseFeedback": pose,
            "error": None
        }

    except Exception as e:
        # Log the full error for debugging
        print(f"An error occurred during analysis: {e}")
        return {"error": "An internal error occurred during image analysis."}

@app.route('/process-image', methods=['POST'])
def process_image_route():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        image_bytes = file.read()
        analysis_result = analyze_image(image_bytes)
        return jsonify(analysis_result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
