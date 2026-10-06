/* ============================================================
   AI Dashboard — Shared data model + common chrome behaviour
   ============================================================ */

const STORAGE_KEYS = {
  dashboards: 'aidash_dashboards_v1',
  apps:       'aidash_apps_v1',
  defaultDashboard: 'aidash_default_dashboard_v1',
  kpiSettings: 'aidash_kpi_settings_v3',
  kpiFamilies: 'aidash_kpi_families_v2',
  dashboardSchedules: 'aidash_dashboard_schedules_v2',
  customKpis: 'aidash_custom_kpis_v2',
  dailyBriefDesignMigrated: 'aidash_daily_brief_design_migrated_v1'
};

/* The app has no real login, but Self Scheduling still needs "your email"
   to be something rather than a blank the user has to type — this is the
   one identity the rest of the chrome already implies (sidebar footer's
   "Dashboard User", the current franchise in the topbar). */
const CURRENT_USER_EMAIL = 'dashboarduser@originalfishtaco.com';

/* ---------- Grid KPI target values (Store Health's 4 modules only) ----------
   Score-vs-target is only configured for Store Health's Labor Performance /
   Inventory Control / Payroll Management / Cash Control — Compliance and
   Risk's grid modules don't carry a per-row SCORE on the real dashboard
   either, so there's nothing for a target to drive there. Most targets
   compare straight against the KPI's own current value; three are only
   meaningful measured against a *different* figure (Waste against Total
   Food Cost, not against Waste itself), so those carry a note — read by
   settings.js's KPI Settings modal — instead of leaving that to guesswork.
   Net Sales has no numeric target at all: it's scored by comparison
   against Forecasted Sales, not a fixed %. */
const GRID_KPI_TARGET_DEFAULTS = {
  'labor_performance|Scheduled Labor %': 25,
  'labor_performance|Variance': 2,
  'labor_performance|SPLH': 0.6,
  'inventory_control|Food Cost %': 30,
  'inventory_control|Variance': 0.5,
  'inventory_control|Waste': 3,
  'payroll_management|Actual Labor %': 25,
  'payroll_management|Variance': 2,
  'payroll_management|SPLH': 0.6,
  'cash_control|Refunds/Voids/Comps': 2,
  'cash_control|Cash Over/Short': 1
};
const GRID_KPI_TARGET_NOTES = {
  'inventory_control|Waste': 'Target is % of Total Food Cost, not of Waste itself',
  'cash_control|Refunds/Voids/Comps': 'Target is % of Net Sales',
  'cash_control|Cash Over/Short': 'Target is % of Sales',
  'cash_control|Net Sales': 'Scored by comparison against Forecasted Sales — no % target'
};
function gridTargetsFor(moduleKey){
  const out = {};
  Object.keys(GRID_KPI_TARGET_DEFAULTS).forEach(k=>{
    if(k.indexOf(moduleKey+'|')===0) out[k.slice(moduleKey.length+1)] = GRID_KPI_TARGET_DEFAULTS[k];
  });
  return out;
}

