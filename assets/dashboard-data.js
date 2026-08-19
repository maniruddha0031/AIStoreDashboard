/* ============================================================
   Hand-authored content for the 5 built-in dashboards
   (values transcribed from the reference screenshots)
   ============================================================ */

const SPARK_PATHS = {
  indigo: 'M0,24 L14,18 28,26 42,10 56,20 70,8 84,16 98,4 112,14 126,6',
  orange: 'M0,20 L14,12 28,22 42,14 56,24 70,10 84,18 98,8 112,16 126,10',
  teal:   'M0,26 L14,20 28,24 42,12 56,18 70,8 84,14 98,20 112,10 126,16',
  blue:   'M0,22 L14,14 28,20 42,8 56,16 70,10 84,18 98,6 112,14 126,8',
  purple: 'M0,18 L14,24 28,14 42,20 56,10 70,16 84,8 98,18 112,12 126,20'
};

let _sparkGradSeq = 0;
function sparkline(color){
  const strokeMap = { indigo:'#6366f1', orange:'#f59e0b', teal:'#14b8a6', blue:'#3b82f6', purple:'#a855f7' };
  const stroke = strokeMap[color] || '#3b82f6';
  const path = SPARK_PATHS[color];
  const gid = 'sparkGrad' + (_sparkGradSeq++);
  return `<svg class="kpi-spark" viewBox="0 0 126 30" preserveAspectRatio="none">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${stroke}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${stroke}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${path} L126,30 L0,30 Z" fill="url(#${gid})" stroke="none"/>
    <path d="${path}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ---------------- MTD derivation (new KPI tile design) ----------------
   KPI_ROWS/DAR_TILES only carry CUR + WTD figures (as transcribed from
   the reference screenshots) — MTD isn't hand-authored data anywhere in
   this app. Rather than doubling every KPI's numbers by hand, the new
   tile derives an MTD figure + vs LM/vs LY deterministically from the
   existing WTD value, keyed off the KPI's own label so it's stable
   across renders instead of jittering on every refresh. */
function kpiHash(s){ let h = 0; for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function kpiParseVal(str){
  const s = String(str);
  const dollar = s.indexOf('$') !== -1;
  const pct = s.indexOf('%') !== -1;
  const decimals = (s.split('.')[1] || '').replace(/[^0-9]/g,'').length;
  const neg = s.replace(/[^\-0-9.]/g,'').charAt(0) === '-';
  const num = parseFloat(s.replace(/[^0-9.]/g,'')) || 0;
  return { num: neg ? -num : num, dollar, pct, decimals: Math.min(decimals, 2) };
}
function kpiFmtLike(num, like){
  const neg = num < 0;
  const abs = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: like.decimals, maximumFractionDigits: like.decimals });
  return (neg ? '-' : '') + (like.dollar ? '$' : '') + abs + (like.pct ? '%' : '');
}
function kpiPctStr(v){ return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'; }
function deriveMtd(k){
  const h = kpiHash(k.label);
  const w = kpiParseVal(k.wtd);
  let mtdNum;
  if(w.pct){
    mtdNum = w.num + (((h % 400) - 200) / 100);          // percentages drift +/-2.00 pts, they don't accumulate
  } else {
    const mult = 3.6 + (h % 14) / 10;                     // $ / count metrics accumulate through the month (~3.6x-5.0x WTD)
    mtdNum = w.num * mult;
  }
  const lm = (((h >> 3) % 300) - 120) / 10;               // -12.00 .. +18.00
  const ly = (((h >> 7) % 300) - 90) / 10;                // -9.00 .. +21.00
  return {
    mtd: kpiFmtLike(mtdNum, w),
    mo: { lm: kpiPctStr(lm), lmUp: lm >= 0, ly: kpiPctStr(ly), lyUp: ly >= 0 }
  };
}

/* ---------------- BANNERS ---------------- */
const BANNERS = {
  storehealth: { eyebrow:'Operational Summary', title:'STORE HEALTH DASHBOARD', sub:'AI Verified Index · America/Los Angeles',
    bannerA:'#fdf1e7', bannerB:'#e6eefc', score:86, scoreLabel:'Excellent', lastWeek:'+3.2 pts', lastYear:'+7.8 pts', aiEmbed:null },
  compliance: { eyebrow:'Operational Summary', title:'COMPLIANCE DASHBOARD', sub:'AI Verified Index · America/Los Angeles',
    bannerA:'#fdf1e7', bannerB:'#e6eefc', score:86, scoreLabel:'Excellent', lastWeek:'+3.2 pts', lastYear:'+7.8 pts',
    aiEmbed:{ lines:['Early clock In Count increases by 2%'] } },
  risk: { eyebrow:'Operational Summary', title:'RISK ANALYSIS SUMMARY', sub:'AI Verified Index · America/Los Angeles',
    bannerA:'#fdf1e7', bannerB:'#e6eefc', score:86, scoreLabel:'Excellent', lastWeek:'+3.2 pts', lastYear:'+7.8 pts',
    aiEmbed:{ lines:['Schedule gaps impacting labor.'] } },
  timeloss: { eyebrow:'Operational Summary', title:'TIMELOSS SUMMARY', sub:'AI Verified Index · America/Los Angeles',
    bannerA:'#fdf1e7', bannerB:'#e6eefc', score:86, scoreLabel:'Excellent', lastWeek:'+3.2 pts', lastYear:'+7.8 pts', aiEmbed:null },
  dar: { eyebrow:'Operational Summary', title:'DAR SUMMARY', sub:'AI Verified Index · America/Los Angeles',
    bannerA:'#fdf1e7', bannerB:'#e6eefc', score:86, scoreLabel:'Excellent', lastWeek:'+3.2 pts', lastYear:'+7.8 pts',
    aiEmbed:{ lines:['Transactions Decreased by 3%'] } }
};

/* ---------------- KPI MINI ROWS ---------------- */
const KPI_ROWS = {
  storehealth: [
    { icon:'user', iconBg:'#e9edfb', iconColor:'#4f46e5', spark:'indigo', label:'Labor %', value:'24.69%', wtd:'30.79%',
      cur:{lw:'-11.21%',lwUp:false, ly:'+21.10%',lyUp:true}, wk:{lw:'+2.13%',lwUp:true, ly:'+1.34%',lyUp:true},
      footer:[['Labor $','$2,094.79'],['Sales','$8,483.13']] },
    { icon:'utensils', iconBg:'#fdecd8', iconColor:'#d97706', spark:'orange', label:'Food Cost %', value:'23.11%', wtd:'33.11%',
      cur:{lw:'-10.61%',lwUp:false, ly:'+60.31%',lyUp:true}, wk:{lw:'+3.81%',lwUp:true, ly:'-2.11%',lyUp:false},
      footer:[['Waste','$120'],['Theo. %','23%']] },
    { icon:'clock-4', iconBg:'#dbf3f5', iconColor:'#0891b2', spark:'teal', label:'SPLH', value:'90.44', wtd:'$389.84',
      cur:{lw:'-10.61%',lwUp:false, ly:'+60.31%',lyUp:true}, wk:{lw:'+3.81%',lwUp:true, ly:'-2.11%',lyUp:false},
      footer:[['Act. Hrs.','93.8'],['Ideal Hrs.','99']] },
    { icon:'bar-chart-3', iconBg:'#dbe7fb', iconColor:'#2563eb', spark:'blue', label:'Net Sales', value:'$8,483.13', wtd:'$27,784.67',
      cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false},
      footer:[['Voids','$42.94'],['Refunds','$0']] },
    { icon:'circle-gauge', iconBg:'#efe4fb', iconColor:'#9333ea', spark:'purple', label:'Actual OT %', value:'1.95%', wtd:'3.43%',
      cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false},
      footer:[['Transaction','320'],['Fct. Sales','$4,000']] }
  ],
  timeloss: [
    { icon:'bar-chart-3', iconBg:'#dbe7fb', iconColor:'#2563eb', spark:'blue', label:'Actual Sales', value:'$4,285', wtd:'$6,142',
      cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false},
      footer:[['Voids','$94.97'],['Refunds','-$0.2']] },
    { icon:'user', iconBg:'#e9edfb', iconColor:'#4f46e5', spark:'indigo', label:'Labor %', value:'24.69%', wtd:'30.79%',
      cur:{lw:'-11.21%',lwUp:false, ly:'+21.10%',lyUp:true}, wk:{lw:'+2.13%',lwUp:true, ly:'+1.34%',lyUp:true},
      footer:[['Labor $','$2,094.79'],['Sales','$8,483.13']] },
    { icon:'clock-4', iconBg:'#dbf3f5', iconColor:'#0891b2', spark:'teal', label:'Early Clock In', value:'$36.61', wtd:'$45.02',
      cur:{lw:'-10.61%',lwUp:false, ly:'+60.31%',lyUp:true}, wk:{lw:'+3.81%',lwUp:true, ly:'-2.11%',lyUp:false},
      footer:[['Act. Hrs.','93.8'],['Ideal Hrs.','99']] },
    { icon:'bar-chart-3', iconBg:'#dbe7fb', iconColor:'#2563eb', spark:'blue', label:'Late Clock Out', value:'$6.55', wtd:'$158.33',
      cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false},
      footer:[['Voids','$42.94'],['Refunds','$0']] },
    { icon:'circle-gauge', iconBg:'#efe4fb', iconColor:'#9333ea', spark:'purple', label:'OT Loss', value:'$95.59', wtd:'$164.94',
      cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false},
      footer:[['OT Hours','8.58'],['LY OT','0']] }
  ]
};

const AI_TILES = {
  storehealth: ['Labor % up <b>0.8%</b> above target.','Labor % is <b>1.2%</b> above regional average.','Sales up <b>12.4%</b> with $8.2K upsell potential.','SPLH drop detected at <b>12 stores</b>.'],
  timeloss:    ['Late clock-outs driving time loss.','Friday showed highest time loss.','Overtime increased this week.','Early clock-ins remain elevated.']
};

/* ---------------- GRID SECTIONS ---------------- */
const GRID_COLS_SCORE = ['KPI','CUR','WTD','LW (SD)','LW (WTD)','LW (TOT)','SCORE'];
const GRID_COLS_PLAIN = ['KPI','CUR','WTD','LW (SD)','LW (WTD)','LW (TOT)'];

const GRID_SECTIONS = {
  storehealth: [
    { title:'Labor Performance', color:'blue', score:'86%', hasScore:true, rows:[
      ['Scheduled Labor %','31.73%','37.96%','0%','0%','17.23%','78.78%'],
      ['Variance','0.19%','0.32%','0%','0%','18.12%','100%'],
      ['SPLH','$70.26','$63.73','$0','$0','$53.12','63.87%'] ] },
    { title:'Inventory Control', color:'orange', score:'86%', hasScore:true, rows:[
      ['Food Cost %','0%','0%','0%','0%','0%','0%'],
      ['Variance','0%','0%','0%','0%','0%','0%'],
      ['Waste','$0','$0','$24.05','$0','$0','0%'] ] },
    { title:'Payroll Management', color:'green', score:'86%', hasScore:true, rows:[
      ['Actual Labor %','24.69%','30.79%','0%','0%','23.11%','100%'],
      ['Variance','0.14%','0.18%','0%','0%','1.12%','100%'],
      ['SPLH','$90.44','$389.84','$0','$0','$151.22','82.22%'] ] },
    { title:'Cash Control', color:'red', score:'86%', hasScore:true, rows:[
      ['Refunds/Voids/Comps','$93.32','$261.84','$182.69','$266.63','$313.55','100%'],
      ['Cash Over/Short','$28.71','-$2315.87','-$839.22','-$766.13','-$213.76','100%'],
      ['Net Sales','$8,483.13','$27,784.67','$7,266.63','$1,156.61','$2,213.73','100%'] ] }
  ],
  compliance: [
    { title:'Attendance Behaviour', color:'blue', score:'68%', hasScore:false, rows:[
      ['Early Clock In','$4,210','$28,400','$4,080','$27,900','$31,000'],
      ['Late Clock Out','$240','$1,420','$180','$1,200','$1,600'],
      ['Dropped Shifts','25.8%','25.2%','24.9%','25.0%','25.1%'],
      ['Unapproved Shifts','+1.6%','+0.7%','+1.1%','+0.9%','+1.1%'] ] },
    { title:'Minors Compliance', color:'orange', score:'68%', hasScore:false, rows:[
      ['OT Violations','4','18','6','20','22'],
      ['Late Night Work','1','4','0','3','4'],
      ['Minor Violations','3','12','2','11','13'],
      ['Break Violations','5','21','7','23','26'] ] },
    { title:'Breaks Management', color:'green', score:'94%', hasScore:false, rows:[
      ['Paid Break Violations','7','28','5','26','30'],
      ['Unpaid Break Violations','6','22','4','20','24'],
      ['No. of Employees Violated Break','5','19','6','20','23'],
      ['Violation Rate','2.4%','2.6%','3.0%','2.8%','3.1%'] ] },
    { title:'Labor Exceptions', color:'red', score:'55%', hasScore:false, rows:[
      ['Mismatch Punches','18','72','24','78','88'],
      ['Unauthorized OT','42 hrs','168 hrs','34 hrs','160 hrs','178 hrs'],
      ['Manual Time Edits','7.6%','8.1%','9.0%','8.5%','8.8%'],
      ['Unscheduled Labor','31 hrs','124 hrs','22 hrs','115 hrs','130 hrs'] ] },
    { title:'Scheduling Optimization', color:'purple', score:'82%', hasScore:false, rows:[
      ['Overstaffed Hours','12 hrs','46 hrs','9 hrs','43 hrs','50 hrs'],
      ['Understaffed Hours','8 hrs','30 hrs','6 hrs','28 hrs','32 hrs'],
      ['Scheduled Efficiency','91%','91%','90%','90%','89%'],
      ['Forecasted Hours','312 hrs','1,248 hrs','298 hrs','1,210 hrs','1,380 hrs'] ] },
    { title:'Fair Work Week', color:'indigo', score:'86%', hasScore:false, rows:[
      ['Average Weekly Premium','$4,210','$28,400','$4,080','$27,900','$31,000'],
      ['Rest Premium','$240','$1,420','$180','$1,200','$1,600'],
      ['Scheduled Publication Compliance','25.8%','25.2%','24.9%','25.0%','25.1%'],
      ['Act vs Sch Variance %','+1.6%','+0.7%','+1.1%','+0.9%','+1.1%'] ] }
  ],
  risk: [
    { title:'Labor Risk', color:'blue', score:'75%', hasScore:false, rows:[
      ['Unauthorized OT','42 hrs','168 hrs','34 hrs','160 hrs','178 hrs'],
      ['Mismatch Punches','18','72','24','78','88'],
      ['Manual Edit Rate','7.6%','8.1%','9.0%','8.5%','8.8%'],
      ['Opening Exposure','82%','80%','78%','79%','81%'] ] },
    { title:'Inventory Risk', color:'orange', score:'68%', hasScore:false, rows:[
      ['Food Cost Variable','+1.8%','+1.5%','+1.2%','+1.4%','+1.6%'],
      ['Food Cost ($)','$84.6K','$338.4K','$80.2K','$325.0K','$360.0K'],
      ['Waste Cost ($)','$22.8K','$91.2K','$19.4K','$84.0K','$96.0K'],
      ['Stockout Alerts','9','34','8','30','36'] ] },
    { title:'Compliance Risk', color:'green', score:'71%', hasScore:false, rows:[
      ['Break Violations','14','56','12','52','60'],
      ['Minor Violations','5','18','6','20','22'],
      ['Total Unpaid Break Violations','9','34','18','30','36'],
      ['Unapproved Shifts','11','42','11','44','48'] ] },
    { title:'SCH Risk', color:'red', score:'66%', hasScore:false, rows:[
      ['Understaffed Hours','21','84','18','78','90'],
      ['Overstaffed Hours','17','64','15','60','70'],
      ['Scheduled Changes','46','182','40','170','195'],
      ['Late Publishing','4','14','5','16','18'] ] },
    { title:'Sales Risk', color:'purple', score:'61%', hasScore:false, rows:[
      ['Sales Forecast','-4.2%','-3.8%','-3.1%','-3.5%','-3.9%'],
      ['Voids','23','88','19','80','92'],
      ['Refund Amount ($)','$1,840','$7,200','$1,620','$6,800','$7,600'],
      ['Compensation','$2.1K','$8.4K','2.4K','$9.0K','$9.8K'] ] }
  ]
};

/* ---------------- DAR (12 mini KPI tiles) ---------------- */
const DAR_TILES = [
  { icon:'bar-chart-3', iconBg:'#dbe7fb', iconColor:'#2563eb', spark:'blue', label:'Actual Sales', value:'$4,285', wtd:'$6,142',
    cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false}, footer:[['Voids','$94.97'],['Refunds','-$0.2']] },
  { icon:'user', iconBg:'#e9edfb', iconColor:'#4f46e5', spark:'indigo', label:'Labor %', value:'24.69%', wtd:'30.79%',
    cur:{lw:'-11.21%',lwUp:false, ly:'+21.10%',lyUp:true}, wk:{lw:'+2.13%',lwUp:true, ly:'+1.34%',lyUp:true}, footer:[['Labor $','$2,094.79'],['Sales','$8,483.13']] },
  { icon:'utensils', iconBg:'#fdecd8', iconColor:'#d97706', spark:'orange', label:'Food Cost %', value:'23.11%', wtd:'33.11%',
    cur:{lw:'-10.61%',lwUp:false, ly:'+60.31%',lyUp:true}, wk:{lw:'+3.81%',lwUp:true, ly:'-2.11%',lyUp:false}, footer:[['Waste','$120'],['Theo. %','23%']] },
  { icon:'clock-4', iconBg:'#dbf3f5', iconColor:'#0891b2', spark:'teal', label:'SPLH', value:'90.44', wtd:'389.84',
    cur:{lw:'-10.61%',lwUp:false, ly:'+60.31%',lyUp:true}, wk:{lw:'+3.81%',lwUp:true, ly:'-2.11%',lyUp:false}, footer:[['Act. Hrs.','93.8'],['Ideal Hrs.','99']] },
  { icon:'users', iconBg:'#efe4fb', iconColor:'#9333ea', spark:'purple', label:'Transactions', value:'162', wtd:'846',
    cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false}, footer:[['',''],['','']] },
  { icon:'circle-gauge', iconBg:'#efe4fb', iconColor:'#9333ea', spark:'purple', label:'Labor Hours', value:'162.08', wtd:'725.21',
    cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false}, footer:[['',''],['','']] },
  { icon:'bar-chart-3', iconBg:'#dbe7fb', iconColor:'#2563eb', spark:'blue', label:'Act vs Ideal Hrs.', value:'122.08', wtd:'142.43',
    cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false}, footer:[['Act. Hrs.','122.08'],['Ideal Hrs.','0']] },
  { icon:'user', iconBg:'#e9edfb', iconColor:'#4f46e5', spark:'indigo', label:'Act vs Sch Hrs.', value:'-14.92', wtd:'-61.94',
    cur:{lw:'-11.21%',lwUp:false, ly:'+21.10%',lyUp:true}, wk:{lw:'+2.13%',lwUp:true, ly:'+1.34%',lyUp:true}, footer:[['Act. Hrs.','17.89'],['Sch. Hrs.','177']] },
  { icon:'clock-4', iconBg:'#dbf3f5', iconColor:'#0891b2', spark:'teal', label:'Financial Loss ($)', value:'$223.18', wtd:'$820.05',
    cur:{lw:'-10.61%',lwUp:false, ly:'+60.31%',lyUp:true}, wk:{lw:'+3.81%',lwUp:true, ly:'-2.11%',lyUp:false}, footer:[['Early In','$0'],['Late Out','$0']] },
  { icon:'bar-chart-3', iconBg:'#dbe7fb', iconColor:'#2563eb', spark:'blue', label:'Time Loss (Hrs.)', value:'5.29', wtd:'20.62',
    cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false}, footer:[['Early In (Hrs)','0'],['Late Out (Hrs.)','0']] },
  { icon:'users', iconBg:'#efe4fb', iconColor:'#9333ea', spark:'purple', label:'Act vs Fct Sales', value:'$0', wtd:'$0',
    cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false}, footer:[['Act Sales','$161.15'],['Fct Sales','$121.15']] },
  { icon:'circle-gauge', iconBg:'#efe4fb', iconColor:'#9333ea', spark:'purple', label:'Act vs Fct Trans.', value:'-67', wtd:'-148',
    cur:{lw:'+110.31%',lwUp:true, ly:'+1.03%',lyUp:true}, wk:{lw:'-10.31%',lwUp:false, ly:'-1.13%',lyUp:false}, footer:[['Act Trans','162'],['Fct Trans','229']] }
];

/* ---------------- HISTORICAL DATA (Timeloss) ---------------- */
const HISTORICAL_ROWS = [
  ['01/05/2026','1018','$32,862.63','18.71%','0.96%','$314.65','$36.61','$267.04','$23.50','$11.00'],
  ['12/29/2025','1018','$58,555.81','18.66%','1.46%','$855.45','$275.48','$358.62','$211.36','$10.00'],
  ['12/22/2025','1018','$55,336.98','17.76%','1.28%','$708.21','$82.78','$500.83','$103.18','$21.42']
];

/* ---------------- Timeloss chart source data ---------------- */
const TIMELOSS_CHART1 = {
  labels:['04/03/2024','05/03/2024','06/03/2024','07/03/2024','08/03/2024','09/03/2024','10/03/2024'],
  early:[230,180,120,590,230,80,220],
  late:[190,140,150,260,180,80,590],
  ot:[220,150,80,150,80,0,0],
  brk:[150,80,60,0,220,540,0],
  total:[950,1080,730,990,1200,1080,1450]
};
const TIMELOSS_CHART2 = {
  labels:['04/03/2024','05/03/2024','06/03/2024','07/03/2024','08/03/2024','09/03/2024','10/03/2024'],
  sales:[5000,2100,2600,6400,7300,6600,2500],
  laborPct:[16,11,12,20,21,19,22],
  lossPct:[7,8,9,7,9,8,10]
};
