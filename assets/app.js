/* ============================================================
   AI Dashboard — Shared data model + common chrome behaviour
   ============================================================ */

const STORAGE_KEYS = {
  dashboards: 'aidash_dashboards_v1',
  apps:       'aidash_apps_v1',
  defaultDashboard: 'aidash_default_dashboard_v1'
};

/* ---------- Default dashboards (built-in, hand designed) ---------- */
const DEFAULT_DASHBOARDS = [
  { id:'aihub',       name:'AI Hub Dashboard',        icon:'git-branch', color:'indigo', order:955, active:true, enableAllRoles:true, isOrg:false, builtin:true, group:'ai', roles:{} },
  { id:'pulseindex',  name:'Pulse Index Dashboard',  icon:'activity', color:'indigo', order:960, active:true, enableAllRoles:true, isOrg:false, builtin:true, group:'ai', roles:{} },
  { id:'aiorgdashboard', name:'AI Organization Dashboard', icon:'presentation', color:'indigo', order:965, active:false, enableAllRoles:true, isOrg:false, builtin:true, group:'ai', isPageLink:true, roles:{} },
  { id:'storehealth', name:'Store Health Dashboard', icon:'heart-pulse', color:'blue',   order:1000, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{} },
  { id:'compliance',  name:'Compliance Dashboard',   icon:'shield-check',color:'green',  order:1010, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{} },
  { id:'risk',        name:'Risk Dashboard',         icon:'triangle-alert',color:'red',  order:1020, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{} },
  { id:'timeloss',    name:'Timeloss Dashboard',     icon:'timer-reset', color:'orange', order:1030, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{} },
  { id:'dar',         name:'DAR Dashboard',          icon:'clipboard-list',color:'purple',order:1040, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{} }
];

const DEFAULT_APPS = [
  { id:'ai-dashboard',   name:'AI Dashboard',    icon:'sparkles',    color:'#8b5cf6', enabled:true },
  { id:'workflow',       name:'Workflow',        icon:'workflow',    color:'#1e3a8a', enabled:true },
  { id:'zip-clock',      name:'Zip Clock',       icon:'clock',       color:'#0ea5e9', enabled:true },
  { id:'zip-forecasting',name:'Zip Forecasting', icon:'trending-up', color:'#10b981', enabled:true },
  { id:'zip-reports',    name:'Zip Reports',     icon:'bar-chart-3', color:'#4f46e5', enabled:false }
];

const ROLES = [
  'Admin With Billing','Owner','Crew','Regional Manager','Admin',
  'Franchise Admin','Franchise Regional Manager','Assistant Manager','Shift Manager','Manager'
];

const ICON_CHOICES = ['heart-pulse','shield-check','triangle-alert','timer-reset','clipboard-list',
  'layout-dashboard','bar-chart-2','trending-up','activity','gauge','banknote','users','clock','calendar-days','star'];

/* Component library used by the Sections builder */
const COMPONENT_LIBRARY = {
  banner: [
    { key:'storehealth_summary', label:'Store Health Summary', icon:'heart-pulse' },
    { key:'compliance_summary',  label:'System Compliance',    icon:'shield-check' },
    { key:'risk_summary',        label:'Risk Analysis Summary',icon:'triangle-alert' },
    { key:'timeloss_summary',    label:'Time Loss Summary',    icon:'timer-off' },
    { key:'dar_summary',         label:'DAR Summary',          icon:'clipboard-list' }
  ],
  grid: [
    { key:'labor_performance', label:'Labor Performance', icon:'calendar-check', color:'blue' },
    { key:'inventory_control', label:'Inventory Control', icon:'shopping-cart',  color:'orange' },
    { key:'payroll_management',label:'Payroll Management',icon:'clock',         color:'green' },
    { key:'cash_control',      label:'Cash Control',      icon:'banknote',      color:'red' },
    { key:'labor_exceptions',  label:'Labor Exceptions',  icon:'alert-octagon', color:'purple' },
    { key:'scheduling_optimization', label:'Scheduling Optimization', icon:'calendar-clock', color:'indigo' }
  ],
  kpi: [
    { key:'kpi_tile', label:'KPI Tile', icon:'gauge', color:'blue' },
    { key:'mini_kpi_tile', label:'Mini KPI Tile', icon:'activity', color:'indigo' }
  ],
  table: [
    { key:'historical_data', label:'Historical Data Table', icon:'table', color:'blue' }
  ],
  chart: [
    { key:'trend_chart', label:'Trend Chart', icon:'line-chart', color:'blue' },
    { key:'bar_chart', label:'Bar Chart', icon:'bar-chart-3', color:'indigo' }
  ]
};

