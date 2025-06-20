#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing build process...\n');

// Check if all required files exist
const requiredFiles = [
  'package.json',
  'next.config.js',
  'app/layout.tsx',
  'app/page.tsx'
];

console.log('📋 Checking required files...');
let missingFiles = [];
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\n❌ Missing required files. Please create them before building.');
  process.exit(1);
}

// Check environment variables
console.log('\n🔑 Checking environment variables...');

// List of required environment variables
const envVariableGroups = [
  {
    name: 'Google OAuth',
    vars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']
  },
  {
    name: 'Google Sheets',
    vars: ['SHEET_ID']
  }
];

let envVarsFound = 0;
let totalEnvVars = 0;

if (fs.existsSync('.env.local')) {
  console.log('✅ .env.local file found');
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  envVariableGroups.forEach(group => {
    console.log(`\n📁 ${group.name}:`);
    group.vars.forEach(envVar => {
      totalEnvVars++;
      // Check if the variable exists (either as VARNAME= or VARNAME =)
      const regex = new RegExp(`^${envVar}\\s*=`, 'm');
      if (regex.test(envContent)) {
        console.log(`  ✅ ${envVar}`);
        envVarsFound++;
      } else {
        console.log(`  ⚠️  ${envVar} - NOT FOUND`);
      }
    });
  });
  
  console.log(`\n📊 Found ${envVarsFound}/${totalEnvVars} environment variables`);
  
  if (envVarsFound < totalEnvVars) {
    console.log('\n⚠️  Some environment variables are missing.');
    console.log('💡 This is OK for testing build, but required for deployment.');
  }
} else {
  console.log('⚠️  .env.local file not found');
  console.log('💡 You can still test build, but create .env.local for full functionality.');
}

// Test build
console.log('\n🔨 Running build test...');
try {
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\nBuilding application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Build successful!');
  console.log('\n🚀 Ready for deployment!');
  console.log('\nNext steps:');
  console.log('1. Push code to GitHub');
  console.log('2. Follow DEPLOY_GUIDE.md for Render deployment');
  console.log('3. Make sure to set all environment variables on Render');
  
} catch (error) {
  console.log('\n❌ Build failed!');
  console.log('Please fix the errors before deploying.');
  process.exit(1);
} 