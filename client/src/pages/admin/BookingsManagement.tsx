import React, { useState, useEffect } from 'react';
import '../../styles/AdminTables.css';
import '../../styles/UrgentRequests.css';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
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
  endTime: string;
  status: 'booked' | 'cancelled';
  user: User;
  reservationType?: ReservationType;
}

interface UrgentRequest {
  id: number;
  userId: number;
  message: string;
  status: 'pending' | 'confirmed' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  user: User;
}

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const RejectionModal: React.FC<RejectionModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
    setReason(''); // Reset for next time
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="rejection-modal">
        <h3>Podaj powód odrzucenia</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rejectionReason">Powód:</label>
            <textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Proszę podać powód odrzucenia prośby..."
              rows={4}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="confirm-button">
              Odrzuć prośbę
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BookingsManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [urgentRequestsTab, setUrgentRequestsTab] = useState<'pending' | 'handled'>('pending');
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch both bookings and urgent requests
      const [bookingsResponse, urgentRequestsResponse] = await Promise.all([
        fetch('http://localhost:3001/api/bookings'),
        fetch('http://localhost:3001/api/urgent-request')
      ]);
      
      if (!bookingsResponse.ok) {
        throw new Error('Nie udało się pobrać rezerwacji');
      }
      
      if (!urgentRequestsResponse.ok) {
        throw new Error('Nie udało się pobrać pilnych próśb');
      }
      
      const bookingsData = await bookingsResponse.json();
      const urgentRequestsData = await urgentRequestsResponse.json();
      
      setBookings(bookingsData);
      setUrgentRequests(urgentRequestsData);
    } catch (err) {
      setError('Wystąpił błąd podczas pobierania danych');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się anulować rezerwacji');
      }

      // Odśwież listę rezerwacji
      fetchData();
    } catch (err) {
      setError('Wystąpił błąd podczas anulowania rezerwacji');
      console.error(err);
    }
  };

  // Handle urgent request status change (confirm or reject)
  const handleUrgentRequestStatus = async (id: number, status: 'confirmed' | 'rejected', rejectionReason?: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/urgent-request/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          ...(rejectionReason && { rejectionReason })
        }),
      });

      if (!response.ok) {
        throw new Error(`Nie udało się ${status === 'confirmed' ? 'potwierdzić' : 'odrzucić'} pilnej prośby`);
      }

      // Refresh data
      fetchData();
    } catch (err) {
      setError('Wystąpił błąd podczas aktualizacji pilnej prośby');
      console.error(err);
    }
  };

  const handleRejectClick = (id: number) => {
    setSelectedRequestId(id);
    setRejectionModalOpen(true);
  };

  const handleConfirmRejection = (reason: string) => {
    if (selectedRequestId !== null) {
      handleUrgentRequestStatus(selectedRequestId, 'rejected', reason);
      setRejectionModalOpen(false);
      setSelectedRequestId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filter bookings based on the selected tab
  const now = new Date();
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.dateTime);
    return selectedTab === 'upcoming' 
      ? bookingDate >= now && booking.status === 'booked'
      : bookingDate < now || booking.status === 'cancelled';
  });

  // Filter urgent requests based on tab
  const pendingUrgentRequests = urgentRequests.filter(request => request.status === 'pending');
  const handledUrgentRequests = urgentRequests.filter(request => request.status === 'confirmed' || request.status === 'rejected');

  if (loading) {
    return <div className="loading">Ładowanie danych...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-page">
      <h1>Zarządzanie rezerwacjami</h1>

      {/* Urgent Requests Section */}
      <div className="urgent-requests-section">
        <h2>Pilne prośby o spotkanie</h2>
        
        <div className="urgent-request-tabs">
          <button 
            className={`urgent-tab-button ${urgentRequestsTab === 'pending' ? 'active' : ''}`}
            onClick={() => setUrgentRequestsTab('pending')}
          >
            Oczekujące ({pendingUrgentRequests.length})
          </button>
          <button 
            className={`urgent-tab-button ${urgentRequestsTab === 'handled' ? 'active' : ''}`}
            onClick={() => setUrgentRequestsTab('handled')}
          >
            Obsłużone ({handledUrgentRequests.length})
          </button>
        </div>

        {urgentRequestsTab === 'pending' ? (
          pendingUrgentRequests.length > 0 ? (
            <div className="urgent-requests-list">
              {pendingUrgentRequests.map(request => (
                <div key={request.id} className="urgent-request-card">
                  <div className="urgent-request-header">
                    <span className="urgent-label">PILNE</span>
                    <span className="urgent-date">{formatDate(request.createdAt)}</span>
                  </div>
                  <div className="urgent-request-body">
                    <div className="urgent-request-user">
                      <strong>{request.user.name} {request.user.surname}</strong>
                      <span>{request.user.email}</span>
                    </div>
                    <p className="urgent-request-message">{request.message}</p>
                  </div>
                  <div className="urgent-request-actions">
                    <button 
                      className="urgent-confirm-button"
                      onClick={() => handleUrgentRequestStatus(request.id, 'confirmed')}
                    >
                      Potwierdź
                    </button>
                    <button 
                      className="urgent-reject-button"
                      onClick={() => handleRejectClick(request.id)}
                    >
                      Odrzuć
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Brak oczekujących pilnych próśb</p>
          )
        ) : (
          handledUrgentRequests.length > 0 ? (
            <div className="urgent-requests-list">
              {handledUrgentRequests.map(request => (
                <div key={request.id} className={`urgent-request-card ${request.status === 'rejected' ? 'rejected' : 'confirmed'}`}>
                  <div className="urgent-request-header">
                    <span className={`urgent-label ${request.status === 'rejected' ? 'rejected' : 'confirmed'}`}>
                      {request.status === 'rejected' ? 'ODRZUCONO' : 'POTWIERDZONO'}
                    </span>
                    <span className="urgent-date">{formatDate(request.createdAt)}</span>
                  </div>
                  <div className="urgent-request-body">
                    <div className="urgent-request-user">
                      <strong>{request.user.name} {request.user.surname}</strong>
                      <span>{request.user.email}</span>
                    </div>
                    <p className="urgent-request-message">{request.message}</p>
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div className="rejection-reason">
                        <h4>Powód odrzucenia:</h4>
                        <p>{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Brak obsłużonych pilnych próśb</p>
          )
        )}
      </div>

      {/* Regular Bookings Section */}
      <div className="regular-bookings-section">
        <div className="tabs">
          <button 
            className={`tab-button ${selectedTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setSelectedTab('upcoming')}
          >
            Nadchodzące rezerwacje
          </button>
          <button 
            className={`tab-button ${selectedTab === 'past' ? 'active' : ''}`}
            onClick={() => setSelectedTab('past')}
          >
            Przeszłe / Anulowane
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="no-records">Brak rezerwacji do wyświetlenia</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data i godzina</th>
                  <th>Koniec</th>
                  <th>Uczeń</th>
                  <th>Typ spotkania</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className={booking.status === 'cancelled' ? 'cancelled-row' : ''}>
                    <td>{formatDate(booking.dateTime)}</td>
                    <td>{formatDate(booking.endTime)}</td>
                    <td>{booking.user ? `${booking.user.name} ${booking.user.surname}` : `Użytkownik #${booking.userId}`}</td>
                    <td>
                      {booking.reservationType 
                        ? `${booking.reservationType.name} (${booking.reservationType.duration} min)` 
                        : 'Standardowa konsultacja'}
                    </td>
                    <td>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status === 'booked' ? 'Zarezerwowane' : 'Anulowane'}
                      </span>
                    </td>
                    <td>
                      {booking.status === 'booked' && new Date(booking.dateTime) > new Date() && (
                        <button 
                          className="cancel-button" 
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Anuluj
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Rejection Reason Modal */}
      <RejectionModal 
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleConfirmRejection}
      />
    </div>
  );
};

export default BookingsManagement; 