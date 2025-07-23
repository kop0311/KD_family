#!/usr/bin/env node

/**
 * Deployment preparation script for Vercel
 * This script ensures the project is ready for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing KD Family project for Vercel deployment...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  '.env.example',
  'vercel.json'
];

console.log('📋 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
    process.exit(1);
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'dev'];

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ ${script} script - Found`);
  } else {
    console.log(`❌ ${script} script - Missing`);
    process.exit(1);
  }
});

// Check for environment variables
console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env.local')) {
  console.log('✅ .env.local - Found (for local development)');
} else {
  console.log('⚠️  .env.local - Not found (will use Vercel environment variables)');
}

// Test build
console.log('\n🔨 Testing production build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed');
  process.exit(1);
}

// Check build output
console.log('\n📁 Checking build output...');
if (fs.existsSync('.next')) {
  console.log('✅ .next directory - Found');
  
  // Check for static files
  const staticDir = '.next/static';
  if (fs.existsSync(staticDir)) {
    console.log('✅ Static files - Generated');
  } else {
    console.log('❌ Static files - Missing');
  }
} else {
  console.log('❌ .next directory - Missing');
  process.exit(1);
}

// Generate deployment summary
console.log('\n📊 Deployment Summary:');
console.log('='.repeat(50));
console.log(`Project: ${packageJson.name}`);
console.log(`Version: ${packageJson.version}`);
console.log(`Node.js: ${process.version}`);
console.log(`Next.js: ${packageJson.dependencies.next || 'Not found'}`);
console.log(`React: ${packageJson.dependencies.react || 'Not found'}`);
console.log(`TypeScript: ${packageJson.devDependencies.typescript || 'Not found'}`);
console.log('='.repeat(50));

// Create deployment checklist
const checklist = `# Vercel Deployment Checklist

## Pre-deployment Steps Completed
- [x] All required files present
- [x] Package.json scripts configured
- [x] Production build successful
- [x] Build output generated

## Manual Steps Required

### 1. Environment Variables (Set in Vercel Dashboard)
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production

### 2. Database Setup
- [ ] Create PostgreSQL database (Neon, Supabase, etc.)
- [ ] Run database migrations
- [ ] Update DATABASE_URL in Vercel

### 3. Vercel Configuration
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Configure custom domain (optional)
- [ ] Enable automatic deployments

### 4. Post-deployment Testing
- [ ] Test all pages load correctly
- [ ] Test API endpoints
- [ ] Test database connectivity
- [ ] Test authentication flow

## Useful Commands
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs

## Documentation
- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- PostgreSQL on Vercel: https://vercel.com/docs/storage/vercel-postgres
`;

fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
console.log('\n📝 Created DEPLOYMENT_CHECKLIST.md');

console.log('\n🎉 Project is ready for Vercel deployment!');
console.log('\n📋 Next steps:');
console.log('1. Review DEPLOYMENT_CHECKLIST.md');
console.log('2. Set up external PostgreSQL database');
console.log('3. Configure environment variables in Vercel');
console.log('4. Deploy with: vercel --prod');
console.log('\n✨ Happy deploying!');
