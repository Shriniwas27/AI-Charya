import React, { useState, useRef } from 'react';
import { Upload, FileText, RotateCcw, Book, GraduationCap, Loader2 } from 'lucide-react';

const KnowledgeBaseUploadApp = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [subjectName, setSubjectName] = useState('');
  const [standard, setStandard] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const sendToAPI = async () => {
    if (!selectedFile || !subjectName.trim() || !standard.trim()) {
      setError('Please fill in all fields and select a PDF file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setLoadingStatus('Testing backend connection...');

    try {
      // First, test if the backend is reachable
      const testController = new AbortController();
      const testTimeoutId = setTimeout(() => testController.abort(), 10000); // 10 second test
      
      try {
        const testResponse = await fetch('/api/', {
          method: 'GET',
          headers: { 'ngrok-skip-browser-warning': 'true' },
          signal: testController.signal
        });
        clearTimeout(testTimeoutId);
        console.log('Backend connection test:', testResponse.status);
      } catch (testErr) {
        clearTimeout(testTimeoutId);
        console.log('Backend connection test failed:', testErr);
        throw new Error('Cannot connect to backend server. Please check if your backend is running and ngrok tunnel is active.');
      }

      // If connection test passes, proceed with file upload
      const API_URL = 'https://cf02a2aac7b6.ngrok-free.app/upload_chapter_pdf/';
      
      const formData = new FormData();
      formData.append('file', selectedFile, selectedFile.name);
      formData.append('subject_name', subjectName.trim());
      formData.append('std', standard.trim());

      console.log('Sending request to:', API_URL);
      console.log('Form data:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        subject: subjectName.trim(),
        standard: standard.trim()
      });

      setLoadingStatus('Uploading PDF file... (this may take a while for large files)');

      // Increase timeout to 2 minutes for large file uploads
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 120000); // 2 minutes timeout

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorText;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorText = JSON.stringify(errorData, null, 2);
          } else {
            errorText = await response.text();
          }
        } catch (e) {
          errorText = 'Unable to read error response';
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}\nServer Response: ${errorText}`);
      }

      setLoadingStatus('Processing response...');
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.warn('Non-JSON response received:', text);
        data = { message: text, raw_response: text };
      }
      
      console.log('Success response:', data);
      
      setResponse(data);
      setLoadingStatus('Upload successful!');
      setIsLoading(false);

    } catch (err) {
      console.error('Upload error:', err);
      
      let errorMessage = 'Upload failed: ';
      let troubleshooting = '';

      if (err.name === 'AbortError') {
        errorMessage += 'Request timed out (2 minutes)';
        troubleshooting = `⏱️ Timeout Issues:\n` +
                         `1. Your PDF file (${formatFileSize(selectedFile.size)}) might be too large\n` +
                         `2. Backend processing is taking too long\n` +
                         `3. Network connection is slow or unstable\n` +
                         `4. Try with a smaller PDF file (< 10MB recommended)\n` +
                         `5. Check your backend server logs for errors\n` +
                         `6. Ensure your backend has enough memory/CPU resources`;
      } else if (err.message.includes('Cannot connect to backend')) {
        errorMessage += err.message;
        troubleshooting = `🔌 Backend Connection Issues:\n` +
                         `1. Your backend server is not running\n` +
                         `2. Ngrok tunnel expired - restart ngrok\n` +
                         `3. Wrong ngrok URL in vite.config.js\n` +
                         `4. Firewall blocking the connection\n` +
                         `5. Backend crashed - check server logs`;
      } else if (err.message === 'Failed to fetch') {
        errorMessage += 'Network connection failed';
        troubleshooting = `🌐 Network Issues:\n` +
                         `1. Internet connection lost\n` +
                         `2. Vite dev server needs restart\n` +
                         `3. Proxy configuration error\n` +
                         `4. DNS resolution issues`;
      } else if (err.message.includes('HTTP')) {
        errorMessage += err.message;
        troubleshooting = `🚨 Server Error:\n` +
                         `1. Check backend server logs\n` +
                         `2. Verify the upload endpoint exists\n` +
                         `3. Check file permissions on server\n` +
                         `4. Ensure backend has disk space`;
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage + (troubleshooting ? '\n\n' + troubleshooting : ''));
      setLoadingStatus('Upload failed');
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setSubjectName('');
    setStandard('');
    setResponse(null);
    setError(null);
    setLoadingStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Book className="w-8 h-8" />
              Knowledge Base Upload System
            </h1>
            <p className="mt-2 text-purple-100">Upload chapter PDFs to build your knowledge base</p>
          </div>

          <div className="p-6">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Subject and Standard Input */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Book className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard/Class
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={standard}
                      onChange={(e) => setStandard(e.target.value)}
                      placeholder="e.g., 10th, 12th, B.Tech 1st Year"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <GraduationCap className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter PDF File
                </label>
                
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Upload PDF File</h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Select a PDF file containing the chapter content
                    </p>
                    <label className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md hover:shadow-lg max-w-xs mx-auto">
                      <Upload className="w-5 h-5" />
                      Choose PDF File
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="bg-red-100 p-3 rounded-lg">
                        <FileText className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{selectedFile.name}</h4>
                        <p className="text-sm text-gray-500">
                          Size: {formatFileSize(selectedFile.size)} • Type: PDF
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={sendToAPI}
                  disabled={isLoading || !selectedFile || !subjectName.trim() || !standard.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {isLoading ? 'Uploading...' : 'Upload to Knowledge Base'}
                </button>
                <button
                  onClick={reset}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>

              {/* Loading Status */}
              {isLoading && loadingStatus && (
                <div className="text-center mt-4">
                  <p className="text-purple-600 font-medium">{loadingStatus}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Trying multiple connection methods...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseUploadApp;