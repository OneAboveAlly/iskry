import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/QuillEditorFixes.css';

interface BasicQuillEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const BasicQuillEditor: React.FC<BasicQuillEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Wprowadź treść tutaj...' 
}) => {
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Podstawowa konfiguracja modułów dla React-Quill
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

  // Ustawienie edytora jako załadowany po montażu komponentu
  useEffect(() => {
    setEditorLoaded(true);
  }, []);

  // Obsługa zmiany treści z obsługą błędów
  const handleChange = (content: string) => {
    try {
      onChange(content);
    } catch (err) {
      console.error('Błąd podczas aktualizacji treści:', err);
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    }
  };

  // Jeśli wystąpił błąd, pokazujemy textarea zapasowe
  if (error) {
    return (
      <div className="quill-editor-wrapper">
        <div className="editor-error-message">
          <p>Wystąpił błąd podczas ładowania edytora: {error}</p>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="editor-fallback-textarea"
        />
      </div>
    );
  }

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        placeholder={placeholder}
      />
      
      {editorLoaded ? (
        <div className="editor-status-message text-green-600">
          Edytor został załadowany
        </div>
      ) : (
        <div className="editor-status-message text-orange-500">
          Ładowanie edytora...
        </div>
      )}
    </div>
  );
};

export default BasicQuillEditor; 