/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Terminal, Camera, Cpu, HelpCircle, Trash2, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface LogEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', content: 'VisionCLI v1.0.0 initialized.', timestamp: new Date() },
    { id: '2', type: 'system', content: 'Type "help" to see available commands.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Focus input on click anywhere in terminal
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const addLog = (content: string, type: LogEntry['type'] = 'output') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      type,
      content,
      timestamp: new Date()
    }]);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        addLog('Camera system online.', 'system');
      }
    } catch (err) {
      addLog('Error: Failed to access camera. Check permissions.', 'error');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      addLog('Camera system offline.', 'system');
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return null;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return null;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    return canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  const runVisionCommand = async (prompt: string) => {
    if (!isCameraActive) {
      addLog('Error: Camera must be active to run vision commands. Type "cam on".', 'error');
      return;
    }

    const base64Image = captureFrame();
    if (!base64Image) {
      addLog('Error: Failed to capture image frame.', 'error');
      return;
    }

    setIsProcessing(true);
    addLog('Processing vision request...', 'system');

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        },
        config: {
          systemInstruction: "You are a computer vision CLI assistant. Provide concise, technical descriptions of what you see. Use bullet points for lists. Be direct and avoid conversational filler."
        }
      });

      addLog(response.text || 'No analysis returned.');
    } catch (err) {
      addLog(`Error: Vision processing failed. ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    addLog(`> ${input}`, 'input');
    setInput('');

    const [baseCmd, ...args] = cmd.split(' ');

    switch (baseCmd) {
      case 'help':
        addLog('Available commands:\n' +
               '  cam on/off    - Toggle camera system\n' +
               '  scan          - Describe the current view\n' +
               '  detect [obj]  - Search for a specific object\n' +
               '  text          - Extract text from the view\n' +
               '  preview       - Toggle visual preview window\n' +
               '  report        - Show project summary\n' +
               '  cat [file]    - Read a file (e.g., cat REPORT.md)\n' +
               '  clear         - Clear terminal logs\n' +
               '  help          - Show this help menu');
        break;
      case 'cam':
        if (args[0] === 'on') await startCamera();
        else if (args[0] === 'off') stopCamera();
        else addLog('Usage: cam on | cam off', 'error');
        break;
      case 'scan':
        await runVisionCommand("Describe what you see in this image in detail but concisely.");
        break;
      case 'detect':
        if (args.length === 0) {
          addLog('Usage: detect [object_name]', 'error');
        } else {
          await runVisionCommand(`Locate and describe any ${args.join(' ')} in the image. If not found, say so.`);
        }
        break;
      case 'text':
        await runVisionCommand("Extract all readable text from this image. Format it clearly.");
        break;
      case 'preview':
        setShowPreview(!showPreview);
        addLog(`Preview window ${!showPreview ? 'enabled' : 'disabled'}.`);
        break;
      case 'report':
        addLog('--- VISIONCLI PROJECT REPORT ---');
        addLog('Architecture: React + Gemini 3 Flash');
        addLog('Core Engine: Neural Vision Processing');
        addLog('Status: Functional');
        addLog('Type "cat REPORT.md" for full documentation (simulated).');
        break;
      case 'cat':
        if (args[0] === 'report.md') {
          addLog('Reading REPORT.md...');
          addLog('# VisionCLI Project Report\n' +
                 'VisionCLI is a terminal-based computer vision interface...\n' +
                 'Check the root directory for the full REPORT.md file.');
        } else {
          addLog(`cat: ${args[0]}: No such file or directory`, 'error');
        }
        break;
      case 'clear':
        setLogs([]);
        break;
      default:
        addLog(`Unknown command: ${baseCmd}. Type "help" for assistance.`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff41] font-mono p-4 md:p-8 flex flex-col gap-4 overflow-hidden selection:bg-[#00ff41] selection:text-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#00ff41]/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00ff41]/10 rounded border border-[#00ff41]/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase">VisionCLI Terminal</h1>
            <p className="text-[10px] opacity-50">Neural Link: Active | Buffer: 1024KB</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs opacity-70">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
            <span>CAM: {isCameraActive ? 'LIVE' : 'OFF'}</span>
          </div>
          <div className="hidden md:block">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Terminal Area */}
        <div 
          className="flex-1 bg-black/50 border border-[#00ff41]/20 rounded-lg p-4 flex flex-col overflow-hidden relative group"
          onClick={handleTerminalClick}
        >
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] opacity-30 whitespace-nowrap">
                    [{log.timestamp.toLocaleTimeString([], { hour12: false })}]
                  </span>
                  <div className={`
                    ${log.type === 'input' ? 'text-white font-bold' : ''}
                    ${log.type === 'error' ? 'text-red-400' : ''}
                    ${log.type === 'system' ? 'text-blue-400 italic' : ''}
                    ${log.type === 'output' ? 'text-[#00ff41]' : ''}
                    text-sm whitespace-pre-wrap break-words
                  `}>
                    {log.content}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing neural patterns...</span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleCommand} className="mt-4 flex items-center gap-2 border-t border-[#00ff41]/10 pt-4">
            <span className="text-[#00ff41] font-bold">vision@cli:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[#00ff41] caret-[#00ff41] text-sm"
              autoFocus
              disabled={isProcessing}
              placeholder={isProcessing ? "Processing..." : "Type command..."}
            />
          </form>

          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10 opacity-20" />
        </div>

        {/* Preview Overlay (Optional Sidebar) */}
        <AnimatePresence>
          {showPreview && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full md:w-80 flex flex-col gap-4"
            >
              <div className="bg-black/80 border border-[#00ff41]/30 rounded-lg overflow-hidden flex flex-col aspect-video md:aspect-auto md:flex-1 relative">
                <div className="bg-[#00ff41]/10 px-3 py-1 border-b border-[#00ff41]/30 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                    <Camera className="w-3 h-3" /> Visual_Feed.raw
                  </span>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="hover:text-white transition-colors"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="flex-1 bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                  {!isCameraActive && (
                    <div className="text-center p-4">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] opacity-40 uppercase">Feed Offline</p>
                    </div>
                  )}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
                  />
                  {/* HUD Overlays */}
                  {isCameraActive && (
                    <>
                      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#00ff41]" />
                      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#00ff41]" />
                      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#00ff41]" />
                      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#00ff41]" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 border border-[#00ff41]/30 rounded-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-[#00ff41] rounded-full" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Command Quick Reference */}
              <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 rounded-lg p-3">
                <h3 className="text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                  <HelpCircle className="w-3 h-3" /> Quick Commands
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="bg-black/40 p-1 rounded border border-[#00ff41]/10">scan</div>
                  <div className="bg-black/40 p-1 rounded border border-[#00ff41]/10">detect [obj]</div>
                  <div className="bg-black/40 p-1 rounded border border-[#00ff41]/10">cam on/off</div>
                  <div className="bg-black/40 p-1 rounded border border-[#00ff41]/10">text</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="text-[9px] opacity-40 flex justify-between items-center border-t border-[#00ff41]/10 pt-2">
        <div>SYSTEM_STATUS: NOMINAL | ENCRYPTION: AES-256</div>
        <div>CONNECTION: SECURE_TUNNEL_01</div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 255, 65, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 65, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 65, 0.4);
        }
      `}</style>
    </div>
  );
}
