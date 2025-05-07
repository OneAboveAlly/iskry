# Instrukcja obsługi funkcji resetowania hasła

## Opis funkcjonalności

Zaimplementowaliśmy funkcjonalność resetowania hasła, która działa w następujący sposób:

1. Użytkownik klika "Zapomniałeś hasła?" na stronie logowania
2. Użytkownik podaje swój adres email
3. System sprawdza, czy email istnieje w bazie danych
4. Jeśli email istnieje, generowany jest unikalny token resetowania hasła
5. W trybie produkcyjnym: System wysyła email z linkiem do resetowania hasła
   W trybie deweloperskim: System wyświetla link w konsoli serwera
6. Użytkownik klika link w emailu (lub kopiuje z konsoli w trybie deweloperskim)
7. Użytkownik wypełnia formularz z nowym hasłem
8. Nowe hasło zostaje zapisane w bazie danych

## Konfiguracja podczas instalacji

Podczas instalacji aplikacji, skrypt instalacyjny zapyta o konfigurację wysyłania emaili.
Jeśli wybierzesz opcję konfiguracji, zostaniesz poproszony o:

1. Adres serwera SMTP (np. smtp.gmail.com)
2. Port serwera SMTP (zazwyczaj 587)
3. Czy używać połączenia SSL/TLS
4. Nazwa użytkownika (adres email do wysyłki)
5. Hasło do konta email (dla Gmaila zalecane jest użycie hasła aplikacji)
6. Adres nadawcy emaili
7. URL strony frontendowej (do generowania linków resetowania)

Skrypt automatycznie doda te ustawienia do pliku `.env` oraz utworzy wymagane tabele w bazie danych.

## Jak przetestować funkcjonalność w środowisku deweloperskim

### Krok 1: Uruchom serwer

```
cd server
npm run dev
```

### Krok 2: Wywołaj endpoint "Zapomniałeś hasła?"

Możesz to zrobić na kilka sposobów:
- Kliknij "Zapomniałeś hasła?" na stronie logowania i wypełnij formularz
- Uruchom skrypt testowy: `node test-forgot-password.js`
- Wykonaj zapytanie HTTP bezpośrednio: 
  ```
  curl -X POST -H "Content-Type: application/json" -d '{"email":"twoj-email@example.com"}' http://localhost:3001/api/auth/forgot-password
  ```

### Krok 3: Odczytaj link resetowania hasła z konsoli serwera

Po wywołaniu endpointu "Zapomniałeś hasła?", w konsoli serwera pojawi się komunikat podobny do:

```
==============================================================
TRYB DEWELOPERSKI - UŻYJ PONIŻSZEGO LINKU:
http://localhost:5173/reset-password/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
==============================================================
```

### Krok 4: Użyj linku do zresetowania hasła

1. Otwórz link w przeglądarce
2. Wypełnij formularz nowego hasła
3. Kliknij przycisk "Zresetuj hasło"

### Krok 5: Zaloguj się z nowym hasłem

Możesz teraz zalogować się używając nowego hasła.

## Konfiguracja manualna (jeśli nie skonfigurowano podczas instalacji)

Jeśli nie skonfigurowałeś wysyłania emaili podczas instalacji, możesz to zrobić ręcznie:

1. Utwórz/edytuj plik `.env` w folderze `server` i dodaj następujące zmienne:

```
NODE_ENV=production
EMAIL_HOST=smtp.example.com  # np. smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false  # true dla SSL
EMAIL_USER=twoja-nazwa-uzytkownika
EMAIL_PASS=twoje-haslo-lub-token
EMAIL_FROM=adres-nadawcy@example.com
FRONTEND_URL=http://twoj-adres-frontendu  # np. http://localhost:5173
```

2. Jeśli używasz Gmail, powinieneś utworzyć "hasło do aplikacji" zamiast używać swojego głównego hasła.

3. Wykonanie migracji bazy danych, aby dodać tabelę do przechowywania tokenów resetowania:

```
cd server
npx prisma migrate dev --name add_password_reset
```

4. Jeśli migracja się nie powiedzie, możesz spróbować alternatywnej metody:

```
npx prisma db push
```

5. Ponowne uruchomienie serwera:

```
npm run dev
```

## Rozwiązywanie problemów

1. **Email nie jest wysyłany**
   - Sprawdź logi serwera czy nie ma błędów
   - Zweryfikuj dane dostępowe w pliku .env
   - Sprawdź, czy NODE_ENV=production
   - W przypadku Gmail, upewnij się, że używasz hasła aplikacji

2. **Nie działa resetowanie hasła**
   - Sprawdź czy token nie wygasł (ważny przez 1 godzinę)
   - Upewnij się, że migracja bazy danych została wykonana
   - Sprawdź, czy formularz resetowania hasła przyjmuje token z URL

3. **Błąd tabeli PasswordReset**
   - Jeśli widzisz błąd "Tabela resetowania hasła nie istnieje", wykonaj migrację:
   ```
   npx prisma migrate dev --name add_password_reset
   ```
   - Jeśli widzisz inne błędy związane z prisma, spróbuj wygenerować klienta na nowo:
   ```
   npx prisma generate
   ```

4. **Problemy z PowerShellem na Windows**
   - Na Windows, operator `&&` może nie działać w PowerShell
   - Używaj `;` zamiast `&&` do rozdzielania poleceń, np.:
   ```
   cd server; npm run dev
   ```
   - Alternatywnie, możesz użyć CMD zamiast PowerShell

## Jak działa resetowanie hasła w tle

Funkcja resetowania hasła składa się z kilku części:

1. **Frontend**: Komponent ForgotPassword.tsx wysyła żądanie z adresem email do API
2. **Backend**: Kontroler forgotPassword generuje unikalny token i wysyła email
3. **Frontend**: Komponent ResetPassword.tsx odbiera token z URL i umożliwia wpisanie nowego hasła
4. **Backend**: Kontroler resetPassword weryfikuje token i aktualizuje hasło

W przypadku problemów z bazą danych lub konfiguracją email, system przechodzi w tryb awaryjny, wyświetlając linki w konsoli. 