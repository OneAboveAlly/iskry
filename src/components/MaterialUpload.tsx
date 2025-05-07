import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/MaterialUpload.css';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
}

const MaterialUpload: React.FC = () => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch students list
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/admin/users?role=STUDENT', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        setStudents(data);
      } catch (err) {
        setError('Error fetching students list');
        console.error('Error fetching students:', err);
      }
    };

    fetchStudents();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('studentId', selectedStudent);
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:3001/api/materials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload material');
      }

      // Reset form
      setTitle('');
      setSelectedFile(null);
      setSelectedStudent('');
      if (document.getElementById('file-input') instanceof HTMLInputElement) {
        (document.getElementById('file-input') as HTMLInputElement).value = '';
      }
      
      setSuccessMessage('Material uploaded successfully');
    } catch (err: any) {
      setError(err.message || 'Error uploading material');
      console.error('Error uploading material:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="material-upload-container">
      <h2>Assign PDF Material to Student</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit} className="material-upload-form">
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter material title"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="student">Student:</label>
          <select
            id="student"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            required
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} {student.surname} ({student.email})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="file-input">PDF File:</label>
          <input
            type="file"
            id="file-input"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          {selectedFile && (
            <div className="selected-file">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="upload-button"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload Material'}
        </button>
      </form>
    </div>
  );
};

export default MaterialUpload; 