/* ---------- Default dashboards (built-in, hand designed) ---------- */
const DEFAULT_DASHBOARDS = [
  { id:'dailydigest', name:'Daily Brief Dashboard',  icon:'radar', color:'indigo', order:950, active:true, enableAllRoles:true, isOrg:false, builtin:true, group:'ai', noSections:true, roles:{}, dailyBriefV1:true },
  { id:'aihub',       name:'AI Hub Dashboard',        icon:'git-branch', color:'indigo', order:955, active:true, enableAllRoles:true, isOrg:false, builtin:true, group:'ai', noSections:true, roles:{} },
  { id:'pulseindex',  name:'Pulse Index Dashboard',  icon:'activity', color:'indigo', order:960, active:true, enableAllRoles:true, isOrg:false, builtin:true, group:'ai', noSections:true, roles:{} },
  { id:'aiorgdashboard', name:'Multi-Store Dashboard', icon:'presentation', color:'indigo', order:965, active:false, enableAllRoles:true, isOrg:false, builtin:true, group:'ai', isPageLink:true, roles:{} },
  { id:'storehealth', name:'Store Health Dashboard', icon:'heart-pulse', color:'blue',   order:1000, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{},
    sections:[
      { layout:'1col-header', slots:[ {kind:'banner', key:'storehealth_summary', label:'Store Health Summary', icon:'heart-pulse'} ] },
      { layout:'6col-kpi', slots:[
          {kind:'kpi', key:'storehealth_labor_pct', label:'Labor % (Store Health)', icon:'user', color:'indigo'},
          {kind:'kpi', key:'storehealth_food_cost_pct', label:'Food Cost % (Store Health)', icon:'utensils', color:'orange'},
          {kind:'kpi', key:'storehealth_splh', label:'SPLH (Store Health)', icon:'clock-4', color:'teal'},
          {kind:'kpi', key:'storehealth_net_sales', label:'Net Sales (Store Health)', icon:'bar-chart-3', color:'blue'},
          {kind:'kpi', key:'storehealth_actual_ot_pct', label:'Actual OT % (Store Health)', icon:'circle-gauge', color:'purple'},
          {kind:'kpi', key:'storehealth_ai_tile', label:'AI Insight (Store Health)', icon:'lightbulb', color:'indigo'}
      ]},
      { layout:'2col-grid', slots:[
          {kind:'grid', key:'labor_performance', label:'Labor Performance', icon:'calendar-check', color:'blue', targets:gridTargetsFor('labor_performance')},
          {kind:'grid', key:'inventory_control', label:'Inventory Control', icon:'shopping-cart', color:'orange', targets:gridTargetsFor('inventory_control')}
      ]},
      { layout:'2col-grid', slots:[
          {kind:'grid', key:'payroll_management', label:'Payroll Management', icon:'clock', color:'green', targets:gridTargetsFor('payroll_management')},
          {kind:'grid', key:'cash_control', label:'Cash Control', icon:'banknote', color:'red', targets:gridTargetsFor('cash_control')}
      ]}
    ] },
  { id:'compliance',  name:'Compliance Dashboard',   icon:'shield-check',color:'green',  order:1010, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{},
    sections:[
      { layout:'1col-header', slots:[ {kind:'banner', key:'compliance_summary', label:'System Compliance', icon:'shield-check'} ] },
      { layout:'2col-grid', slots:[
          {kind:'grid', key:'attendance_behaviour', label:'Attendance Behaviour', icon:'calendar-check', color:'blue'},
          {kind:'grid', key:'minors_compliance', label:'Minors Compliance', icon:'shield-alert', color:'orange'}
      ]},
      { layout:'2col-grid', slots:[
          {kind:'grid', key:'breaks_management', label:'Breaks Management', icon:'coffee', color:'green'},
          {kind:'grid', key:'labor_exceptions', label:'Labor Exceptions', icon:'alert-octagon', color:'red'}
      ]},
      { layout:'2col-grid', slots:[
          {kind:'grid', key:'scheduling_optimization', label:'Scheduling Optimization', icon:'calendar-clock', color:'purple'},
          {kind:'grid', key:'fair_work_week', label:'Fair Work Week', icon:'scale', color:'indigo'}
      ]}
    ] },
  { id:'risk',        name:'Risk Dashboard',         icon:'triangle-alert',color:'red',  order:1020, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{},
    sections:[
      { layout:'1col-header', slots:[ {kind:'banner', key:'risk_summary', label:'Risk Analysis Summary', icon:'triangle-alert'} ] },
      { layout:'2col-grid', slots:[
          {kind:'grid', key:'labor_risk', label:'Labor Risk', icon:'users', color:'blue'},
          {kind:'grid', key:'inventory_risk', label:'Inventory Risk', icon:'package', color:'orange'}
      ]},
      { layout:'2col-grid', slots:[
          {kind:'grid', key:'compliance_risk', label:'Compliance Risk', icon:'shield-check', color:'green'},
          {kind:'grid', key:'sch_risk', label:'SCH Risk', icon:'calendar-x', color:'red'}
      ]},
      { layout:'2col-grid', slots:[
          {kind:'grid', key:'sales_risk', label:'Sales Risk', icon:'trending-down', color:'purple'},
          null
      ]}
    ] },
  { id:'timeloss',    name:'Timeloss Dashboard',     icon:'timer-reset', color:'orange', order:1030, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{},
    sections:[
      { layout:'1col-header', slots:[ {kind:'banner', key:'timeloss_summary', label:'Time Loss Summary', icon:'timer-off'} ] },
      { layout:'6col-kpi', slots:[
          {kind:'kpi', key:'timeloss_actual_sales', label:'Actual Sales (Timeloss)', icon:'bar-chart-3', color:'blue'},
          {kind:'kpi', key:'timeloss_labor_pct', label:'Labor % (Timeloss)', icon:'user', color:'indigo'},
          {kind:'kpi', key:'timeloss_early_clock_in', label:'Early Clock In (Timeloss)', icon:'clock-4', color:'teal'},
          {kind:'kpi', key:'timeloss_late_clock_out', label:'Late Clock Out (Timeloss)', icon:'bar-chart-3', color:'blue'},
          {kind:'kpi', key:'timeloss_ot_loss', label:'OT Loss (Timeloss)', icon:'circle-gauge', color:'purple'},
          {kind:'kpi', key:'timeloss_ai_tile', label:'AI Insight (Timeloss)', icon:'lightbulb', color:'indigo'}
      ]},
      { layout:'2col-chart', slots:[
          {kind:'chart', key:'timeloss_chart_1', label:'Current Week Time Loss', icon:'bar-chart-3', color:'blue'},
          {kind:'chart', key:'timeloss_chart_2', label:'Time Loss Trend', icon:'line-chart', color:'indigo'}
      ]},
      { layout:'1col-table', slots:[ {kind:'table', key:'historical_data', label:'Historical Data Table', icon:'table', color:'blue'} ] }
    ] },
  { id:'dar',         name:'DAR Dashboard',          icon:'clipboard-list',color:'purple',order:1040, active:true, enableAllRoles:true,  isOrg:false, builtin:true, roles:{},
    sections:[
      { layout:'1col-header', slots:[ {kind:'banner', key:'dar_summary', label:'DAR Summary', icon:'clipboard-list'} ] },
      { layout:'6col-kpi-fixed', slots:[
          {kind:'kpi', key:'dar_actual_sales', label:'Actual Sales (DAR)', icon:'bar-chart-3', color:'blue'},
          {kind:'kpi', key:'dar_labor_pct', label:'Labor % (DAR)', icon:'user', color:'indigo'},
          {kind:'kpi', key:'dar_food_cost_pct', label:'Food Cost % (DAR)', icon:'utensils', color:'orange'},
          {kind:'kpi', key:'dar_splh', label:'SPLH (DAR)', icon:'clock-4', color:'teal'},
          {kind:'kpi', key:'dar_transactions', label:'Transactions (DAR)', icon:'users', color:'purple'},
          {kind:'kpi', key:'dar_labor_hours', label:'Labor Hours (DAR)', icon:'circle-gauge', color:'purple'}
      ]},
      { layout:'6col-kpi-fixed', slots:[
          {kind:'kpi', key:'dar_act_vs_ideal_hrs', label:'Act vs Ideal Hrs. (DAR)', icon:'bar-chart-3', color:'blue'},
          {kind:'kpi', key:'dar_act_vs_sch_hrs', label:'Act vs Sch Hrs. (DAR)', icon:'user', color:'indigo'},
          {kind:'kpi', key:'dar_financial_loss', label:'Financial Loss ($) (DAR)', icon:'clock-4', color:'teal'},
          {kind:'kpi', key:'dar_time_loss_hrs', label:'Time Loss (Hrs.) (DAR)', icon:'bar-chart-3', color:'blue'},
          {kind:'kpi', key:'dar_act_vs_fct_sales', label:'Act vs Fct Sales (DAR)', icon:'users', color:'purple'},
          {kind:'kpi', key:'dar_act_vs_fct_trans', label:'Act vs Fct Trans. (DAR)', icon:'circle-gauge', color:'purple'}
      ]}
    ] }
];

