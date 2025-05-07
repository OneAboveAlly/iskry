import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/MaterialUpload.css';
import { authFetch } from '../utils/auth';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  approved: boolean;
}

const MaterialUpload: React.FC = () => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedStudentLabel, setSelectedStudentLabel] = useState<string>('');
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pobierz listę uczniów
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await authFetch('http://localhost:3001/api/admin/users?role=STUDENT');

        if (!response.ok) {
          throw new Error('Nie udało się pobrać listy uczniów');
        }

        const data = await response.json();
        // Filter to only include approved users
        const approvedStudents = data.filter((user: User) => user.approved);
        setStudents(approvedStudents);
        setFilteredStudents(approvedStudents);
      } catch (err) {
        setError('Błąd podczas pobierania listy uczniów');
        console.error('Błąd pobierania uczniów:', err);
      }
    };

    fetchStudents();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter students when search term changes
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => {
        const fullName = `${student.name} ${student.surname}`.toLowerCase();
        const email = student.email.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search);
      });
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Sprawdź, czy plik jest w formacie PDF
      if (file.type !== 'application/pdf') {
        setError('Dozwolone są tylko pliki PDF');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setDropdownOpen(true);
  };

  const handleStudentSelect = (student: User) => {
    setSelectedStudent(student.id.toString());
    setSelectedStudentLabel(`${student.name} ${student.surname} (${student.email})`);
    setDropdownOpen(false);
    setSearchTerm('');
    setSelectAllStudents(false);
  };
  
  const handleSelectAllStudents = () => {
    setSelectAllStudents(true);
    setSelectedStudent('all');
    setSelectedStudentLabel('Wszyscy uczniowie');
    setDropdownOpen(false);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Proszę podać tytuł');
      return;
    }
    
    if (!selectedStudent) {
      setError('Proszę wybrać ucznia');
      return;
    }
    
    if (!selectedFile) {
      setError('Proszę wybrać plik PDF');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (selectAllStudents) {
        // Handle sending to all students
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', selectedFile);
        formData.append('sendToAll', 'true');
        
        const response = await authFetch('http://localhost:3001/api/materials/send-to-all', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Nie udało się przesłać materiału do wszystkich uczniów');
        }
        
        setSuccessMessage('Materiał został pomyślnie przesłany do wszystkich uczniów');
      } else {
        // Handle sending to a single student
        const formData = new FormData();
        formData.append('title', title);
        formData.append('studentId', selectedStudent);
        formData.append('file', selectedFile);
        
        const response = await authFetch('http://localhost:3001/api/materials', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Nie udało się przesłać materiału');
        }
        
        setSuccessMessage('Materiał został pomyślnie przesłany');
      }

      // Resetuj formularz
      setTitle('');
      setSelectedFile(null);
      setSelectedStudent('');
      setSelectedStudentLabel('');
      setSelectAllStudents(false);
      if (document.getElementById('file-input') instanceof HTMLInputElement) {
        (document.getElementById('file-input') as HTMLInputElement).value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Błąd podczas przesyłania materiału');
      console.error('Błąd przesyłania materiału:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="material-upload-container">
      <h2>Przypisz materiał PDF do ucznia</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit} className="material-upload-form">
        <div className="form-group">
          <label htmlFor="title">Tytuł:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Wprowadź tytuł materiału"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="student">Uczeń:</label>
          <div className="student-search-dropdown" ref={dropdownRef}>
            <div className="student-search-input-container">
              <input
                type="text"
                id="student-search"
                placeholder="Wyszukaj ucznia..."
                value={selectedStudentLabel || searchTerm}
                onClick={() => setDropdownOpen(true)}
                onChange={handleSearchChange}
                autoComplete="off"
              />
              {selectedStudentLabel && (
                <button 
                  type="button" 
                  className="clear-selection" 
                  onClick={() => {
                    setSelectedStudent('');
                    setSelectedStudentLabel('');
                    setSearchTerm('');
                    setSelectAllStudents(false);
                  }}
                >
                  ×
                </button>
              )}
            </div>
            {dropdownOpen && (
              <ul className="student-search-results">
                <li 
                  className="student-option select-all-option"
                  onClick={handleSelectAllStudents}
                >
                  <div className="student-option-info">
                    <span className="student-name">Wszyscy uczniowie</span>
                    <span className="student-email">Wyślij do wszystkich zatwierdzonych uczniów</span>
                  </div>
                </li>
                <li className="divider"></li>
                {filteredStudents.length === 0 ? (
                  <li className="no-results">Brak pasujących wyników</li>
                ) : (
                  filteredStudents.map(student => (
                    <li 
                      key={student.id} 
                      onClick={() => handleStudentSelect(student)}
                      className="student-option"
                    >
                      <div className="student-option-info">
                        <span className="student-name">{student.name} {student.surname}</span>
                        <span className="student-email">{student.email}</span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
            <input 
              type="hidden" 
              id="student" 
              name="student" 
              value={selectedStudent} 
              required 
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="file-input">Plik PDF:</label>
          <input
            type="file"
            id="file-input"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          {selectedFile && (
            <div className="selected-file">
              Wybrany: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="upload-button"
          disabled={loading}
        >
          {loading ? 'Przesyłanie...' : 'Prześlij materiał'}
        </button>
      </form>
    </div>
  );
};

export default MaterialUpload; 