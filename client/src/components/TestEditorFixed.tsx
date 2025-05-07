import React, { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// Import our custom CSS with toolbar fixes
import '../styles/EnhancedCKEditor.css';

const TestEditorFixed: React.FC = () => {
  const [content, setContent] = useState('<p>Test content</p>');
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px', border: '1px solid red' }}>
        <h3>Error loading CKEditor:</h3>
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
      <h3>Test CKEditor Component (Fixed)</h3>

      <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
        {/* @ts-ignore - Ignoring TypeScript errors for CKEditor */}
        <CKEditor
          editor={ClassicEditor}
          data={content}
          config={{
            toolbar: [
              'heading',
              '|',
              'bold', 'italic', 'underline', 'strikethrough',
              '|',
              'link', 'bulletedList', 'numberedList',
              '|',
              'outdent', 'indent',
              '|',
              'blockQuote', 'insertTable', 'mediaEmbed',
              '|',
              'undo', 'redo'
            ],
            table: {
              contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
            }
          }}
          onReady={(editor) => {
            console.log('Test Editor is ready!', editor);
            setEditorLoaded(true);
          }}
          onChange={(event, editor) => {
            const data = editor.getData();
            setContent(data);
          }}
          onError={(error) => {
            console.error('CKEditor error:', error);
            setError(error.toString());
          }}
        />
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

export default TestEditorFixed; 