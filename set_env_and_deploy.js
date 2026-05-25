const { execSync } = require('child_process');

const TUNNEL_URL = 'https://8f6e7e2bc5faf164-106-222-248-18.serveousercontent.com';
const API_URL = TUNNEL_URL + '/api';
const WS_URL = TUNNEL_URL;

console.log('Setting NEXT_PUBLIC_API_URL to:', API_URL);
console.log('Setting NEXT_PUBLIC_WS_URL to:', WS_URL);

try {
  // Remove existing env vars first
  try { execSync('npx -y vercel env rm NEXT_PUBLIC_API_URL production --yes', { stdio: 'pipe' }); } catch(e) {}
  try { execSync('npx -y vercel env rm NEXT_PUBLIC_WS_URL production --yes', { stdio: 'pipe' }); } catch(e) {}
  
  // Set new values
  execSync(`echo ${API_URL} | npx -y vercel env add NEXT_PUBLIC_API_URL production`, { stdio: 'inherit' });
  execSync(`echo ${WS_URL} | npx -y vercel env add NEXT_PUBLIC_WS_URL production`, { stdio: 'inherit' });
  
  console.log('\n✅ Environment variables set!');
  
  // Deploy
  console.log('\n🚀 Deploying to production...');
  const output = execSync('npx -y vercel --prod --yes', { encoding: 'utf-8' });
  console.log(output);
  console.log('\n✅ Deployment complete!');
} catch (err) {
  console.error('Error:', err.message);
}
