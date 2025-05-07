import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import our custom CSS styles
import '../styles/ReactQuillEditor.css';

interface EnhancedEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const EnhancedQuillEditor: React.FC<EnhancedEditorProps> = ({
  value,
  onChange,
  placeholder = 'Rozpocznij pisanie treści tutaj...'
}) => {
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);

  // Set editor as loaded after component mount
  useEffect(() => {
    console.log('Enhanced editor is ready!');
    setEditorLoaded(true);
  }, []);

  // Enhanced Quill modules configuration with more features
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  // Handle editor change with error catching
  const handleChange = (content: string) => {
    try {
      onChange(content);
    } catch (error) {
      console.error('Error in editor onChange:', error);
      setEditorError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // If there's an error, show fallback textarea
  if (editorError) {
    return (
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="bg-red-100 text-red-700 p-3 flex justify-between items-center">
          <p>Wystąpił błąd podczas ładowania edytora: {editorError}</p>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[300px] p-3 border border-gray-200"
        />
      </div>
    );
  }

  return (
    <div className="enhanced-editor-wrapper w-full">
      <div className="editor-container w-full overflow-visible">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          placeholder={placeholder}
          className="bg-white rounded"
        />
      </div>
      
      {editorLoaded ? (
        <div className="text-green-600 text-xs mt-1 mb-2">
          Edytor został pomyślnie załadowany
        </div>
      ) : (
        <div className="text-orange-500 text-xs mt-1 mb-2">
          Ładowanie edytora...
        </div>
      )}
    </div>
  );
};

export default EnhancedQuillEditor; 