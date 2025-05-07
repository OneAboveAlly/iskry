// CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testResetPassword() {
  // Przykładowy token i dane
  const token = 'test-token-1234567890';
  const testEmail = 'test@example.com'; // Adres email używany w teście forgot-password
  const newPassword = 'nowe-haslo-12345';
  
  console.log('Testowanie resetowania hasła...');
  console.log('Token:', token);
  console.log('Email:', testEmail);
  
  try {
    // Najpierw próbujemy standardowego resetowania hasła
    console.log('\nPróba 1: Standardowe resetowanie hasła (tylko token)');
    let response = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        token: token,
        password: newPassword
      })
    });

    let data = await response.json();
    console.log('Odpowiedź:', data);
    
    // Jeśli wystąpił błąd dotyczący braku tabeli, spróbuj z adresem email
    if (response.status === 400 && 
       (data.message.includes('Tabela') || data.message.includes('email nie został podany'))) {
      console.log('\nPróba 2: Resetowanie hasła w trybie awaryjnym (token + email)');
      response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token: token,
          password: newPassword,
          email: testEmail // Dodajemy email do trybu awaryjnego
        })
      });
      
      data = await response.json();
      console.log('Odpowiedź z trybu awaryjnego:', data);
    }
    
    if (response.ok) {
      console.log('\nSukces! Hasło zostało zresetowane.');
      console.log('Możesz teraz zalogować się używając nowego hasła.');
    } else {
      console.log('\nBłąd podczas resetowania hasła. Sprawdź komunikat odpowiedzi powyżej.');
    }
  } catch (error) {
    console.error('Błąd:', error);
  }
}

testResetPassword(); 