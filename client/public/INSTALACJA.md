# Instrukcja instalacji PostgreSQL i konfiguracji bazy danych

## 1. Instalacja PostgreSQL

1. Pobierz instalator PostgreSQL:
   - Wejdź na stronę: https://www.postgresql.org/download/windows/
   - Kliknij "Download the installer"
   - Wybierz najnowszą wersję (np. PostgreSQL 17)

2. Uruchom instalator:
   - Kliknij "Next"
   - Wybierz katalog instalacji (domyślnie: C:\Program Files\PostgreSQL\17)
   - Wybierz komponenty do instalacji (zostaw domyślne)
   - Wybierz katalog danych (domyślnie: C:\Program Files\PostgreSQL\17\data)
   - Ustaw hasło dla użytkownika postgres (ZAPAMIĘTAJ TO HASŁO!)
   - Wybierz port (domyślnie: 5432)
   - Zakończ instalację

## 2. Konfiguracja bazy danych

1. Otwórz pgAdmin 4:
   - Znajdź w menu Start "pgAdmin 4"
   - Przy pierwszym uruchomieniu podaj hasło, które ustawiłeś podczas instalacji

2. Utwórz nową bazę danych:
   - W drzewie po lewej stronie rozwiń "Servers"
   - Rozwiń "PostgreSQL 17"
   - Kliknij prawym przyciskiem myszy na "Databases"
   - Wybierz "Create" -> "Database"
   - W polu "Database" wpisz nazwę bazy (np. "iskrzacy")
   - Kliknij "Save"

## 3. Instalacja aplikacji

1. Uruchom aplikację i przejdź do strony instalacji

2. W formularzu instalacyjnym podaj:
   - Nazwa bazy danych: nazwa, którą utworzyłeś w pgAdmin (np. "iskrzacy")
   - Użytkownik bazy danych: postgres
   - Hasło bazy danych: hasło, które ustawiłeś podczas instalacji PostgreSQL
   - Email administratora: twój email
   - Hasło administratora: hasło do konta admina
   - Imię administratora: twoje imię
   - Nazwisko administratora: twoje nazwisko

3. Kliknij "Zainstaluj"

## Rozwiązywanie problemów

1. Jeśli pojawi się błąd "template database has a collation version mismatch":
   - Otwórz pgAdmin 4
   - Kliknij na "Query Tool" (ikonka z kartką i ołówkiem)
   - Wpisz i wykonaj: `ALTER DATABASE template1 REFRESH COLLATION VERSION;`
   - Spróbuj ponownie zainstalować aplikację

2. Jeśli pojawi się błąd z uprawnieniami:
   - Znajdź plik generate-prisma.bat w katalogu server
   - Kliknij prawym przyciskiem myszy i wybierz "Uruchom jako administrator"
   - Poczekaj na zakończenie procesu
   - Spróbuj ponownie zainstalować aplikację

## Pomoc

Jeśli masz problemy z instalacją:
1. Sprawdź, czy PostgreSQL jest uruchomiony (w Services powinien być status "Running")
2. Sprawdź, czy możesz się zalogować do pgAdmin 4
3. Sprawdź, czy baza danych została utworzona
4. Jeśli potrzebujesz pomocy, skontaktuj się z administratorem 