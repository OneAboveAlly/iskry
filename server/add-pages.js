// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Define default pages
  const defaultPages = [
    {
      slug: 'o-mnie',
      title: 'O mnie',
      content: '<h1>O mnie</h1><p>Witaj na mojej stronie! Jestem ekspertem w dziedzinie rozwoju osobistego i duchowego. Pomagam ludziom odkrywać ich wewnętrzną siłę i potencjał.</p><p>Moja historia zaczęła się wiele lat temu, gdy sam poszukiwałem odpowiedzi na fundamentalne pytania życiowe. Dziś dzielę się swoją wiedzą i doświadczeniem z innymi.</p>',
    },
    {
      slug: 'aktualnosci',
      title: 'Aktualności',
      content: '<h1>Aktualności</h1><p>Tutaj znajdziesz najnowsze informacje o moich warsztatach, wykładach i publikacjach.</p>',
    },
    {
      slug: 'istnienie',
      title: 'Istnienie',
      content: '<h1>Istnienie</h1><p>Odkryj głębsze wymiary istnienia i świadomości. Na tej stronie dzielę się przemyśleniami na temat natury naszego bytu.</p>',
    },
    {
      slug: 'droga-rozwoju',
      title: 'Droga rozwoju',
      content: '<h1>Droga rozwoju</h1><p>Rozwój osobisty to proces, który trwa całe życie. Poznaj metody i techniki, które pomogą Ci w Twojej własnej drodze.</p>',
    },
    {
      slug: 'rytual-przykladania',
      title: 'Rytuał przykładania',
      content: '<h1>Rytuał przykładania</h1><p>Dowiedz się więcej o wyjątkowym rytuale, który pomaga w transformacji energetycznej i duchowej.</p>',
    },
    {
      slug: 'plan-spiewamy-razem',
      title: 'Plan śpiewamy razem',
      content: '<h1>Plan śpiewamy razem</h1><p>Wspólne śpiewanie to potężne narzędzie łączące ludzi. Zapoznaj się z harmonogramem nadchodzących wydarzeń.</p>',
    },
    {
      slug: 'cennik',
      title: 'Cennik',
      content: '<h1>Cennik</h1><p>Poniżej znajdziesz informacje o cenach moich usług i warsztatów.</p><ul><li>Konsultacja indywidualna: 150 zł / godz.</li><li>Warsztat grupowy: 80 zł / osoba</li><li>Kurs online: 599 zł</li></ul>',
    },
    {
      slug: 'kontakt',
      title: 'Kontakt',
      content: '<h1>Kontakt</h1><p>Możesz się ze mną skontaktować na kilka sposobów:</p><ul><li>Email: kontakt@przyklad.pl</li><li>Telefon: +48 123 456 789</li><li>Adres: ul. Przykładowa 1, 00-000 Warszawa</li></ul>',
    },
    {
      slug: 'rezerwacja',
      title: 'Rezerwacja',
      content: '<h1>Rezerwacja</h1><p>Aby zarezerwować termin konsultacji lub zapisać się na warsztat, wypełnij formularz poniżej lub skontaktuj się telefonicznie.</p>',
    }
  ];

  console.log('Starting to add default pages...');

  for (const page of defaultPages) {
    const existing = await prisma.pageContent.findUnique({
      where: { slug: page.slug }
    });

    if (!existing) {
      await prisma.pageContent.create({
        data: page
      });
      console.log(`Added page: ${page.slug}`);
    } else {
      console.log(`Page ${page.slug} already exists, skipping...`);
    }
  }

  console.log('All default pages have been processed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 