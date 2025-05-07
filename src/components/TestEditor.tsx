import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import our custom CSS styles
import '../styles/ReactQuillEditor.css';

const TestQuillEditor: React.FC = () => {
  const [content, setContent] = useState('<p>Test content</p>');
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set editor as loaded after component mount
  useEffect(() => {
    console.log('Test Editor is ready!');
    setEditorLoaded(true);
  }, []);

  // Enhanced modules for React-Quill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['link', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['image', 'table'],
      ['clean']
    ]
  };

  // Handle editor change with error catching
  const handleChange = (content: string) => {
    try {
      setContent(content);
    } catch (error) {
      console.error('ReactQuill error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px', border: '1px solid red' }}>
        <h3>Error loading Editor:</h3>
        <p>{error}</p>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: '100%', height: '200px' }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
      <h3>Test ReactQuill Editor Component</h3>
      
      <div className="w-full overflow-visible">
        <div className="editor-container w-full">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleChange}
            modules={modules}
            placeholder="Type something here..."
            className="bg-white rounded"
          />
        </div>
      </div>
      
      {editorLoaded ? (
        <div style={{ color: 'green', marginTop: '10px' }}>
          Editor loaded successfully!
        </div>
      ) : (
        <div style={{ color: 'orange', marginTop: '10px' }}>
          Loading editor...
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <h4>Content HTML:</h4>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflowX: 'auto' }}>
          {content}
        </pre>
      </div>
    </div>
  );
};

export default TestQuillEditor; 