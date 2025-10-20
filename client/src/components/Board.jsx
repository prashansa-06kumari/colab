/**
 * Board Component
 * Collaborative text editor using Quill.js
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import socketService from '../services/socket';
import { boardAPI } from '../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Board = ({ content, onChange, roomId = 'default-room' }) => {
  const quillRef = useRef(null);
  const [editorContent, setEditorContent] = useState(content || '');
  const [isLocalChange, setIsLocalChange] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditors, setActiveEditors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiMode, setAiMode] = useState('grammar');

  /**
   * Update editor content when prop changes (from other users)
   */
  useEffect(() => {
    if (!isLocalChange && content !== editorContent) {
      setEditorContent(content || '');
      
      // Update Quill editor content
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const currentContent = editor.getContents();
        const newContent = editor.clipboard.convert(content || '');
        
        // Only update if content is different to avoid cursor jumping
        if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
          editor.setContents(newContent);
        }
      }
    }
    setIsLocalChange(false);
  }, [content, editorContent, isLocalChange]);

  /**
   * Handle content changes from the editor
   */
  const handleContentChange = (value) => {
    setIsLocalChange(true);
    setEditorContent(value);
    onChange(value);
  };

  /**
   * Handle undo action
   */
  const handleUndo = async () => {
    try {
      setIsLoading(true);
      const response = await boardAPI.undoBoard(roomId);
      if (response.success) {
        setEditorContent(response.data.board.content);
        onChange(response.data.board.content);
      }
    } catch (error) {
      console.error('Undo failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle redo action
   */
  const handleRedo = async () => {
    try {
      setIsLoading(true);
      const response = await boardAPI.redoBoard(roomId);
      if (response.success) {
        setEditorContent(response.data.board.content);
        onChange(response.data.board.content);
      }
    } catch (error) {
      console.error('Redo failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export board as JSON (text only)
   */
  const handleExportJSON = async () => {
    try {
      console.log('📄 Starting JSON export...');
      const response = await boardAPI.exportBoardAsJSON(roomId);
      console.log('📄 JSON response received:', response);
      
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-${roomId}-text.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('📄 JSON export completed');
    } catch (error) {
      console.error('JSON export failed:', error);
      alert('JSON export failed: ' + error.message);
    }
  };

  /**
   * Export Quill editor content as PDF with formatting preservation
   * Uses html2canvas to capture the rendered content and jsPDF to create PDF
   */
  const exportQuillToPDF = async () => {
    try {
      console.log('📋 Starting PDF export with formatting...');
      
      if (!quillRef.current) {
        throw new Error('Editor not found');
      }

      // Get the Quill editor element
      const editorElement = quillRef.current.getEditor().container.querySelector('.ql-editor');
      
      if (!editorElement) {
        throw new Error('Editor content not found');
      }

      // Capture the editor content as canvas using html2canvas
      const canvas = await html2canvas(editorElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Create PDF with jsPDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit content
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`collabspace-board-${roomId}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('📋 PDF export completed with formatting preserved');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed: ' + error.message);
    }
  };

  /**
   * Export Quill editor content as PNG with formatting preservation
   * Uses html2canvas to capture the rendered content and download as PNG
   */
  const exportQuillToPNG = async () => {
    try {
      console.log('🖼️ Starting PNG export with formatting...');
      
      if (!quillRef.current) {
        throw new Error('Editor not found');
      }

      // Get the Quill editor element
      const editorElement = quillRef.current.getEditor().container.querySelector('.ql-editor');
      
      if (!editorElement) {
        throw new Error('Editor content not found');
      }

      // Capture the editor content as canvas using html2canvas
      const canvas = await html2canvas(editorElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Convert canvas to PNG and download
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `collabspace-board-${roomId}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imgData;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('🖼️ PNG export completed with formatting preserved');
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('PNG export failed: ' + error.message);
    }
  };

  /**
   * Handle AI text improvement
   */
  const handleAiImprove = async () => {
    console.log('🤖 AI Improve button clicked');
    console.log('📝 Editor content:', editorContent);
    console.log('🎯 AI Mode:', aiMode);
    
    if (!quillRef.current || !editorContent.trim()) {
      console.log('❌ No text to improve');
      alert('Please enter some text to improve.');
      return;
    }

    try {
      console.log('🚀 Starting AI processing...');
      setIsAiProcessing(true);
      
      // Get plain text from Quill editor
      const editor = quillRef.current.getEditor();
      const textContent = editor.getText().trim();
      
      if (!textContent) {
        alert('Please enter some text to improve.');
        return;
      }

      // Call AI improvement API
      console.log('📡 Making API call to /api/ai/improve');
      console.log('📤 Request body:', { text: textContent, mode: aiMode });
      
      const response = await fetch('http://localhost:5000/api/ai/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: textContent,
          mode: aiMode
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ API call failed with status:', response.status);
        throw new Error(`API call failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'AI improvement failed');
      }

      if (data.success && data.improved) {
        // Replace editor content with improved text
        const improvedContent = data.improved;
        editor.setText(improvedContent);
        
        // Update state
        setEditorContent(improvedContent);
        onChange(improvedContent);
        
        // Show success message
        console.log('✅ AI improvement successful:', data);
      }

    } catch (error) {
      console.error('❌ AI improvement failed:', error);
      alert(`AI improvement failed: ${error.message}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  /**
   * Handle editor focus
   */
  const handleEditorFocus = () => {
    if (!isEditing) {
      setIsEditing(true);
      socketService.emit('startEditing', { roomId });
    }
  };

  /**
   * Handle editor blur
   */
  const handleEditorBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      socketService.emit('stopEditing', { roomId });
    }
  };

  /**
   * Set up socket listeners for editor tracking
   */
  useEffect(() => {
    // Listen for active editors
    socketService.onActiveEditors((data) => {
      setActiveEditors(data.editors);
    });

    // Listen for user started editing
    socketService.onUserStartedEditing((data) => {
      console.log('User started editing:', data);
    });

    // Listen for user stopped editing
    socketService.onUserStoppedEditing((data) => {
      console.log('User stopped editing:', data);
    });

    // Get initial active editors
    socketService.emit('getActiveEditors', { roomId });

    return () => {
      // Cleanup
      if (isEditing) {
        socketService.emit('stopEditing', { roomId });
      }
    };
  }, [roomId, isEditing]);

  /**
   * Initialize Quill editor properly
   */
  useEffect(() => {
    const initializeQuill = () => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        if (editor) {
          console.log('✅ Quill editor initialized');
          
          // Ensure toolbar is properly set up
          const toolbar = editor.getModule('toolbar');
          if (toolbar) {
            console.log('✅ Quill toolbar module loaded');
            
            // Force enable all toolbar buttons
            const toolbarContainer = toolbar.container;
            if (toolbarContainer) {
              // Make sure toolbar is visible and functional
              toolbarContainer.style.display = 'block';
              toolbarContainer.style.visibility = 'visible';
              toolbarContainer.style.opacity = '1';
              
              // Enable all buttons
              const buttons = toolbarContainer.querySelectorAll('button');
              buttons.forEach(button => {
                button.disabled = false;
                button.style.pointerEvents = 'auto';
                button.style.cursor = 'pointer';
              });
              
              // Enable all pickers
              const pickers = toolbarContainer.querySelectorAll('.ql-picker');
              pickers.forEach(picker => {
                picker.style.pointerEvents = 'auto';
                picker.style.cursor = 'pointer';
              });
            }
          }
        }
      }
    };

    // Initialize immediately and after a delay to ensure DOM is ready
    initializeQuill();
    const timeoutId = setTimeout(initializeQuill, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  /**
   * Force reinitialize Quill when content changes
   */
  useEffect(() => {
    if (quillRef.current && content !== editorContent) {
      setEditorContent(content || '');
    }
  }, [content]);

  /**
   * Initialize Web Speech API
   */
  useEffect(() => {
    const initSpeechRecognition = () => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
          console.log('🎤 Voice recognition started');
          setIsListening(true);
        };

        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            insertVoiceText(finalTranscript);
          }
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          console.log('🎤 Voice recognition ended');
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
    };

    initSpeechRecognition();
  }, []);

  /**
   * Insert voice text at current cursor position
   */
  const insertVoiceText = (text) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        const range = editor.getSelection();
        const index = range ? range.index : editor.getLength();
        
        editor.insertText(index, text + ' ');
        editor.setSelection(index + text.length + 1);
        
        // Trigger content change
        const newContent = editor.root.innerHTML;
        setEditorContent(newContent);
        onChange(newContent);
      }
    }
  };

  /**
   * Start/stop voice recognition
   */
  const toggleVoiceRecognition = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
    }
  };

  /**
   * Custom image handler for Quill
   */
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, 'image', reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  /**
   * Quill editor modules configuration
   */
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  /**
   * Quill editor formats
   */
  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image'
  ];

  return (
    <div className="h-full flex flex-col bg-primary-dark/50 backdrop-blur-sm">
      {/* Enhanced Editor Toolbar */}
      <div className="px-6 py-4 premium-gradient border-b border-bronze-tone/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-accent-gold font-poppins">Collaborative Text Editor</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-gold rounded-full animate-glow-pulse"></div>
              <span className="text-xs text-bronze-tone font-inter">Real-time collaboration</span>
            </div>
          </div>
          <span className="text-xs bg-bronze-tone/20 px-3 py-1 rounded-lg font-medium text-text-bright font-inter">
            {editorContent.length} characters
          </span>
        </div>
        
        {/* AI Writing Assistant - Clean Layout */}
        <div className="mb-4 p-4 bg-secondary-blue/20 rounded-xl border border-bronze-tone/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-accent-gold">🤖 AI Writing Assistant</span>
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value)}
                className="px-3 py-2 bg-panel-bg border border-bronze-tone/30 rounded-lg text-text-bright text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold"
                disabled={isAiProcessing}
              >
                <option value="grammar">Grammar Fix</option>
                <option value="rephrase">Rephrase</option>
                <option value="summarize">Summarize</option>
              </select>
            </div>
            <button
              onClick={handleAiImprove}
              disabled={isAiProcessing || !editorContent.trim()}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white disabled:text-gray-300 text-sm rounded-lg transition-all duration-300 flex items-center gap-2 font-medium disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg"
            >
              {isAiProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-dark/30 border-t-primary-dark"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Improve Writing
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons - Organized Layout */}
        <div className="space-y-4">
          {/* Primary Actions Row */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleUndo}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white disabled:text-gray-300 text-sm rounded-lg transition-all duration-300 flex items-center gap-2 font-medium hover:scale-105 hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white disabled:text-gray-300 text-sm rounded-lg transition-all duration-300 flex items-center gap-2 font-medium hover:scale-105 hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
              Redo
            </button>
            <button
              onClick={toggleVoiceRecognition}
              className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 hover:shadow-lg'
              }`}
              title={isListening ? 'Stop Voice Input' : 'Start Voice Input'}
            >
              {isListening ? (
                <>
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  Stop Voice
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17a1 1 0 102 0v-2.07z" clipRule="evenodd" />
                  </svg>
                  Voice Input
                </>
              )}
            </button>
          </div>

          {/* Export Actions Row */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg transition-all duration-300 flex items-center gap-2 font-medium hover:scale-105 hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export JSON
            </button>
            <button
              onClick={exportQuillToPDF}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-sm rounded-lg transition-all duration-300 flex items-center gap-2 font-medium hover:scale-105 hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </button>
            <button
              onClick={exportQuillToPNG}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg transition-all duration-300 flex items-center gap-2 font-medium hover:scale-105 hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Export PNG
            </button>
          </div>
        </div>

        {/* Active Editors Indicator */}
        {activeEditors.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-bronze-tone font-medium font-inter">Active editors:</span>
            <div className="flex items-center gap-1">
              {activeEditors.map((editor, index) => (
                <div
                  key={editor.userId || index}
                  className="flex items-center gap-1 px-2 py-1 bg-accent-gold/20 text-accent-gold text-xs rounded-lg border border-bronze-tone/30"
                >
                  <div className="w-2 h-2 bg-accent-gold rounded-full animate-glow-pulse"></div>
                  <span className="font-inter">{editor.userName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quill Editor */}
      <div className="flex-1 bg-white">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={editorContent}
          onChange={handleContentChange}
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          modules={modules}
          formats={formats}
          placeholder="Start typing your collaborative document..."
        />
      </div>

      {/* Editor Status */}
      <div className="px-6 py-3 premium-gradient border-t border-bronze-tone/30 text-xs text-bronze-tone">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-gold rounded-full animate-glow-pulse"></div>
              <span className="font-medium text-text-bright font-inter">Real-time collaboration enabled</span>
            </div>
            {isListening && (
              <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-lg border border-red-400/30">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-red-300 font-inter">🎤 Listening...</span>
              </div>
            )}
          </div>
          <span className="bg-bronze-tone/20 px-2 py-1 rounded-lg font-medium text-text-bright font-inter">Auto-save</span>
        </div>
      </div>
    </div>
  );
};

export default Board;
