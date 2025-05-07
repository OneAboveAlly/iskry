import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/availability
router.get('/availability', async (req, res) => {
  try {
    const availabilities = await prisma.availability.findMany();
    res.json(availabilities);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania dostępności' });
  }
});

// POST /api/availability
router.post('/availability', async (req, res) => {
  try {
    const { adminId, days, fromHour, toHour } = req.body;
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ error: 'Brak wybranych dni' });
    }
    
    console.log('Otrzymane dni:', days);
    
    const data = days.map((dateStr: string) => {
      // Parsujemy datę i ustawiamy godzinę 12:00, aby uniknąć problemów z przesunięciem strefy czasowej
      const [year, month, day] = dateStr.split('-').map(Number);
      // Miesiące w JavaScript są 0-indeksowane, więc odejmujemy 1 od miesiąca
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      console.log(`Przetwarzanie daty: ${dateStr} -> ${date.toISOString()}`);
      
      return {
        adminId,
        date,
        fromHour,
        toHour
      };
    });
    
    const created = await prisma.availability.createMany({ data });
    res.json({ count: created.count });
  } catch (err) {
    console.error('Błąd dodawania dostępności:', err);
    res.status(500).json({ error: 'Błąd dodawania dostępności' });
  }
});

// DELETE /api/availability/:id
router.delete('/availability/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Sprawdź czy istnieje dostępność o podanym ID
    const availability = await prisma.availability.findUnique({
      where: { id }
    });
    
    if (!availability) {
      return res.status(404).json({ error: 'Dostępność nie znaleziona' });
    }
    
    // Sprawdź czy nie ma rezerwacji na ten termin
    // Utwórz nowe obiekty Date, aby uniknąć mutacji oryginalnej daty
    const startOfDay = new Date(availability.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(availability.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookingsForDay = await prisma.booking.findMany({
      where: {
        dateTime: {
          gte: startOfDay,
          lt: endOfDay
        },
        status: 'booked'
      }
    });
    
    if (bookingsForDay.length > 0) {
      return res.status(400).json({ 
        error: 'Nie można usunąć dostępności, ponieważ istnieją zarezerwowane terminy na ten dzień'
      });
    }
    
    // Usuń dostępność
    await prisma.availability.delete({
      where: { id }
    });
    
    res.json({ success: true, message: 'Dostępność została usunięta' });
  } catch (err) {
    console.error('Błąd usuwania dostępności:', err);
    res.status(500).json({ error: 'Błąd usuwania dostępności' });
  }
});

// GET /api/bookings
router.get('/bookings', async (req, res) => {
  try {
    // Pobierz rezerwacje z informacją o typie rezerwacji i użytkowniku
    const bookings = await prisma.booking.findMany({
      include: {
        reservationType: true,
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          }
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania rezerwacji' });
  }
});

// POST /api/bookings
router.post('/bookings', async (req, res) => {
  try {
    const { userId, dateTime, reservationTypeId } = req.body;
    
    // Sprawdź limit rezerwacji
    const maxBookingsSetting = await prisma.settings.findFirst({
      where: { key: 'max_bookings_per_user' }
    });
    
    if (maxBookingsSetting) {
      const maxBookings = Number(maxBookingsSetting.value);
      const userBookings = await prisma.booking.count({
        where: {
          userId,
          status: 'booked',
          dateTime: {
            gte: new Date() // Tylko przyszłe rezerwacje
          }
        }
      });
      
      if (userBookings >= maxBookings) {
        return res.status(400).json({ 
          error: `Osiągnięto maksymalną liczbę rezerwacji (${maxBookings}). Aby zarezerwować nowy termin, odwołaj jedną z istniejących rezerwacji.` 
        });
      }
    }
    
    // Pobierz typ rezerwacji, by znać długość
    let duration = 60; // Domyślna długość 1h
    let endTime = new Date(dateTime);
    
    if (reservationTypeId) {
      const reservationType = await prisma.reservationType.findUnique({
        where: { id: reservationTypeId }
      });
      
      if (reservationType) {
        duration = reservationType.duration;
      }
    }
    
    // Oblicz czas zakończenia rezerwacji
    endTime.setMinutes(endTime.getMinutes() + duration);
    
    // Sprawdź czy termin nie koliduje z istniejącymi rezerwacjami
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        status: 'booked',
        OR: [
          // Rezerwacja zaczyna się w trakcie innej
          {
            dateTime: { lte: new Date(dateTime) },
            endTime: { gt: new Date(dateTime) }
          },
          // Rezerwacja kończy się w trakcie innej
          {
            dateTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          // Rezerwacja zawiera się w innej
          {
            dateTime: { gte: new Date(dateTime) },
            endTime: { lte: endTime }
          }
        ]
      }
    });
    
    if (overlappingBookings.length > 0) {
      return res.status(400).json({ error: 'Ten termin koliduje z istniejącą rezerwacją' });
    }
    
    // Zapisz rezerwację
    const booking = await prisma.booking.create({
      data: { 
        userId, 
        dateTime: new Date(dateTime), 
        endTime,
        status: 'booked',
        reservationTypeId: reservationTypeId || undefined
      }
    });

    // Powiadom wszystkich adminów o nowej rezerwacji
    const admins = await prisma.user.findMany({ where: { isAdmin: true } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const reservationType = reservationTypeId ? await prisma.reservationType.findUnique({ where: { id: reservationTypeId } }) : null;
    const bookingDate = new Date(dateTime).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
    const message = `Nowa rezerwacja: ${user?.name || ''} ${user?.surname || ''} na ${bookingDate}${reservationType ? ` (${reservationType.name})` : ''}`;
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          content: message,
          isRead: false
        }
      });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Błąd rezerwacji terminu' });
  }
});

