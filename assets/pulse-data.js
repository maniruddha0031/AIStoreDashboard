/* ============================================================
   Pulse Index — current value vs median benchmark, per KPI.
   Anchored to the main KPIs already tracked across this app's 5
   dashboards (App/assets/dashboard-data.js — KPI_ROWS, GRID_SECTIONS,
   DAR_TILES) so the numbers stay consistent with what's shown
   elsewhere; medians are seeded benchmark figures (illustrative,
   in the spirit of an industry percentile table) rather than a
   live peer computation.
   ============================================================ */
const PULSE_METRICS = [
  /* Store Health */
  { id:'labor_pct',    label:'Labor %',            icon:'user',         iconBg:'#e9edfb', iconColor:'#4f46e5', unit:'%', current:24.69,   median:26.4,  lowerIsBetter:true },
  { id:'food_cost',    label:'Food Cost %',        icon:'utensils',     iconBg:'#fdecd8', iconColor:'#d97706', unit:'%', current:23.11,   median:29.6,  lowerIsBetter:true },
  { id:'splh',         label:'SPLH',               icon:'clock-4',      iconBg:'#dbf3f5', iconColor:'#0891b2', unit:'$', current:90.44,   median:62.5,  lowerIsBetter:false },
  { id:'net_sales',    label:'Net Sales',          icon:'bar-chart-3',  iconBg:'#dbe7fb', iconColor:'#2563eb', unit:'$', current:8483.13, median:7100,  lowerIsBetter:false },
  { id:'actual_ot',    label:'Actual OT %',        icon:'circle-gauge', iconBg:'#efe4fb', iconColor:'#9333ea', unit:'%', current:1.95,    median:2.6,   lowerIsBetter:true },
  /* Timeloss */
  { id:'early_in',     label:'Early Clock In',     icon:'clock-4',      iconBg:'#dbf3f5', iconColor:'#0891b2', unit:'$', current:36.61,   median:25,    lowerIsBetter:true },
  { id:'late_out',     label:'Late Clock Out',     icon:'bar-chart-3',  iconBg:'#dbe7fb', iconColor:'#2563eb', unit:'$', current:6.55,    median:15,    lowerIsBetter:true },
  { id:'ot_loss',      label:'OT Loss',            icon:'circle-gauge', iconBg:'#efe4fb', iconColor:'#9333ea', unit:'$', current:95.59,   median:70,    lowerIsBetter:true },
  /* DAR */
  { id:'transactions', label:'Transactions',       icon:'users',        iconBg:'#efe4fb', iconColor:'#9333ea', unit:'#', current:162,     median:150,   lowerIsBetter:false },
  { id:'labor_hours',  label:'Labor Hours',        icon:'circle-gauge', iconBg:'#efe4fb', iconColor:'#9333ea', unit:'h', current:162.08,  median:170,   lowerIsBetter:true },
  { id:'fin_loss',     label:'Financial Loss',     icon:'clock-4',      iconBg:'#dbf3f5', iconColor:'#0891b2', unit:'$', current:223.18,  median:150,   lowerIsBetter:true },
  { id:'time_loss',    label:'Time Loss',          icon:'bar-chart-3',  iconBg:'#dbe7fb', iconColor:'#2563eb', unit:'h', current:5.29,    median:8,     lowerIsBetter:true },
  /* Compliance */
  { id:'dropped_shifts', label:'Dropped Shifts',   icon:'calendar-x',   iconBg:'#dbe7fb', iconColor:'#2563eb', unit:'%', current:25.8,    median:20,    lowerIsBetter:true },
  { id:'ot_violations',  label:'OT Violations',    icon:'triangle-alert', iconBg:'#fdecd8', iconColor:'#d97706', unit:'#', current:4,     median:6,     lowerIsBetter:true },
  { id:'break_viol',     label:'Paid Break Violations', icon:'coffee',  iconBg:'#d9f2e3', iconColor:'#16a34a', unit:'#', current:7,       median:5,     lowerIsBetter:true },
  { id:'mismatch',       label:'Mismatch Punches', icon:'fingerprint',  iconBg:'#fbdede', iconColor:'#dc2626', unit:'#', current:18,      median:10,    lowerIsBetter:true },
  /* Risk */
  { id:'opening_exp',  label:'Opening Exposure',   icon:'door-open',    iconBg:'#dbe7fb', iconColor:'#2563eb', unit:'%', current:82,      median:78,    lowerIsBetter:true },
  { id:'stockout',     label:'Stockout Alerts',    icon:'package-x',    iconBg:'#fdecd8', iconColor:'#d97706', unit:'#', current:9,       median:12,    lowerIsBetter:true },
  { id:'voids',        label:'Voids',              icon:'receipt',      iconBg:'#efe4fb', iconColor:'#9333ea', unit:'#', current:23,      median:18,    lowerIsBetter:true },
  { id:'understaffed', label:'Understaffed Hours', icon:'user-minus',   iconBg:'#fbdede', iconColor:'#dc2626', unit:'#', current:21,      median:25,    lowerIsBetter:true }
];

