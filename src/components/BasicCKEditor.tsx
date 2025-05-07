import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import our custom CSS styles
import '../styles/ReactQuillEditor.css';

interface BasicEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const BasicQuillEditor: React.FC<BasicEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Wprowadź treść tutaj...' 
}) => {
  const [editorLoaded, setEditorLoaded] = useState(false);

  // Enhanced modules for React-Quill
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
    <div className="basic-editor-wrapper w-full">
      <div className="editor-container w-full overflow-visible">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
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

export default BasicQuillEditor; 