const LAYOUT_TYPES = [
  { key:'1col-header', label:'1 Column (Headers)', cols:1, kind:'banner' },
  { key:'2col-grid',   label:'2 Columns (Grids)',  cols:2, kind:'grid' },
  { key:'3col-kpi',    label:'3 Columns (KPIs)',   cols:3, kind:'kpi' },
  { key:'5col-kpi',    label:'5 Columns (Mini KPIs)', cols:5, kind:'kpi' },
  { key:'1col-table',  label:'1 Column (Table)',   cols:1, kind:'table' },
  { key:'2col-chart',  label:'2 Column (Charts)',  cols:2, kind:'chart' }
];

/* Suggested dashboard layouts — styled after the 5 built-in dashboards,
   built entirely from LAYOUT_TYPES + COMPONENT_LIBRARY so they can be
   turned into a real editing.sections array. Labelled generically
   ("Layout N") since the card itself now shows a visual wireframe of
   the row/column structure — `desc` is kept only as a hover tooltip. */
const DASHBOARD_LAYOUT_TEMPLATES = [
  { key:'storehealth', label:'Layout 1', desc:'Banner + 5 mini KPIs + 2 grid sections',
    rows:[
      { layout:'1col-header', components:['storehealth_summary'] },
      { layout:'5col-kpi', components:['mini_kpi_tile','mini_kpi_tile','mini_kpi_tile','mini_kpi_tile','mini_kpi_tile'] },
      { layout:'2col-grid', components:['labor_performance','inventory_control'] }
    ]},
  { key:'compliance', label:'Layout 2', desc:'Banner + 3 KPI tiles + 2 grid sections',
    rows:[
      { layout:'1col-header', components:['compliance_summary'] },
      { layout:'3col-kpi', components:['kpi_tile','kpi_tile','kpi_tile'] },
      { layout:'2col-grid', components:['payroll_management','labor_exceptions'] }
    ]},
  { key:'risk', label:'Layout 3', desc:'Banner + 3 KPI tiles + grid section',
    rows:[
      { layout:'1col-header', components:['risk_summary'] },
      { layout:'3col-kpi', components:['kpi_tile','kpi_tile','kpi_tile'] },
      { layout:'2col-grid', components:['labor_exceptions','scheduling_optimization'] }
    ]},
  { key:'timeloss', label:'Layout 4', desc:'Banner + 2 charts + 5 mini KPIs',
    rows:[
      { layout:'1col-header', components:['timeloss_summary'] },
      { layout:'2col-chart', components:['trend_chart','bar_chart'] },
      { layout:'5col-kpi', components:['mini_kpi_tile','mini_kpi_tile','mini_kpi_tile','mini_kpi_tile','mini_kpi_tile'] }
    ]},
  { key:'dar', label:'Layout 5', desc:'Banner + 5 mini KPIs + historical table',
    rows:[
      { layout:'1col-header', components:['dar_summary'] },
      { layout:'5col-kpi', components:['mini_kpi_tile','mini_kpi_tile','mini_kpi_tile','mini_kpi_tile','mini_kpi_tile'] },
      { layout:'1col-table', components:['historical_data'] }
    ]}
];

/* Built-in dashboards retired after already having shipped to browsers —
   removing an entry from DEFAULT_DASHBOARDS alone only stops *new*
   sessions from seeding it; a browser that already saved it to
   localStorage would keep it around forever otherwise. */
const REMOVED_DASHBOARD_IDS = ['aiinsighthub', 'insights'];

/* ---------- Persistence helpers ---------- */
function loadDashboards(){
  try{
    const raw = localStorage.getItem(STORAGE_KEYS.dashboards);
    if(!raw) { saveDashboards(DEFAULT_DASHBOARDS); return clone(DEFAULT_DASHBOARDS); }
    let list = JSON.parse(raw);
    // migrate: add any newly-introduced built-in dashboards that pre-existing browsers don't have yet
    let changed = false;
    DEFAULT_DASHBOARDS.forEach(d=>{
      const existing = list.find(x=>x.id===d.id);
      if(!existing){ list.push(clone(d)); changed = true; }
      else{
        // backfill any fields added to a builtin dashboard's definition after this browser's first load
        // (e.g. `group`) without touching fields the user may have already customized (active/order/...)
        Object.keys(d).forEach(key=>{
          if(existing[key]===undefined){ existing[key] = clone(d[key]); changed = true; }
        });
      }
    });
    const preRemoveCount = list.length;
    list = list.filter(d=> !REMOVED_DASHBOARD_IDS.includes(d.id));
    if(list.length !== preRemoveCount) changed = true;
    if(changed) saveDashboards(list);
    return list;
  }catch(e){ return clone(DEFAULT_DASHBOARDS); }
}
function saveDashboards(list){ localStorage.setItem(STORAGE_KEYS.dashboards, JSON.stringify(list)); }

function loadDefaultDashboard(){
  try{ return localStorage.getItem(STORAGE_KEYS.defaultDashboard) || null; }catch(e){ return null; }
}
function saveDefaultDashboard(id){ localStorage.setItem(STORAGE_KEYS.defaultDashboard, id); }