function pulseFmt(m, v){
  if(m.unit==='$') return '$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(m.unit==='%') return v.toFixed(2)+'%';
  if(m.unit==='h') return v.toFixed(2)+' hrs';
  return v.toLocaleString('en-US');
}
function pulseMetric(id){ return PULSE_METRICS.find(m=>m.id===id); }
function pulseDeltaPct(m, median){ const med = median===undefined ? m.median : median; return ((m.current - med) / med) * 100; }
function pulseBeats(m, median){ const med = median===undefined ? m.median : median; return m.lowerIsBetter ? m.current < med : m.current > med; }

/* Scope-aware median — All Stores / Corporate / Franchise each get a
   distinct median instead of the one fixed benchmark figure. Corporate
   stores run a bit ahead of the chain median, franchise a bit behind
   (deterministic per metric, not just a flat shift on every KPI). */
function pulseScopeMedianMult(m, peer){
  if(peer!=='corporate' && peer!=='franchise') return 1;
  const jitter = ((pulseHash(m.id+'|'+peer) % 21) - 10) / 100;      // +/-0.10
  const corpEdge = m.lowerIsBetter ? -0.06 : 0.06;                  // corporate ~6% better than chain median
  const franEdge = m.lowerIsBetter ? 0.08 : -0.08;                  // franchise ~8% behind chain median
  return 1 + (peer==='corporate' ? corpEdge : franEdge) + jitter;
}
function pulseMedianForPeer(m, peer){ return m.median * pulseScopeMedianMult(m, peer); }
function pulsePeerLabel(peer){ return peer==='corporate' ? 'Corporate' : peer==='franchise' ? 'Franchise' : 'All Stores'; }

/* ============================================================
   Peer group — store roster + per-store spread, used by the
   "All Stores / Corporate / Franchise" scope bar and the 4 peer
   tiles. Per-store readings are a deterministic spread around
   each metric's company figure (current), normalised so the
   full-roster median lands exactly on that figure.
   ============================================================ */
const PULSE_STORES = [
  { id:'bay_101', name:'#101 – Downtown LA',   own:'corporate' },
  { id:'bay_102', name:'#102 – Santa Monica',  own:'franchise' },
  { id:'bay_103', name:'#103 – Culver City',   own:'corporate' },
  { id:'bay_104', name:'#104 – Burbank',        own:'franchise' },
  { id:'pac_201', name:'#201 – San Francisco', own:'corporate' },
  { id:'pac_202', name:'#202 – Oakland',        own:'franchise' },
  { id:'pac_203', name:'#203 – Berkeley',       own:'corporate' },
  { id:'mtn_301', name:'#301 – Denver',         own:'franchise' },
  { id:'mtn_302', name:'#302 – Boulder',        own:'corporate' },
  { id:'mtn_303', name:'#303 – Colorado Springs', own:'franchise' },
  { id:'sw_401',  name:'#401 – Phoenix',        own:'corporate' },
  { id:'sw_402',  name:'#402 – Scottsdale',     own:'franchise' },
  { id:'ne_501',  name:'#501 – Boston',         own:'corporate' },
  { id:'ne_502',  name:'#502 – Cambridge',      own:'franchise' },
  { id:'cv_601',  name:'#601 – Fresno',         own:'corporate' },
  { id:'cv_602',  name:'#602 – Bakersfield',    own:'franchise' },
  { id:'md_701',  name:'#701 – Manhattan',      own:'corporate' },
  { id:'md_702',  name:'#702 – Brooklyn',       own:'franchise' }
];
function pulseHash(s){ let h = 0; for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function pulseStoresFor(peer){
  if(peer==='corporate') return PULSE_STORES.filter(s=>s.own==='corporate');
  if(peer==='franchise') return PULSE_STORES.filter(s=>s.own==='franchise');
  return PULSE_STORES;
}
function pulseStoreRaw(store, m){ return 0.78 + (pulseHash(store.id+'|'+m.id) % 44) / 100; } // 0.78 - 1.22
const PULSE_SPREAD_NORM = {};
function pulseNorm(m){
  if(PULSE_SPREAD_NORM[m.id] !== undefined) return PULSE_SPREAD_NORM[m.id];
  const vs = PULSE_STORES.map(s=>pulseStoreRaw(s,m)).sort((a,b)=>a-b);
  const n = vs.length, med = n % 2 ? vs[(n-1)/2] : (vs[n/2-1]+vs[n/2])/2;
  return PULSE_SPREAD_NORM[m.id] = med > 0 ? 1/med : 1;
}
function pulseStoreVal(store, m){ return m.current * pulseStoreRaw(store, m) * pulseNorm(m); }
function pulseMedianOf(vals){
  const n = vals.length;
  if(!n) return 0;
  return n % 2 ? vals[(n-1)/2] : (vals[n/2-1]+vals[n/2])/2;
}
function pulsePeerStats(m, peer){
  const peers = pulseStoresFor(peer);
  const vals = peers.map(s=>({ store:s, v: pulseStoreVal(s, m) })).sort((a,b)=> m.lowerIsBetter ? a.v-b.v : b.v-a.v);
  const best = vals[0], worst = vals[vals.length-1];
  const corpVals = pulseStoresFor('corporate').map(s=>pulseStoreVal(s,m)).sort((a,b)=>a-b);
  const franVals = pulseStoresFor('franchise').map(s=>pulseStoreVal(s,m)).sort((a,b)=>a-b);
  return { peers, best, worst, corpMed: pulseMedianOf(corpVals), franMed: pulseMedianOf(franVals) };
}