// GET /api/bookings/:id
router.get('/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        reservationType: true,
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          }
        }
      }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Rezerwacja nie znaleziona' });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania rezerwacji' });
  }
});

// PATCH /api/bookings/:id - Anulowanie rezerwacji
router.patch('/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!['booked', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }
    
    // Znajdź rezerwację przed aktualizacją, aby mieć dostęp do informacji o użytkowniku
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true
          }
        },
        reservationType: true
      }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Rezerwacja nie znaleziona' });
    }
    
    // Aktualizuj status rezerwacji
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    // Jeśli rezerwacja została odwołana, wyślij powiadomienie do adminów
    if (status === 'cancelled') {
      const admins = await prisma.user.findMany({ where: { isAdmin: true } });
      const bookingDate = new Date(booking.dateTime).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
      const message = `Rezerwacja odwołana: ${booking.user.name} ${booking.user.surname} na ${bookingDate}${booking.reservationType ? ` (${booking.reservationType.name})` : ''}`;
      
      // Utwórz powiadomienie dla każdego admina
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            content: message,
            isRead: false
          }
        });
      }
    }
    
    res.json(updatedBooking);
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji rezerwacji' });
  }
});

// GET /api/urgent-request
router.get('/urgent-request', async (req, res) => {
  try {
    // Get urgent requests with user info
    const urgentRequests = await prisma.urgentRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Zwracamy tylko najnowszą aktywną prośbę użytkownika (jeśli jest userId w query)
    if (req.query.userId) {
      const userId = Number(req.query.userId);
      const userRequest = urgentRequests.find(r => r.userId === userId && r.status === 'pending');
      return res.json(userRequest || null);
    }
    
    res.json(urgentRequests);
  } catch (err) {
    console.error('Error fetching urgent requests:', err);
    res.status(500).json({ error: 'Błąd pobierania pilnych próśb' });
  }
});

// POST /api/urgent-request
router.post('/urgent-request', async (req, res) => {
  try {
    const { userId, message } = req.body;
    // Sprawdź, czy użytkownik nie ma już aktywnej prośby
    const active = await prisma.urgentRequest.findFirst({
      where: { userId, status: 'pending' }
    });
    if (active) {
      return res.status(400).json({ error: 'Masz już aktywną pilną prośbę.' });
    }
    
    // Get user info for notification content
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, surname: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Create urgent request
    const urgentRequest = await prisma.urgentRequest.create({
      data: { userId, message, status: 'pending' }
    });

    // Find all admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true }
    });

    // Create notification for each admin
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          content: `PILNA PROŚBA: ${user.name} ${user.surname} prosi o pilne spotkanie: "${message}"`,
          isRead: false
        }
      });
    }

    res.json(urgentRequest);
  } catch (err) {
    console.error('Error creating urgent request:', err);
    res.status(500).json({ error: 'Błąd wysyłania pilnej prośby' });
  }
});

// PATCH /api/urgent-request/:id - Update urgent request status
router.patch('/urgent-request/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, rejectionReason } = req.body;
    
    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }
    
    // Find the request first to get user info
    const urgentRequest = await prisma.urgentRequest.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!urgentRequest) {
      return res.status(404).json({ error: 'Pilna prośba nie znaleziona' });
    }
    
    // Update the urgent request
    const updatedRequest = await prisma.urgentRequest.update({
      where: { id },
      data: { 
        status,
        // If status is rejected and a reason is provided, save it
        ...(status === 'rejected' && rejectionReason ? { rejectionReason } : {})
      }
    });
    
    // Create a notification for the student about the status change
    let notificationContent = '';
    if (status === 'confirmed') {
      notificationContent = 'Twoja pilna prośba o spotkanie została potwierdzona. Skontaktujemy się wkrótce z dalszymi szczegółami.';
    } else if (status === 'rejected') {
      // Include rejection reason in notification if provided
      notificationContent = `Twoja pilna prośba o spotkanie została odrzucona. ${rejectionReason ? `Powód: ${rejectionReason}` : 'Możesz spróbować zarezerwować regularny termin.'}`;
    }
    
    if (notificationContent) {
      await prisma.notification.create({
        data: {
          userId: urgentRequest.userId,
          content: notificationContent,
          isRead: false
        }
      });
    }
    
    res.json(updatedRequest);
  } catch (err) {
    console.error('Error updating urgent request:', err);
    res.status(500).json({ error: 'Błąd aktualizacji pilnej prośby' });
  }
});

// === Nowe endpointy dla typów rezerwacji ===

// GET /api/reservation-types
router.get('/reservation-types', async (req, res) => {
  try {
    const types = await prisma.reservationType.findMany({
      orderBy: { duration: 'asc' }
    });
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania typów rezerwacji' });
  }
});

// POST /api/reservation-types
router.post('/reservation-types', async (req, res) => {
  try {
    const { name, duration, description } = req.body;
    const type = await prisma.reservationType.create({
      data: { 
        name, 
        duration: Number(duration),
        description
      }
    });
    res.json(type);
  } catch (err) {
    res.status(500).json({ error: 'Błąd dodawania typu rezerwacji' });
  }
});

// PUT /api/reservation-types/:id - Aktualizacja typu rezerwacji
router.put('/reservation-types/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, duration, description } = req.body;
    
    // Sprawdź czy typ rezerwacji istnieje
    const existingType = await prisma.reservationType.findUnique({
      where: { id }
    });
    
    if (!existingType) {
      return res.status(404).json({ error: 'Typ rezerwacji nie znaleziony' });
    }
    
    // Aktualizuj typ rezerwacji
    const updatedType = await prisma.reservationType.update({
      where: { id },
      data: { 
        name, 
        duration: Number(duration),
        description 
      }
    });
    
    // Jeśli zmieniono czas trwania, zaktualizuj wszystkie przyszłe rezerwacje z tym typem
    if (existingType.duration !== Number(duration)) {
      // Pobierz przyszłe rezerwacje z tym typem
      const now = new Date();
      const bookings = await prisma.booking.findMany({
        where: {
          reservationTypeId: id,
          dateTime: { gte: now },
          status: 'booked'
        }
      });
      
      // Zaktualizuj czas zakończenia dla każdej rezerwacji
      for (const booking of bookings) {
        const endTime = new Date(booking.dateTime);
        endTime.setMinutes(endTime.getMinutes() + Number(duration));
        
        await prisma.booking.update({
          where: { id: booking.id },
          data: { endTime }
        });
      }
    }
    
    res.json(updatedType);
  } catch (err) {
    console.error('Błąd aktualizacji typu rezerwacji:', err);
    res.status(500).json({ error: 'Błąd aktualizacji typu rezerwacji' });
  }
});

// DELETE /api/reservation-types/:id
router.delete('/reservation-types/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.reservationType.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania typu rezerwacji' });
  }
});

// GET /api/notifications - pobierz powiadomienia (dla admina)
router.get('/notifications', async (req, res) => {
  try {
    const { 
      search, 
      type, 
      isRead, 
      startDate, 
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Buduj warunki wyszukiwania
    const where: any = {};

    // Filtrowanie po treści (wyszukiwanie)
    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Filtrowanie po typie powiadomienia
    if (type) {
      if (type === 'booking') {
        where.content = {
          contains: 'rezerwacja',
          mode: 'insensitive'
        };
      } else if (type === 'urgent') {
        where.content = {
          contains: 'pilna',
          mode: 'insensitive'
        };
      }
    }

    // Filtrowanie po statusie przeczytania
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    // Filtrowanie po dacie
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Pobierz powiadomienia z paginacją
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, surname: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania powiadomień' });
  }
});

// PATCH /api/notifications/:id - oznacz powiadomienie jako przeczytane
router.patch('/notifications/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji powiadomienia' });
  }
});

// GET /api/max-bookings-per-user
router.get('/max-bookings-per-user', async (req, res) => {
  try {
    const setting = await prisma.settings.findFirst({
      where: { key: 'max_bookings_per_user' }
    });
    
    res.json({ maxBookingsPerUser: setting ? Number(setting.value) : null });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania ustawienia' });
  }
});

// PUT /api/max-bookings-per-user
router.put('/max-bookings-per-user', async (req, res) => {
  try {
    const { maxBookingsPerUser } = req.body;
    
    if (typeof maxBookingsPerUser !== 'number' || maxBookingsPerUser < 0) {
      return res.status(400).json({ error: 'Nieprawidłowa wartość' });
    }
    
    const setting = await prisma.settings.upsert({
      where: { key: 'max_bookings_per_user' },
      update: { value: maxBookingsPerUser.toString() },
      create: { 
        key: 'max_bookings_per_user',
        value: maxBookingsPerUser.toString(),
        type: 'system',
        label: 'Maksymalna liczba rezerwacji na użytkownika'
      }
    });
    
    res.json({ maxBookingsPerUser: Number(setting.value) });
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji ustawienia' });
  }
});

export default router; 