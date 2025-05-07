import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EnhancedEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const EnhancedEditor: React.FC<EnhancedEditorProps> = ({
  value,
  onChange,
  placeholder = 'Rozpocznij pisanie treści tutaj...'
}) => {
  const [editorError, setEditorError] = useState<string | null>(null);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
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
    <div className="editor-wrapper bg-white rounded shadow-sm overflow-hidden">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        placeholder={placeholder}
        className="bg-white"
      />
      <div className="p-3 text-sm text-gray-500 border-t">
        <details>
          <summary className="cursor-pointer">Jak używać edytora</summary>
          <div className="p-2 mt-2 bg-gray-50 rounded">
            <p><strong>Formatowanie tekstu:</strong> Użyj paska narzędzi, aby formatować tekst (pogrubienie, kursywa).</p>
            <p><strong>Wstawianie linków:</strong> Zaznacz tekst i kliknij ikonę łańcucha.</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default EnhancedEditor; 