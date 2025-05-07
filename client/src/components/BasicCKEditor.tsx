import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import our custom CSS with toolbar fixes
import '../styles/EnhancedCKEditor.css';

interface BasicEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const BasicEditor: React.FC<BasicEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Wprowadź treść tutaj...' 
}) => {
  const [editorLoaded, setEditorLoaded] = useState(false);

  // Enhanced modules for React-Quill to match CKEditor functionality
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'blockquote'],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['clean']
    ]
  };

  // Set editor as loaded after component mount
  useEffect(() => {
    console.log('Basic editor is ready!');
    setEditorLoaded(true);
  }, []);

  return (
    <div className="basic-editor-wrapper">
      <div className="border border-gray-300 rounded bg-white mb-3">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
          className="bg-white"
        />
      </div>
      
      {editorLoaded ? (
        <div className="text-green-600 text-sm mb-2">
          Edytor został pomyślnie załadowany
        </div>
      ) : (
        <div className="text-orange-500 text-sm mb-2">
          Ładowanie edytora...
        </div>
      )}
    </div>
  );
};

export default BasicEditor; 