const DEFAULT_APPS = [
  { id:'ai-dashboard',   name:'AI Dashboard',    icon:'sparkles',    color:'#8b5cf6', enabled:true },
  { id:'workflow',       name:'Workflow',        icon:'list-checks', color:'#1e3a8a', enabled:true },
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

/* Component library used by the Sections builder. Grid/kpi/table/chart keys
   are resolved back to real data by the lookup maps at the bottom of
   assets/dashboard-data.js (BANNER_BY_KEY etc.) — see renderComponentPreviewFull()
   in dashboard-render.js, which is what actually renders a live dashboard's
   sections. Keys not found in those maps still render a generic placeholder
   (used for genuinely custom, hand-picked components with no real data source). */
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
    { key:'attendance_behaviour', label:'Attendance Behaviour', icon:'calendar-check', color:'blue' },
    { key:'minors_compliance', label:'Minors Compliance', icon:'shield-alert', color:'orange' },
    { key:'breaks_management', label:'Breaks Management', icon:'coffee', color:'green' },
    { key:'labor_exceptions',  label:'Labor Exceptions',  icon:'alert-octagon', color:'red' },
    { key:'scheduling_optimization', label:'Scheduling Optimization', icon:'calendar-clock', color:'purple' },
    { key:'fair_work_week',    label:'Fair Work Week',    icon:'scale',         color:'indigo' },
    { key:'labor_risk',        label:'Labor Risk',        icon:'users',         color:'blue' },
    { key:'inventory_risk',    label:'Inventory Risk',    icon:'package',       color:'orange' },
    { key:'compliance_risk',   label:'Compliance Risk',   icon:'shield-check',  color:'green' },
    { key:'sch_risk',          label:'SCH Risk',          icon:'calendar-x',    color:'red' },
    { key:'sales_risk',        label:'Sales Risk',        icon:'trending-down', color:'purple' }
  ],
  kpi: [
    { key:'kpi_tile', label:'KPI Tile', icon:'gauge', color:'blue' },
    { key:'mini_kpi_tile', label:'Mini KPI Tile', icon:'activity', color:'indigo' },
    { key:'storehealth_labor_pct', label:'Labor % (Store Health)', icon:'user', color:'indigo' },
    { key:'storehealth_food_cost_pct', label:'Food Cost % (Store Health)', icon:'utensils', color:'orange' },
    { key:'storehealth_splh', label:'SPLH (Store Health)', icon:'clock-4', color:'teal' },
    { key:'storehealth_net_sales', label:'Net Sales (Store Health)', icon:'bar-chart-3', color:'blue' },
    { key:'storehealth_actual_ot_pct', label:'Actual OT % (Store Health)', icon:'circle-gauge', color:'purple' },
    { key:'storehealth_ai_tile', label:'AI Insight (Store Health)', icon:'lightbulb', color:'indigo' },
    { key:'timeloss_actual_sales', label:'Actual Sales (Timeloss)', icon:'bar-chart-3', color:'blue' },
    { key:'timeloss_labor_pct', label:'Labor % (Timeloss)', icon:'user', color:'indigo' },
    { key:'timeloss_early_clock_in', label:'Early Clock In (Timeloss)', icon:'clock-4', color:'teal' },
    { key:'timeloss_late_clock_out', label:'Late Clock Out (Timeloss)', icon:'bar-chart-3', color:'blue' },
    { key:'timeloss_ot_loss', label:'OT Loss (Timeloss)', icon:'circle-gauge', color:'purple' },
    { key:'timeloss_ai_tile', label:'AI Insight (Timeloss)', icon:'lightbulb', color:'indigo' },
    { key:'dar_actual_sales', label:'Actual Sales (DAR)', icon:'bar-chart-3', color:'blue' },
    { key:'dar_labor_pct', label:'Labor % (DAR)', icon:'user', color:'indigo' },
    { key:'dar_food_cost_pct', label:'Food Cost % (DAR)', icon:'utensils', color:'orange' },
    { key:'dar_splh', label:'SPLH (DAR)', icon:'clock-4', color:'teal' },
    { key:'dar_transactions', label:'Transactions (DAR)', icon:'users', color:'purple' },
    { key:'dar_labor_hours', label:'Labor Hours (DAR)', icon:'circle-gauge', color:'purple' },
    { key:'dar_act_vs_ideal_hrs', label:'Act vs Ideal Hrs. (DAR)', icon:'bar-chart-3', color:'blue' },
    { key:'dar_act_vs_sch_hrs', label:'Act vs Sch Hrs. (DAR)', icon:'user', color:'indigo' },
    { key:'dar_financial_loss', label:'Financial Loss ($) (DAR)', icon:'clock-4', color:'teal' },
    { key:'dar_time_loss_hrs', label:'Time Loss (Hrs.) (DAR)', icon:'bar-chart-3', color:'blue' },
    { key:'dar_act_vs_fct_sales', label:'Act vs Fct Sales (DAR)', icon:'users', color:'purple' },
    { key:'dar_act_vs_fct_trans', label:'Act vs Fct Trans. (DAR)', icon:'circle-gauge', color:'purple' }
  ],
  table: [
    { key:'historical_data', label:'Historical Data Table', icon:'table', color:'blue' }
  ],
  chart: [
    { key:'trend_chart', label:'Trend Chart', icon:'line-chart', color:'blue' },
    { key:'bar_chart', label:'Bar Chart', icon:'bar-chart-3', color:'indigo' },
    { key:'timeloss_chart_1', label:'Current Week Time Loss', icon:'bar-chart-3', color:'blue' },
    { key:'timeloss_chart_2', label:'Time Loss Trend', icon:'line-chart', color:'indigo' }
  ]
};

