/**
 * SieuCap5s Puppeteer Automation Service
 *
 * Automates the tool on sieucap5s.com:
 * 1. Login using SAVED COOKIES (Google OAuth - cannot automate Google login)
 * 2. Navigate to tool page
 * 3. Paste account list into textarea
 * 4. Enter shared code (mã Chung Sức / mã quà tặng)
 * 5. Click "Bắt đầu" (Start)
 * 6. Wait for results and parse them
 *
 * LOGIN FLOW:
 * - User runs "npm run save-cookies" once to manually login and save cookies
 * - Puppeteer loads saved cookies for all subsequent runs
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { formatAccountInput, parseSuccessResults, parseFailedResults } = require('./parser');

const COOKIES_FILE = path.join(__dirname, '..', '..', 'data', 'sieucap5s_cookies.json');

let puppeteer;

/**
 * Lazy-load puppeteer and stealth plugin
 */
async function loadPuppeteer() {
  if (!puppeteer) {
    try {
      const puppeteerExtra = require('puppeteer-extra');
      const StealthPlugin = require('puppeteer-extra-plugin-stealth');
      puppeteerExtra.use(StealthPlugin());
      puppeteer = puppeteerExtra;
    } catch (e) {
      puppeteer = require('puppeteer');
    }
  }
  return puppeteer;
}

class SieuCap5sAutomation {
  constructor() {
    this.browser = null;
    this.isLoggedIn = false;
  }

