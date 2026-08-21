/**
 * Save Cookies Script
 * 
 * Run this ONCE to login to sieucap5s.com manually via Google OAuth.
 * The script opens a browser window, you login, then it saves cookies.
 * 
 * Usage: node scripts/save-cookies.js
 */
const { saveCookiesInteractive } = require('../src/services/sieucap5s');

saveCookiesInteractive()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
