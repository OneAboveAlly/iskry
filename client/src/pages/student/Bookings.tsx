import React from 'react';
import BookingCalendar from '../../components/BookingCalendar';
import '../../styles/Bookings.css';

const Bookings: React.FC = () => {
  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <h1>Rezerwacje</h1>
        <p>Wybierz dostępny termin lub wyślij pilną prośbę o spotkanie</p>
      </div>
      
      <div className="bookings-content">
        <BookingCalendar />
      </div>
    </div>
  );
};

export default Bookings; 