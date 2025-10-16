/**
 * Board Component
 * Collaborative text editor using Quill.js
 */

import React, { useEffect, useRef, useState } from 'react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditors, setActiveEditors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="h-full flex flex-col bg-white/50 backdrop-blur-sm">
      {/* Enhanced Editor Toolbar */}
      <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-700">Collaborative Text Editor</span>
          <span className="text-xs bg-white/60 px-2 py-1 rounded-lg font-medium">
            {editorContent.length} characters
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Undo/Redo Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-xs rounded-lg transition-colors duration-200 flex items-center gap-1"
            >
              ↶ Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={isLoading}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-xs rounded-lg transition-colors duration-200 flex items-center gap-1"
            >
              ↷ Redo
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={handleExportJSON}
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors duration-200 flex items-center gap-1"
            >
              📄 Text JSON
            </button>
            <button
              onClick={exportQuillToPDF}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors duration-200 flex items-center gap-1"
            >
              📋 Export as PDF
            </button>
            <button
              onClick={exportQuillToPNG}
              className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg transition-colors duration-200 flex items-center gap-1"
            >
              🖼️ Export as PNG
            </button>
            <button
              onClick={() => {
                console.log('🧪 Testing export functionality...');
                console.log('Current roomId:', roomId);
                console.log('Current content:', editorContent);
              }}
              className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors duration-200"
            >
              🧪 Test
            </button>
          </div>
        </div>

        {/* Active Editors Indicator */}
        {activeEditors.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">Active editors:</span>
            <div className="flex items-center gap-1">
              {activeEditors.map((editor, index) => (
                <div
                  key={editor.userId || index}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>{editor.userName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quill Editor */}
      <div className="flex-1 overflow-hidden bg-white/80">
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
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        />
      </div>

      {/* Editor Status */}
      <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Real-time collaboration enabled</span>
          </div>
          <span className="bg-white/60 px-2 py-1 rounded-lg font-medium">Auto-save</span>
        </div>
      </div>
    </div>
  );
};

export default Board;
