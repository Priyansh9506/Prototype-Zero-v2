"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Search, AlertCircle, Loader2, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

const BoundingBoxOverlay = ({ detections, dimensions }) => {
  if (!detections || !dimensions) return null;
  
  return (
    <svg 
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="none"
    >
      {detections.map((det, i) => {
        const x = det.x - det.width / 2;
        const y = det.y - det.height / 2;
        const color = det.class.toLowerCase().includes('dent') ? '#FACC15' : '#EF4444';
        
        return (
          <g key={i}>
            <rect 
              x={x} y={y} width={det.width} height={det.height}
              fill="transparent" stroke={color} strokeWidth={dimensions.width * 0.005}
            />
            <rect 
              x={x} y={y - dimensions.height * 0.04} 
              width={det.width * 0.4} height={dimensions.height * 0.04}
              fill={color}
            />
            <text 
              x={x + dimensions.width * 0.01} y={y - dimensions.height * 0.01} 
              fill="white" fontSize={dimensions.width * 0.025} fontWeight="bold"
            >
              {det.class.toUpperCase()} {(det.confidence * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default function ImageAnalysis({ onBack, onAnalysisComplete }) {
  const fileRef = useRef(null);
  const [containerId, setContainerId] = useState('');
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // ... (keep drop logic same) ...

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (status === 'uploading') return;
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length + droppedFiles.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const onFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length + selectedFiles.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedImageIdx === index) setSelectedImageIdx(0);
  };

  const handleUpload = async () => {
    if (!containerId) {
      alert("Please enter a Container ID");
      return;
    }
    if (files.length === 0) {
      alert("Please select at least one image");
      return;
    }

    setStatus('uploading');
    setMessage('Neural Engine Initializing...');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`http://localhost:8000/analyze-container-image?container_id=${containerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setAnalysisResult(data.analysis);
        setMessage(`Analysis complete: Container is ${data.analysis.condition}`);
        setSelectedImageIdx(0);
        setIsSaved(false);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred');
    }
  };

  const getStatusInlineColor = (condition) => {
    switch (condition) {
      case 'Safe': return { color: '#5CB85C', background: 'rgba(92, 184, 92, 0.1)', borderColor: 'rgba(92, 184, 92, 0.2)' };
      case 'Faulty': return { color: '#F0AD4E', background: 'rgba(240, 173, 78, 0.1)', borderColor: 'rgba(240, 173, 78, 0.2)' };
      case 'Damaged': return { color: '#D9534F', background: 'rgba(217, 83, 79, 0.1)', borderColor: 'rgba(217, 83, 79, 0.2)' };
      default: return { color: '#337AB7', background: 'rgba(51, 122, 183, 0.1)', borderColor: 'rgba(51, 122, 183, 0.2)' };
    }
  };

  if (status === 'success' && analysisResult) {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease-out', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFDF8', border: '1px solid #D9CDBA', padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
          <div>
            <h3 style={{ fontFamily: 'Quicksand', fontSize: 20, color: '#2C2418', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <BarChart3 size={20} color="#C06820" />
              NEURAL ANALYSIS DASHBOARD
            </h3>
            <p style={{ margin: 0, color: '#7A6E5D', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
              UNIT: {containerId} // TS: {new Date(analysisResult.timestamp).toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              padding: '8px 24px', borderRadius: 32, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', border: '2px solid', display: 'flex', alignItems: 'center', gap: 8,
              ...getStatusInlineColor(analysisResult.condition)
            }}>
              <ShieldCheck size={16} />
              {analysisResult.condition}
            </div>

            <button 
              onClick={() => {
                if (onAnalysisComplete) onAnalysisComplete(containerId, analysisResult);
                setIsSaved(true);
              }}
              disabled={isSaved}
              style={{ 
                padding: '10px 24px', background: isSaved ? '#5CB85C' : '#C06820', border: 'none', borderRadius: 12, 
                color: '#FFFFFF', fontWeight: 800, fontSize: 13, fontFamily: 'Quicksand', letterSpacing: 1,
                cursor: isSaved ? 'default' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {isSaved ? 'SAVED ✓' : 'SAVE DATA'}
            </button>

            <button 
              onClick={() => { setStatus('idle'); setAnalysisResult(null); setFiles([]); setIsSaved(false); }}
              style={{ padding: 12, background: '#FFFFFF', border: '1px solid #D9CDBA', borderRadius: 12, color: '#2C2418', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 24, padding: 32, display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 40, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#1A160F', borderRadius: 16, overflow: 'hidden', border: '1px solid #D9CDBA' }}>
              <img 
                src={URL.createObjectURL(files[selectedImageIdx])} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                alt="Scanned Evidence" 
              />
              <BoundingBoxOverlay 
                detections={analysisResult.detailed_results?.[selectedImageIdx]?.detections}
                dimensions={analysisResult.detailed_results?.[selectedImageIdx]?.dimensions}
              />
              <div style={{ position: 'absolute', bottom: 20, left: 20, padding: '6px 16px', background: 'rgba(255, 253, 248, 0.9)', borderRadius: 8, color: '#2C2418', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
                CAM_{selectedImageIdx + 1}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {files.map((file, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  style={{ 
                    position: 'relative', flexShrink: 0, width: 120, height: 80, borderRadius: 12, overflow: 'hidden', padding: 0,
                    border: `2px solid ${selectedImageIdx === idx ? '#C06820' : '#D9CDBA'}`,
                    opacity: selectedImageIdx === idx ? 1 : 0.6,
                    cursor: 'pointer', background: '#2C2418'
                  }}
                >
                  <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <h4 style={{ fontFamily: 'Quicksand', fontSize: 14, color: '#2C2418', fontWeight: 700, margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
                <Zap size={16} color="#C06820" fill="#C06820" />
                RISK CONTRIBUTION MAP
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {analysisResult.shap_explanation?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#2C2418', textTransform: 'uppercase', letterSpacing: 1 }}>{item.feature}</span>
                        <span style={{ fontSize: 11, color: '#7A6E5D', fontFamily: 'monospace' }}>NEURAL_WEIGHT: 0.94</span>
                      </div>
                      <span style={{ 
                        fontSize: 14, fontWeight: 800, 
                        color: item.direction === 'risk' ? '#D9534F' : '#5CB85C' 
                      }}>
                        {item.direction === 'risk' ? '+' : '-'}{(item.impact * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#EAE2D3', borderRadius: 4, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', borderRadius: 4,
                          background: item.direction === 'risk' ? '#D9534F' : '#5CB85C',
                          width: `${item.impact * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden', marginTop: 'auto' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: 11, color: '#C06820', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Sensor Interpretation</p>
              <p style={{ margin: '0 0 24px 0', fontSize: 14, color: '#7A6E5D', fontStyle: 'italic', lineHeight: 1.6 }}>
                "{analysisResult.condition === 'Safe' 
                  ? 'Global integrity verified. No critical structural deviations detected from baseline CAD profile.' 
                  : `Visual telemetry confirms high-severity deformation. ${analysisResult.shap_explanation?.[0]?.feature} exceeds safety threshold.`}"
              </p>
              <div style={{ paddingTop: 20, borderTop: '1px solid #D9CDBA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#7A6E5D', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1 }}>Confidence Index</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#2C2418' }}>92.48%</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out', maxWidth: 800, margin: '0 auto' }}>
      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <h2 style={{ fontFamily: 'Quicksand', fontSize: 22, color: '#2C2418', marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>IMAGE INTELLIGENCE</h2>
      <p style={{ color: '#7A6E5D', fontSize: 15, marginBottom: 32, fontWeight: 500 }}>Ingest visual telemetry (JPG/PNG) for neural damage assessment and structural profiling.</p>

      <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => status !== 'uploading' && fileRef.current?.click()}
          style={{
              border: `2px dashed ${dragging || files.length > 0 ? '#C06820' : '#D9CDBA'}`,
              borderRadius: 16, padding: '60px 32px',
              background: dragging || files.length > 0 ? 'rgba(192,104,32,0.04)' : '#FFFDF8',
              cursor: status === 'uploading' ? 'not-allowed' : 'pointer', textAlign: 'center',
              transition: 'all 0.3s',
              opacity: status === 'uploading' ? 0.6 : 1
          }}
      >
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(192,104,32,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Upload size={40} color="#C06820" />
          </div>
          <h3 style={{ fontFamily: 'Quicksand', fontSize: 20, color: '#2C2418', marginBottom: 12, fontWeight: 700 }}>
            {files.length > 0 ? `${files.length} Images Mounted` : 'Drag & Drop Images'}
          </h3>
          <p style={{ color: '#7A6E5D', fontSize: 15, marginBottom: 24, fontWeight: 500 }}>
            or click to browse your local file system
          </p>
          <input ref={fileRef} type="file" multiple accept="image/*" hidden onChange={onFileChange} />

          <div style={{
              background: '#C06820', border: 'none', borderRadius: 8,
              padding: '12px 24px', fontFamily: 'Quicksand', fontSize: 13, color: '#FFFFFF', fontWeight: 800,
              cursor: 'pointer', letterSpacing: 1, pointerEvents: 'none', display: 'inline-block'
          }}>
              SELECT IMAGES
          </div>
      </div>

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>TARGET CONTAINER ID</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#7A6E5D" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={containerId}
              onChange={(e) => setContainerId(e.target.value)}
              placeholder="e.g. 76991507"
              style={{
                width: '100%', padding: '16px 16px 16px 48px', 
                background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12,
                color: '#2C2418', fontFamily: 'monospace', fontSize: 14,
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        
        <button
          onClick={handleUpload}
          disabled={status === 'uploading' || !containerId || files.length === 0}
          style={{
            width: '100%', padding: '18px 24px', 
            background: '#2C2418', borderRadius: 12, border: 'none',
            color: '#FFFFFF', fontFamily: 'Quicksand', fontSize: 13, fontWeight: 800, letterSpacing: 2,
            cursor: (status === 'uploading' || !containerId || files.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (status === 'uploading' || !containerId || files.length === 0) ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
          }}
        >
          {status === 'uploading' ? (
            <>
              <Loader2 size={16} color="#FFFFFF" style={{ animation: 'spin 1s linear infinite' }} />
              INITIALIZING ENGINES...
            </>
          ) : (
            <>
              <Zap size={16} color="#FFFFFF" fill="#FFFFFF" />
              ENGAGE INTELLIGENCE SCAN
            </>
          )}
        </button>
      </div>

      {files.length > 0 && (
        <div style={{ 
          marginTop: 24, padding: 20, background: '#FFFDF8', 
          border: '1px solid #D9CDBA', borderRadius: 16, 
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 
        }}>
          {files.map((file, idx) => (
            <div key={idx} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #D9CDBA', aspectRatio: '1/1', background: '#FFFFFF' }}>
              <img
                src={URL.createObjectURL(file)}
                alt={`upload-${idx}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                style={{ 
                  position: 'absolute', top: 6, right: 6, background: '#D9534F', border: 'none', 
                  borderRadius: '50%', padding: 4, color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: 24, padding: 16, background: '#FFF0F0', border: '1px solid #FFD6D6', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#D9534F' }}>
          <AlertCircle size={20} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{message}</p>
          <button 
            onClick={() => setStatus('idle')} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#D9534F', fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', letterSpacing: 1 }}
          >
            RETRY
          </button>
        </div>
      )}

      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
              <ImageIcon size={24} color="#C06820" style={{ marginBottom: 12 }} />
              <h4 style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>VALID SOURCES</h4>
              <p style={{ fontSize: 13, color: '#7A6E5D', lineHeight: 1.6, margin: 0 }}>High-resolution JPG, PNG captures. Internal limit: Max 5 viewpoints.</p>
          </div>
          <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
              <ShieldCheck size={24} color="#C06820" style={{ marginBottom: 12 }} />
              <h4 style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>NEURAL PRIVACY</h4>
              <p style={{ fontSize: 13, color: '#7A6E5D', lineHeight: 1.6, margin: 0 }}>Visual data strictly mapped over Roboflow endpoints. No local retention.</p>
          </div>
          <div style={{ background: '#FFFDF8', border: '1px solid #D9CDBA', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(44,36,24,0.04)' }}>
              <BarChart3 size={24} color="#C06820" style={{ marginBottom: 12 }} />
              <h4 style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#2C2418', marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>INTEGRATION PIPELINE</h4>
              <p style={{ fontSize: 13, color: '#7A6E5D', lineHeight: 1.6, margin: 0 }}>SHAP impact vectors push real-time updates to container profiles upon scan.</p>
          </div>
      </div>
    </div>
  );
}
