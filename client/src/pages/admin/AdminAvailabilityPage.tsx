import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { pl } from 'date-fns/locale/pl';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import "../../styles/Admin.css"; // Poprawiona ścieżka do pliku stylów

// Rejestracja polskiej lokalizacji
registerLocale('pl', pl);

// Interfejs dla typu rezerwacji
interface ReservationType {
  id: number;
  name: string;
  duration: number;
  description?: string;
}

const AdminAvailabilityPage: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [fromHour, setFromHour] = useState('09:00');
  const [toHour, setToHour] = useState('15:00');
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Stan dla typów rezerwacji
  const [reservationTypes, setReservationTypes] = useState<ReservationType[]>([]);
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDuration, setNewTypeDuration] = useState(60); // domyślnie 1h (60 min)
  const [newTypeDescription, setNewTypeDescription] = useState('');
  
  // Stan dla edycji typu rezerwacji
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDuration, setEditTypeDuration] = useState(60);
  const [editTypeDescription, setEditTypeDescription] = useState('');

  // Dodajemy stan do śledzenia aktualnego miesiąca
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Dodajemy nowy stan dla zaznaczonych dostępności do usunięcia
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<number[]>([]);

  // Dodajmy stan do obsługi widoczności modalu potwierdzenia
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const [maxBookingsPerUser, setMaxBookingsPerUser] = useState<number | null>(null);
  const [loadingMaxBookings, setLoadingMaxBookings] = useState(true);

  useEffect(() => {
    fetchAvailabilities();
    fetchReservationTypes();
    fetchAdminAvailability();
    fetchMaxBookingsPerUser();
  }, []);

  useEffect(() => {
    console.log('Aktualny miesiąc:', currentMonth);
  }, [currentMonth]);

  const fetchAvailabilities = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/availability');
      const data = await res.json();
      setAvailabilities(data);
    } catch (err) {
      setError('Błąd pobierania dostępności');
    } finally {
      setLoading(false);
    }
  };
  
  // Pobieranie typów rezerwacji
  const fetchReservationTypes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/reservation-types');
      if (res.ok) {
        const data = await res.json();
        setReservationTypes(data);
      } else {
        console.error('Błąd pobierania typów rezerwacji');
      }
    } catch (err) {
      console.error('Błąd pobierania typów rezerwacji', err);
    }
  };
  
  // Dodawanie nowego typu rezerwacji
  const handleAddReservationType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/reservation-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTypeName,
          duration: newTypeDuration,
          description: newTypeDescription || undefined
        })
      });
      
      if (res.ok) {
        const newType = await res.json();
        setReservationTypes([...reservationTypes, newType]);
        setNewTypeName('');
        setNewTypeDuration(60);
        setNewTypeDescription('');
        setShowAddTypeForm(false);
        setSuccess('Typ rezerwacji dodany!');
      } else {
        setError('Nie udało się dodać typu rezerwacji');
      }
    } catch (err) {
      setError('Błąd dodawania typu rezerwacji');
    }
  };
  
  // Funkcja rozpoczynająca edycję typu rezerwacji
  const startEditingType = (type: ReservationType) => {
    setEditingTypeId(type.id);
    setEditTypeName(type.name);
    setEditTypeDuration(type.duration);
    setEditTypeDescription(type.description || '');
  };
  
  // Anulowanie edycji
  const cancelEditing = () => {
    setEditingTypeId(null);
    setEditTypeName('');
    setEditTypeDuration(60);
    setEditTypeDescription('');
  };
  
  // Aktualizacja typu rezerwacji
  const handleUpdateReservationType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTypeId === null) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/reservation-types/${editingTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTypeName,
          duration: editTypeDuration,
          description: editTypeDescription || undefined
        })
      });
      
      if (res.ok) {
        const updatedType = await res.json();
        setReservationTypes(reservationTypes.map(type => 
          type.id === editingTypeId ? updatedType : type
        ));
        setEditingTypeId(null);
        setSuccess('Typ rezerwacji zaktualizowany!');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Nie udało się zaktualizować typu rezerwacji');
      }
    } catch (err) {
      setError('Błąd aktualizacji typu rezerwacji');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedDays.length) {
      setError('Wybierz przynajmniej jeden dzień!');
      return;
    }
    try {
      // adminId = 1 (do poprawy na dynamiczne z auth)
      const days = selectedDays.map(date => {
        // Tworzymy znormalizowaną datę bez przesunięcia związanego ze strefą czasową
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      
      console.log('Wybrane dni do wysłania:', selectedDays.map(d => d.toISOString()));
      console.log('Dni po normalizacji:', days);

      // Sprawdź istniejące dostępności, aby uniknąć duplikatów
      const existingDays = availabilities.map(a => {
        const availDate = new Date(a.date);
        const year = availDate.getFullYear();
        const month = String(availDate.getMonth() + 1).padStart(2, '0');
        const day = String(availDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      
      console.log('Istniejące dni:', existingDays);
      
      const newDays = days.filter(day => !existingDays.includes(day));
      console.log('Nowe dni do dodania:', newDays);

      if (newDays.length === 0) {
        setError('Wybrane dni są już dodane do dostępności!');
        return;
      }
      
      const res = await fetch('http://localhost:3001/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: 1,
          days: newDays,
          fromHour,
          toHour
        })
      });
      if (!res.ok) throw new Error('Błąd dodawania dostępności');
      
      setSuccess(`Dostępność dodana dla ${newDays.length} dni!`);
      setSelectedDays([]); // Wyczyść wybrane dni po dodaniu
      await fetchAvailabilities(); // Odśwież listę
    } catch (err) {
      setError('Błąd dodawania dostępności');
      console.error(err);
    }
  };

  // Formatowanie daty do wyświetlenia
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL');
  };

  // Dodawanie i usuwanie dat
  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    
    // Sprawdź czy data jest już wybrana
    const dateExists = selectedDays.some(d => 
      d.getFullYear() === date.getFullYear() && 
      d.getMonth() === date.getMonth() && 
      d.getDate() === date.getDate()
    );
    
    if (dateExists) {
      // Jeśli data już istnieje, usuń ją
      setSelectedDays(selectedDays.filter(d => 
        !(d.getFullYear() === date.getFullYear() && 
          d.getMonth() === date.getMonth() && 
          d.getDate() === date.getDate())
      ));
    } else {
      // Jeśli nie istnieje, dodaj ją
      setSelectedDays(prevDays => [...prevDays, date]);
    }
  };

  // Dodajemy funkcję obsługującą zmianę miesiąca
  const handleMonthChange = (date: Date) => {
    console.log('Zmiana miesiąca na:', date);
    setCurrentMonth(date);
  };

  // Dodaj funkcję pomocniczą do formatowania dat
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // sortuj i filtruj dostępności do przyszłych dat
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const futureAvailabilities = availabilities
    .filter(a => {
      const availabilityDate = new Date(a.date);
      return availabilityDate >= now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Klasy dla wybranych dat
  const getTileClassName = ({ date, view }: { date: Date; view: string }): string => {
    if (view !== 'month') return '';
    
    const dateStr = formatDateToYYYYMMDD(date);
    
    // Sprawdź czy data jest już wybrana
    const isSelected = selectedDays.some(selectedDate => 
      formatDateToYYYYMMDD(selectedDate) === dateStr
    );
    
    // Sprawdź czy data jest już dostępna
    const isAvailable = availabilities.some(a => {
      const availabilityDate = new Date(a.date);
      return formatDateToYYYYMMDD(availabilityDate) === dateStr;
    });
    
    if (isSelected) return 'selected-day';
    if (isAvailable) return 'available-day';
    return '';
  };

  const handleDateClick = (value: Date | null) => {
    if (!value) return;
    
    const date = value;
    console.log(`Kliknięto datę: ${date.toISOString()}`);
    
    // Znormalizuj datę do porównania, używając tylko roku, miesiąca i dnia
    const clickedDateStr = formatDateToYYYYMMDD(date);
    
    // Sprawdź czy data jest już wybrana
    const isSelected = selectedDays.some(selectedDate => 
      formatDateToYYYYMMDD(selectedDate) === clickedDateStr
    );
    
    console.log(`Data ${clickedDateStr} jest ${isSelected ? 'już wybrana' : 'nie wybrana'}`);

    if (isSelected) {
      // Usuń datę z wybranych
      setSelectedDays(selectedDays.filter(selectedDate => 
        formatDateToYYYYMMDD(selectedDate) !== clickedDateStr
      ));
    } else {
      // Dodaj nową datę (znormalizowaną)
      const newDate = new Date(date);
      // Ustawienie godziny na 12 w południe, aby uniknąć problemów z przesunięciem strefy czasowej
      newDate.setHours(12, 0, 0, 0);
      console.log(`Dodawanie daty: ${newDate.toISOString()}`);
      setSelectedDays([...selectedDays, newDate]);
    }
  };

  const fetchAdminAvailability = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/availability');
      if (res.ok) {
        const data = await res.json();
        // Nie ustawiamy już tych dat jako wybranych, 
        // tylko aktualizujemy stan availabilities
        setAvailabilities(data);
      } else {
        console.error('Błąd pobierania dostępności admina');
      }
    } catch (err) {
      console.error('Błąd pobierania dostępności admina', err);
    }
  };

  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      setCurrentMonth(activeStartDate);
    }
  };

  // Dodajemy funkcję zaznaczającą/odznaczającą dostępność
  const handleSelectAvailability = (id: number) => {
    setSelectedAvailabilities(prev => {
      if (prev.includes(id)) {
        return prev.filter(availId => availId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Zmodyfikujmy funkcję usuwania wielu dostępności
  const handleDeleteMultipleAvailabilities = async () => {
    if (selectedAvailabilities.length === 0) {
      return;
    }

    // Zamiast natychmiastowego usuwania, pokazujemy modal
    setShowConfirmationModal(true);
  };

  // Dodajmy nową funkcję, która będzie wykonywana po potwierdzeniu
  const confirmDeleteMultipleAvailabilities = async () => {
    try {
      // Usuwamy każdą zaznaczoną dostępność po kolei
      const results = await Promise.allSettled(
        selectedAvailabilities.map(id => 
          fetch(`http://localhost:3001/api/availability/${id}`, {
            method: 'DELETE',
          })
        )
      );
      
      // Sprawdzamy rezultaty
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (failed > 0) {
        setError(`Nie udało się usunąć ${failed} dostępności. Sprawdź czy nie mają rezerwacji.`);
      }
      
      if (succeeded > 0) {
        setSuccess(`Pomyślnie usunięto ${succeeded} dostępności.`);
      }
      
      // Odświeżamy listę
      await fetchAvailabilities();
      // Czyścimy zaznaczenia
      setSelectedAvailabilities([]);
      // Zamykamy modal
      setShowConfirmationModal(false);
    } catch (err) {
      setError('Wystąpił błąd podczas usuwania dostępności');
      console.error(err);
      setShowConfirmationModal(false);
    }
  };

  // Dodaj funkcję do usuwania dostępności
  const handleDeleteAvailability = async (id: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę dostępność?')) {
      try {
        const res = await fetch(`http://localhost:3001/api/availability/${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          // Usuń usunięty dzień z kalendarza, jeśli był wybrany
          const deletedAvailability = availabilities.find(a => a.id === id);
          if (deletedAvailability) {
            const deletedDate = new Date(deletedAvailability.date);
            // Usuń z wybranych dni, jeśli był wybrany
            setSelectedDays(prevSelectedDays => 
              prevSelectedDays.filter(day => 
                day.toDateString() !== deletedDate.toDateString()
              )
            );
          }
          
          setSuccess('Dostępność została usunięta!');
          // Zaktualizuj listę dostępności po usunięciu
          await fetchAvailabilities();
        } else {
          // Pobierz informację o błędzie z odpowiedzi serwera
          const errorData = await res.json();
          setError(errorData.error || 'Nie udało się usunąć dostępności');
        }
      } catch (err) {
        setError('Błąd podczas usuwania dostępności');
        console.error(err);
      }
    }
  };

  const fetchMaxBookingsPerUser = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/max-bookings-per-user');
      if (res.ok) {
        const data = await res.json();
        setMaxBookingsPerUser(data.maxBookingsPerUser);
      }
    } catch (err) {
      console.error('Błąd pobierania limitu rezerwacji:', err);
    } finally {
      setLoadingMaxBookings(false);
    }
  };

  const handleUpdateMaxBookings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/max-bookings-per-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxBookingsPerUser })
      });
      
      if (res.ok) {
        setSuccess('Limit rezerwacji został zaktualizowany');
      } else {
        setError('Nie udało się zaktualizować limitu rezerwacji');
      }
    } catch (err) {
      setError('Błąd aktualizacji limitu rezerwacji');
    }
  };

  return (
    <div className="admin-availability-page" style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: 24 }}>Ustaw dostępność</h1>
      
      {/* Nowa sekcja - Limit rezerwacji */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Limit rezerwacji</h2>
        <form onSubmit={handleUpdateMaxBookings}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Maksymalna liczba rezerwacji na użytkownika:
              <input
                type="number"
                value={maxBookingsPerUser || ''}
                onChange={(e) => setMaxBookingsPerUser(e.target.value ? Number(e.target.value) : null)}
                min="0"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', marginTop: 8 }}
                placeholder="Wprowadź liczbę (0 = brak limitu)"
              />
            </label>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: 8 }}>
              Ustawienie limitu rezerwacji pozwala kontrolować, ile przyszłych rezerwacji może mieć jednocześnie jeden użytkownik.
              Wartość 0 oznacza brak limitu.
            </p>
          </div>
          <button
            type="submit"
            style={{ padding: '8px 16px', backgroundColor: '#3a506b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Zapisz limit
          </button>
        </form>
      </div>
      
      {/* Sekcja typów rezerwacji */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Typy rezerwacji</h2>
        
        {/* Lista typów rezerwacji */}
        {reservationTypes.length === 0 ? (
          <p style={{ color: '#888', marginBottom: 16 }}>Brak zdefiniowanych typów rezerwacji.</p>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Nazwa</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Czas trwania</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Opis</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px' }}>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {reservationTypes.map(type => (
                  <React.Fragment key={type.id}>
                    {editingTypeId === type.id ? (
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <td colSpan={4} style={{ padding: '12px' }}>
                          <form onSubmit={handleUpdateReservationType}>
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ display: 'block', marginBottom: 4 }}>Nazwa</label>
                              <input 
                                type="text" 
                                value={editTypeName} 
                                onChange={e => setEditTypeName(e.target.value)} 
                                required 
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
                              />
                            </div>
                            
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ display: 'block', marginBottom: 4 }}>Czas trwania (min)</label>
                              <input 
                                type="number" 
                                value={editTypeDuration} 
                                onChange={e => setEditTypeDuration(Number(e.target.value))} 
                                min="15" 
                                step="15" 
                                required 
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
                              />
                            </div>
                            
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ display: 'block', marginBottom: 4 }}>Opis (opcjonalnie)</label>
                              <textarea 
                                value={editTypeDescription} 
                                onChange={e => setEditTypeDescription(e.target.value)} 
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', resize: 'vertical' }}
                                rows={2}
                              ></textarea>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                              <button 
                                type="button" 
                                onClick={cancelEditing} 
                                style={{ padding: '8px 16px', backgroundColor: '#f1f1f1', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                              >
                                Anuluj
                              </button>
                              <button 
                                type="submit" 
                                style={{ padding: '8px 16px', backgroundColor: '#3a506b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                              >
                                Zapisz zmiany
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px' }}>{type.name}</td>
                        <td style={{ padding: '8px 12px' }}>{type.duration} min</td>
                        <td style={{ padding: '8px 12px' }}>{type.description || '-'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => startEditingType(type)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#3a506b',
                              marginRight: '8px'
                            }}
                            title="Edytuj"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Przycisk "Dodaj typ" lub formularz dodawania */}
        {showAddTypeForm ? (
          <form onSubmit={handleAddReservationType} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Nazwa</label>
              <input 
                type="text" 
                value={newTypeName} 
                onChange={e => setNewTypeName(e.target.value)} 
                required 
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Czas trwania (min)</label>
              <input 
                type="number" 
                value={newTypeDuration} 
                onChange={e => setNewTypeDuration(Number(e.target.value))} 
                min="15" 
                step="15" 
                required 
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Opis (opcjonalnie)</label>
              <textarea 
                value={newTypeDescription} 
                onChange={e => setNewTypeDescription(e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', resize: 'vertical' }}
                rows={2}
              ></textarea>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="submit" 
                style={{ padding: '8px 16px', backgroundColor: '#3a506b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Zapisz
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddTypeForm(false)} 
                style={{ padding: '8px 16px', backgroundColor: '#f1f1f1', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Anuluj
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setShowAddTypeForm(true)} 
            style={{ padding: '8px 16px', backgroundColor: '#3a506b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Dodaj nowy typ rezerwacji
          </button>
        )}
      </div>
      
      {/* Formularz dodawania dostępności - istniejący kod */}
      <form onSubmit={handleSubmit} className="availability-form" style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 32 }}>
        <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>
          Wybierz dni:
          <div style={{ marginBottom: 20 }}>
            <Calendar
              onClickDay={handleDateClick}
              value={null} 
              locale="pl-PL"
              minDate={new Date()}
              tileClassName={getTileClassName}
              onActiveStartDateChange={handleActiveStartDateChange}
            />
          </div>
        </label>
        {selectedDays.length > 0 && (
          <div style={{ margin: '12px 0 18px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedDays.map((date, idx) => (
              <span key={idx} style={{ background: '#e6f7fa', color: '#3a506b', borderRadius: 4, padding: '3px 10px', fontSize: 15 }}>
                {formatDate(date)}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <label style={{ flex: 1 }}>
            Od godziny:
            <input type="time" value={fromHour} onChange={e => setFromHour(e.target.value)} required style={{ width: '100%' }} />
          </label>
          <label style={{ flex: 1 }}>
            Do godziny:
            <input type="time" value={toHour} onChange={e => setToHour(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <button type="submit" style={{ marginTop: '1.5rem', padding: '0.7rem 1.5rem', fontSize: 17, background: '#3a506b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Dodaj dostępność</button>
      </form>
      
      {error && <div className="error" style={{ color: '#dc3545', marginBottom: 12 }}>{error}</div>}
      {success && <div className="success" style={{ color: '#28a745', marginBottom: 12 }}>{success}</div>}
      
      {/* Lista dostępności */}
      <div className="availability-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Lista dostępności</h2>
          
          <div>
            {selectedAvailabilities.length > 0 && (
              <button
                onClick={handleDeleteMultipleAvailabilities}
                className="delete-multiple-button"
              >
                Usuń zaznaczone ({selectedAvailabilities.length})
              </button>
            )}
          </div>
        </div>
        
        {futureAvailabilities.length === 0 ? (
          <p style={{ color: '#888' }}>Brak ustawionych dostępności.</p>
        ) : (
          <div className="scroll-container">
            <ul>
              {futureAvailabilities.map(a => {
                const availabilityDate = new Date(a.date);
                const isSelected = selectedAvailabilities.includes(a.id);
                
                // Wyświetl datę i godziny w czytelnym formacie
                return (
                  <li 
                    key={a.id} 
                    className={isSelected ? 'selected' : ''}
                    style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectAvailability(a.id)}
                        style={{ marginRight: 12, width: 18, height: 18 }}
                      />
                      <div>
                        <strong style={{ fontSize: '1.05rem' }}>
                          {availabilityDate.toLocaleDateString('pl-PL', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </strong>
                        <div style={{ marginTop: 4, color: '#4a5568' }}>
                          Godziny: {a.fromHour} - {a.toHour}
                        </div>
                        <div style={{ marginTop: 4, fontSize: '0.85rem', color: '#718096' }}>
                          ID: {a.id}, Format lokalny: {formatDateToYYYYMMDD(availabilityDate)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAvailability(a.id)}
                      className="delete-availability-btn"
                    >
                      Usuń
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      
      {/* Modal potwierdzający usunięcie */}
      {showConfirmationModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Potwierdź usunięcie</h3>
              <button className="close-button" onClick={() => setShowConfirmationModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                Czy na pewno chcesz usunąć zaznaczone dostępności ({selectedAvailabilities.length})?
              </p>
              <div style={{ fontSize: '0.9rem', color: '#718096', backgroundColor: '#f7fafc', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Usunięcie spowoduje:</p>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Brak możliwości rezerwacji tych terminów przez uczniów</li>
                  <li>Trwałe usunięcie tych terminów z kalendarza</li>
                </ul>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#e53e3e' }}>
                Uwaga: Nie można usunąć terminów, które już mają rezerwacje.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowConfirmationModal(false)}
              >
                Anuluj
              </button>
              <button
                className="confirm-delete-button"
                onClick={confirmDeleteMultipleAvailabilities}
              >
                Usuń zaznaczone terminy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAvailabilityPage;