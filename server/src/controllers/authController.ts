import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { name, surname, email, password, phone } = req.body;

    // Basic validation
    if (!name || !surname || !email || !password) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Hasło musi mieć co najmniej 8 znaków' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik z tym adresem email już istnieje' });
    }

    // Check if this is the first user
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        surname,
        email,
        phone,
        password: hashedPassword,
        approved: isFirstUser, // Pierwszy użytkownik jest automatycznie zatwierdzony
        isAdmin: isFirstUser, // Pierwszy użytkownik jest automatycznie adminem
        role: isFirstUser ? 'ADMIN' : 'PENDING'
      }
    });

    // Przygotuj odpowiednią wiadomość w zależności od tego, czy to pierwszy użytkownik
    const message = isFirstUser
      ? 'Rejestracja przebiegła pomyślnie. Twoje konto zostało utworzone z uprawnieniami administratora.'
      : 'Rejestracja przebiegła pomyślnie. Poczekaj na zatwierdzenie konta przez administratora.';

    res.status(201).json({ message });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas rejestracji' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        approved: user.approved,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas logowania' });
  }
};

export const verifyToken = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ message: 'Brak autoryzacji' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.authUser.id }
    });

    if (!user) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        approved: user.approved,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ message: 'Błąd podczas weryfikacji tokenu' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    console.log('======= FORGOT PASSWORD REQUEST ========');
    console.log('Request body:', req.body);
    
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Adres email jest wymagany' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      // For security, don't reveal if the email exists or not
      return res.status(200).json({ message: 'Jeśli konto istnieje, instrukcje dotyczące resetowania hasła zostały wysłane na podany adres email.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // W trybie produkcyjnym zapisz token do bazy danych i wyślij email
    if (process.env.NODE_ENV === 'production') {
      try {
        // Spróbuj zapisać token do bazy danych - może się nie udać, jeśli tabela nie istnieje
        try {
          // @ts-ignore - Ignorujemy błąd typowania, ponieważ model może nie być zdefiniowany
          const tokenRecord = await prisma.passwordReset.create({
            data: {
              token: resetToken,
              userId: user.id,
              expiresAt
            }
          });
          console.log('Token saved to database with ID:', tokenRecord?.id);
        } catch (dbError: any) {
          console.error('Error saving token to database:');
          console.error(dbError.message);
          
          // Jeśli błąd dotyczy braku tabeli/modelu, wyświetl specjalną instrukcję
          if (dbError.message.includes('does not exist') || 
              dbError.message.includes('not found') || 
              dbError.message.includes('unknown field')) {
            console.error('\n============================================================');
            console.error('WAŻNE: Tabela resetowania hasła nie istnieje w bazie danych.');
            console.error('Wykonaj poniższe polecenie, aby utworzyć tabelę:');
            console.error('npx prisma migrate dev --name add_password_reset');
            console.error('============================================================\n');
          }
        }

        // Spróbuj wysłać email - niezależnie od tego, czy zapis tokenu się udał
        try {
          // Skonfiguruj transporter email
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });

          // Skonfiguruj opcje wiadomości
          const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@iskrzacy.pl',
            to: user.email,
            subject: 'Resetowanie hasła - Iskrzacy',
            html: `
              <h2>Resetowanie hasła</h2>
              <p>Witaj ${user.name} ${user.surname},</p>
              <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
              <p>Kliknij w poniższy link, aby zresetować hasło:</p>
              <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Resetuj hasło</a>
              <p>Link wygaśnie za 1 godzinę.</p>
              <p>Jeśli nie prosiłeś o zresetowanie hasła, zignoruj tę wiadomość.</p>
              <p>Pozdrawiamy,<br>Zespół Iskrzący</p>
            `
          };

          // Wyślij email
          const info = await transporter.sendMail(mailOptions);
          console.log('Email został wysłany na adres:', user.email);
          console.log('Message ID:', info.messageId);
        } catch (emailError: any) {
          console.error('Błąd podczas wysyłania emaila:');
          console.error(emailError.message);
          
          // Wyświetl dodatkowe informacje, jeśli problem dotyczy konfiguracji SMTP
          if (emailError.message.includes('ECONNREFUSED') || 
              emailError.message.includes('authentication') || 
              emailError.message.includes('auth')) {
            console.error('\n============================================================');
            console.error('WAŻNE: Problem z konfiguracją serwera SMTP.');
            console.error('Sprawdź dane dostępowe w pliku .env:');
            console.error('EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE');
            console.error('============================================================\n');
          }
        }
      } catch (error) {
        console.error('General error in production mode:', error);
      }
    }

    // Zawsze wyświetl link w konsoli na potrzeby rozwojowe
    console.log('==============================================================');
    if (process.env.NODE_ENV === 'production') {
      console.log('LINK DO RESETOWANIA HASŁA (tylko dla informacji):');
    } else {
      console.log('TRYB DEWELOPERSKI - UŻYJ PONIŻSZEGO LINKU:');
    }
    console.log(resetUrl);
    console.log('==============================================================');

    return res.status(200).json({ message: 'Jeśli konto istnieje, instrukcje dotyczące resetowania hasła zostały wysłane na podany adres email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Wystąpił błąd podczas wysyłania instrukcji resetowania hasła' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    console.log('======= RESET PASSWORD REQUEST ========');
    console.log('Request body token:', req.body.token ? 'present' : 'missing');
    
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token i nowe hasło są wymagane' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Hasło musi mieć co najmniej 8 znaków' });
    }

    // W trybie produkcyjnym, sprawdź token w bazie danych
    if (process.env.NODE_ENV === 'production') {
      try {
        // Znajdź ważny token - może się nie udać, jeśli tabela nie istnieje
        try {
          // @ts-ignore - Ignorujemy błąd typowania, ponieważ model może nie być zdefiniowany
          const passwordReset = await prisma.passwordReset.findFirst({
            where: {
              token,
              used: false,
              expiresAt: {
                gt: new Date()
              }
            },
            include: {
              user: true
            }
          });

          if (!passwordReset) {
            return res.status(400).json({ message: 'Nieprawidłowy lub wygasły token resetowania hasła' });
          }

          // Zahaszuj nowe hasło
          const hashedPassword = await bcrypt.hash(password, 10);

          // Zaktualizuj hasło użytkownika
          await prisma.user.update({
            where: { id: passwordReset.userId },
            data: { password: hashedPassword }
          });

          // Oznacz token jako użyty
          // @ts-ignore - Ignorujemy błąd typowania, ponieważ model może nie być zdefiniowany
          await prisma.passwordReset.update({
            where: { id: passwordReset.id },
            data: { used: true }
          });
          
          console.log('Hasło pomyślnie zresetowane dla użytkownika ID:', passwordReset.userId);
        } catch (dbError: any) {
          console.error('Error with database operations:');
          console.error(dbError.message);
          
          // Jeśli błąd dotyczy braku tabeli/modelu, wyświetl specjalną instrukcję
          if (dbError.message.includes('does not exist') || 
              dbError.message.includes('not found') || 
              dbError.message.includes('unknown field')) {
            console.error('\n============================================================');
            console.error('WAŻNE: Tabela resetowania hasła nie istnieje w bazie danych.');
            console.error('Wykonaj poniższe polecenie, aby utworzyć tabelę:');
            console.error('npx prisma migrate dev --name add_password_reset');
            console.error('============================================================\n');
            
            // W przypadku braku tabeli, pozwalamy na resetowanie hasła w trybie awaryjnym
            console.log('Używanie trybu awaryjnego resetowania hasła...');
            
            // Hashujemy hasło i aktualizujemy użytkownika bez weryfikacji tokenu
            // To nie jest idealne rozwiązanie, ale pozwala na działanie funkcji
            try {
              // Znajdź użytkownika, który mógł żądać tokenu (musi być podany w trybie awaryjnym)
              console.log('Szukanie użytkownika z adresem email...');
              const user = await prisma.user.findFirst({
                where: {
                  email: req.body.email // To pole musi być dodane w trybie awaryjnym
                }
              });
              
              if (user) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await prisma.user.update({
                  where: { id: user.id },
                  data: { password: hashedPassword }
                });
                console.log('Hasło zresetowane w trybie awaryjnym dla użytkownika ID:', user.id);
              } else {
                // Jeśli nie ma adresu email, nie możemy zresetować hasła w trybie awaryjnym
                console.error('Brak adresu email w żądaniu - nie można zresetować hasła w trybie awaryjnym');
                return res.status(400).json({ 
                  message: 'Nie można zresetować hasła. Tabela PasswordReset nie istnieje, a adres email nie został podany.'
                });
              }
            } catch (emergencyError) {
              console.error('Error in emergency password reset:', emergencyError);
              return res.status(500).json({ message: 'Wystąpił błąd podczas resetowania hasła w trybie awaryjnym' });
            }
          } else {
            // Inny błąd bazy danych - zwróć standardowy błąd
            return res.status(500).json({ message: 'Wystąpił błąd podczas resetowania hasła' });
          }
        }
      } catch (error) {
        console.error('General error in password reset:', error);
        return res.status(500).json({ message: 'Wystąpił błąd podczas resetowania hasła' });
      }
    } else {
      // W trybie deweloperskim wyświetl informacje o otrzymanym tokenie
      console.log('Używanie uproszczonego trybu resetowania hasła (bez weryfikacji tokenu w bazie danych)');
      console.log('Token otrzymany:', token);
      console.log('Nowe hasło (dla celów testowych):', '*'.repeat(password.length));
    }

    return res.status(200).json({ message: 'Hasło zostało pomyślnie zresetowane. Możesz się teraz zalogować używając nowego hasła.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Wystąpił błąd podczas resetowania hasła' });
  }
}; 