import React from 'react';
import MaterialUpload from '../../components/MaterialUpload';
import MaterialsManagementComponent from '../../components/MaterialsManagement';
import '../../styles/MaterialsManagement.css';

const MaterialsManagementPage: React.FC = () => {
  return (
    <div className="materials-management-container">
      <h1 className="page-title">Zarządzanie Materiałami PDF</h1>

      <div className="materials-grid">
        {/* Upload section */}
        <div className="card-container">
          <div className="card-header">
            <h2 className="section-title">Dodaj nowy materiał</h2>
          </div>
          <div className="card-content">
            <MaterialUpload />
          </div>
        </div>

        {/* Materials list section */}
        <div className="card-container">
          <div className="card-header">
            <h2 className="section-title">Lista materiałów</h2>
          </div>
          <div className="card-content">
            <MaterialsManagementComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsManagementPage; 