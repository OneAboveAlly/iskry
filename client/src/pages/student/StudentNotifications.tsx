import React from 'react';
import NotificationsCenter from '../../components/NotificationsCenter';
import '../../styles/StudentNotifications.css';

const StudentNotifications: React.FC = () => {
  return (
    <div className="student-notifications-page">
      <div className="student-notifications-header">
        <h1>Powiadomienia</h1>
        <p>Tutaj znajdziesz wszystkie powiadomienia dotyczące Twojego konta. Kliknij w powiadomienie, aby przejść do szczegółów.</p>
      </div>
      <div className="student-notifications-content">
        <NotificationsCenter />
      </div>
    </div>
  );
};

export default StudentNotifications; 