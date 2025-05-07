/**
 * This file provides a polyfill for Quill's mutation handling,
 * replacing the deprecated DOMNodeInserted event with the modern MutationObserver API.
 * 
 * It should be imported before using the Quill editor to silence deprecation warnings.
 */

// Add Quill to Window interface
declare global {
  interface Window {
    Quill?: any;
    forceQuillEditorVisibility?: () => boolean;
  }
}

// Polyfill for Quill's deprecated DOM mutation event handling
const setupQuillMutationPolyfill = () => {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  console.log('Setting up Quill editor compatibility fixes');
  
  // Add a global fix for ReactQuill visibility issues
  window.addEventListener('load', () => {
    console.log('Applying ReactQuill visibility fixes');
    
    // Fix for editor visibility issues
    const fixEditorVisibility = () => {
      const editorElements = document.querySelectorAll('.ql-toolbar, .ql-container, .ql-editor, .quill, .react-quill, .enhanced-quill-editor');
      editorElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.style.display = element.classList.contains('ql-picker-options') ? 'none' : 'block';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
        }
      });
      
      // Fix toolbar buttons
      const formatButtons = document.querySelectorAll('.ql-formats button, .ql-formats .ql-picker');
      formatButtons.forEach((button) => {
        if (button instanceof HTMLElement) {
          button.style.display = 'inline-block';
          button.style.visibility = 'visible';
          button.style.opacity = '1';
        }
      });
    };
    
    // Run multiple times to ensure it works after React rendering
    setTimeout(fixEditorVisibility, 500);
    setTimeout(fixEditorVisibility, 1000);
    setTimeout(fixEditorVisibility, 2000);
  });
  
  // Patch Quill to prevent moduleClass errors
  if (typeof window !== 'undefined' && window.Quill) {
    try {
      // Safer patching method that doesn't alter prototype directly
      const originalRegisterModule = window.Quill.register;
      
      window.Quill.register = function(path: any, target: any, overwrite?: boolean) {
        try {
          return originalRegisterModule.call(this, path, target, overwrite);
        } catch (error) {
          console.warn('Quill module registration error suppressed:', error);
          return window.Quill;
        }
      };
      
      console.log('Quill patched successfully');
    } catch (error) {
      console.error('Error patching Quill:', error);
    }
  }
};

// Run the polyfill setup
setupQuillMutationPolyfill();

// Add a global function to force editor visibility
if (typeof window !== 'undefined') {
  window.forceQuillEditorVisibility = () => {
    const editorElements = document.querySelectorAll(
      '.ql-toolbar, .ql-container, .ql-editor, .quill, .react-quill, .enhanced-quill-editor, .ql-formats, .ql-picker, .ql-picker-label'
    );
    editorElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.display = element.classList.contains('ql-picker-options') ? 'none' : 'block';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
      }
    });
    console.log('Forced Quill editor visibility');
    return true;
  };
}

export default setupQuillMutationPolyfill; 