  /**
   * Initialize browser instance
   */
  async init() {
    const pup = await loadPuppeteer();

    this.browser = await pup.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--window-size=1280,900',
      ],
      defaultViewport: { width: 1280, height: 900 },
    });

    console.log('[Puppeteer] Browser initialized');
    return this;
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isLoggedIn = false;
      console.log('[Puppeteer] Browser closed');
    }
  }

  /**
   * Load saved cookies from Firestore or local file
   */
  async _loadCookies() {
    // 1. Try loading from Firestore first
    try {
      const { getFirestore } = require('firebase-admin/firestore');
      const db = getFirestore();
      const doc = await db.collection('settings').doc('sieucap5s_cookies').get();
      if (doc.exists && doc.data()?.cookies) {
        const cookies = doc.data().cookies;
        if (Array.isArray(cookies) && cookies.length > 0) {
          console.log(`[Cookies] Loaded ${cookies.length} cookies from Firestore`);
          return cookies;
        }
      }
    } catch (e) {
      console.warn('[Cookies] Could not load from Firestore:', e.message);
    }

    // 2. Fallback to local file
    try {
      if (fs.existsSync(COOKIES_FILE)) {
        const data = fs.readFileSync(COOKIES_FILE, 'utf8');
        const cookies = JSON.parse(data);
        console.log(`[Cookies] Loaded ${cookies.length} cookies from local file`);
        return cookies;
      }
    } catch (e) {
      console.error('[Cookies] Error loading local file:', e.message);
    }
    return null;
  }

  /**
   * Save cookies to Firestore and local file
   */
  async _saveCookies(cookies) {
    // Save to local file
    try {
      const dir = path.dirname(COOKIES_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
      console.log(`[Cookies] Saved ${cookies.length} cookies to local file`);
    } catch (e) {
      console.error('[Cookies] Error saving local:', e.message);
    }

    // Save to Firestore
    try {
      const { getFirestore, FieldValue } = require('firebase-admin/firestore');
      const db = getFirestore();
      await db.collection('settings').doc('sieucap5s_cookies').set({
        cookies,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`[Cookies] Saved ${cookies.length} cookies to Firestore`);
    } catch (e) {
      console.warn('[Cookies] Could not save to Firestore:', e.message);
    }
  }

  /**
   * Helper to parse raw cookie header string into Puppeteer cookie format
   */
  static parseCookieString(cookieStr, domain = '.sieucap5s.com') {
    if (!cookieStr || typeof cookieStr !== 'string') return [];
    
    // Check if it's already a JSON array
    try {
      const parsed = JSON.parse(cookieStr);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Not JSON, parse as header string
    }

    const cookies = [];
    const parts = cookieStr.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const name = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim();
      if (name) {
        cookies.push({
          name,
          value,
          domain: domain,
          path: '/',
        });
      }
    }
    return cookies;
  }

  /**
   * Login using saved cookies
   */
  async login() {
    if (!this.browser) throw new Error('Browser not initialized');

    const cookies = await this._loadCookies();
    if (!cookies || cookies.length === 0) {
      throw new Error(
        'Chưa có cookies SieuCap5s! Vui lòng vào trang Admin (/admin) mục Cookies để dán Cookies hoặc chạy "npm run save-cookies".'
      );
    }

    const page = await this.browser.newPage();

    try {
      // Set cookies
      await page.setCookie(...cookies);
      console.log(`[Login] Loaded ${cookies.length} saved cookies`);

      // Navigate to sieucap5s
      console.log('[Login] Navigating to sieucap5s.com...');
      await page.goto(config.sieucap5s.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for anti-bot verification
      await this._waitForVerification(page);

      // Check if logged in (look for "Đăng xuất" link)
      const isLoggedIn = await page.evaluate(() => {
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.textContent.includes('Đăng xuất')) return true;
        }
        return false;
      });

      if (!isLoggedIn) {
        throw new Error(
          'Cookies expired! Please run "npm run save-cookies" again to re-login.'
        );
      }

      // Update cookies (they may have been refreshed)
      const freshCookies = await page.cookies();
      await this._saveCookies(freshCookies);

      this.isLoggedIn = true;
      console.log('[Login] Successfully authenticated via cookies');
      await page.close();
      return true;
    } catch (error) {
      console.error('[Login] Error:', error.message);
      await page.close();
      throw error;
    }
  }

  /**
   * Wait for anti-bot verification page to pass
   */
  async _waitForVerification(page) {
    const maxWait = 15000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const title = await page.title();
      const content = await page.content();

      if (
        title.includes('Checking') ||
        content.includes('Đang kiểm tra trình duyệt') ||
        content.includes('verify.js')
      ) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      console.log('[Verify] Anti-bot verification passed');
      return;
    }

    console.warn('[Verify] Verification timeout - proceeding anyway');
  }

  /**
   * Run the Chung Suc / Gift Code tool
   *
   * @param {Array<{username: string, password: string}>} accounts - Worker accounts
   * @param {string} chungSucCode - The Chung Suc code (or gift code)
   * @returns {Promise<{success: Array, failed: Array, totalBi: number}>}
   */
  async runTool(accounts, chungSucCode) {
    if (!this.browser) throw new Error('Browser not initialized');
    if (!this.isLoggedIn) throw new Error('Not logged in');

    const page = await this.browser.newPage();

    // Restore cookies
    const cookies = await this._loadCookies();
    if (cookies) await page.setCookie(...cookies);

    try {
      // 1. Navigate to tool page
      console.log(`[Tool] Navigating to ${config.sieucap5s.toolUrl}`);
      await page.goto(config.sieucap5s.toolUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this._waitForVerification(page);

      // 2. Wait for form
      await page.waitForSelector('textarea', { timeout: 15000 });
      console.log('[Tool] Form loaded');

      // 3. Fill the main textarea with accounts (Cách 1: shared code)
      const accountText = formatAccountInput(accounts, chungSucCode);
      const textareas = await page.$$('textarea');
      if (textareas.length === 0) throw new Error('No textarea found on tool page');

      const accountTextarea = textareas[0];
      await accountTextarea.click({ clickCount: 3 });
      await accountTextarea.press('Backspace');
      await accountTextarea.type(accountText, { delay: 10 });
      console.log(`[Tool] Pasted ${accounts.length} accounts`);

      // 4. Fill "NHẬP MÃ QUÀ TẶNG" input
      const codeInputSelectors = [
        'input[placeholder*="quà tặng"]',
        'input[placeholder*="mã"]',
        'input[placeholder*="chung"]',
      ];

      let codeField = null;
      for (const sel of codeInputSelectors) {
        codeField = await page.$(sel);
        if (codeField) break;
      }

      if (codeField) {
        await codeField.click({ clickCount: 3 });
        await codeField.type(chungSucCode, { delay: 30 });
        console.log(`[Tool] Entered code: ${chungSucCode}`);
      } else {
        console.warn('[Tool] Could not find code input field');
      }

      // 5. Wait for account count to update
      await new Promise((r) => setTimeout(r, 1000));

      // 6. Click "Bắt đầu" (Start)
      const clicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="button"], a.btn');
        for (const btn of buttons) {
          const text = (btn.textContent || btn.value || '').trim();
          if (text.includes('Bắt đầu') || text.includes('Start')) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (!clicked) throw new Error('Could not find "Bắt đầu" button');
      console.log('[Tool] Clicked "Bắt đầu" - processing...');

      // 7. Wait for results
      const results = await this._waitForResults(page, accounts.length);
      console.log(`[Tool] Results: ${results.success.length} success, ${results.failed.length} failed, ${results.totalBi} Bỉ`);

      await page.close();
      return results;
    } catch (error) {
      console.error('[Tool] Error:', error.message);
      try {
        await page.screenshot({ path: path.join(__dirname, '..', '..', 'data', `error_${Date.now()}.png`), fullPage: true });
      } catch (e) { /* ignore */ }
      await page.close();
      throw error;
    }
  }

  /**
   * Wait for tool results by polling the DOM
   */
  async _waitForResults(page, totalAccounts) {
    const timeout = config.sieucap5s.resultTimeout;
    const pollInterval = config.sieucap5s.resultPollInterval;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await page.evaluate(() => {
        const body = document.body.innerText;
        const successMatch = body.match(/Account\s*Success[:\s]*(\d+)\s*\/\s*(\d+)/i);
        const failedMatch = body.match(/Account\s*Failed?[:\s]*(\d+)\s*\/\s*(\d+)/i);

        const successDone = successMatch ? parseInt(successMatch[1]) : 0;
        const failedDone = failedMatch ? parseInt(failedMatch[1]) : 0;

        const textareas = document.querySelectorAll('textarea');
        let successText = '';
        let failedText = '';

        for (const ta of textareas) {
          const text = ta.value || ta.textContent || '';
          if (text.includes('THƯỞNG') || text.includes('thưởng')) successText = text;
          else if (text.includes('hết lượt') || text.includes('thất bại')) failedText = text;
        }

        if (!successText && textareas.length >= 2) successText = textareas[1]?.value || '';
        if (!failedText && textareas.length >= 3) failedText = textareas[2]?.value || '';

        return { successDone, failedDone, totalProcessed: successDone + failedDone, successText, failedText };
      });

      console.log(`[Results] Progress: ${result.totalProcessed}/${totalAccounts} (S:${result.successDone} F:${result.failedDone})`);

      if (result.totalProcessed >= totalAccounts && totalAccounts > 0) {
        const success = parseSuccessResults(result.successText);
        const failed = parseFailedResults(result.failedText);
        const totalBi = success.reduce((sum, s) => sum + s.biEarned, 0);
        return { success, failed, totalBi };
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    // Timeout
    console.warn('[Results] Timeout waiting for results');
    const finalResult = await page.evaluate(() => {
      const textareas = document.querySelectorAll('textarea');
      return { successText: textareas[1]?.value || '', failedText: textareas[2]?.value || '' };
    });

    const success = parseSuccessResults(finalResult.successText);
    const failed = parseFailedResults(finalResult.failedText);
    const totalBi = success.reduce((sum, s) => sum + s.biEarned, 0);
    return { success, failed, totalBi, timedOut: true };
  }
}

// ==========================================
// Cookie Saver Script (run manually)
// ==========================================

/**
 * Interactive script: opens browser for user to login manually via Google OAuth
 * Then saves the session cookies for Puppeteer to reuse
 */
async function saveCookiesInteractive() {
  console.log('\n🔐 SieuCap5s Cookie Saver');
  console.log('========================');
  console.log('A browser window will open. Please:');
  console.log('1. Login to sieucap5s.com using your Google account');
  console.log('2. Wait until you see the main dashboard');
  console.log('3. Press ENTER in this terminal to save cookies\n');

  const pup = await loadPuppeteer();
  const browser = await pup.launch({
    headless: false, // Show browser so user can login
    args: ['--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();
  await page.goto('https://sieucap5s.com', { waitUntil: 'networkidle2', timeout: 30000 });

  console.log('⏳ Waiting for you to login...');
  console.log('   Press ENTER after you see "Đăng xuất" on sieucap5s.com\n');

  // Wait for user to press Enter
  await new Promise((resolve) => {
    process.stdin.once('data', () => resolve());
  });

  // Save cookies
  const cookies = await page.cookies();
  const dir = path.dirname(COOKIES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));

  console.log(`\n✅ Saved ${cookies.length} cookies to ${COOKIES_FILE}`);
  console.log('   You can now close this window.\n');

  await browser.close();
}

module.exports = SieuCap5sAutomation;
module.exports.saveCookiesInteractive = saveCookiesInteractive;
