import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/QuillEditorFixes.css';

const TestQuillEditor: React.FC = () => {
  const [content, setContent] = useState('<p>Test content</p>');
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Konfiguracja modułów dla testowego edytora React-Quill
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

  // Ustawienie edytora jako załadowany po montażu komponentu
  useEffect(() => {
    setEditorLoaded(true);
  }, []);

  // Obsługa zmiany treści z obsługą błędów
  const handleChange = (content: string) => {
    try {
      setContent(content);
    } catch (err) {
      console.error('Błąd podczas aktualizacji treści:', err);
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    }
  };

  // Jeśli wystąpił błąd, pokazujemy textarea zapasowe
  if (error) {
    return (
      <div className="p-5 border border-red-500 rounded bg-red-50">
        <h3 className="text-xl font-bold text-red-600 mb-2">Błąd edytora:</h3>
        <p className="mb-3">{error}</p>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="editor-fallback-textarea"
        />
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-300 rounded my-5 bg-white">
      <h3 className="text-xl font-bold mb-4">Testowy komponent ReactQuill</h3>
      
      <div className="quill-editor-wrapper">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          placeholder="Wpisz coś tutaj..."
        />
      </div>
      
      {editorLoaded ? (
        <div className="mt-3 text-green-600">
          Edytor załadowany pomyślnie!
        </div>
      ) : (
        <div className="mt-3 text-orange-500">
          Ładowanie edytora...
        </div>
      )}
      
      <div className="mt-5">
        <h4 className="font-bold mb-2">Kod HTML zawartości:</h4>
        <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
          {content}
        </pre>
      </div>
    </div>
  );
};

export default TestQuillEditor; 