/* Keeps COMPONENT_LIBRARY.kpi's user-created entries in sync with the
   Custom KPI screen — called before the Sections "Select Component"
   modal renders, so every active Custom KPI shows up as a pickable
   5-column mini KPI alongside the built-in ones. */
function syncCustomKpisIntoComponentLibrary(){
  COMPONENT_LIBRARY.kpi = COMPONENT_LIBRARY.kpi.filter(c => c.key.indexOf('custom-') !== 0);
  loadCustomKpis().filter(c => c.active !== false).forEach(c=>{
    COMPONENT_LIBRARY.kpi.push({ key:customKpiRegistryKey(c.id), label:c.name, icon:'calculator', color:'indigo' });
  });
}

const LAYOUT_TYPES = [
  { key:'1col-header', label:'1 Column (Headers)', cols:1, kind:'banner' },
  { key:'2col-grid',   label:'2 Columns (Grids)',  cols:2, kind:'grid' },
  { key:'3col-kpi',    label:'3 Columns (KPIs)',   cols:3, kind:'kpi' },
  { key:'5col-kpi',    label:'5 Columns (Mini KPIs)', cols:5, kind:'kpi' },
  { key:'6col-kpi',    label:'6 Columns (KPIs + AI Insight)', cols:6, kind:'kpi' },
  { key:'6col-kpi-fixed', label:'6 Columns (Fixed KPI Grid)', cols:6, kind:'kpi', wrap:'fixed' },
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
    if(!raw) {
      saveDashboards(DEFAULT_DASHBOARDS);
      // fresh seed already reflects the current default (dailyBriefV1:true)
      // — mark the one-time migration below as already handled, so it
      // never later flips a genuine off-choice back to on.
      localStorage.setItem(STORAGE_KEYS.dailyBriefDesignMigrated, '1');
      return clone(DEFAULT_DASHBOARDS);
    }
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
    // one-time rename/reorder: "Daily Digest" -> "Daily Brief", moved ahead of AI Hub.
    // Only touches browsers still holding the old default values, so a user who
    // already renamed/reordered it themselves keeps their own choice.
    const digest = list.find(x=>x.id==='dailydigest');
    if(digest && digest.name==='Daily Digest Dashboard'){ digest.name = 'Daily Brief Dashboard'; changed = true; }
    if(digest && digest.order===962){ digest.order = 950; changed = true; }

    // one-time rename: "AI Organization Dashboard" -> "Multi-Store Dashboard"
    // (only if the browser still holds the old default name)
    const aiOrg = list.find(x=>x.id==='aiorgdashboard');
    if(aiOrg && aiOrg.name==='AI Organization Dashboard'){ aiOrg.name = 'Multi-Store Dashboard'; changed = true; }

    // one-time collapse: Daily Brief used to have two separate flags
    // (newspaperMode / dailyBriefV1) toggled from two different places;
    // now there's a single dailyBriefV1 flag (default on) in the topbar's
    // quick settings. A browser that had explicitly switched to Newspaper
    // (dailyBriefV1:false, newspaperMode:true) keeps showing Newspaper;
    // everyone else gets the new default. Guarded by its own marker (not
    // just "still false") so this fires exactly once per browser —
    // otherwise it would re-flip the flag back on every load for anyone
    // who deliberately turns it back off, making the toggle impossible to
    // actually disable.
    if(digest && !localStorage.getItem(STORAGE_KEYS.dailyBriefDesignMigrated)){
      const explicitlyChoseNewspaper = digest.dailyBriefV1===false && digest.newspaperMode===true;
      if(!explicitlyChoseNewspaper && digest.dailyBriefV1!==true){ digest.dailyBriefV1 = true; changed = true; }
      if(digest.newspaperMode!==undefined){ delete digest.newspaperMode; changed = true; }
      localStorage.setItem(STORAGE_KEYS.dailyBriefDesignMigrated, '1');
    }

    // one-time backfill: Store Health's 4 grid modules get their default
    // KPI target values — browsers that already had storehealth's sections
    // saved (with no `targets` yet on those slots) get them added here,
    // same as a fresh seed would. Doesn't touch a slot that already has
    // its own targets (a user's own configuration always wins).
    const storehealth = list.find(x=>x.id==='storehealth');
    if(storehealth && Array.isArray(storehealth.sections)){
      storehealth.sections.forEach(row=>{
        (row.slots||[]).forEach(slot=>{
          if(slot && slot.kind==='grid' && !slot.targets){
            const defaults = gridTargetsFor(slot.key);
            if(Object.keys(defaults).length){ slot.targets = defaults; changed = true; }
          }
        });
      });
    }

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
    const list = JSON.parse(raw);
    // one-time icon fix: "workflow" lucide icon read as a weak/unclear glyph
    // in the App Settings grid — browsers that already seeded the old icon
    // get it corrected here rather than only in DEFAULT_APPS.
    let changed = false;
    const wf = list.find(a=>a.id==='workflow');
    if(wf && wf.icon==='workflow'){ wf.icon = 'list-checks'; changed = true; }
    if(changed) saveApps(list);
    return list;
  }catch(e){ return clone(DEFAULT_APPS); }
}
function saveApps(list){ localStorage.setItem(STORAGE_KEYS.apps, JSON.stringify(list)); }