function loadApps(){
  try{
    const raw = localStorage.getItem(STORAGE_KEYS.apps);
    if(!raw){ saveApps(DEFAULT_APPS); return clone(DEFAULT_APPS); }
    return JSON.parse(raw);
  }catch(e){ return clone(DEFAULT_APPS); }
}
function saveApps(list){ localStorage.setItem(STORAGE_KEYS.apps, JSON.stringify(list)); }

function clone(o){ return JSON.parse(JSON.stringify(o)); }
function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

/* ---------- New KPI tile design (Store Health / Timeloss / DAR) ----------
   Flag lives in Global/Organization Setting, next to "Add Dashboard".
   Checked by default — absent key means "on", not "off". ---------- */
const NEW_KPI_TILE_KEY = 'aidash_new_kpi_tile_v1';
function newKpiTileEnabled(){
  try{ const v = localStorage.getItem(NEW_KPI_TILE_KEY); return v === null ? true : v === 'true'; }catch(e){ return true; }
}
function setNewKpiTileEnabled(v){
  try{ localStorage.setItem(NEW_KPI_TILE_KEY, v ? 'true' : 'false'); }catch(e){}
}

/* Third tile design — same data as the "new" tile above, laid out as
   3 side-by-side columns (CUR / WTD / MTD) instead of 3 stacked rows.
   Only one of the two "new" designs can be on at a time; both off
   falls back to the original tile with the sparkline. */
const NEW_VERSION_KPI_KEY = 'aidash_new_version_kpi_v1';
function newVersionKpiEnabled(){
  try{ return localStorage.getItem(NEW_VERSION_KPI_KEY) === 'true'; }catch(e){ return false; }
}
function setNewVersionKpiEnabled(v){
  try{ localStorage.setItem(NEW_VERSION_KPI_KEY, v ? 'true' : 'false'); }catch(e){}
}

/* Fourth tile design — the original sparkline tile, but with an MTD
   row added to the comparison table and the side box expanded to show
   WTD + MTD stacked (instead of WTD alone). Also mutually exclusive
   with the two flags above — only one KPI tile design is ever on. */
const KPI_VERSION1_KEY = 'aidash_kpi_version1_v1';
function newKpiVersion1Enabled(){
  try{ return localStorage.getItem(KPI_VERSION1_KEY) === 'true'; }catch(e){ return false; }
}
function setNewKpiVersion1Enabled(v){
  try{ localStorage.setItem(KPI_VERSION1_KEY, v ? 'true' : 'false'); }catch(e){}
}

/* ---------- AI Organization Dashboard sidebar link — hidden unless
   its row in the Dashboards list (Global/Organization Setting) is
   switched on. Off by default. ---------- */
function applyAiOrgDashboardVisibility(){
  const d = loadDashboards().find(x=>x.id==='aiorgdashboard');
  const show = !!(d && d.active);
  document.querySelectorAll('#sideAiOrgLink').forEach(el=> el.classList.toggle('hidden', !show));
}

/* ---------- Common chrome behaviour (topbar dropdowns, clock) ---------- */
function toggleMenu(id){
  const m = document.getElementById(id);
  if(m) m.classList.toggle('hidden');
}
document.addEventListener('click', function(e){
  document.querySelectorAll('[data-dropdown-menu]').forEach(function(m){
    const btnId = m.getAttribute('data-trigger');
    const btn = btnId ? document.getElementById(btnId) : null;
    if(!m.classList.contains('hidden') && !m.contains(e.target) && !(btn && btn.contains(e.target))){
      m.classList.add('hidden');
    }
  });
});

function startClock(){
  const el = document.getElementById('topClock');
  if(!el) return;
  function tick(){
    const now = new Date();
    let h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if(h===0) h = 12;
    const m = String(now.getMinutes()).padStart(2,'0');
    el.textContent = String(h).padStart(2,'0') + ':' + m + ' ' + ampm + ' AMERICA/LOS ANGELES';
  }
  tick();
  setInterval(tick, 30000);
}

function renderAppsMenu(containerId){
  const apps = loadApps().filter(a=>a.enabled);
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = apps.map(a => `
    <div class="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 cursor-pointer">
      <span class="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style="background:${a.color}">
        <i data-lucide="${a.icon}" class="w-4 h-4 text-white"></i>
      </span>
      <span>${a.name}</span>
    </div>`).join('') + `
    <div class="my-1 border-t border-slate-100"></div>
    <a href="settings.html?scope=global" class="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 cursor-pointer">
      <span class="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style="background:#64748b">
        <i data-lucide="settings" class="w-4 h-4 text-white"></i>
      </span>
      <span>Settings</span>
    </a>`;
}

document.addEventListener('DOMContentLoaded', function(){
  startClock();
  renderAppsMenu('myAppsMenu');
  applyAiOrgDashboardVisibility();
  if(window.lucide) lucide.createIcons();
});
