/**
 * SieuCap5s Puppeteer Automation Service
 *
 * Automates the tool on sieucap5s.com:
 * 1. Login with credentials
 * 2. Navigate to tool page
 * 3. Paste account list into textarea
 * 4. Enter shared code (mã Chung Sức / mã quà tặng)
 * 5. Click "Bắt đầu" (Start)
 * 6. Wait for results and parse them
 *
 * Based on screenshots of "NHẬP MÃ QUÀ TẶNG [SK THẺ LSR]" tool.
 */
const config = require('../config');
const { formatAccountInput, parseSuccessResults, parseFailedResults, parseProgressCounter } = require('./parser');

let puppeteer;
let StealthPlugin;

/**
 * Lazy-load puppeteer and stealth plugin
 */
async function loadPuppeteer() {
  if (!puppeteer) {
    try {
      const puppeteerExtra = require('puppeteer-extra');
      StealthPlugin = require('puppeteer-extra-plugin-stealth');
      puppeteerExtra.use(StealthPlugin());
      puppeteer = puppeteerExtra;
    } catch (e) {
      // Fallback to regular puppeteer if extra is not available
      puppeteer = require('puppeteer');
    }
  }
  return puppeteer;
}

class SieuCap5sAutomation {
  constructor() {
    this.browser = null;
    this.cookies = null;
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
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--window-size=1280,900',
      ],
      defaultViewport: {
        width: 1280,
        height: 900,
      },
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
   * Login to sieucap5s.com
   * The site has an anti-bot verification page first.
   */
  async login() {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      // If we have saved cookies, try restoring session
      if (this.cookies && this.cookies.length > 0) {
        await page.setCookie(...this.cookies);
        console.log('[Login] Restored saved cookies');
      }

      // Navigate to homepage
      console.log('[Login] Navigating to sieucap5s.com...');
      await page.goto(config.sieucap5s.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for anti-bot verification to pass
      // The "Checking your browser" page auto-redirects after verification
      await this._waitForVerification(page);

      // Check if already logged in (look for "Đăng xuất" button)
      const isLoggedIn = await page.evaluate(() => {
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.textContent.includes('Đăng xuất')) return true;
        }
        return false;
      });

      if (isLoggedIn) {
        console.log('[Login] Already logged in via cookies');
        this.cookies = await page.cookies();
        this.isLoggedIn = true;
        await page.close();
        return true;
      }

      // Need to login - find and fill login form
      console.log('[Login] Logging in with credentials...');

