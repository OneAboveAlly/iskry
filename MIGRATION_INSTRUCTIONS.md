# Instrukcja Migracji Bazy Danych

Aby dodać pole `archived` do tabeli powiadomień, należy wykonać poniższe kroki:

## 1. Połącz się z bazą danych PostgreSQL

Możesz użyć psql lub innego klienta PostgreSQL.

## 2. Uruchom poniższe zapytanie SQL

```sql
ALTER TABLE "Notification" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
```

To zapytanie doda nową kolumnę `archived` do tabeli `Notification`.

## 3. Sprawdź czy kolumna została dodana

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Notification';
```

## 4. Modyfikacje typów Prisma

Ponieważ Prisma nie mogło automatycznie wygenerować klienta, zmodyfikowaliśmy kod aby używał zapytań SQL zamiast standardowych metod Prisma:

- Dla endpointów archive/unarchive używamy `prisma.$executeRaw` aby bezpośrednio aktualizować bazę danych
- Dodaliśmy nowy endpoint `/api/notifications/archive-multiple` który umożliwia archiwizację wielu powiadomień jednocześnie

## 5. Jeśli problem nadal występuje

Jeśli po zastosowaniu powyższych kroków nadal otrzymujesz błędy, uruchom serwer ponownie: 