function clone(o){ return JSON.parse(JSON.stringify(o)); }
function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

/* ---------- KPI Settings (Lower/Higher/Closer-to-Zero is Better per KPI) ---------- */
const KPI_DIRECTION_VALUES = ['lower', 'higher', 'zero'];
function loadKpiSettings(){
  const catalog = buildKpiCatalog();
  let map = {};
  try{ map = JSON.parse(localStorage.getItem(STORAGE_KEYS.kpiSettings)) || {}; }catch(e){ map = {}; }
  let changed = false;
  catalog.forEach(m=>{
    if(map[m.key] === undefined){ map[m.key] = m.direction || 'higher'; changed = true; }
  });
  if(changed) saveKpiSettings(map);
  return map;
}
function saveKpiSettings(map){ localStorage.setItem(STORAGE_KEYS.kpiSettings, JSON.stringify(map)); }
function kpiDirectionOf(key){
  const map = loadKpiSettings();
  return KPI_DIRECTION_VALUES.indexOf(map[key]) !== -1 ? map[key] : 'lower';
}

/* ---------- KPI Families (module + data-type based grouping, drives
   the "Add Metric" overlay picker on the KPI trend-modal popup) ---------- */
function buildDefaultKpiFamilies(){
  const catalog = buildKpiCatalog();
  const byModule = {};
  catalog.forEach(m=>{
    if(!byModule[m.module]) byModule[m.module] = [];
    byModule[m.module].push(m.key);
  });
  return Object.keys(byModule).map(mod => ({
    id: uid('fam'), name: mod, module: mod, memberKeys: byModule[mod]
  }));
}
function loadKpiFamilies(){
  let list = null;
  try{ list = JSON.parse(localStorage.getItem(STORAGE_KEYS.kpiFamilies)); }catch(e){ list = null; }
  if(!list || !list.length){ list = buildDefaultKpiFamilies(); saveKpiFamilies(list); return list; }
  const catalog = buildKpiCatalog();
  const grouped = {};
  list.forEach(f=> (f.memberKeys||[]).forEach(k=> grouped[k]=true));
  let changed = false;
  catalog.forEach(m=>{
    if(!grouped[m.key]){
      let fam = list.find(f=>f.module===m.module);
      if(!fam){ fam = { id: uid('fam'), name:m.module, module:m.module, memberKeys:[] }; list.push(fam); }
      fam.memberKeys.push(m.key);
      changed = true;
    }
  });
  if(changed) saveKpiFamilies(list);
  return list;
}
function saveKpiFamilies(list){ localStorage.setItem(STORAGE_KEYS.kpiFamilies, JSON.stringify(list)); }
function familyForKpiKey(key){
  return loadKpiFamilies().find(f => (f.memberKeys||[]).indexOf(key)!==-1) || null;
}

