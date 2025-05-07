import React from 'react';
import TestEditorFixed from '../../components/TestEditorFixed';

const TestPage: React.FC = () => {
  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1>Test CKEditor Page</h1>
      <p>This page tests if CKEditor works properly.</p>
      
      <TestEditorFixed />
    </div>
  );
};

export default TestPage; 