import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.AUDIT_URL||'http://127.0.0.1:3100';
const browser=await chromium.launch({channel:'msedge'});
const results=[];
const runCount=Number(process.env.PERFORMANCE_RUNS||3);
try {
 const setup=await browser.newContext();
 const response=await setup.request.post(base+'/api/auth/login',{data:{username:'admin',password:'admin123'}});
 if(!response.ok()) throw new Error('Fixture login failed');
 const auth=await response.json(); await setup.close();
 for(let run=1;run<=runCount;run++) {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
  await context.addInitScript(auth=>{
   localStorage.setItem('sewtec_crm_token_v1',auth.token);
   localStorage.setItem('sewtec_crm_user_v1',JSON.stringify({id:auth.userId,username:auth.username,fullName:auth.fullName,role:auth.role,branchId:auth.branchId}));
   window.auditMetrics={lcpMs:0,lcpElement:'',cls:0,interactionsMs:[]};
   let start=0,last=0,session=0;
   new PerformanceObserver(list=>{for(const entry of list.getEntries()){window.auditMetrics.lcpMs=entry.startTime;window.auditMetrics.lcpElement=entry.element?.outerHTML?.slice(0,500)||'';}}).observe({type:'largest-contentful-paint',buffered:true});
   new PerformanceObserver(list=>{for(const entry of list.getEntries()){if(entry.hadRecentInput)continue;if(entry.startTime-last>1000||entry.startTime-start>5000){session=0;start=entry.startTime;}last=entry.startTime;session+=entry.value;window.auditMetrics.cls=Math.max(window.auditMetrics.cls,session);}}).observe({type:'layout-shift',buffered:true});
   new PerformanceObserver(list=>{for(const entry of list.getEntries())if(entry.interactionId)window.auditMetrics.interactionsMs.push(entry.duration);}).observe({type:'event',buffered:true,durationThreshold:16});
  },auth);
  const page=await context.newPage();const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750,connectionType:'cellular4g'});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto(base+'/customers');await page.locator('#workspace').waitFor();await page.waitForTimeout(2000);
  await page.getByRole('button',{name:'إضافة عميل جديد',exact:true}).first().click();
  await page.locator('#customerdrawer-field-1').pressSequentially('اختبار الأداء',{delay:50});
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
  results.push({run,...await page.evaluate(()=>({
    ...window.auditMetrics,
    transferredBytes: performance.getEntriesByType('resource').reduce((total,entry)=>total+(entry.transferSize||0),0),
    topResources: performance.getEntriesByType('resource').map(entry=>({name:entry.name.split('/').pop(),type:entry.initiatorType,bytes:entry.transferSize||0,endMs:Math.round(entry.responseEnd)})).sort((a,b)=>b.bytes-a.bytes).slice(0,8),
  }))});await context.close();
 }
 await fs.mkdir('../artifacts/browser',{recursive:true});
 await fs.writeFile('../artifacts/browser/performance.json',JSON.stringify({browser:browser.version(),profile:'Edge headless, fresh context/cache disabled, 390x844 touch emulation, CPU 4x, 150ms latency, 1.6Mbps down/0.75Mbps up, local production Next build and isolated small fixture; customer list plus opening form/typing/Escape. Event Timing samples are lab interaction durations, not field INP.',results},null,2));
 console.log(JSON.stringify(results));
}finally{await browser.close();}
