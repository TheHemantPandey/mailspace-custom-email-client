/**
 * Helper script to generate a new Google OAuth2 Refresh Token for Gmail API.
 * Run using: node scripts/get-refresh-token.js
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { google } = require('googleapis');

// 1. Read environment variables from .env.local or process.env
const envPath = path.resolve(process.cwd(), '.env.local');

function loadEnvFile(filePath) {
  const envVars = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          envVars[key] = val;
        }
      }
    });
  }
  return envVars;
}

const fileEnv = loadEnvFile(envPath);
const clientId = process.env.GOOGLE_CLIENT_ID || fileEnv.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || fileEnv.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('\n❌ ERROR: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
  console.error('Please ensure they are defined in process.env or .env.local before running this script.\n');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // Required to get a fresh refresh token
  scope: [
    'openid',
    'email',
    'profile',
    'https://mail.google.com/',
  ],
});

console.log('\n==================================================');
console.log('🔑 GOOGLE OAUTH2 REFRESH TOKEN GENERATOR');
console.log('==================================================\n');
console.log('Please open the following URL in your browser to authorize access:\n');
console.log(authUrl);
console.log('\n--------------------------------------------------');
console.log(`Waiting for callback on ${REDIRECT_URI}...\n`);

// Automatically attempt to open the authorization link in default browser
const startCmd = process.platform === 'win32' ? `start "" "${authUrl}"` : process.platform === 'darwin' ? `open "${authUrl}"` : `xdg-open "${authUrl}"`;
exec(startCmd, () => {});

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname === '/oauth2callback') {
      const code = reqUrl.query.code;

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Authorization Error</h1><p>No code parameter received.</p>');
        console.error('❌ Authorization failed: No code returned.');
        return;
      }

      console.log('🔄 Authorization code received! Requesting tokens...');

      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Notice</h1><p>Access Token retrieved, but no Refresh Token was returned. Make sure to revoke existing app permissions or use prompt=consent.</p>');
        console.warn('⚠️ Access Token retrieved, but Google did not return a new refresh token.');
        console.warn('Access Token:', tokens.access_token);
        server.close();
        process.exit(0);
        return;
      }

      // Update or append GOOGLE_REFRESH_TOKEN in .env.local
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
        envContent = envContent.replace(
          /GOOGLE_REFRESH_TOKEN=.*/g,
          `GOOGLE_REFRESH_TOKEN="${refreshToken}"`
        );
      } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN="${refreshToken}"\n`;
      }

      fs.writeFileSync(envPath, envContent, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0f172a; color: #f8fafc;">
          <h1 style="color: #3b82f6;">Authorization Successful! 🎉</h1>
          <p style="font-size: 16px;">Your new permanent <strong>GOOGLE_REFRESH_TOKEN</strong> has been generated and automatically saved to <code>.env.local</code>.</p>
          <p style="color: #94a3b8;">You may now close this browser tab and restart your dev server.</p>
        </div>
      `);

      console.log('\n==================================================');
      console.log('✅ REFRESH TOKEN GENERATED SUCCESSFULLY!');
      console.log('==================================================');
      console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
      console.log('\nSaved automatically to .env.local');
      console.log('You can now restart your dev server to apply the updated credentials.\n');

      server.close();
      process.exit(0);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } catch (err) {
    console.error('❌ Error handling callback:', err);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Internal Error</h1><p>${err.message}</p>`);
    server.close();
    process.exit(1);
  }
});

server.listen(3000, () => {
  // Listening on port 3000 for callback
});
