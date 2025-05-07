import React from 'react';
import MaterialList from '../../components/MaterialList';
import '../../styles/StudentMaterials.css';

const Materials: React.FC = () => {
  return (
    <div className="student-materials-page">
      <div className="materials-header">
        <h1>Twoje Materiały PDF</h1>
        <p>Wszystkie materiały przypisane do Twojego konta</p>
      </div>
      
      <div className="materials-content">
        <MaterialList />
      </div>
    </div>
  );
};

export default Materials; 