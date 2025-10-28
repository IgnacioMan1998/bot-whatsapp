import 'reflect-metadata';
import dotenv from 'dotenv';
import { Application } from './Application';

// Load environment variables
dotenv.config();

async function main() {
  const app = new Application();
  
  try {
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
main();