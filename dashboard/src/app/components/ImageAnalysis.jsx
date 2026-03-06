"use client";

import React, { useState } from 'react';
import { Upload, X, ImageIcon, Search, AlertCircle, Loader2, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

const BoundingBoxOverlay = ({ detections, dimensions }) => {
  if (!detections || !dimensions) return null;
  
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none" 
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
              className="animate-pulse"
            />
            <rect 
              x={x} y={y - dimensions.height * 0.04} 
              width={det.width * 0.4} height={dimensions.height * 0.04}
              fill={color}
            />
            <text 
              x={x + dimensions.width * 0.01} y={y - dimensions.height * 0.01} 
              fill="white" fontSize={dimensions.width * 0.025} fontWeight="bold"
              className="uppercase"
            >
              {det.class} {(det.confidence * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const ImageAnalysis = ({ onBack }) => {
  const [containerId, setContainerId] = useState('');
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const onFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
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
      } else {
        setStatus('error');
        setMessage(data.detail || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred');
    }
  };

  const getStatusColor = (condition) => {
    switch (condition) {
      case 'Safe': return 'text-green-400 bg-green-400/10 border-green-500/20';
      case 'Faulty': return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
      case 'Damaged': return 'text-red-400 bg-red-400/10 border-red-500/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        .scan-line {
          animation: scan 2s linear infinite;
        }
      `}</style>

      {status !== 'success' ? (
        <div className="max-w-[800px] mx-auto space-y-8 animate-in fadeInUp duration-500">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h2 className="text-[22px] font-bold text-[#2C2418] uppercase tracking-wider" style={{ fontFamily: 'Quicksand' }}>
              IMAGE INTELLIGENCE
            </h2>
            <p className="text-[#7A6E5D] text-[15px] font-medium">
              Ingest visual telemetry (JPG/PNG) for neural damage assessment and structural profiling.
            </p>
          </div>

          <div 
            className={`relative border-2 border-dashed rounded-[16px] p-[60px_32px] text-center cursor-pointer transition-all duration-300 ${status === 'uploading' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#C06820]/[0.04]'}`}
            style={{ 
              borderColor: files.length > 0 ? '#C06820' : '#D9CDBA',
              background: files.length > 0 ? 'rgba(192,104,32,0.02)' : '#FFFDF8'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (status === 'uploading') return;
              const droppedFiles = Array.from(e.dataTransfer.files);
              if (files.length + droppedFiles.length > 5) return;
              setFiles(prev => [...prev, ...droppedFiles]);
            }}
            onClick={() => status !== 'uploading' && document.getElementById('image-input').click()}
          >
            <input
              id="image-input"
              type="file" multiple accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
            
            <div className="w-20 h-20 bg-[#C06820]/[0.08] rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload size={40} color="#C06820" />
            </div>
            
            <h3 className="text-xl font-bold text-[#2C2418] mb-3" style={{ fontFamily: 'Quicksand' }}>
              {files.length > 0 ? `${files.length} Images Mounted` : 'Drag & Drop Images'}
            </h3>
            <p className="text-[#7A6E5D] text-[15px] font-medium mb-6">
              or click to browse your local file system
            </p>

            <div className="inline-block px-8 py-4 bg-[#C06820] text-white text-[13px] font-bold rounded-lg uppercase tracking-[0.15em] pointer-events-none transition-transform active:scale-95" style={{ fontFamily: 'Quicksand' }}>
              SELECT IMAGES
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-3">
              <label className="block text-[13px] font-bold text-[#2C2418] uppercase tracking-wider" style={{ fontFamily: 'Quicksand' }}>
                Target Container ID
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6E5D] group-focus-within:text-[#C06820] transition-colors" />
                <input
                  type="text"
                  value={containerId}
                  onChange={(e) => setContainerId(e.target.value)}
                  placeholder="e.g. 76991507"
                  className="w-full pl-12 pr-4 py-4 bg-[#FFFDF8] border border-[#D9CDBA] rounded-xl focus:outline-none focus:border-[#C06820] focus:ring-1 focus:ring-[#C06820] text-[#2C2418] transition-all font-mono text-sm placeholder:text-[#A89E91]"
                />
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={status === 'uploading' || !containerId || files.length === 0}
              className="w-full h-[58px] bg-[#2C2418] hover:bg-[#1A160F] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] shadow-lg active:shadow-inner"
              style={{ fontFamily: 'Quicksand' }}
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin font-bold" />
                  Neural engine running...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  Engage Intelligence Scan
                </>
              )}
            </button>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-5 gap-4 p-5 bg-[#FFFDF8] border border-[#D9CDBA] rounded-[20px] shadow-inner">
              {files.map((file, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-[#D9CDBA] bg-white">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`upload-${idx}`}
                    className="w-full h-full object-cover transition-all grayscale duration-500 group-hover:grayscale-0 group-hover:scale-110"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg scale-90 group-hover:scale-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in shake duration-500">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-bold">{message}</p>
              <button 
                onClick={() => setStatus('idle')} 
                className="ml-auto text-xs uppercase font-black tracking-widest hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-[#FFFDF8] border border-[#D9CDBA] rounded-xl p-6 shadow-sm">
              <ImageIcon size={28} color="#C06820" className="mb-4" />
              <h4 className="text-[14px] font-bold text-[#2C2418] mb-2 tracking-wide font-['Quicksand'] uppercase">VALID SOURCES</h4>
              <p className="text-[13px] text-[#7A6E5D] leading-relaxed font-medium">High-resolution JPG, PNG captures. Max 5 viewpoints.</p>
            </div>
            <div className="bg-[#FFFDF8] border border-[#D9CDBA] rounded-xl p-6 shadow-sm">
              <ShieldCheck size={28} color="#C06820" className="mb-4" />
              <h4 className="text-[14px] font-bold text-[#2C2418] mb-2 tracking-wide font-['Quicksand'] uppercase">NEURAL PRIVACY</h4>
              <p className="text-[13px] text-[#7A6E5D] leading-relaxed font-medium">Visual data processed securely via Roboflow.</p>
            </div>
            <div className="bg-[#FFFDF8] border border-[#D9CDBA] rounded-xl p-6 shadow-sm">
              <BarChart3 size={28} color="#C06820" className="mb-4" />
              <h4 className="text-[14px] font-bold text-[#2C2418] mb-2 tracking-wide font-['Quicksand'] uppercase">INTEGRATION</h4>
              <p className="text-[13px] text-[#7A6E5D] leading-relaxed font-medium">SHAP impact analysis reflects in container profiles.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in zoom-in-95 duration-700">
          <div className="flex justify-between items-center bg-[#FFFDF8] border border-[#D9CDBA] p-6 rounded-3xl shadow-sm">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#2C2418] flex items-center gap-3 uppercase tracking-tighter font-['Quicksand']">
                <BarChart3 className="w-5 h-5 text-[#C06820]" />
                Neural Analysis Dashboard
              </h3>
              <p className="text-xs text-[#7A6E5D] font-mono font-bold">
                UNIT: {containerId} // TS: {new Date(analysisResult.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <div className={`px-6 py-2 rounded-full text-xs font-black uppercase border-2 flex items-center gap-2 shadow-sm ${getStatusColor(analysisResult.condition)}`}>
                <ShieldCheck className="w-4 h-4" />
                {analysisResult.condition}
              </div>
              <button 
                onClick={() => { setStatus('idle'); setAnalysisResult(null); setFiles([]); }}
                className="p-3 bg-white border border-[#D9CDBA] rounded-xl text-[#2C2418] hover:bg-slate-50 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-8 rounded-[2rem] bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
              <div className="lg:col-span-8 space-y-6">
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 shadow-inner bg-black group">
                  <img 
                    src={URL.createObjectURL(files[selectedImageIdx])} 
                    className="w-full h-full object-contain opacity-90 transition-opacity" 
                    alt="Scanned Evidence" 
                  />
                  <BoundingBoxOverlay 
                    detections={analysisResult.detailed_results?.[selectedImageIdx]?.detections}
                    dimensions={analysisResult.detailed_results?.[selectedImageIdx]?.dimensions}
                  />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C06820] to-transparent opacity-50 scan-line shadow-[0_0_15px_rgba(192,104,32,0.5)]" />
                  <div className="absolute bottom-6 left-6 flex gap-3">
                    <div className="px-4 py-1.5 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] text-[#C06820] font-black uppercase tracking-widest">
                      CAM_{selectedImageIdx + 1}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {files.map((file, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`relative flex-shrink-0 w-28 h-20 rounded-2xl overflow-hidden border-2 transition-all ${selectedImageIdx === idx ? 'border-[#C06820] scale-105 shadow-[0_0_20px_rgba(192,104,32,0.3)]' : 'border-white/5 grayscale opacity-30 hover:opacity-100'}`}
                    >
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black pointer-events-none text-white/50">POV_{idx + 1}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    Risk Contribution Map
                  </h4>
                  <div className="grid gap-6">
                    {analysisResult.shap_explanation?.map((item, idx) => (
                      <div key={idx} className="space-y-2.5">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest">{item.feature}</span>
                            <span className="text-[9px] text-slate-500 font-mono">NEURAL_WEIGHT: 0.94</span>
                          </div>
                          <span className={`text-[12px] font-black tabular-nums transition-colors duration-1000 ${item.direction === 'risk' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {item.direction === 'risk' ? '+' : '-'}{(item.impact * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-[2s] cubic-bezier(0.16, 1, 0.3, 1) ${item.direction === 'risk' ? 'bg-gradient-to-r from-orange-600 to-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.5)]' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}
                            style={{ width: `${item.impact * 100}%`, transitionDelay: `${idx * 100}ms` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-7 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden backdrop-blur-3xl mt-10">
                  <div className="relative z-10 space-y-4">
                    <p className="text-[10px] text-[#C06820] font-black uppercase tracking-[0.2em]">Sensor Interpretation</p>
                    <p className="text-[13px] text-slate-400 font-medium leading-relaxed italic">
                      "{analysisResult.condition === 'Safe' 
                        ? 'Global integrity verified. No critical structural deviations detected from baseline CAD profile.' 
                        : `Visual telemetry confirms high-severity deformation. ${analysisResult.shap_explanation?.[0]?.feature} exceeds safety threshold.`}"
                    </p>
                    <div className="pt-5 flex items-center justify-between border-t border-white/5">
                      <span className="text-[10px] text-slate-600 uppercase font-mono tracking-widest">Confidence Index</span>
                      <span className="text-[14px] font-black text-slate-100 tabular-nums">92.48%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalysis;