/* ---------- Dashboard Scheduling (Organization Setting) ----------
   Ships with the 5 core dashboards pre-scheduled (Daily, 5 AM EST, to
   the Manager role) so the feature is demo-ready out of the box. */
function defaultScheduleBodyFor(dashName){
  return `<div>Hi Team,</div><div><br></div><div>Please find attached the <strong>${dashName}</strong>.</div>`
    + `<div>This is an automated email generated as part of the scheduled dashboard reporting process.</div><div><br></div>`
    + `<div>Best regards,</div><div>Altametrics Growth</div>`;
}
function buildDefaultDashboardSchedules(){
  const coreDashIds = ['storehealth','compliance','risk','timeloss','dar'];
  return DEFAULT_DASHBOARDS.filter(d=>coreDashIds.indexOf(d.id)!==-1).map(d => ({
    id: uid('sched'),
    dashboardId: d.id, dashboardName: d.name,
    schedulingMode: 'role', selfEmail: '', roles: ['Manager'], stores: ['236 - Bressi Ranch'],
    subject: `${d.name} | Daily`,
    emailBody: defaultScheduleBodyFor(d.name),
    frequency: 'Daily', dailyMode: 'everyDay', dailyN: 2,
    weeklyMode: 'single', weeklyDay: 'Monday', weeklyN: 2, weeklyDays: [],
    monthlyMode: 'dayOfMonth', monthlyDay: 1, monthlyMonths1: 1, monthlyNth: 'first', monthlyWeekdayType: 'Monday', monthlyMonths2: 1,
    time: '05:00', startDate: new Date().toISOString().slice(0,10),
    endType: 'noEnd', endOccurrences: 1, endDate: '',
    format: 'PNG', active: true
  }));
}
function loadDashboardSchedules(){
  try{
    const raw = localStorage.getItem(STORAGE_KEYS.dashboardSchedules);
    if(!raw){ const defaults = buildDefaultDashboardSchedules(); saveDashboardSchedules(defaults); return defaults; }
    const list = JSON.parse(raw) || [];
    // one-time sign-off fix: browsers that already seeded the default
    // schedules have the old "AI Dashboard Reporting Team" sign-off baked
    // into their saved emailBody — corrected here, not just in the builder.
    let changed = false;
    list.forEach(s=>{
      if(s.emailBody && s.emailBody.indexOf('AI Dashboard Reporting Team') !== -1){
        s.emailBody = s.emailBody.replace('AI Dashboard Reporting Team', 'Altametrics Growth');
        changed = true;
      }
    });
    if(changed) saveDashboardSchedules(list);
    return list;
  }catch(e){ return []; }
}
function saveDashboardSchedules(list){ localStorage.setItem(STORAGE_KEYS.dashboardSchedules, JSON.stringify(list)); }

