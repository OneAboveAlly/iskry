import { PrismaClient } from '@prisma/client';
import { initialSettings } from './data/initialSettings';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed initial settings...');
  
  try {
    // Check if there are any settings already
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    const existingSettingsCount = await prisma.settings.count();
    
    if (existingSettingsCount > 0) {
      console.log(`Found ${existingSettingsCount} existing settings. Skipping initialization.`);
      return;
    }
    
    console.log('No existing settings found. Creating initial settings...');
    
    // Create initial settings
    for (const setting of initialSettings) {
      // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
      await prisma.settings.create({
        data: setting
      });
      console.log(`Created setting: ${setting.label} (${setting.key})`);
    }
    
    console.log('Initial settings created successfully!');
  } catch (error) {
    console.error('Error seeding settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 