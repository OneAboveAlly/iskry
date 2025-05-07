import React from 'react';

interface InstallationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallationGuideModal: React.FC<InstallationGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-2xl leading-6 font-medium text-gray-900 mb-4">
                  Instrukcja instalacji PostgreSQL
                </h3>
                <div className="mt-2 prose max-w-none">
                  <h4 className="text-lg font-semibold mb-2">📋 Wymagania wstępne</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li>System Windows 10 lub nowszy</li>
                    <li>Minimum 2GB wolnego miejsca na dysku</li>
                    <li>Uprawnienia administratora</li>
                  </ul>

                  <h4 className="text-lg font-semibold mb-2">🔧 Krok po kroku</h4>
                  
                  <h5 className="font-semibold mb-2">1️⃣ Pobieranie PostgreSQL</h5>
                  <ol className="list-decimal pl-5 mb-4">
                    <li>Wejdź na oficjalną stronę PostgreSQL: <a href="https://www.postgresql.org/download/windows/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">https://www.postgresql.org/download/windows/</a></li>
                    <li>Kliknij przycisk "Download the installer"</li>
                    <li>Wybierz najnowszą wersję PostgreSQL (np. 17.x)</li>
                    <li>Wybierz wersję odpowiednią dla Twojego systemu (najczęściej Windows x86-64)</li>
                  </ol>

                  <h5 className="font-semibold mb-2">2️⃣ Instalacja PostgreSQL</h5>
                  <ol className="list-decimal pl-5 mb-4">
                    <li>Uruchom pobrany plik instalacyjny</li>
                    <li>Gdy pojawi się kreator instalacji:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Kliknij "Next"</li>
                        <li>Wybierz folder instalacyjny (zalecany domyślny: `C:\Program Files\PostgreSQL\17`)</li>
                        <li>Zaznacz wszystkie komponenty</li>
                        <li>Ustaw hasło dla użytkownika `postgres`</li>
                        <li>Ustaw domyślny port (5432)</li>
                        <li>Wybierz domyślną lokalizację (Polish)</li>
                      </ul>
                    </li>
                  </ol>

                  <h5 className="font-semibold mb-2">3️⃣ Po instalacji</h5>
                  <ol className="list-decimal pl-5 mb-4">
                    <li>Sprawdź, czy PostgreSQL został zainstalowany:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Otwórz menu Start</li>
                        <li>Wyszukaj "pgAdmin 4"</li>
                        <li>Jeśli program się uruchomi, instalacja przebiegła pomyślnie</li>
                      </ul>
                    </li>
                  </ol>

                  <h4 className="text-lg font-semibold mb-2">⚠️ Rozwiązywanie problemów</h4>
                  
                  <h5 className="font-semibold mb-2">Jeśli aplikacja nie może znaleźć PostgreSQL:</h5>
                  <ol className="list-decimal pl-5 mb-4">
                    <li>Sprawdź, czy ścieżka do PostgreSQL jest poprawna:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Domyślnie: `C:\Program Files\PostgreSQL\17\bin`</li>
                        <li>Upewnij się, że w tym folderze znajduje się plik `psql.exe`</li>
                      </ul>
                    </li>
                    <li>Jeśli zainstalowałeś PostgreSQL w innej lokalizacji:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Znajdź folder instalacyjny PostgreSQL</li>
                        <li>Przejdź do podfolderu `bin`</li>
                        <li>Skopiuj pełną ścieżkę z paska adresu</li>
                        <li>Wklej ścieżkę w pole w aplikacji</li>
                      </ul>
                    </li>
                  </ol>

                  <h5 className="font-semibold mb-2">Jeśli nie możesz się połączyć z bazą danych:</h5>
                  <ol className="list-decimal pl-5 mb-4">
                    <li>Sprawdź, czy usługa PostgreSQL jest uruchomiona:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Naciśnij `Win + R`</li>
                        <li>Wpisz `services.msc`</li>
                        <li>Znajdź "postgresql-x64-17" (lub podobną nazwę)</li>
                        <li>Status powinien być "Uruchomiony"</li>
                        <li>Jeśli nie, kliknij prawym przyciskiem i wybierz "Uruchom"</li>
                      </ul>
                    </li>
                    <li>Sprawdź dane logowania:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Użytkownik: `postgres`</li>
                        <li>Hasło: to, które ustawiłeś podczas instalacji</li>
                        <li>Port: 5432 (domyślny)</li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallationGuideModal; 