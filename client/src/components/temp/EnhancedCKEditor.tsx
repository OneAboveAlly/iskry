import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// Najpierw importujemy własne style
import '../styles/EnhancedCKEditor.css';
// Następnie importujemy główny styl CKEditora, aby nadpisać ewentualne konflikty
import '@ckeditor/ckeditor5-build-classic/build/ckeditor.css';

interface EnhancedCKEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const EnhancedCKEditor: React.FC<EnhancedCKEditorProps> = ({
  value,
  onChange,
  placeholder = 'Rozpocznij pisanie treści tutaj...'
}) => {
  // CKEditor configuration
  const editorConfiguration = {
    placeholder: placeholder,
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'link',
        '|',
        'numberedList',
        'bulletedList',
        '|',
        'outdent',
        'indent',
        '|',
        'blockQuote',
        'insertTable',
        'uploadImage',
        'mediaEmbed',
        '|',
        'undo',
        'redo'
      ],
      shouldNotGroupWhenFull: true
    },
    language: 'pl',
    image: {
      toolbar: [
        'imageTextAlternative',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side'
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells'
      ]
    }
  };

  return (
    <div className="enhanced-quill-editor">
      {/* @ts-ignore - Ignorujemy błędy TypeScript dla CKEditor */}
      <CKEditor
        editor={ClassicEditor}
        config={editorConfiguration}
        data={value}
        onChange={(event: any, editor: any) => {
          const data = editor.getData();
          onChange(data);
        }}
        onReady={(editor: any) => {
          // Sprawdź, czy edytor i jego interfejs zostały prawidłowo załadowane
          console.log('CKEditor is ready to use!', editor);
        }}
        onError={(error: any, { phase }: any) => {
          console.error('CKEditor Error:', error, 'Phase:', phase);
        }}
      />

      <div className="editor-tools">
        <div className="editor-help">
          <details>
            <summary>Jak używać edytora</summary>
            <div className="help-content">
              <p><strong>Formatowanie tekstu:</strong> Użyj paska narzędzi, aby formatować tekst (pogrubienie, kursywa).</p>
              <p><strong>Nagłówki:</strong> Wybierz opcje z menu rozwijanych na pasku narzędzi.</p>
              <p><strong>Wstawianie obrazów:</strong> Kliknij ikonę obrazu i wybierz obraz z komputera.</p>
              <p><strong>Listy:</strong> Twórz listy numerowane i wypunktowane za pomocą odpowiednich przycisków.</p>
              <p><strong>Wstawianie linków:</strong> Zaznacz tekst i kliknij ikonę łańcucha.</p>
              <p><strong>Wstawianie tabeli:</strong> Kliknij ikonę tabeli i wybierz liczbę kolumn i wierszy.</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCKEditor; 