/* ---------- Custom KPI (formula builder combining two existing KPIs) ----------
   Ships with 5 worked examples so the feature is demo-ready out of the box —
   each pairs two real KPIs already in dashboard-data.js. */
function buildDefaultCustomKpis(){
  return [
    { id:uid('customkpi'), name:'Total Loss Exposure', module:'Time Loss', unit:'$', direction:'lower',
      notes:'Combined dollar exposure from food waste and overtime loss.',
      xKey:'storehealth-sec-1__row2', xLabel:'Waste', yKey:'timeloss-4', yLabel:'OT Loss', formulaId:'sum', active:true },
    { id:uid('customkpi'), name:'Compliance Pressure Score', module:'Breaks', unit:'', direction:'lower',
      notes:'Break violations plus mismatched punches — a quick read on compliance risk building up.',
      xKey:'compliance-sec-1__row3', xLabel:'Break Violations', yKey:'compliance-sec-3__row0', yLabel:'Mismatch Punches', formulaId:'sum', active:true },
    { id:uid('customkpi'), name:'Sales per Labor Hour', module:'Labor', unit:'$', direction:'higher',
      notes:'Net Sales generated per labor hour worked — a productivity read alongside SPLH.',
      xKey:'storehealth-3', xLabel:'Net Sales', yKey:'dar-5', yLabel:'Labor Hours', formulaId:'ratio', active:true },
    { id:uid('customkpi'), name:'Cost Mix Delta', module:'Food Cost', unit:'%', direction:'zero',
      notes:'How far Food Cost % sits from Actual Labor % — a balance check between the two biggest cost lines.',
      xKey:'storehealth-1', xLabel:'Food Cost %', yKey:'storehealth-sec-2__row0', yLabel:'Actual Labor %', formulaId:'difference', active:true },
    { id:uid('customkpi'), name:'Overtime Recovery Ratio', module:'Time Loss', unit:'', direction:'lower',
      notes:'Overtime loss relative to waste dollars — flags weeks where OT is outpacing food loss.',
      xKey:'timeloss-4', xLabel:'OT Loss', yKey:'storehealth-sec-1__row2', yLabel:'Waste', formulaId:'ratio', active:true }
  ];
}
function loadCustomKpis(){
  try{
    const raw = localStorage.getItem(STORAGE_KEYS.customKpis);
    if(!raw){ const defaults = buildDefaultCustomKpis(); saveCustomKpis(defaults); return defaults; }
    return JSON.parse(raw) || [];
  }catch(e){ return []; }
}
function saveCustomKpis(list){ localStorage.setItem(STORAGE_KEYS.customKpis, JSON.stringify(list)); }

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

