import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createDefaultPagesIfNeeded() {
  try {
    console.log('Checking for default pages in database...');
    
    // Sprawdź czy istnieją strony w bazie
    const count = await prisma.pageContent.count();
    
    if (count === 0) {
      console.log('No pages found. Creating default pages...');
      
      // Domyślne strony
      const defaultPages = [
        {
          slug: 'o-mnie',
          title: 'O mnie',
          content: '<h1>O mnie</h1><p>Strona o mnie</p>',
          imageUrl: null
        },
        {
          slug: 'istnienie',
          title: 'Istnienie',
          content: '<h1>Istnienie</h1><p>Strona o istnieniu</p>',
          imageUrl: null
        },
        {
          slug: 'rytual-przykladania',
          title: 'Rytuał przykładania',
          content: '<h1>Rytuał przykładania</h1><p>Informacje o rytuale</p>',
          imageUrl: null
        },
        {
          slug: 'droga-rozwoju',
          title: 'Droga rozwoju',
          content: '<h1>Droga rozwoju</h1><p>Informacje o drodze rozwoju</p>',
          imageUrl: null
        },
        {
          slug: 'cennik',
          title: 'Cennik',
          content: '<h1>Cennik</h1><p>Informacje o cenach</p>',
          imageUrl: null
        }
      ];
      
      // Twórz strony w bazie danych
      for (const page of defaultPages) {
        await prisma.pageContent.create({
          data: page
        });
        console.log(`Created page: ${page.title} (${page.slug})`);
      }
      
      console.log('Default pages created successfully');
      return true;
    } else {
      console.log(`Found ${count} pages in database. Skipping default page creation.`);
      return false;
    }
  } catch (error) {
    console.error('Error creating default pages:', error);
    return false;
  }
} 