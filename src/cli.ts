#!/usr/bin/env node

import 'reflect-metadata';
import dotenv from 'dotenv';
import { CliApplication } from './presentation/cli/CliApplication';

// Load environment variables
dotenv.config();

async function main() {
  const cli = new CliApplication();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down CLI...');
    await cli.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down CLI...');
    await cli.cleanup();
    process.exit(0);
  });

  try {
    await cli.run(process.argv);
  } catch (error) {
    console.error('CLI failed:', error);
    await cli.cleanup();
    process.exit(1);
  }
}

main();