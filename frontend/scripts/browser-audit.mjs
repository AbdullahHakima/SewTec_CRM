import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const base = process.env.AUDIT_URL || 'http://127.0.0.1:3100';
const browser = await chromium.launch({channel: process.env.AUDIT_BROWSER || 'msedge'});
const findings = [];
const themes = (process.env.AUDIT_THEMES || 'light,dark').split(',').map(value => value.trim()).filter(Boolean);
const output = process.env.AUDIT_OUTPUT || 'confirmation.json';
await fs.mkdir('../artifacts/browser', {recursive: true});
for (const theme of themes) for (const width of [360, 390, 430, 768, 1440]) {
  const context = await browser.newContext({ viewport: {width, height: 900}, isMobile: width < 768, hasTouch: width < 768, locale: 'ar-EG', timezoneId: 'Africa/Cairo' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const login = await context.request.post(`${base}/api/auth/login`, {data: {username: 'admin', password: 'admin123'}});
  if (!login.ok()) throw new Error(`Login failed ${login.status()}`);
  const auth = await login.json();
  await context.addInitScript(({auth, theme}) => {
    localStorage.setItem('sewtec-theme', theme);
    localStorage.setItem('sewtec_crm_token_v1', auth.token);
    localStorage.setItem('sewtec_crm_user_v1', JSON.stringify({id: auth.userId, username: auth.username, fullName: auth.fullName, role: auth.role, branchId: auth.branchId}));
  }, {auth, theme});
  for (const route of ['/', '/customers', '/opportunities', '/follow-ups', '/catalog', '/settings']) {
    await page.goto(base + route);
    await page.locator('#workspace').waitFor();
    await page.waitForTimeout(600);
    const name = route.replaceAll('/', '') || 'dashboard';
    const geometry = await page.evaluate(() => ({width: innerWidth, scrollWidth: document.documentElement.scrollWidth, title: document.querySelector('h1')?.textContent}));
    const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    findings.push({theme, width, route, geometry, errors: [...errors], violations: axe.violations.map(v => ({id:v.id, impact:v.impact, nodes:v.nodes.map(n=>n.target).slice(0,6)}))});
    if (width === 390 || width === 1440) await page.screenshot({path: `../artifacts/browser/${name}-${width}-${theme}.png`, fullPage:true, animations:"disabled"});
  }
  await page.goto(base + '/customers');
  await page.getByRole('button', {name:'إضافة عميل جديد', exact:true}).first().click();
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({path:`../artifacts/browser/customer-form-${width}-${theme}.png`, fullPage:true, animations:"disabled"});
  findings.push({theme, width, route:'customer-form', geometry: await page.getByRole('dialog').evaluate(el => ({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight})), violations:(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target).slice(0,6)}))});
  await context.close();
}
await fs.writeFile(`../artifacts/browser/${output}`, JSON.stringify(findings,null,2));
console.log(JSON.stringify(findings.map(f=>({theme:f.theme,width:f.width,route:f.route,overflow:f.geometry.scrollWidth>f.geometry.width,errors:f.errors,violations:f.violations.map(v=>v.id)})),null,2));
await browser.close();

