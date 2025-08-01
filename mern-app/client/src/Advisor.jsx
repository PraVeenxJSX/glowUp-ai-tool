import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // We can still use the main App.css for styles

// --- RefineResults Component ---
const RefineResults = ({ analysis, onRefine }) => {
    const [hairTexture, setHairTexture] = useState('');
    const [styleGoal, setStyleGoal] = useState('');
    const [skincareConcern, setSkincareConcern] = useState('');

    useEffect(() => {
        // This effect calls the onRefine function whenever a selection changes
        onRefine({
            faceShape: analysis.faceShape,
            hairTexture,
            styleGoal,
            skincareConcern,
        });
    }, [hairTexture, styleGoal, skincareConcern, analysis.faceShape, onRefine]);

    const hairOptions = ['Straight', 'Wavy', 'Curly'];
    const styleOptions = ['Professional', 'Casual', 'Edgy', 'Minimalist'];
    const skincareOptions = ['Acne', 'Redness', 'Dry Patches'];

    return (
        <div className="refine-section">
            <h2>Refine Your Recommendations</h2>
            <div className="refine-options">
                <div className="option-group">
                    <h4>💇‍♂️ What's your hair texture?</h4>
                    <div className="option-buttons">
                        {hairOptions.map(opt => <button key={opt} onClick={() => setHairTexture(opt)} className={`option-button ${hairTexture === opt ? 'selected' : ''}`}>{opt}</button>)}
                    </div>
                </div>
                <div className="option-group">
                    <h4>🎯 What's your style goal?</h4>
                    <div className="option-buttons">
                        {styleOptions.map(opt => <button key={opt} onClick={() => setStyleGoal(opt)} className={`option-button ${styleGoal === opt ? 'selected' : ''}`}>{opt}</button>)}
                    </div>
                </div>
                <div className="option-group">
                    <h4>🧼 Any skincare concerns?</h4>
                    <div className="option-buttons">
                        {skincareOptions.map(opt => <button key={opt} onClick={() => setSkincareConcern(opt)} className={`option-button ${skincareConcern === opt ? 'selected' : ''}`}>{opt}</button>)}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Advisor Component ---
function Advisor() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [initialResults, setInitialResults] = useState(null);
  const [refinedResults, setRefinedResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState('upload');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  }, []);
  
  useEffect(() => {
    let stream;
    const enableWebcam = async () => {
      if (inputMode === 'webcam') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          setError('Could not start webcam. Please allow camera access.');
        }
      }
    };
    enableWebcam();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [inputMode]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        const capturedFile = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
        setFile(capturedFile);
        setPreview(URL.createObjectURL(capturedFile));
        stopWebcam();
        setInputMode('upload');
      }, 'image/jpeg');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please provide an image first.');
      return;
    }
    setLoading(true);
    setError('');
    setInitialResults(null);
    setRefinedResults(null);

    const formData = new FormData();
    formData.append('faceImage', file);
    if (age) formData.append('age', age);
    if (height) formData.append('height', height);
    if (weight) formData.append('weight', weight);

    try {
      const response = await axios.post('http://localhost:8080/api/analyze', formData);
      setInitialResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- FIXED: Wrapped handleRefine in useCallback to prevent infinite loops ---
  const handleRefine = useCallback(async (refineData) => {
    if (!refineData.faceShape) return;
    try {
      const response = await axios.post('http://localhost:8080/api/refine', refineData);
      setRefinedResults(response.data);
    } catch (err) {
      console.error("Refine error:", err);
    }
  }, []); // Empty dependency array means this function is created only once

  return (
    <div className="App">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!initialResults && (
        <>
            <header className="header">
                <h1>✨ AI Glow Up Advisor ✨</h1>
                <p>Get AI-powered style, wellness, and grooming recommendations.</p>
            </header>
            <div className="input-mode-selection">
                <button onClick={() => setInputMode('upload')} className={`mode-button ${inputMode === 'upload' ? 'active' : ''}`}>📤 Upload Photo</button>
                <button onClick={() => setInputMode('webcam')} className={`mode-button ${inputMode === 'webcam' ? 'active' : ''}`}>📸 Use Webcam</button>
            </div>
            {inputMode === 'upload' && <><input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileChange} accept="image/png, image/jpeg" /><label htmlFor="file-upload" className="upload-section"><p>{file ? file.name : 'Click to select your best photo'}</p></label></>}
            {inputMode === 'webcam' && <div className="webcam-container"><video ref={videoRef} autoPlay playsInline muted className="webcam-view" /><button onClick={capturePhoto} className="mode-button capture-button">Capture</button></div>}
            {preview && <img src={preview} alt="Your face" className="image-preview" />}
            <div className="data-form">
                <input type="number" placeholder="Your Age (Optional)" value={age} onChange={(e) => setAge(e.target.value)} />
                <input type="number" placeholder="Height in cm (Optional)" value={height} onChange={(e) => setHeight(e.target.value)} />
                <input type="number" placeholder="Weight in kg (Optional)" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <button onClick={handleSubmit} disabled={loading || !file} className="analyze-button">{loading ? 'Analyzing...' : 'Get My Glow Up Plan'}</button>
        </>
      )}

      {error && <div className="error-message">{error}</div>}

      {initialResults && (
        <div className="results-section">
          <div className="result-card">
            <h3>🧐 Initial Analysis</h3>
            <p><strong>Detected Face Shape:</strong> {initialResults.analysis.faceShape}</p>
            <p><strong>Detected Skin Tone:</strong> {initialResults.analysis.skinTone}</p>
            <p><strong>👓 Glasses:</strong> {initialResults.recommendations.glasses}</p>
            <p><strong>👕 Clothing Colors:</strong> {initialResults.recommendations.clothingColor}</p>
          </div>

          {initialResults.bmi && (
            <div className="result-card">
              <h3>💪 Health & Wellness</h3>
              <p><strong>BMI Analysis:</strong> {initialResults.bmi.advice}</p>
            </div>
          )}

          <RefineResults analysis={initialResults.analysis} onRefine={handleRefine} />

          {refinedResults && (
             <div className="result-card">
                <h3>💡 Personalized Tips</h3>
                <p><strong>💇‍♂️ Haircut:</strong> {refinedResults.haircut}</p>
                <p><strong>🧼 Skincare:</strong> {refinedResults.skincare}</p>
                <p><strong>🎯 Style Goal:</strong> {refinedResults.styleGoal}</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Advisor;
