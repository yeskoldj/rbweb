#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRef = process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef) {
  console.error('❌ Missing SUPABASE_PROJECT_REF environment variable.');
  console.error('   Set it to your Supabase project reference before running this script.');
  process.exit(1);
}

if (!accessToken) {
  console.error('⚠️  SUPABASE_ACCESS_TOKEN is not set. The Supabase CLI will prompt for login or fail if no access token is available.');
}

const functionsDir = join(__dirname, '..', 'supabase', 'functions');

let directories;
try {
  directories = await readdir(functionsDir, { withFileTypes: true });
} catch (error) {
  console.error(`❌ Unable to read functions directory at ${functionsDir}:`, error);
  process.exit(1);
}

const functions = directories
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort();

if (functions.length === 0) {
  console.log('No Supabase Edge Functions found to deploy.');
  process.exit(0);
}

console.log(`Deploying ${functions.length} Supabase Edge Function(s) to project ${projectRef}...`);

for (const functionName of functions) {
  console.log(`\n🚀 Deploying function: ${functionName}`);
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['supabase', 'functions', 'deploy', functionName, '--project-ref', projectRef],
      { stdio: 'inherit', env: process.env }
    );

    child.on('error', (error) => {
      reject(error);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Deployment failed for function ${functionName} with exit code ${code}`));
      }
    });
  }).catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  });
}

console.log('\n✅ All Supabase Edge Functions deployed successfully.');
