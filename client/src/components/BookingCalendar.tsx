import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../context/AuthContext';
import '../styles/BookingCalendar.css';

interface Availability {
  id: number;
  date: string;
  fromHour: string;
  toHour: string;
}

interface ReservationType {
  id: number;
  name: string;
  duration: number;
  description?: string;
}

interface Booking {
  id: number;
  userId: number;
  dateTime: string;
  status: 'booked' | 'cancelled';
  reservationType?: ReservationType;
}

interface UrgentRequest {
  id: number;
  userId: number;
  message: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

const BookingCalendar: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reservationTypes, setReservationTypes] = useState<ReservationType[]>([]);
  const [selectedReservationType, setSelectedReservationType] = useState<number | null>(null);
  const [urgentRequest, setUrgentRequest] = useState<UrgentRequest | null>(null);
  const [showUrgentRequestModal, setShowUrgentRequestModal] = useState(false);
  const [urgentRequestMessage, setUrgentRequestMessage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<Booking | null>(null);
  const [maxBookingsPerUser, setMaxBookingsPerUser] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
    fetchMaxBookingsPerUser();
    
    // Ustaw interwał, który będzie odświeżał dane co 30 sekund
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);
    
    // Wyczyść interwał po odmontowaniu komponentu
    return () => clearInterval(intervalId);
  }, []);
  
  // Dodaj efekt, który odświeża dane po zmianie daty
  useEffect(() => {
    // Jeśli data się zmieniła, odśwież dane
    fetchData();
  }, [date]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [availabilitiesRes, bookingsRes, urgentRequestRes, reservationTypesRes] = await Promise.all([
        fetch('http://localhost:3001/api/availability'),
        fetch('http://localhost:3001/api/bookings'),
        fetch(`http://localhost:3001/api/urgent-request${user?.id ? `?userId=${user.id}` : ''}`),
        fetch('http://localhost:3001/api/reservation-types')
      ]);

      if (!availabilitiesRes.ok || !bookingsRes.ok || !urgentRequestRes.ok || !reservationTypesRes.ok) {
        throw new Error('Nie udało się pobrać danych');
      }

      const [availabilitiesData, bookingsData, urgentRequestData, reservationTypesData] = await Promise.all([
        availabilitiesRes.json(),
        bookingsRes.json(),
        urgentRequestRes.json(),
        reservationTypesRes.json()
      ]);

      // Loguj raw data dla diagnozy
      console.log('Raw availabilities from API:', availabilitiesData);

      // Filtruj przeszłe dostępności
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Ustawia czas na początek dnia
      
      // Konwertuj wszystkie daty na obiekty Date i normalizuj je 
      const futureAvailabilities = availabilitiesData.filter((availability: Availability) => {
        // Tworzymy lokalne obiekty Date (bez przesunięcia UTC)
        const [year, month, day] = availability.date.split('T')[0].split('-').map(Number);
        const availabilityDate = new Date(year, month - 1, day);
        return availabilityDate >= now;
      }).map((availability: Availability) => {
        // Upewniamy się, że data jest w formacie lokalnym
        const [year, month, day] = availability.date.split('T')[0].split('-').map(Number);
        const formattedDate = new Date(year, month - 1, day).toISOString();
        
        // Logowanie każdej przetworzonej dostępności
        console.log(`Processing availability: original date=${availability.date}, year=${year}, month=${month}, day=${day}, formatted=${formattedDate}, with hours=${availability.fromHour}-${availability.toHour}`);
        
        return {
          ...availability,
          date: formattedDate
        };
      });

      console.log('Processed availabilities:', futureAvailabilities);

      setAvailabilities(futureAvailabilities);
      setBookings(bookingsData);
      setUrgentRequest(urgentRequestData);
      setReservationTypes(reservationTypesData);
      
      // Set default reservation type if available
      if (reservationTypesData.length > 0 && !selectedReservationType) {
        setSelectedReservationType(reservationTypesData[0].id);
      }
      
      // Wyświetl komunikat o sukcesie
      console.log('Dane zostały pomyślnie zaktualizowane:', {
        dostępności: futureAvailabilities.length,
        rezerwacje: bookingsData.length,
        typyRezerwacji: reservationTypesData.length
      });
      
    } catch (err) {
      setError('Wystąpił błąd podczas pobierania danych');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
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
    }
  };

  const handleDateChange = (newDate: Date | Date[]) => {
    if (newDate instanceof Date) {
      console.log(`Date changed to: ${newDate.toISOString()}`);
      
      // Utwórz nową instancję daty bez czasu, aby uniknąć problemów ze strefą czasową
      const year = newDate.getFullYear();
      const month = newDate.getMonth();
      const day = newDate.getDate();
      const normalizedDate = new Date(year, month, day, 12, 0, 0); // Ustawiamy godzinę na 12, aby uniknąć problemów z przejściem dnia
      
      console.log(`Normalized date: ${normalizedDate.toISOString()}`);
      setDate(normalizedDate);
    }
  };

  const openBookingModal = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    if (!selectedTimeSlot) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateTime: selectedTimeSlot,
          userId: user?.id,
          reservationTypeId: selectedReservationType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się zarezerwować terminu');
      }

      setSuccessMessage('Rezerwacja została przyjęta!');
      setTimeout(() => setSuccessMessage(null), 5000);
      setShowBookingModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas rezerwacji');
      console.error('Error booking:', err);
    }
  };

  const handleUrgentRequest = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/urgent-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: urgentRequestMessage,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się wysłać pilnej prośby');
      }

      setShowUrgentRequestModal(false);
      setUrgentRequestMessage('');
      await fetchData();
    } catch (err) {
      setError('Wystąpił błąd podczas wysyłania prośby');
      console.error('Error sending urgent request:', err);
    }
  };

  const getAvailableTimeSlots = (selectedDate: Date) => {
    // Funkcja pomocnicza do normalizacji daty (tylko rok, miesiąc, dzień)
    const normalizeDate = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    // Znormalizowana data wybrana przez użytkownika
    const normalizedSelectedDate = normalizeDate(selectedDate);
    console.log(`[getAvailableTimeSlots] Looking for slots on date: ${normalizedSelectedDate}, original selected date: ${selectedDate.toISOString()}`);

    // Znajdź dostępność dla wybranego dnia
    const foundAvailabilities = availabilities.filter(a => {
      const availDate = new Date(a.date);
      const normalizedAvailDate = normalizeDate(availDate);
      const isMatch = normalizedAvailDate === normalizedSelectedDate;
      console.log(`[getAvailableTimeSlots] Checking availability: ${a.date}, normalized: ${normalizedAvailDate}, matches selected: ${isMatch ? 'YES' : 'NO'}`);
      console.log(`[getAvailableTimeSlots] Hours set by admin: ${a.fromHour} - ${a.toHour}`);
      return isMatch;
    });
    
    console.log(`[getAvailableTimeSlots] Found ${foundAvailabilities.length} matching availabilities for ${normalizedSelectedDate}`);
    
    if (foundAvailabilities.length === 0) return [];
    
    // Weźmy pierwszy pasujący wpis dostępności (jeśli jest ich kilka, co nie powinno się zdarzyć)
    const dayAvailability = foundAvailabilities[0];
    console.log(`[getAvailableTimeSlots] Selected availability: ID=${dayAvailability.id}, date=${dayAvailability.date}, hours=${dayAvailability.fromHour}-${dayAvailability.toHour}`);
    
    // Parsujemy dokładne godziny ustawione przez administratora
    const [fromHour, fromMinute] = dayAvailability.fromHour.split(':').map(Number);
    const [toHour, toMinute] = dayAvailability.toHour.split(':').map(Number);
    
    // Używamy wybranej daty, ale z dokładnymi godzinami
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    console.log(`[getAvailableTimeSlots] Creating time slots for ${year}-${month+1}-${day} from ${fromHour}:${fromMinute} to ${toHour}:${toMinute}`);
    
    // Tworzymy obiekty Date dla początku i końca przedziału czasowego
    let currentTime = new Date(year, month, day, fromHour, fromMinute, 0);
    const endTime = new Date(year, month, day, toHour, toMinute, 0);

    // Sprawdzanie aktualnego czasu (aby nie pokazywać minionych terminów)
    const now = new Date();
    
    // Interwał czasowy w minutach (30 minut)
    const timeInterval = 30;

    // Funkcja pomocnicza do formatowania daty dla debugowania
    const formatDateTimeForLog = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    console.log(`[getAvailableTimeSlots] Current time: ${formatDateTimeForLog(currentTime)}, End time: ${formatDateTimeForLog(endTime)}`);

    // Tablica na wygenerowane sloty
    const slots = [];

    // Generuj sloty co 30 minut, od godziny początkowej do końcowej
    while (currentTime < endTime) {
      // Stwórz kopię czasu aby uniknąć modyfikowania oryginału
      const slotDate = new Date(currentTime.getTime());
      
      // Tworzymy poprawny format ISO dla API, zachowując lokalną strefę czasową
      const timeISOStr = slotDate.toISOString();
      
      console.log(`[getAvailableTimeSlots] Generated slot: ${formatDateTimeForLog(slotDate)} -> ${timeISOStr}`);
      
      // Jeśli wybrany dzień to dzisiaj i czas slotu już minął, przejdź do następnego
      if (normalizeDate(selectedDate) === normalizeDate(now) && slotDate < now) {
        console.log(`[getAvailableTimeSlots] Skipping past slot: ${formatDateTimeForLog(slotDate)}`);
        currentTime.setMinutes(currentTime.getMinutes() + timeInterval);
        continue;
      }
      
      // Sprawdź czy slot jest już zarezerwowany
      const isBooked = bookings.some(b => {
        if (b.status !== 'booked') return false;
        
        const bookingDateTime = new Date(b.dateTime);
        const bookingEndTime = new Date(bookingDateTime);
        
        // Oblicz czas zakończenia rezerwacji na podstawie czasu trwania typu rezerwacji
        const duration = b.reservationType?.duration || 60;
        bookingEndTime.setMinutes(bookingEndTime.getMinutes() + duration);
        
        // Slot jest zajęty jeśli zaczyna się w trakcie istniejącej rezerwacji
        // lub jeśli rezerwacja zaczyna się podczas tego slotu
        const slotEndTime = new Date(slotDate);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + timeInterval);
        
        const isOverlapping = (
          (slotDate >= bookingDateTime && slotDate < bookingEndTime) || // Slot zaczyna się podczas rezerwacji
          (bookingDateTime >= slotDate && bookingDateTime < slotEndTime) // Rezerwacja zaczyna się podczas slotu
        );
        
        if (isOverlapping) {
          console.log(`[getAvailableTimeSlots] Slot ${formatDateTimeForLog(slotDate)} is already booked by reservation ID=${b.id}`);
        }
        
        return isOverlapping;
      });
      
      // Jeśli slot nie jest zarezerwowany, dodaj go do listy dostępnych slotów
      if (!isBooked) {
        slots.push(timeISOStr);
        console.log(`[getAvailableTimeSlots] Added available slot: ${formatDateTimeForLog(slotDate)}`);
      }
      
      // Przejdź do następnego slotu czasowego
      currentTime.setMinutes(currentTime.getMinutes() + timeInterval);
    }

    console.log(`[getAvailableTimeSlots] Generated ${slots.length} available slots for ${normalizedSelectedDate}`);
    return slots;
  };

  // Funkcja pomocnicza do normalizacji daty, używana w całym komponencie
  const normalizeDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Wyciągnij listę dostępnych dni w znormalizowanym formacie
  const availableDays = availabilities.map(a => {
    const availDate = new Date(a.date);
    return normalizeDate(availDate);
  });

  const handleCancelBooking = async () => {
    if (!selectedBookingToCancel) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${selectedBookingToCancel.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!response.ok) {
        throw new Error('Nie udało się odwołać rezerwacji');
      }

      setSuccessMessage('Rezerwacja została odwołana!');
      setTimeout(() => setSuccessMessage(null), 5000);
      setShowCancelModal(false);
      setSelectedBookingToCancel(null);
      await fetchData();
    } catch (err) {
      setError('Wystąpił błąd podczas odwoływania rezerwacji');
      console.error('Error cancelling booking:', err);
    }
  };

  const openCancelModal = (booking: Booking) => {
    setSelectedBookingToCancel(booking);
    setShowCancelModal(true);
  };

  if (loading) {
    return <div className="loading">Ładowanie...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="booking-calendar">
      {successMessage && (
        <div className="success-message" style={{ 
          backgroundColor: '#dff0d8', 
          color: '#3c763d', 
          padding: '10px 15px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px 15px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {/* Wyświetl informację o limicie rezerwacji */}
      {maxBookingsPerUser !== null && maxBookingsPerUser > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px 15px',
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid #ddd'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Maksymalna liczba aktywnych rezerwacji: <strong>{maxBookingsPerUser}</strong>
          </p>
        </div>
      )}

      <div className="calendar-section">
        <h2>Wybierz termin</h2>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <strong>Wybrany dzień: {date.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </div>
        <Calendar
          onChange={(value) => {
            if (value instanceof Date) {
              handleDateChange(value);
            }
          }}
          value={date}
          minDate={new Date()}
          tileDisabled={({ date }) => {
            // Normalizuj datę z kalendarza
            const normalizedTileDate = normalizeDate(date);
            
            // Sprawdź czy znormalizowana data jest w liście dostępnych dni
            return !availableDays.includes(normalizedTileDate);
          }}
          tileClassName={({ date: tileDate }) => {
            // Normalizuj datę z kalendarza
            const normalizedTileDate = normalizeDate(tileDate);
            
            // Sprawdź czy data jest dzisiaj
            const today = new Date();
            const isToday = normalizeDate(tileDate) === normalizeDate(today);
            
            // Sprawdź czy data jest wybrana przez użytkownika
            const isSelected = normalizeDate(tileDate) === normalizeDate(date);
            
            // Dodaj odpowiednią klasę
            if (availableDays.includes(normalizedTileDate)) {
              if (isToday) return 'calendar-available-day calendar-today';
              if (isSelected) return 'calendar-available-day calendar-selected';
              return 'calendar-available-day';
            }
            return isToday ? 'calendar-today' : '';
          }}
          formatShortWeekday={(locale, date) => ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'][date.getDay()]}
          formatMonthYear={(locale, date) => {
            const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
            return `${months[date.getMonth()]} ${date.getFullYear()}`;
          }}
        />
      </div>

      <div className="time-slots-section">
        <h3>Dostępne godziny</h3>
        {getAvailableTimeSlots(date).length === 0 ? (
          <div style={{ color: '#888', fontSize: 15, padding: 8 }}>Brak dostępnych godzin w tym dniu</div>
        ) : (
          <>
            <div style={{ marginBottom: 15, fontSize: 14, color: '#666', backgroundColor: '#f5f5f5', padding: 10, borderRadius: 5 }}>
              Terminarz dla dnia: {date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="time-slots">
              {getAvailableTimeSlots(date).map((slot) => {
                const slotDate = new Date(slot);
                // Formatuj pojedynczą godzinę
                const timeStr = slotDate.toLocaleTimeString('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                
                // Sprawdź czy slot jest już zarezerwowany
                const existingBooking = bookings.find(b => {
                  if (b.status !== 'booked') return false;
                  const bookingDate = new Date(b.dateTime);
                  return bookingDate.getTime() === slotDate.getTime();
                });
                
                return (
                  <div key={slot} className="time-slot-container">
                    {existingBooking ? (
                      <button
                        className="time-slot booked"
                        disabled
                        title={`Zarezerwowane przez ${existingBooking.userId}`}
                      >
                        {timeStr} (Zarezerwowane)
                      </button>
                    ) : (
                      <button
                        className="time-slot"
                        onClick={() => openBookingModal(slot)}
                        title={`Zarezerwuj termin ${timeStr}`}
                      >
                        {timeStr}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="urgent-request-section">
        <h3>Pilna prośba o spotkanie</h3>
        {urgentRequest ? (
          <div className="urgent-request-status">
            <p>Status: {
              urgentRequest.status === 'pending' ? 'Oczekująca' : 
              urgentRequest.status === 'confirmed' ? 'Potwierdzona' : 'Odrzucona'
            }</p>
            <p>Wiadomość: {urgentRequest.message}</p>
          </div>
        ) : (
          <button
            className="urgent-request-button"
            onClick={() => setShowUrgentRequestModal(true)}
          >
            Wyślij pilną prośbę
          </button>
        )}
      </div>

      {showBookingModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Potwierdź rezerwację</h3>
            {selectedTimeSlot && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                    Termin: {new Date(selectedTimeSlot).toLocaleDateString('pl-PL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p style={{ margin: '0 0 5px 0' }}>
                    Godzina: <strong>
                      {new Date(selectedTimeSlot).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </strong>
                  </p>
                </div>
                
                <div style={{ marginBottom: '15px', borderTop: '1px solid #eee', paddingTop: 15 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                    Wybierz typ spotkania:
                  </label>
                  <select 
                    value={selectedReservationType || ''} 
                    onChange={(e) => setSelectedReservationType(Number(e.target.value))}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  >
                    {reservationTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.duration} min){type.description ? ` - ${type.description}` : ''}
                      </option>
                    ))}
                  </select>
                  
                  {selectedReservationType && (
                    <div style={{ 
                      marginTop: 10, 
                      backgroundColor: '#f8f9fa', 
                      padding: 10, 
                      borderRadius: 4, 
                      fontSize: 14 
                    }}>
                      <p style={{ margin: '0 0 5px 0' }}>
                        <strong>Czas trwania:</strong> {reservationTypes.find(t => t.id === selectedReservationType)?.duration || 60} minut
                      </p>
                      {reservationTypes.find(t => t.id === selectedReservationType)?.description && (
                        <p style={{ margin: 0 }}>
                          <strong>Opis:</strong> {reservationTypes.find(t => t.id === selectedReservationType)?.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="modal-buttons">
              <button onClick={handleBooking}>Potwierdź</button>
              <button onClick={() => setShowBookingModal(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {showUrgentRequestModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Pilna prośba o spotkanie</h3>
            <textarea
              value={urgentRequestMessage}
              onChange={(e) => setUrgentRequestMessage(e.target.value)}
              placeholder="Opisz swoją prośbę..."
              rows={4}
            />
            <div className="modal-buttons">
              <button onClick={handleUrgentRequest}>Wyślij</button>
              <button onClick={() => setShowUrgentRequestModal(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedBookingToCancel && (
        <div className="modal">
          <div className="modal-content">
            <h3>Odwołaj rezerwację</h3>
            <p>Czy na pewno chcesz odwołać rezerwację na godzinę {new Date(selectedBookingToCancel.dateTime).toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}?</p>
            <div className="modal-buttons">
              <button onClick={handleCancelBooking}>Potwierdź odwołanie</button>
              <button onClick={() => {
                setShowCancelModal(false);
                setSelectedBookingToCancel(null);
              }}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      <div className="my-bookings-section">
        <h3>Moje rezerwacje</h3>
        {bookings.filter(b => b.userId === user?.id && b.status === 'booked').length === 0 ? (
          <div style={{ color: '#888', fontSize: 15, padding: 8 }}>Brak aktywnych rezerwacji</div>
        ) : (
          <ul className="my-bookings-list">
            {bookings.filter(b => b.userId === user?.id && b.status === 'booked').map(booking => (
              <li key={booking.id} className="my-booking-item">
                <span>
                  {new Date(booking.dateTime).toLocaleDateString('pl-PL', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                  , godz. {new Date(booking.dateTime).toLocaleTimeString('pl-PL', {
                    hour: '2-digit', minute: '2-digit', hour12: false
                  })}
                  {booking.reservationType ? ` (${booking.reservationType.name})` : ''}
                </span>
                <button
                  className="cancel-booking-btn"
                  onClick={() => openCancelModal(booking)}
                  style={{ marginLeft: 15 }}
                >
                  Odwołaj
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BookingCalendar; 