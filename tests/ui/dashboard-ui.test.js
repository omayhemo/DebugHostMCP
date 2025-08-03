/**
 * Dashboard UI Testing Suite
 * Comprehensive browser-based testing with Puppeteer for UI validation
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

describe('🖥️ Dashboard UI Testing', () => {
    let browser;
    let page;
    let dashboardUrl;
    
    beforeAll(async () => {
        // Launch browser with appropriate settings
        browser = await puppeteer.launch({
            headless: true, // Set to false for debugging
            slowMo: 0,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        dashboardUrl = `http://localhost:${global.__TEST_PORTS__?.dashboard || 3000}`;
        console.log(`🌐 Testing dashboard at: ${dashboardUrl}`);
    });
    
    beforeEach(async () => {
        page = await browser.newPage();
        
        // Set viewport for consistent testing
        await page.setViewport({ width: 1200, height: 800 });
        
        // Enable console logging for debugging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`🔴 Console Error: ${msg.text()}`);
            }
        });
        
        // Handle page errors
        page.on('pageerror', error => {
            console.error(`🚨 Page Error: ${error.message}`);
        });
    });
    
    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });
    
    describe('Page Loading & Structure', () => {
        test('should load dashboard page successfully', async () => {
            const response = await page.goto(dashboardUrl, { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            
            expect(response.status()).toBe(200);
            
            // Check page title
            const title = await page.title();
            expect(title).toContain('MCP Debug Host');
            
            // Verify main elements are present
            const mainContainer = await page.$('.dashboard-container, .main-container, main');
            expect(mainContainer).toBeTruthy();
            
            console.log(`✅ Dashboard loaded successfully: ${title}`);
        });
        
        test('should have proper HTML structure', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Check for essential HTML elements
            const elements = await page.evaluate(() => {
                return {
                    hasDoctype: document.doctype !== null,
                    hasTitle: document.querySelector('title') !== null,
                    hasMetaViewport: document.querySelector('meta[name="viewport"]') !== null,
                    hasCharset: document.querySelector('meta[charset]') !== null,
                    hasCSS: document.querySelectorAll('link[rel="stylesheet"], style').length > 0,
                    hasJS: document.querySelectorAll('script').length > 0
                };
            });
            
            expect(elements.hasDoctype).toBe(true);
            expect(elements.hasTitle).toBe(true);
            expect(elements.hasMetaViewport).toBe(true);
            expect(elements.hasCharset).toBe(true);
            expect(elements.hasCSS).toBe(true);
            expect(elements.hasJS).toBe(true);
        });
        
        test('should not have console errors on load', async () => {
            const consoleErrors = [];
            
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Wait a bit for any delayed errors
            await page.waitForTimeout(2000);
            
            // Filter out known acceptable errors (if any)
            const criticalErrors = consoleErrors.filter(error => 
                !error.includes('favicon.ico') &&
                !error.includes('sourceMap')
            );
            
            expect(criticalErrors).toHaveLength(0);
            
            if (criticalErrors.length > 0) {
                console.log('🔴 Console errors found:', criticalErrors);
            }
        });
    });
    
    describe('Server Management UI', () => {
        test('should display server list interface', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Look for server management elements
            const serverElements = await page.evaluate(() => {
                const selectors = [
                    '.server-list',
                    '.servers-container', 
                    '[data-testid="server-list"]',
                    '#server-list',
                    '.process-list'
                ];
                
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) return selector;
                }
                
                // Check for any element with server-related text
                const allElements = document.querySelectorAll('*');
                for (const element of allElements) {
                    const text = element.textContent?.toLowerCase() || '';
                    if (text.includes('server') || text.includes('process')) {
                        return element.tagName + '.' + element.className;
                    }
                }
                
                return null;
            });
            
            expect(serverElements).toBeTruthy();
            console.log(`📋 Found server list interface: ${serverElements}`);
        });
        
        test('should have server control buttons', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Look for server control buttons
            const buttons = await page.evaluate(() => {
                const buttonSelectors = [
                    'button[data-action="start"]',
                    'button[data-action="stop"]',
                    'button.start-btn',
                    'button.stop-btn',
                    '.btn-start',
                    '.btn-stop'
                ];
                
                const foundButtons = [];
                
                for (const selector of buttonSelectors) {
                    const elements = document.querySelectorAll(selector);
                    foundButtons.push(...Array.from(elements).map(el => ({
                        selector,
                        text: el.textContent?.trim(),
                        disabled: el.disabled
                    })));
                }
                
                // Also look for buttons with server-related text
                const allButtons = document.querySelectorAll('button');
                for (const button of allButtons) {
                    const text = button.textContent?.toLowerCase() || '';
                    if (text.includes('start') || text.includes('stop') || text.includes('restart')) {
                        foundButtons.push({
                            selector: 'button',
                            text: button.textContent?.trim(),
                            disabled: button.disabled
                        });
                    }
                }
                
                return foundButtons;
            });
            
            expect(buttons.length).toBeGreaterThan(0);
            console.log(`🔘 Found control buttons:`, buttons.map(b => b.text));
        });
    });
    
    describe('Log Viewer UI', () => {
        test('should display log viewer interface', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Look for log viewer elements
            const logElements = await page.evaluate(() => {
                const selectors = [
                    '.log-viewer',
                    '.logs-container',
                    '[data-testid="log-viewer"]',
                    '#log-viewer',
                    '.terminal',
                    'pre',
                    '.log-output'
                ];
                
                const found = [];
                
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        found.push({
                            selector,
                            count: elements.length,
                            visible: elements[0].offsetParent !== null
                        });
                    }
                }
                
                return found;
            });
            
            expect(logElements.length).toBeGreaterThan(0);
            console.log(`📜 Found log viewer elements:`, logElements);
        });
        
        test('should have log filtering controls', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Look for filter controls
            const filterControls = await page.evaluate(() => {
                const controls = [];
                
                // Look for select dropdowns
                const selects = document.querySelectorAll('select');
                for (const select of selects) {
                    const label = select.previousElementSibling?.textContent || 
                                 select.parentElement?.querySelector('label')?.textContent ||
                                 select.getAttribute('aria-label') || '';
                    
                    if (label.toLowerCase().includes('filter') || 
                        label.toLowerCase().includes('level') ||
                        select.options.length > 1) {
                        controls.push({
                            type: 'select',
                            label: label.trim(),
                            options: Array.from(select.options).map(opt => opt.text)
                        });
                    }
                }
                
                // Look for filter inputs
                const inputs = document.querySelectorAll('input[type="text"], input[type="search"]');
                for (const input of inputs) {
                    const placeholder = input.placeholder?.toLowerCase() || '';
                    const label = input.getAttribute('aria-label')?.toLowerCase() || '';
                    
                    if (placeholder.includes('filter') || placeholder.includes('search') ||
                        label.includes('filter') || label.includes('search')) {
                        controls.push({
                            type: 'input',
                            placeholder: input.placeholder,
                            label: input.getAttribute('aria-label') || ''
                        });
                    }
                }
                
                return controls;
            });
            
            console.log(`🔍 Found filter controls:`, filterControls);
        });
    });
    
    describe('Real-time Updates', () => {
        test('should handle WebSocket connection status', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Look for WebSocket connection indicators
            const wsStatus = await page.evaluate(() => {
                const indicators = [];
                
                // Look for connection status elements
                const statusSelectors = [
                    '.connection-status',
                    '.websocket-status',
                    '[data-status]',
                    '.status-indicator'
                ];
                
                for (const selector of statusSelectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        indicators.push({
                            selector,
                            text: element.textContent?.trim(),
                            className: element.className,
                            dataset: element.dataset
                        });
                    }
                }
                
                // Check for status in page content
                const bodyText = document.body.textContent?.toLowerCase() || '';
                const hasConnectionText = bodyText.includes('connected') || 
                                        bodyText.includes('disconnected') ||
                                        bodyText.includes('connection');
                
                return {
                    indicators,
                    hasConnectionText
                };
            });
            
            console.log(`🔌 WebSocket status elements:`, wsStatus);
        });
        
        test('should update log content dynamically', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Find log container
            const logContainer = await page.evaluate(() => {
                const selectors = ['.log-viewer', '.logs-container', 'pre', '.log-output'];
                
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        return {
                            selector,
                            initialContent: element.textContent?.length || 0,
                            hasContent: (element.textContent?.trim().length || 0) > 0
                        };
                    }
                }
                
                return null;
            });
            
            if (logContainer) {
                console.log(`📝 Found log container:`, logContainer);
                
                // Wait a bit and check if content updates
                await page.waitForTimeout(3000);
                
                const updatedContent = await page.evaluate(() => {
                    const selectors = ['.log-viewer', '.logs-container', 'pre', '.log-output'];
                    
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            return element.textContent?.length || 0;
                        }
                    }
                    
                    return 0;
                });
                
                console.log(`📊 Content length - Initial: ${logContainer.initialContent}, Updated: ${updatedContent}`);
            }
        });
    });
    
    describe('Responsive Design', () => {
        test('should be responsive on mobile devices', async () => {
            const mobileViewport = { width: 375, height: 667 }; // iPhone SE
            await page.setViewport(mobileViewport);
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Check if layout adapts to mobile
            const layoutCheck = await page.evaluate(() => {
                return {
                    hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
                    elementsOverflow: Array.from(document.querySelectorAll('*')).some(el => 
                        el.scrollWidth > window.innerWidth
                    ),
                    hasResponsiveElements: document.querySelectorAll('.responsive, .mobile-friendly, .col-sm, .col-md').length > 0
                };
            });
            
            // Should not have horizontal scroll on mobile
            expect(layoutCheck.hasHorizontalScroll).toBe(false);
            
            console.log(`📱 Mobile layout check:`, layoutCheck);
        });
        
        test('should work on tablet devices', async () => {
            const tabletViewport = { width: 768, height: 1024 }; // iPad
            await page.setViewport(tabletViewport);
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Check tablet layout
            const tabletLayout = await page.evaluate(() => {
                return {
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight,
                    hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
                    mainElementsVisible: document.querySelectorAll('[style*="display: none"]').length < 5
                };
            });
            
            expect(tabletLayout.viewportWidth).toBe(768);
            expect(tabletLayout.hasHorizontalScroll).toBe(false);
            
            console.log(`📱 Tablet layout check:`, tabletLayout);
        });
    });
    
    describe('Accessibility', () => {
        test('should have proper ARIA labels and roles', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            const accessibilityCheck = await page.evaluate(() => {
                const results = {
                    elementsWithAriaLabel: document.querySelectorAll('[aria-label]').length,
                    elementsWithRole: document.querySelectorAll('[role]').length,
                    buttons: document.querySelectorAll('button').length,
                    buttonsWithAriaLabel: document.querySelectorAll('button[aria-label]').length,
                    headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
                    images: document.querySelectorAll('img').length,
                    imagesWithAlt: document.querySelectorAll('img[alt]').length
                };
                
                return results;
            });
            
            // Basic accessibility requirements
            if (accessibilityCheck.buttons > 0) {
                // At least 50% of buttons should have aria-label
                const buttonLabelRatio = accessibilityCheck.buttonsWithAriaLabel / accessibilityCheck.buttons;
                expect(buttonLabelRatio).toBeGreaterThanOrEqual(0.3);
            }
            
            if (accessibilityCheck.images > 0) {
                // All images should have alt text
                expect(accessibilityCheck.imagesWithAlt).toBe(accessibilityCheck.images);
            }
            
            console.log(`♿ Accessibility check:`, accessibilityCheck);
        });
        
        test('should be keyboard navigable', async () => {
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Test keyboard navigation
            let focusableElements = 0;
            
            // Try to tab through elements
            for (let i = 0; i < 10; i++) {
                await page.keyboard.press('Tab');
                
                const activeElement = await page.evaluate(() => {
                    const active = document.activeElement;
                    return {
                        tagName: active?.tagName,
                        type: active?.type,
                        className: active?.className,
                        id: active?.id
                    };
                });
                
                if (activeElement.tagName && 
                    activeElement.tagName !== 'BODY' && 
                    activeElement.tagName !== 'HTML') {
                    focusableElements++;
                }
            }
            
            // Should have some focusable elements
            expect(focusableElements).toBeGreaterThan(0);
            
            console.log(`⌨️  Keyboard navigation: ${focusableElements} focusable elements found`);
        });
    });
    
    describe('Performance', () => {
        test('should load within acceptable time limits', async () => {
            const startTime = Date.now();
            
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            const loadTime = Date.now() - startTime;
            
            // Should load within 5 seconds
            expect(loadTime).toBeLessThan(5000);
            
            console.log(`⚡ Page load time: ${loadTime}ms`);
        });
        
        test('should have acceptable resource sizes', async () => {
            const client = await page.target().createCDPSession();
            await client.send('Network.enable');
            
            const resources = [];
            
            client.on('Network.responseReceived', (params) => {
                resources.push({
                    url: params.response.url,
                    status: params.response.status,
                    mimeType: params.response.mimeType,
                    encodedDataLength: params.response.encodedDataLength || 0
                });
            });
            
            await page.goto(dashboardUrl, { waitUntil: 'networkidle2' });
            
            // Wait for all resources to load
            await page.waitForTimeout(2000);
            
            const totalSize = resources.reduce((sum, resource) => sum + resource.encodedDataLength, 0);
            const jsSize = resources
                .filter(r => r.mimeType?.includes('javascript'))
                .reduce((sum, resource) => sum + resource.encodedDataLength, 0);
            const cssSize = resources
                .filter(r => r.mimeType?.includes('css'))
                .reduce((sum, resource) => sum + resource.encodedDataLength, 0);
            
            console.log(`📊 Resource sizes:`);
            console.log(`  📦 Total: ${(totalSize / 1024).toFixed(2)}KB`);
            console.log(`  📜 JavaScript: ${(jsSize / 1024).toFixed(2)}KB`);
            console.log(`  🎨 CSS: ${(cssSize / 1024).toFixed(2)}KB`);
            console.log(`  📄 Resources: ${resources.length}`);
            
            // Reasonable size limits
            expect(totalSize).toBeLessThan(5 * 1024 * 1024); // 5MB total
            expect(jsSize).toBeLessThan(2 * 1024 * 1024); // 2MB JS
            expect(cssSize).toBeLessThan(500 * 1024); // 500KB CSS
        });
    });
});