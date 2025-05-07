import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import our custom CSS with toolbar fixes
import '../styles/EnhancedCKEditor.css';

interface EnhancedQuillEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const EnhancedQuillEditor: React.FC<EnhancedQuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Rozpocznij pisanie treści tutaj...'
}) => {
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Set editor as loaded after component mount
  useEffect(() => {
    console.log('Enhanced editor is initializing...');
    // Short delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setEditorLoaded(true);
      console.log('Enhanced editor is ready!');
      
      // Fix for dropdown menus being open by default
      if (editorWrapperRef.current) {
        // Close any open dropdowns
        const openDropdowns = editorWrapperRef.current.querySelectorAll('.ql-picker.ql-expanded');
        openDropdowns.forEach((dropdown) => {
          dropdown.classList.remove('ql-expanded');
        });
        
        // Hide all picker options
        const pickerOptions = editorWrapperRef.current.querySelectorAll('.ql-picker-options');
        pickerOptions.forEach((options) => {
          (options as HTMLElement).style.display = 'none';
          (options as HTMLElement).style.visibility = 'hidden';
        });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Enhanced Quill modules configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: function() {
          try {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();
            
            input.onchange = () => {
              if (input.files && input.files[0]) {
                const file = input.files[0];
                
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                  alert('Obrazek nie może być większy niż 5MB');
                  return;
                }
                
                const reader = new FileReader();
                
                reader.onload = (e) => {
                  try {
                    if (e.target && e.target.result && quillRef.current) {
                      const quill = quillRef.current.getEditor();
                      const range = quill.getSelection(true);
                      
                      // Insert image at current position
                      quill.insertEmbed(range.index, 'image', e.target.result);
                      
                      // Move cursor to after the image
                      quill.setSelection(range.index + 1, 0);
                    }
                  } catch (error) {
                    console.error("Error inserting image:", error);
                    setEditorError("Nie udało się wstawić obrazka.");
                  }
                };
                
                reader.readAsDataURL(file);
              }
            };
          } catch (error) {
            console.error("Error handling image upload:", error);
            setEditorError("Wystąpił problem z przesyłaniem obrazka.");
          }
        }
      }
    },
    clipboard: {
      matchVisual: false
    }
  };

  // Supported formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image',
    'align', 'color', 'background'
  ];

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
      <div className="editor-error-message">
        <p>Wystąpił problem z edytorem. Spróbuj odświeżyć stronę.</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="fallback-textarea"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div ref={editorWrapperRef} className="enhanced-editor-wrapper">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default EnhancedQuillEditor; 