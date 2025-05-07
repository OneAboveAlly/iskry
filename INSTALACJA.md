# 🚀 Instrukcja instalacji PostgreSQL

## 📋 Wymagania wstępne
- System Windows 10 lub nowszy
- Minimum 2GB wolnego miejsca na dysku
- Uprawnienia administratora

## 🔧 Krok po kroku

### 1️⃣ Pobieranie PostgreSQL
1. Wejdź na oficjalną stronę PostgreSQL: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Kliknij przycisk "Download the installer"
3. Wybierz najnowszą wersję PostgreSQL (np. 16.x)
4. Wybierz wersję odpowiednią dla Twojego systemu (najczęściej Windows x86-64)

### 2️⃣ Instalacja PostgreSQL
1. Uruchom pobrany plik instalacyjny
2. Gdy pojawi się kreator instalacji:
   - Kliknij "Next"
   - Wybierz folder instalacyjny (zalecany domyślny: `C:\Program Files\PostgreSQL\16`)
   - Zaznacz wszystkie komponenty
   - Ustaw hasło dla użytkownika `postgres`
   - Ustaw domyślny port (5432)
   - Wybierz domyślną lokalizację (Polish)

### 3️⃣ Po instalacji
1. Sprawdź, czy PostgreSQL został zainstalowany:
   - Otwórz menu Start
   - Wyszukaj "pgAdmin 4"
   - Jeśli program się uruchomi, instalacja przebiegła pomyślnie

### ⚠️ Rozwiązywanie problemów

#### Jeśli aplikacja nie może znaleźć PostgreSQL:
1. Sprawdź, czy ścieżka do PostgreSQL jest poprawna:
   - Domyślnie: `C:\Program Files\PostgreSQL\16\bin`
   - Upewnij się, że w tym folderze znajduje się plik `psql.exe`

2. Jeśli zainstalowałeś PostgreSQL w innej lokalizacji:
   - Znajdź folder instalacyjny PostgreSQL
   - Przejdź do podfolderu `bin`
   - Skopiuj pełną ścieżkę z paska adresu
   - Wklej ścieżkę w pole w aplikacji

#### Jeśli nie możesz się połączyć z bazą danych:
1. Sprawdź, czy usługa PostgreSQL jest uruchomiona:
   - Naciśnij `Win + R`
   - Wpisz `services.msc`
   - Znajdź "postgresql-x64-16" (lub podobną nazwę)
   - Status powinien być "Uruchomiony"
   - Jeśli nie, kliknij prawym przyciskiem i wybierz "Uruchom"

2. Sprawdź dane logowania:
   - Użytkownik: `postgres`
   - Hasło: to, które ustawiłeś podczas instalacji
   - Port: 5432 (domyślny)

## 🆘 Potrzebujesz pomocy?
- Dokumentacja PostgreSQL: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- Oficjalne forum: [https://www.postgresql.org/list/](https://www.postgresql.org/list/)
- Stack Overflow: [https://stackoverflow.com/questions/tagged/postgresql](https://stackoverflow.com/questions/tagged/postgresql)

## ✅ Co dalej?
Po pomyślnej instalacji PostgreSQL możesz wrócić do aplikacji i kontynuować proces konfiguracji. Aplikacja automatycznie wykryje zainstalowaną wersję PostgreSQL i pomoże Ci skonfigurować bazę danych. 