      // Navigate to login page if not there
      const currentUrl = page.url();
      if (!currentUrl.includes('login') && !currentUrl.includes('dang-nhap')) {
        // Look for login link
        const loginLink = await page.evaluate(() => {
          const links = document.querySelectorAll('a');
          for (const link of links) {
            if (
              link.textContent.includes('Đăng nhập') ||
              link.href.includes('login') ||
              link.href.includes('dang-nhap')
            ) {
              return link.href;
            }
          }
          return null;
        });

        if (loginLink) {
          await page.goto(loginLink, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          });
        }
      }

      // Fill in credentials
      // Try common selectors for username/password fields
      const usernameSelectors = [
        'input[name="username"]',
        'input[name="email"]',
        'input[name="txtUsername"]',
        'input[name="txtEmail"]',
        'input[type="text"]:not([name=""])',
        '#username',
        '#email',
        '#txtUsername',
      ];

      const passwordSelectors = [
        'input[name="password"]',
        'input[name="txtPassword"]',
        'input[type="password"]',
        '#password',
        '#txtPassword',
      ];

      let usernameInput = null;
      for (const sel of usernameSelectors) {
        usernameInput = await page.$(sel);
        if (usernameInput) break;
      }

      let passwordInput = null;
      for (const sel of passwordSelectors) {
        passwordInput = await page.$(sel);
        if (passwordInput) break;
      }

      if (!usernameInput || !passwordInput) {
        throw new Error('Could not find login form fields');
      }

      // Clear and type credentials
      await usernameInput.click({ clickCount: 3 });
      await usernameInput.type(config.sieucap5s.username, { delay: 50 });

      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(config.sieucap5s.password, { delay: 50 });

      // Find and click submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button.btn-login',
        '.btn-primary',
        'button:not([type])',
      ];

      let submitBtn = null;
      for (const sel of submitSelectors) {
        submitBtn = await page.$(sel);
        if (submitBtn) break;
      }

      if (submitBtn) {
        await submitBtn.click();
      } else {
        // Try pressing Enter
        await page.keyboard.press('Enter');
      }

      // Wait for navigation after login
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      // Verify login success
      const loginSuccess = await page.evaluate(() => {
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.textContent.includes('Đăng xuất')) return true;
        }
        return false;
      });

      if (!loginSuccess) {
        throw new Error('Login failed - could not verify session');
      }

      // Save cookies
      this.cookies = await page.cookies();
      this.isLoggedIn = true;
      console.log('[Login] Login successful');

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
    const maxWait = 15000; // 15 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const title = await page.title();
      const content = await page.content();

      // If still on verification page, wait
      if (
        title.includes('Checking') ||
        content.includes('Đang kiểm tra trình duyệt') ||
        content.includes('verify.js')
      ) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      // Verification passed
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
    if (this.cookies) {
      await page.setCookie(...this.cookies);
    }

    try {
      // 1. Navigate to tool page
      console.log(`[Tool] Navigating to ${config.sieucap5s.toolUrl}`);
      await page.goto(config.sieucap5s.toolUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for anti-bot if needed
      await this._waitForVerification(page);

      // 2. Wait for the tool form to be ready
      // Look for the textarea (account input area)
      await page.waitForSelector('textarea', { timeout: 15000 });
      console.log('[Tool] Form loaded');

      // 3. Find and fill the main textarea with accounts
      // Format: acc1|pass1\nacc2|pass2...  (Cách 1: shared code)
      const accountText = formatAccountInput(accounts, chungSucCode);

      const textareas = await page.$$('textarea');
      if (textareas.length === 0) {
        throw new Error('No textarea found on tool page');
      }

      // First textarea is the account list
      const accountTextarea = textareas[0];
      await accountTextarea.click({ clickCount: 3 });
      await accountTextarea.press('Backspace');
      await accountTextarea.type(accountText, { delay: 10 });
      console.log(`[Tool] Pasted ${accounts.length} accounts`);

      // 4. Find the "NHẬP MÃ QUÀ TẶNG" input and fill with the code
      // This is typically an input[type="text"] near the "NHẬP MÃ QUÀ TẶNG" label
      const codeInput = await page.evaluate(() => {
        // Find input near "NHẬP MÃ QUÀ TẶNG" or "Nhập 1 mã quà tặng"
        const inputs = document.querySelectorAll('input[type="text"]');
        for (const input of inputs) {
          const placeholder = (input.placeholder || '').toLowerCase();
          if (
            placeholder.includes('quà tặng') ||
            placeholder.includes('mã') ||
            placeholder.includes('chung')
          ) {
            return true;
          }
        }
        return false;
      });

      // Try to find and fill the code input
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
        console.warn('[Tool] Could not find code input field - code may need to be in account lines');
      }

      // 5. Wait a moment for "Có: X Account" to update
      await new Promise((r) => setTimeout(r, 1000));

      // 6. Click "Bắt đầu" (Start) button
      const startButton = await page.evaluate(() => {
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

      if (!startButton) {
        throw new Error('Could not find "Bắt đầu" button');
      }

      console.log('[Tool] Clicked "Bắt đầu" - processing...');

      // 7. Wait for results
      const results = await this._waitForResults(page, accounts.length);

      console.log(`[Tool] Results: ${results.success.length} success, ${results.failed.length} failed, ${results.totalBi} Bỉ`);

      await page.close();
      return results;
    } catch (error) {
      console.error('[Tool] Error:', error.message);

      // Try to take screenshot for debugging
      try {
        const screenshotPath = `/tmp/error_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[Tool] Error screenshot saved: ${screenshotPath}`);
      } catch (e) {
        // Ignore screenshot errors
      }

      await page.close();
      throw error;
    }
  }

  /**
   * Wait for tool results by polling the DOM
   * Watches "Account Success: X/Y" and "Account Failed: X/Y" counters
   */
  async _waitForResults(page, totalAccounts) {
    const startTime = Date.now();
    const timeout = config.sieucap5s.resultTimeout;
    const pollInterval = config.sieucap5s.resultPollInterval;

    while (Date.now() - startTime < timeout) {
      const result = await page.evaluate(() => {
        const body = document.body.innerText;

        // Find success and failed counters
        // Format: "Account Success:  X / Y" and "Account Failed:  X / Y"
        const successMatch = body.match(/Account\s*Success[:\s]*(\d+)\s*\/\s*(\d+)/i);
        const failedMatch = body.match(/Account\s*Failed?[:\s]*(\d+)\s*\/\s*(\d+)/i);

        const successDone = successMatch ? parseInt(successMatch[1]) : 0;
        const successTotal = successMatch ? parseInt(successMatch[2]) : 0;
        const failedDone = failedMatch ? parseInt(failedMatch[1]) : 0;
        const failedTotal = failedMatch ? parseInt(failedMatch[2]) : 0;

        // Get textarea contents for results
        const textareas = document.querySelectorAll('textarea');
        // The result textareas are typically after the input textarea
        // Look for textareas that contain result data
        let successText = '';
        let failedText = '';

        // Find all textareas and try to identify success/failed ones
        for (const ta of textareas) {
          const text = ta.value || ta.textContent || '';
          if (text.includes('THƯỞNG') || text.includes('thưởng')) {
            successText = text;
          } else if (text.includes('hết lượt') || text.includes('thất bại') || text.includes('failed')) {
            failedText = text;
          }
        }

        // Also try by position - result textareas are usually the 2nd and 3rd
        if (!successText && textareas.length >= 2) {
          successText = textareas[1]?.value || '';
        }
        if (!failedText && textareas.length >= 3) {
          failedText = textareas[2]?.value || '';
        }

        return {
          successDone,
          successTotal,
          failedDone,
          failedTotal,
          totalProcessed: successDone + failedDone,
          successText,
          failedText,
        };
      });

      console.log(`[Results] Progress: ${result.totalProcessed}/${totalAccounts} (S:${result.successDone} F:${result.failedDone})`);

      // Check if all accounts have been processed
      if (result.totalProcessed >= totalAccounts && totalAccounts > 0) {
        // Parse final results
        const success = parseSuccessResults(result.successText);
        const failed = parseFailedResults(result.failedText);
        const totalBi = success.reduce((sum, s) => sum + s.biEarned, 0);

        return { success, failed, totalBi };
      }

      // Wait before next poll
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    // Timeout - return whatever we have
    console.warn('[Results] Timeout waiting for results');
    const finalResult = await page.evaluate(() => {
      const textareas = document.querySelectorAll('textarea');
      return {
        successText: textareas[1]?.value || '',
        failedText: textareas[2]?.value || '',
      };
    });

    const success = parseSuccessResults(finalResult.successText);
    const failed = parseFailedResults(finalResult.failedText);
    const totalBi = success.reduce((sum, s) => sum + s.biEarned, 0);

    return { success, failed, totalBi, timedOut: true };
  }
}

module.exports = SieuCap5sAutomation;