/* ---------- Multi-Store Dashboard sidebar link — hidden unless
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

/* Daily Brief has exactly two designs — the new card-based design
   (dailyBriefV1, default on) and Newspaper. One flag, checked by
   default: check it for the new design, uncheck it for Newspaper. */
function qsToggleDailyBriefV1(){
  const list = loadDashboards();
  const dd = list.find(d=>d.id==='dailydigest');
  if(!dd) return;
  dd.dailyBriefV1 = !dd.dailyBriefV1;
  saveDashboards(list);
  qsSyncDailyBriefToggles();
  if(typeof buildDailyDigest === 'function') buildDailyDigest();
}
function qsSyncDailyBriefToggles(){
  const dd = loadDashboards().find(d=>d.id==='dailydigest');
  if(!dd) return;
  const v1Btn = document.getElementById('qsV1Toggle');
  if(v1Btn) v1Btn.classList.toggle('on', !!dd.dailyBriefV1);
}

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
  el.innerHTML = apps.map(a => {
    const isAiDashboard = a.id==='ai-dashboard';
    const tag = isAiDashboard ? 'a' : 'div';
    const hrefAttr = isAiDashboard ? ' href="index.html"' : '';
    return `
    <${tag}${hrefAttr} class="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 cursor-pointer">
      <span class="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style="background:${a.color}">
        <i data-lucide="${a.icon}" class="w-4 h-4 text-white"></i>
      </span>
      <span>${a.name}</span>
    </${tag}>`;
  }).join('') + `
    <div class="my-1 border-t border-slate-100"></div>
    <a href="settings.html?section=manageaccount" class="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 cursor-pointer">
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
