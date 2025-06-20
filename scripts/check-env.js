#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 Checking .env.local file...\n');

if (!fs.existsSync('.env.local')) {
  console.log('❌ .env.local file not found!');
  console.log('\n💡 Create .env.local file with these variables:');
  console.log('GOOGLE_CLIENT_ID=your_client_id');
  console.log('GOOGLE_CLIENT_SECRET=your_client_secret');
  console.log('GOOGLE_REFRESH_TOKEN=your_refresh_token');
  console.log('SHEET_ID=your_sheet_id');
  process.exit(1);
}

const envContent = fs.readFileSync('.env.local', 'utf8');
console.log('✅ .env.local file found!');
console.log('\n📄 Content preview:');

// Split into lines and show first 80 characters of each line
const lines = envContent.split('\n');
lines.forEach((line, index) => {
  if (line.trim()) {
    const lineNumber = (index + 1).toString().padStart(2, ' ');
    // Show variable name but hide value for security
    if (line.includes('=')) {
      const [varName, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      const maskedValue = value.length > 10 ? 
        value.substring(0, 10) + '...[HIDDEN]' : 
        '...[HIDDEN]';
      console.log(`${lineNumber}: ${varName.trim()}=${maskedValue}`);
    } else {
      console.log(`${lineNumber}: ${line}`);
    }
  }
});

// Check for required variables (OAuth + main sheet only)
console.log('\n🔍 Checking required variables:');
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_REFRESH_TOKEN',
  'SHEET_ID'
];

let foundCount = 0;
requiredVars.forEach(varName => {
  const regex = new RegExp(`^${varName}\\s*=`, 'm');
  if (regex.test(envContent)) {
    console.log(`✅ ${varName}`);
    foundCount++;
  } else {
    console.log(`❌ ${varName} - MISSING`);
  }
});

console.log(`\n📊 Result: ${foundCount}/${requiredVars.length} variables found`);

if (foundCount === requiredVars.length) {
  console.log('🎉 All environment variables are present!');
} else {
  console.log('⚠️  Some variables are missing. Check your .env.local file.');
}

// Check for encoding issues
if (envContent.includes('') || envContent.charCodeAt(0) === 65279) {
  console.log('\n⚠️  ENCODING ISSUE DETECTED!');
  console.log('Your .env.local file has encoding problems (BOM or special characters).');
  console.log('💡 Solution: Recreate the file and save as UTF-8 without BOM.');
} 