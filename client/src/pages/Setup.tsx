import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstallationGuideModal from '../components/InstallationGuideModal';

interface SetupForm {
  dbName: string;
  dbUser: string;
  dbPassword: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  adminSurname: string;
  configureEmail: boolean;
  emailHost: string;
  emailPort: string;
  emailSecure: boolean;
  emailUser: string;
  emailPassword: string;
  emailFrom: string;
  frontendUrl: string;
  domain: string;
  enableSSL: boolean;
  serverPort: string;
}

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [postgresStatus, setPostgresStatus] = useState<'checking' | 'installed' | 'not_installed' | 'verifying'>('checking');
  const [postgresPath, setPostgresPath] = useState('');
  const [postgresVersion, setPostgresVersion] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [waitingForConnection, setWaitingForConnection] = useState(false);
  
  const [formData, setFormData] = useState<SetupForm>({
    dbName: 'duchowosc_szkola',
    dbUser: 'postgres',
    dbPassword: '',
    adminEmail: '',
    adminPassword: '',
    adminName: '',
    adminSurname: '',
    configureEmail: false,
    emailHost: 'smtp.gmail.com',
    emailPort: '587',
    emailSecure: false,
    emailUser: '',
    emailPassword: '',
    emailFrom: '',
    frontendUrl: 'http://localhost:5173',
    domain: '',
    enableSSL: false,
    serverPort: '3000'
  });

  // Sprawdź status instalacji przy ładowaniu komponentu
  React.useEffect(() => {
    const checkInstallation = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/check-installation');
        const data = await response.json();
        
        if (data.isInstalled) {
          // Jeśli system jest już zainstalowany, przekieruj do logowania
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking installation status:', error);
      }
    };

    checkInstallation();
  }, [navigate]);

  React.useEffect(() => {
    const checkPostgres = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/check-postgres');
        const data = await response.json();
        if (data.isInstalled) {
          setPostgresStatus('installed');
          setPostgresPath(data.path);
          setPostgresVersion(data.version);
        } else {
          setPostgresStatus('not_installed');
        }
      } catch (error) {
        setPostgresStatus('not_installed');
      }
    };

    checkPostgres();
  }, []);

  const verifyConnection = async () => {
    setConnectionStatus('checking');
    setError(''); // Czyścimy błędy przy próbie połączenia
    setWaitingForConnection(true);
    
    try {
      console.log('=== Starting connection verification ===');
      console.log('Verifying connection with:', {
        path: postgresPath,
        user: formData.dbUser,
        password: formData.dbPassword,
        database: formData.dbName
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://localhost:3001/api/verify-postgres-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: postgresPath,
          user: formData.dbUser,
          password: formData.dbPassword,
          database: formData.dbName
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Got response:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      setConnectionStatus(data.connected ? 'connected' : 'failed');
      if (!data.connected && data.error) {
        setError(data.error);
      } else {
        setError(''); // Czyścimy błędy przy pomyślnym połączeniu
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('failed');
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Przekroczono czas oczekiwania na odpowiedź serwera');
        } else {
          setError('Nie można połączyć się z serwerem aplikacji: ' + error.message);
        }
      } else {
        setError('Nie można połączyć się z serwerem aplikacji');
      }
    } finally {
      setWaitingForConnection(false);
    }
  };

  const handlePathChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setPostgresPath(path);
    setPostgresStatus('verifying');
    
    try {
      const response = await fetch('http://localhost:3001/api/verify-postgres-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });
      const data = await response.json();
      if (data.valid) {
        setPostgresStatus('installed');
        setPostgresVersion(data.version);
      } else {
        setPostgresStatus('not_installed');
      }
    } catch (error) {
      setPostgresStatus('not_installed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });

    // Automatycznie uzupełnij emailFrom, jeśli nie jest ustawiony a emailUser jest
    if (e.target.name === 'emailUser' && !formData.emailFrom) {
      setFormData(prev => ({
        ...prev,
        emailFrom: e.target.value
      }));
    }

    // Automatycznie ustaw emailUser na adminEmail, jeśli adminEmail się zmienił i emailUser nie był jeszcze ustawiony
    if (e.target.name === 'adminEmail' && !formData.emailUser) {
      setFormData(prev => ({
        ...prev,
        emailUser: e.target.value
      }));
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateStep = () => {
    if (currentStep === 7) {
      return true;
    }
    
    switch (currentStep) {
      case 0:
        return postgresStatus === 'installed' && postgresPath !== '';
      case 1:
        return formData.dbName && formData.dbUser && formData.dbPassword;
      case 2:
        return connectionStatus === 'connected';
      case 3:
        return (
          formData.adminEmail &&
          validateEmail(formData.adminEmail) &&
          formData.adminPassword &&
          formData.adminPassword.length >= 8
        );
      case 4:
        return formData.adminName && formData.adminSurname;
      case 5:
        if (!formData.configureEmail) return true;
        return (
          formData.emailHost &&
          formData.emailPort &&
          formData.emailUser &&
          validateEmail(formData.emailUser) &&
          formData.emailPassword &&
          formData.emailFrom &&
          validateEmail(formData.emailFrom)
        );
      case 6:
        return !formData.enableSSL || (formData.enableSSL && formData.domain);
      default:
        return false;
    }
  };

  const handleNext = async () => {
    // Sprawdź czy trwa już sprawdzanie połączenia
    if (waitingForConnection) return;
    
    // Różne zachowania dla różnych kroków
    switch (currentStep) {
      case 0: // Weryfikacja PostgreSQL -> Konfiguracja bazy danych
        setCurrentStep(1);
        break;
        
      case 1: // Konfiguracja bazy danych -> Sprawdzanie połączenia
        // Przejdź do kroku 2 (sprawdzenie połączenia)
        setCurrentStep(2);
        // Automatycznie rozpocznij sprawdzanie połączenia po przejściu do kroku 2
        setTimeout(() => {
          verifyConnection();
        }, 100);
        break;
        
      case 2: // Sprawdzanie połączenia -> Konto administratora
        // Tylko jeśli połączenie zostało pomyślnie nawiązane
        if (connectionStatus === 'connected') {
          setCurrentStep(3);
        } else if (connectionStatus === 'failed') {
          // Ponowne sprawdzenie, jeśli poprzednie nie powiodło się
          verifyConnection();
        }
        break;
        
      case 3: // Konto administratora -> Dane osobowe administratora
        setCurrentStep(4);
        break;
        
      case 4: // Dane osobowe administratora -> Konfiguracja email lub Konfiguracja hostingu
        if (formData.configureEmail) {
          setCurrentStep(5); // Przejdź do konfiguracji email
        } else {
          setCurrentStep(6); // Przejdź do konfiguracji hostingu
        }
        break;
        
      case 5: // Konfiguracja email -> Konfiguracja hostingu
        setCurrentStep(6);
        break;
        
      case 6: // Konfiguracja hostingu -> Podsumowanie
        setCurrentStep(7);
        break;
        
      case 7: // Podsumowanie - nic nie rób, czekaj na kliknięcie "Zainstaluj"
        // Nie przechodzimy nigdzie po kliknięciu "Dalej" na kroku podsumowania
        break;
        
      default:
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3001/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dbName: formData.dbName,
          dbUser: formData.dbUser,
          dbPassword: formData.dbPassword,
          postgresPath: postgresPath,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          adminName: formData.adminName,
          adminSurname: formData.adminSurname,
          configureEmail: formData.configureEmail,
          emailHost: formData.emailHost,
          emailPort: formData.emailPort,
          emailSecure: formData.emailSecure,
          emailUser: formData.emailUser,
          emailPassword: formData.emailPassword,
          emailFrom: formData.emailFrom,
          frontendUrl: formData.frontendUrl,
          domain: formData.domain,
          enableSSL: formData.enableSSL,
          serverPort: formData.serverPort
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Wystąpił błąd podczas instalacji');
      }

      setSuccess('Instalacja zakończona pomyślnie! Odświeżanie strony...');
      
      // Wyłącz wszystkie przyciski
      setIsLoading(true);
      
      // Przekieruj po 2 sekundach
      setTimeout(() => {
        window.location.reload();
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Weryfikacja PostgreSQL</h2>
            {postgresStatus === 'checking' && (
              <div className="text-yellow-600">Sprawdzanie instalacji PostgreSQL...</div>
            )}
            {postgresStatus === 'verifying' && (
              <div className="text-yellow-600">Weryfikacja ścieżki PostgreSQL...</div>
            )}
            {postgresStatus === 'not_installed' && (
              <div className="space-y-4">
                <div className="text-red-600">
                  PostgreSQL nie jest zainstalowany lub nie jest dostępny w systemie.
                </div>
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Instrukcja instalacji PostgreSQL:</h3>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Otwórz instrukcję instalacji
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ścieżka do katalogu bin PostgreSQL (np. C:\Program Files\PostgreSQL\17\bin)
                  </label>
                  <input
                    type="text"
                    value={postgresPath}
                    onChange={handlePathChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Wprowadź ścieżkę do katalogu bin PostgreSQL"
                  />
                </div>
              </div>
            )}
            {postgresStatus === 'installed' && (
              <div className="text-green-600">
                PostgreSQL {postgresVersion} jest zainstalowany w: {postgresPath}
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Konfiguracja bazy danych</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa bazy danych
              </label>
              <input
                type="text"
                name="dbName"
                value={formData.dbName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Wprowadź nazwę bazy danych"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Użytkownik bazy danych
              </label>
              <input
                type="text"
                name="dbUser"
                value={formData.dbUser}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasło do bazy danych
              </label>
              <input
                type="password"
                name="dbPassword"
                value={formData.dbPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Sprawdzanie połączenia z bazą danych</h2>
            {connectionStatus === 'checking' && (
              <div className="flex items-center text-yellow-600">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Trwa sprawdzanie połączenia z bazą danych...
              </div>
            )}
            {connectionStatus === 'connected' && (
              <div className="text-green-600">
                Połączenie z bazą danych zostało ustanowione pomyślnie!
              </div>
            )}
            {connectionStatus === 'failed' && (
              <div className="text-red-600">
                <div>{error || 'Nie udało się połączyć z bazą danych'}</div>
                <button
                  onClick={verifyConnection}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Spróbuj ponownie
                </button>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Konto administratora</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Wprowadź adres email administratora"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hasło</label>
              <input
                type="password"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Minimum 8 znaków"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Dane osobowe administratora</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Imię</label>
              <input
                type="text"
                name="adminName"
                value={formData.adminName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Wprowadź imię"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nazwisko</label>
              <input
                type="text"
                name="adminSurname"
                value={formData.adminSurname}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Wprowadź nazwisko"
              />
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <input
                  id="configureEmail"
                  name="configureEmail"
                  type="checkbox"
                  checked={formData.configureEmail}
                  onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement>)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="configureEmail" className="ml-2 block text-sm text-gray-900">
                  Skonfiguruj serwer email (wymagane do funkcji resetowania hasła)
                </label>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Konfiguracja serwera email</h2>
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <p className="text-sm text-blue-800">
                Konfiguracja serwera email jest potrzebna do funkcji resetowania hasła. 
                Jeśli korzystasz z Gmail, użyj <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">hasła do aplikacji</a>.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Serwer SMTP</label>
              <input
                type="text"
                name="emailHost"
                value={formData.emailHost}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="np. smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port SMTP</label>
              <input
                type="text"
                name="emailPort"
                value={formData.emailPort}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="np. 587"
              />
            </div>
            <div className="flex items-center">
              <input
                id="emailSecure"
                name="emailSecure"
                type="checkbox"
                checked={formData.emailSecure}
                onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement>)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="emailSecure" className="ml-2 block text-sm text-gray-900">
                Używaj SSL/TLS
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email użytkownika</label>
              <input
                type="email"
                name="emailUser"
                value={formData.emailUser}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Twój adres email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hasło</label>
              <input
                type="password"
                name="emailPassword"
                value={formData.emailPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Hasło do konta email (dla Gmail użyj hasła aplikacji)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email nadawcy</label>
              <input
                type="email"
                name="emailFrom"
                value={formData.emailFrom}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Adres email widoczny jako nadawca"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL frontendu</label>
              <input
                type="text"
                name="frontendUrl"
                value={formData.frontendUrl}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="np. http://localhost:5173"
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Konfiguracja hostingu</h2>
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <p className="text-sm text-blue-800">
                Poniższe ustawienia są opcjonalne, ale zalecane dla konfiguracji produkcyjnej.
                Konfiguracja SSL wymaga posiadania własnej domeny i dostępu do serwera.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nazwa domeny lub adres IP</label>
              <input
                type="text"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="np. iskrzacy.pl lub 123.45.67.89"
              />
              <p className="mt-1 text-xs text-gray-500">
                Podaj nazwę domeny lub adres IP serwera, na którym będzie działać aplikacja
              </p>
            </div>
            <div className="flex items-center mt-4">
              <input
                id="enableSSL"
                name="enableSSL"
                type="checkbox"
                checked={formData.enableSSL}
                onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement>)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="enableSSL" className="ml-2 block text-sm text-gray-900">
                Włącz HTTPS (SSL/TLS)
              </label>
            </div>
            {formData.enableSSL && (
              <div className="bg-yellow-50 p-4 rounded-md mt-2">
                <p className="text-sm text-yellow-700">
                  <strong>Uwaga:</strong> Włączenie HTTPS wymaga dodatkowej konfiguracji na serwerze.
                  Certyfikat SSL zostanie automatycznie wygenerowany za pomocą Let's Encrypt
                  po uruchomieniu aplikacji na serwerze.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mt-4">Port serwera</label>
              <input
                type="text"
                name="serverPort"
                value={formData.serverPort}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="np. 3000"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Podsumowanie instalacji</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Baza danych</h3>
              <p><span className="font-medium">Nazwa:</span> {formData.dbName}</p>
              <p><span className="font-medium">Użytkownik:</span> {formData.dbUser}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Administrator</h3>
              <p><span className="font-medium">Email:</span> {formData.adminEmail}</p>
              <p><span className="font-medium">Imię i nazwisko:</span> {formData.adminName} {formData.adminSurname}</p>
            </div>
            
            {formData.configureEmail && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Konfiguracja email</h3>
                <p><span className="font-medium">Serwer SMTP:</span> {formData.emailHost}:{formData.emailPort}</p>
                <p><span className="font-medium">Email:</span> {formData.emailUser}</p>
                <p><span className="font-medium">SSL/TLS:</span> {formData.emailSecure ? 'Tak' : 'Nie'}</p>
              </div>
            )}
            
            {(formData.domain || formData.enableSSL) && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Konfiguracja hostingu</h3>
                {formData.domain && <p><span className="font-medium">Domena:</span> {formData.domain}</p>}
                <p><span className="font-medium">HTTPS (SSL):</span> {formData.enableSSL ? 'Włączone' : 'Wyłączone'}</p>
                <p><span className="font-medium">Port serwera:</span> {formData.serverPort}</p>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                Kliknij przycisk "Zainstaluj", aby zakończyć proces instalacji. 
                {formData.configureEmail 
                  ? ' Funkcja resetowania hasła będzie aktywna.'
                  : ' Funkcja resetowania hasła będzie dostępna tylko w trybie deweloperskim (linki w konsoli).'}
                {formData.enableSSL 
                  ? ' Po instalacji konfiguracja HTTPS wymaga dodatkowych kroków na serwerze (szczegóły w pliku DEPLOYMENT.md).' 
                  : ''}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Instalacja Aplikacji
        </h1>
        <div className="mt-4 text-center text-gray-600">
          Krok {currentStep + 1} z 8
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {renderStep()}

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {success && (
              <div className="text-green-600 text-sm">{success}</div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0 || isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Wstecz
              </button>
              {currentStep === 7 ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Instalacja...' : 'Zainstaluj'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Dalej
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <InstallationGuideModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Setup; 