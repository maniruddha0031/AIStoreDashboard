/* ============================================================
   Global Setting / Organization Setting screen logic
   Both sidebar entries point at this same page; `scope` query
   param only changes the title (feature set is identical).
   ============================================================ */

const params = new URLSearchParams(location.search);
const SCOPE = params.get('scope') === 'organization' ? 'organization' : 'global';
const SCOPE_LABEL = SCOPE === 'organization' ? 'Organization Setting' : 'Global Setting';
const SECTION = ['kpisettings','kpifamily','customkpi','manageaccount','appsettings','aidashboardsettings'].indexOf(params.get('section')) !== -1 ? params.get('section') : 'dashboards';
const AUTO_OPEN_SCHEDULE = params.get('opendashschedule') === '1';

let dashboards = [];
let apps = [];
let view = 'list';               // 'list' | 'editor'
let editing = null;              // dashboard object being edited (clone)
let isNew = false;
let editorTab = 'general';       // 'general' | 'sections' | 'roles' | 'applications'
let pendingSlot = null;          // {rowIdx, slotIdx, kind}
let editingDefaultLanding = false; // staged "Is Default Landing" choice for the dashboard being edited (Organization scope only, applied on Save)
let dashSearchTerm = '';         // Dashboards-list search box (matches name or display order)

let kpiSearchTerm = '';
let kpiModuleFilterVal = '';
let kpiFamilyView = 'list';      // 'list' | 'editor'
let editingFamily = null;
let isNewFamily = false;

let customKpiSearchTerm = '';

/* Screens reached only through the topbar's "My Apps > Settings" flow run
   without the left sidebar — Manage Account / App Settings / AI Dashboard
   settings, plus everything opened from the AI Dashboard cards (KPI
   Settings/Family/Custom KPI have no other entry point left; Dashboard
   Scheduling also has its original Organization Setting entry, which keeps
   the sidebar — see backFromDashSchedule()). */
const NO_SIDEBAR_SECTIONS = ['manageaccount','appsettings','aidashboardsettings','kpisettings','kpifamily','customkpi'];
function updateSidebarVisibility(){
  const hide = NO_SIDEBAR_SECTIONS.indexOf(SECTION)!==-1 || (SECTION==='dashboards' && view==='dashSchedule' && AUTO_OPEN_SCHEDULE);
  const row = document.querySelector('.app-row');
  if(row) row.classList.toggle('no-sidebar', hide);
}

function init(){
  dashboards = loadDashboards();
  apps = loadApps();
  if(AUTO_OPEN_SCHEDULE && SCOPE==='organization') view = 'dashSchedule';
  document.getElementById('scopeTitle').textContent = SCOPE_LABEL;
  const SECTION_TITLES = { kpisettings:'KPI Settings', kpifamily:'KPI Family', customkpi:'Custom KPI', manageaccount:'Manage Account', appsettings:'App Settings', aidashboardsettings:'AI Dashboard' };
  document.title = (SECTION_TITLES[SECTION] || SCOPE_LABEL) + ' — AI Dashboard';
  document.getElementById('sideDashLink').classList.remove('active');
  document.getElementById('sideGlobalLink').classList.toggle('active', SECTION==='dashboards' && SCOPE==='global');
  document.getElementById('sideOrgLink').classList.toggle('active', SECTION==='dashboards' && SCOPE==='organization');
  document.getElementById('defaultColHead').classList.toggle('hidden', SCOPE!=='organization');
  document.getElementById('dashScheduleNavBtn').classList.toggle('hidden', SCOPE!=='organization');
  render();
}

/* Dashboard Scheduling has two entry points: Organization Setting's own
   button (stays inside that page, sidebar visible) and the AI Dashboard
   settings card (opened via ?opendashschedule=1, sidebar hidden) — Back
   returns to wherever makes sense for how it was opened. */
function backFromDashSchedule(){
  if(AUTO_OPEN_SCHEDULE){ location.href = 'settings.html?section=aidashboardsettings'; return; }
  backToList();
}

function render(){
  updateSidebarVisibility();
  const listView = document.getElementById('listView');
  const editorView = document.getElementById('editorView');
  const dashScheduleListView = document.getElementById('dashScheduleListView');
  const kpiSettingsView = document.getElementById('kpiSettingsView');
  const kpiFamilyListView = document.getElementById('kpiFamilyListView');
  const kpiFamilyEditorView = document.getElementById('kpiFamilyEditorView');
  const customKpiListView = document.getElementById('customKpiListView');
  const manageAccountView = document.getElementById('manageAccountView');
  const appSettingsView = document.getElementById('appSettingsView');
  const aiDashboardSettingsView = document.getElementById('aiDashboardSettingsView');

  listView.classList.toggle('hidden', !(SECTION==='dashboards' && view==='list'));
  editorView.classList.toggle('hidden', !(SECTION==='dashboards' && view==='editor'));
  dashScheduleListView.classList.toggle('hidden', !(SECTION==='dashboards' && view==='dashSchedule'));
  kpiSettingsView.classList.toggle('hidden', SECTION!=='kpisettings');
  kpiFamilyListView.classList.toggle('hidden', !(SECTION==='kpifamily' && kpiFamilyView==='list'));
  kpiFamilyEditorView.classList.toggle('hidden', !(SECTION==='kpifamily' && kpiFamilyView==='editor'));
  customKpiListView.classList.toggle('hidden', SECTION!=='customkpi');
  manageAccountView.classList.toggle('hidden', SECTION!=='manageaccount');
  appSettingsView.classList.toggle('hidden', SECTION!=='appsettings');
  aiDashboardSettingsView.classList.toggle('hidden', SECTION!=='aidashboardsettings');

  // KPI Settings manages its own internal scroll (fixed title/search/table-head,
  // only the rows scroll) — the shared content wrapper must not also scroll it.
  const mainScroll = document.getElementById('mainContentScroll');
  if(mainScroll){
    const kpiSettingsActive = SECTION==='kpisettings';
    mainScroll.classList.toggle('overflow-y-auto', !kpiSettingsActive);
    mainScroll.classList.toggle('overflow-hidden', kpiSettingsActive);
  }

  if(SECTION==='dashboards'){
    if(view==='list') renderDashboardList();
    else if(view==='dashSchedule') renderDashScheduleList();
    else renderEditor();
  }else if(SECTION==='kpisettings'){
    renderKpiSettingsList();
  }else if(SECTION==='kpifamily'){
    if(kpiFamilyView==='list') renderKpiFamilyList();
    else renderKpiFamilyEditor();
  }else if(SECTION==='customkpi'){
    renderCustomKpiList();
  }else if(SECTION==='appsettings'){
    renderAppSettingsView();
  }

  if(window.lucide) lucide.createIcons();
}

/* ---------------- App Settings (Manage Account > App Settings) ----------------
   Same app roster as the "My Apps" topbar dropdown (loadApps(), app.js) — one
   card per enabled app. Only AI Dashboard actually goes anywhere; the rest are
   other Altametrics products this build doesn't implement, so they render for
   visual completeness but aren't wired to a destination. */
function renderAppSettingsView(){
  const grid = document.getElementById('appSettingsGrid');
  if(!grid) return;
  const list = loadApps().filter(a=>a.enabled);
  grid.innerHTML = list.map(a=>{
    const isAiDashboard = a.id==='ai-dashboard';
    const cls = 'acct-card' + (isAiDashboard ? ' acct-card-link' : '');
    const click = isAiDashboard ? ` onclick="location.href='settings.html?section=aidashboardsettings'"` : '';
    return `
    <div class="${cls}"${click}>
      <div class="acct-card-icon" style="background:${a.color}1A;"><i data-lucide="${a.icon}" style="color:${a.color}"></i></div>
      <div class="acct-card-label">${a.name}</div>
    </div>`;
  }).join('');
}

/* ---------------- Dashboards list (table) ---------------- */
// Managed from Global Setting only — not listed under Organization Setting.
const GLOBAL_ONLY_DASHBOARD_IDS = ['dailydigest','aihub','pulseindex'];
function getVisibleDashboardsSorted(){
  const term = dashSearchTerm.trim().toLowerCase();
  const scoped = SCOPE==='organization' ? dashboards.filter(d => !GLOBAL_ONLY_DASHBOARD_IDS.includes(d.id)) : dashboards;
  const filtered = term ? scoped.filter(d => d.name.toLowerCase().includes(term) || String(d.order).includes(term)) : scoped;
  return [...filtered].sort((a,b)=>a.order-b.order);
}
function onDashSearchInput(v){
  dashSearchTerm = v;
  renderDashboardList();
}
function renderDashboardList(){
  const wrap = document.getElementById('dashboardRows');
  const sorted = getVisibleDashboardsSorted();
  const colorHex = { blue:'#dbe7fb', green:'#d9f2e3', red:'#fbdede', orange:'#fbe7d2', purple:'#ece3fb', indigo:'#dfe3fb' };
  const colorIcon = { blue:'#2563eb', green:'#16a34a', red:'#dc2626', orange:'#d97706', purple:'#7c3aed', indigo:'#4338ca' };
  const defaultId = loadDefaultDashboard();
  if(!sorted.length){
    const colCount = SCOPE==='organization' ? 5 : 4;
    wrap.innerHTML = `<tr><td colspan="${colCount}" class="px-5 py-8 text-center text-slate-400">No dashboards match "${dashSearchTerm}".</td></tr>`;
    return;
  }
  wrap.innerHTML = sorted.map(d => `
    <tr class="border-b border-slate-100">
      <td class="px-5 py-3 text-slate-600">${d.order}</td>
      <td class="px-5 py-3">
        <div class="flex items-center gap-3">
          <div class="dash-card-icon" style="width:34px;height:34px;background:${colorHex[d.color]||'#dbe7fb'}">
            <i data-lucide="${d.icon}" style="width:16px;height:16px;color:${colorIcon[d.color]||'#2563eb'}"></i>
          </div>
          <div class="font-bold text-slate-800">${d.name}</div>
        </div>
      </td>
      <td class="px-5 py-3 text-center"><button class="toggle ${d.active?'on':''}" title="${d.active?'Active':'Inactive'} — manage from Edit" style="margin:0 auto;pointer-events:none;opacity:.55;${d.active?'background:#94a3b8;':''}"></button></td>
      ${SCOPE==='organization' ? `
      <td class="px-5 py-3 text-center">
        <button class="icon-btn" title="${d.id===defaultId?'Default landing dashboard':'Not the default landing dashboard'} — manage from Edit" style="margin:0 auto;pointer-events:none;opacity:.55;">
          <i data-lucide="star" style="width:15px;height:15px${d.id===defaultId?';fill:#94a3b8;color:#94a3b8':''}"></i>
        </button>
      </td>` : ''}
      <td class="px-5 py-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button class="icon-btn" title="Edit" onclick="openEditor('${d.id}')"><i data-lucide="pencil" style="width:15px;height:15px"></i></button>
          ${SCOPE==='organization' ? `<button class="icon-btn" title="Schedule Email" onclick="openDashScheduleModal('${d.id}', null)"><i data-lucide="send" style="width:15px;height:15px"></i></button>` : ''}
          <button class="icon-btn danger" title="Delete" onclick="deleteDashboard('${d.id}')"><i data-lucide="trash-2" style="width:15px;height:15px"></i></button>
        </div>
      </td>
    </tr>`).join('');
  if(window.lucide) lucide.createIcons();
}

/* ---------------- Dashboards list export (CSV / PDF) — exports whatever
   the search box currently has visible, same rows as the table. ---------------- */
function exportDashboardsCsv(){
  const rows = [['Dashboard ID','Friendly Name','Is Active']];
  getVisibleDashboardsSorted().forEach(d=> rows.push([d.order, d.name, d.active ? 'Yes' : 'No']));
  const csv = rows.map(r => r.map(cell=>{
    let text = String(cell);
    if(text.includes(',') || text.includes('"') || text.includes('\n')) text = '"' + text.replace(/"/g,'""') + '"';
    return text;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dashboards.csv';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  document.getElementById('dashExportMenu').classList.add('hidden');
}
function exportDashboardsPdf(){
  const sorted = getVisibleDashboardsSorted();
  const element = document.createElement('div');
  element.style.cssText = 'padding:20px;font-family:Arial,sans-serif;font-size:12px;color:#111827;';
  element.innerHTML = `
    <h2 style="margin:0 0 14px;">${SCOPE_LABEL} — Dashboards</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr>
        <th style="text-align:left;padding:8px 10px;background:#1e293b;color:#fff;">Dashboard ID</th>
        <th style="text-align:left;padding:8px 10px;background:#1e293b;color:#fff;">Friendly Name</th>
        <th style="text-align:left;padding:8px 10px;background:#1e293b;color:#fff;">Is Active</th>
      </tr></thead>
      <tbody>
        ${sorted.map((d,i)=>`<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;background:${i%2?'#f9fafb':'#fff'};">${d.order}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;background:${i%2?'#f9fafb':'#fff'};">${d.name}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;background:${i%2?'#f9fafb':'#fff'};">${d.active?'Yes':'No'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  const opt = {
    margin: 10,
    filename: 'dashboards.pdf',
    image: { type:'jpeg', quality:0.98 },
    html2canvas: { scale:2 },
    jsPDF: { orientation:'portrait', unit:'mm', format:'a4' }
  };
  if(window.html2pdf) window.html2pdf().set(opt).from(element).save();
  document.getElementById('dashExportMenu').classList.add('hidden');
}

let pendingDeleteId = null;
function deleteDashboard(id){
  pendingDeleteId = id;
  const d = dashboards.find(x=>x.id===id);
  document.getElementById('deleteConfirmName').textContent = d ? d.name : '';
  document.getElementById('deleteConfirmModal').classList.remove('hidden');
}
function closeDeleteConfirm(){
  pendingDeleteId = null;
  document.getElementById('deleteConfirmModal').classList.add('hidden');
}
function confirmDeleteDashboard(){
  if(!pendingDeleteId) return;
  dashboards = dashboards.filter(x=>x.id!==pendingDeleteId);
  saveDashboards(dashboards);
  closeDeleteConfirm();
  render();
}

/* ---------------- Editor ---------------- */
function openEditor(id){
  if(id){
    isNew = false;
    editing = clone(dashboards.find(x=>x.id===id));
    editing.roles = editing.roles || {};
    editing.apps = editing.apps || {};
  } else {
    isNew = true;
    const maxOrder = dashboards.reduce((m,d)=>Math.max(m,d.order),1000);
    editing = { id:uid('dash'), name:'', icon:'layout-dashboard', color:'blue', order:maxOrder+10,
      active:true, enableAllRoles:true, isOrg: SCOPE==='organization', builtin:false, roles:{}, apps:{}, sections:[] };
  }
  editingDefaultLanding = !!(id && id === loadDefaultDashboard());
  editorTab = 'general';
  view = 'editor';
  render();
}

function toggleDefaultLandingFlag(){
  editingDefaultLanding = !editingDefaultLanding;
  render();
}

function backToList(){ view='list'; render(); }

function saveEditor(){
  if(!editing.name.trim()){ alert('Please enter a dashboard name.'); switchEditorTab('general'); return; }
  const idx = dashboards.findIndex(x=>x.id===editing.id);
  if(idx>=0) dashboards[idx] = editing; else dashboards.push(editing);
  saveDashboards(dashboards);
  applyAiOrgDashboardVisibility();
  if(SCOPE==='organization'){
    if(editingDefaultLanding) saveDefaultDashboard(editing.id);
    else if(loadDefaultDashboard()===editing.id) saveDefaultDashboard('');
  }
  isNew = false;
  view = 'list';
  render();
}

function copyDashboard(){
  const copy = clone(editing);
  copy.id = uid('dash');
  copy.name = editing.name + ' Copy';
  copy.builtin = false;
  const maxOrder = dashboards.reduce((m,d)=>Math.max(m,d.order),1000);
  copy.order = maxOrder+10;
  dashboards.push(copy);
  saveDashboards(dashboards);
  view = 'list';
  render();
}

function switchEditorTab(t){
  if(editorTab==='sections' && t!=='sections') destroySectionsDragDrop();
  const openLayoutPicker = t==='sections' && (!editing.sections || !editing.sections.length);
  editorTab = t; render();
  if(openLayoutPicker) openLayoutSuggestModal();
}

function renderEditor(){
  document.getElementById('copyDashBtn').classList.toggle('hidden', isNew);
  document.querySelectorAll('.editor-tab').forEach(el=>{
    el.classList.toggle('active', el.dataset.tab===editorTab);
  });
  document.getElementById('editorTabRoles').classList.toggle('hidden', !!editing.enableAllRoles);
  document.getElementById('editorTabSections').classList.toggle('hidden', !!editing.noSections);
  if(editorTab==='roles' && editing.enableAllRoles) editorTab = 'general';
  if(editorTab==='sections' && editing.noSections) editorTab = 'general';

  const body = document.getElementById('editorBody');
  if(editorTab==='general') body.innerHTML = generalTabHtml();
  else if(editorTab==='sections') body.innerHTML = sectionsTabHtml();
  else if(editorTab==='roles') body.innerHTML = rolesTabHtml();
  else body.innerHTML = applicationsTabHtml();

  if(window.lucide) lucide.createIcons();
  if(editorTab==='sections') initSectionsDragDrop();
}

/* AI Hub / Pulse Index / Daily Brief are fixed built-in tabs, not
   store-or-org dashboards a user creates — "Is Org" (which governs
   store-vs-org view choice at creation time) has nothing to act on
   for them, so it's swapped for a plain, tab-specific enable toggle. */
const BUILTIN_TAB_LABELS = { aihub:'AI Hub', pulseindex:'Pulse Index', dailydigest:'Daily Brief' };

function generalTabHtml(){
  const iconOptions = ICON_CHOICES.map(i=>`<option value="${i}" ${editing.icon===i?'selected':''}>${i}</option>`).join('');
  const builtinTabLabel = BUILTIN_TAB_LABELS[editing.id];
  return `
  <div class="max-w-[640px]">
    <div class="text-[15px] font-bold text-slate-800 border-b-2 border-blue-500 inline-block pb-1 mb-5">General Info</div>

    <div class="mb-5">
      <label class="block text-[13px] font-bold text-slate-700 mb-1.5">Dashboard Name <span class="text-red-500">*</span></label>
      <input type="text" value="${editing.name.replace(/"/g,'&quot;')}" oninput="editing.name=this.value"
        placeholder="Enter Dashboard Name" class="w-full max-w-[380px] border border-slate-300 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue-400">
    </div>

    <div class="mb-5">
      <label class="block text-[13px] font-bold text-slate-700 mb-1">Display Order <span class="text-red-500">*</span></label>
      <div class="text-[11.5px] text-slate-400 italic mb-1.5">(Must be more than 1000)</div>
      <input type="number" value="${editing.order}" min="1001" oninput="editing.order=parseInt(this.value||1001)"
        class="w-full max-w-[380px] border border-slate-300 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue-400">
    </div>

    <div class="mb-6">
      <label class="block text-[13px] font-bold text-slate-700 mb-1.5">Select Dashboard Icon <span class="text-red-500">*</span></label>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><i data-lucide="${editing.icon}" class="w-5 h-5 text-blue-600"></i></div>
        <select onchange="editing.icon=this.value; render();" class="border border-slate-300 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue-400">
          ${iconOptions}
        </select>
      </div>
    </div>

    <div class="text-[15px] font-bold text-slate-800 border-b-2 border-blue-500 inline-block pb-1 mb-5">Role Preferences</div>
    <div class="flex items-center justify-between max-w-[560px] mb-6">
      <div class="pr-6">
        <div class="text-[13.5px] font-bold text-slate-700">Enable for all Roles</div>
        <div class="text-[12px] text-slate-500 mt-0.5">By enabling this flag, you instantly grant all user roles access to this dashboard.</div>
      </div>
      <button class="toggle ${editing.enableAllRoles?'on':''}" onclick="editing.enableAllRoles=!editing.enableAllRoles; render();"></button>
    </div>

    <div class="text-[15px] font-bold text-slate-800 border-b-2 border-blue-500 inline-block pb-1 mb-5">Dashboard Preferences</div>
    <div class="flex items-center justify-between max-w-[560px] mb-5">
      <div class="pr-6">
        <div class="text-[13.5px] font-bold text-slate-700">Is Active</div>
        <div class="text-[12px] text-slate-500 mt-0.5">By enabling this flag, you allow customers to view this dashboard within the summary page list.</div>
      </div>
      <button class="toggle ${editing.active?'on':''}" onclick="editing.active=!editing.active; render();"></button>
    </div>
    <div class="flex items-center justify-between max-w-[560px] ${SCOPE==='organization'?'mb-5':''}">
      <div class="pr-6">
        ${builtinTabLabel ? `
        <div class="text-[13.5px] font-bold text-slate-700">Enable ${builtinTabLabel}</div>
        <div class="text-[12px] text-slate-500 mt-0.5">By enabling this flag, the ${builtinTabLabel} tab is available on the dashboard tab bar.</div>
        ` : `
        <div class="text-[13.5px] font-bold text-slate-700">Is Org</div>
        <div class="text-[12px] text-slate-500 mt-0.5">By enabling this flag, you allow users to choose store or organization-level views during dashboard creation.</div>
        `}
      </div>
      ${builtinTabLabel ? `
      <button class="toggle ${editing.active?'on':''}" onclick="editing.active=!editing.active; render();"></button>
      ` : `
      <button class="toggle ${editing.isOrg?'on':''}" onclick="editing.isOrg=!editing.isOrg; render();"></button>
      `}
    </div>
    ${SCOPE==='organization' ? `
    <div class="flex items-center justify-between max-w-[560px]">
      <div class="pr-6">
        <div class="text-[13.5px] font-bold text-slate-700">Is Default Landing</div>
        <div class="text-[12px] text-slate-500 mt-0.5">By enabling this flag, this dashboard opens by default when the app loads (replacing whichever dashboard is currently the default).</div>
      </div>
      <button class="toggle ${editingDefaultLanding?'on':''}" onclick="toggleDefaultLandingFlag()"></button>
    </div>` : ''}
  </div>`;
}

function sectionsTabHtml(){
  const rows = editing.sections || [];
  const layoutBlocks = LAYOUT_TYPES.map(l => `
    <div class="layout-block mb-3" onclick="addLayoutRow('${l.key}')">
      <div class="bars">${Array.from({length:Math.min(l.cols,8)}).map(()=>'<span></span>').join('')}</div>
      <div class="lbl">${l.label}</div>
    </div>`).join('');

  const layoutArea = rows.length ? `
    <div id="sectionsRowsWrap">
    ${rows.map((row,rIdx)=>{
      const layout = LAYOUT_TYPES.find(l=>l.key===row.layout);
      const slots = row.slots.map((slot,sIdx)=>{
        if(!slot) return `
          <div class="layout-slot">
            <span class="slot-drag-handle" title="Drag to reorder"><i data-lucide="grip-vertical"></i></span>
            <div class="layout-slot-empty" onclick="openComponentModal(${rIdx},${sIdx},'${layout.kind}')">
              <i data-lucide="plus-circle"></i> ADD COMPONENT
            </div>
          </div>`;
        return `
          <div class="layout-slot" style="border-style:solid; border-color:#dbeafe; background:#fff;">
            <span class="slot-drag-handle" title="Drag to reorder"><i data-lucide="grip-vertical"></i></span>
            <div class="layout-slot-filled">
              <span class="slot-actions">
                ${layout.kind==='grid' ? `<span class="edit" onclick="openGridKpiSettings(${rIdx},${sIdx})" title="KPI Settings"><i data-lucide="pencil" style="width:14px;height:14px"></i></span>` : ''}
                <span class="del" onclick="removeComponent(${rIdx},${sIdx})" title="Remove"><i data-lucide="trash-2" style="width:14px;height:14px"></i></span>
              </span>
              ${componentPreviewHtml(slot)}
            </div>
          </div>`;
      }).join('');
      return `
        <div class="layout-row">
          <div class="layout-row-tag"><i data-lucide="rows-3" style="width:11px;height:11px"></i> ${layout.label.split(' (')[0].toUpperCase()}</div>
          <button class="layout-row-del" onclick="removeLayoutRow(${rIdx})"><i data-lucide="trash-2" style="width:15px;height:15px"></i></button>
          <div class="layout-row-cols" data-row-idx="${rIdx}" style="grid-template-columns:repeat(${layout.cols},1fr);">${slots}</div>
        </div>`;
    }).join('')}
    </div>` : `
    <div class="sections-empty-placeholder">
      <i data-lucide="layout-template"></i>
      <div class="sep-text">Add Section/Widgets to create dashboard</div>
    </div>`;

  return `
  <div class="grid gap-6" style="grid-template-columns:260px 1fr;">
    <div>
      <div class="text-[12px] font-bold text-slate-500 tracking-wide mb-3">SELECT LAYOUT</div>
      ${layoutBlocks}
      <button class="add-dash-btn mt-2" onclick="openLayoutSuggestModal()"><i data-lucide="layout-template" style="width:15px;height:15px"></i>Dashboard Layout</button>
    </div>
    <div>
      <div class="flex items-center justify-between mb-3">
        <div class="text-[12px] font-bold text-slate-500 tracking-wide">DASHBOARD LAYOUT</div>
        ${rows.length ? `<button class="pill-btn" style="background:#fef2f2;color:#dc2626;font-size:12px;padding:6px 14px;" onclick="clearAllSections()"><i data-lucide="eraser" style="width:13px;height:13px"></i>Clear All</button>` : ''}
      </div>
      ${layoutArea}
    </div>
  </div>`;
}

/* A small wireframe of the template's row/column structure, in place of a
   text description — one bar per row, split into that row's column count,
   colour-coded by section kind (banner/kpi/grid/chart/table). */
function layoutTemplatePreviewHtml(tpl){
  return tpl.rows.map(r=>{
    const layout = LAYOUT_TYPES.find(l=>l.key===r.layout);
    const blocks = Array.from({length:layout.cols}).map(()=>`<span class="lsc-pblock lsc-pblock-${layout.kind}"></span>`).join('');
    return `<div class="lsc-prow" style="grid-template-columns:repeat(${layout.cols},1fr);">${blocks}</div>`;
  }).join('');
}
function layoutTemplateCardsHtml(){
  const templateCards = DASHBOARD_LAYOUT_TEMPLATES.map(t => `
    <div class="layout-suggest-card" onclick="applyLayoutTemplate('${t.key}')" title="${t.desc}">
      <div class="lsc-name">${t.label}</div>
      <div class="lsc-preview">${layoutTemplatePreviewHtml(t)}</div>
    </div>`).join('');
  const blankCard = `
    <div class="layout-suggest-card layout-suggest-blank" onclick="chooseBlankLayout()" title="Start with an empty dashboard and add sections yourself from the blocks on the left">
      <div class="lsc-name">Blank Layout</div>
      <div class="lsc-preview">
        <div class="lsc-blank-box"><i data-lucide="plus"></i></div>
      </div>
    </div>`;
  return templateCards + blankCard;
}
function openLayoutSuggestModal(){
  document.getElementById('layoutSuggestModalGrid').innerHTML = layoutTemplateCardsHtml();
  document.getElementById('layoutSuggestModal').classList.remove('hidden');
  if(window.lucide) lucide.createIcons();
}
function closeLayoutSuggestModal(){ document.getElementById('layoutSuggestModal').classList.add('hidden'); }
function buildSectionsFromTemplate(tpl){
  // A suggested layout only sets up the row/column structure — every slot
  // starts empty ("+ ADD COMPONENT") so the user picks each KPI/banner/grid
  // from the library themselves, rather than the template pre-selecting one.
  return tpl.rows.map(r=>{
    const layout = LAYOUT_TYPES.find(l=>l.key===r.layout);
    return { layout:r.layout, slots: Array.from({length:layout.cols}).map(()=>null) };
  });
}
function applyLayoutTemplate(key){
  const tpl = DASHBOARD_LAYOUT_TEMPLATES.find(t=>t.key===key);
  if(!tpl) return;
  function doApply(){
    editing.sections = buildSectionsFromTemplate(tpl);
    closeLayoutSuggestModal();
    editorTab = 'sections';
    render();
  }
  if(editing.sections && editing.sections.length){
    openSectionsConfirm('Replace current layout?', `Applying "${tpl.label}" will replace your current sections with this suggested layout. This cannot be undone.`, doApply);
  } else {
    doApply();
  }
}
function chooseBlankLayout(){
  function doApply(){
    editing.sections = [];
    closeLayoutSuggestModal();
    editorTab = 'sections';
    render();
  }
  if(editing.sections && editing.sections.length){
    openSectionsConfirm('Clear current layout?', 'Choosing a blank layout will remove your current sections so you can start from scratch, picking layout blocks from the left panel. This cannot be undone.', doApply);
  } else {
    doApply();
  }
}
function clearAllSections(){
  if(!editing.sections || !editing.sections.length) return;
  openSectionsConfirm('Clear all sections?', 'This removes every layout row and widget from this dashboard. This cannot be undone.', function(){
    editing.sections = [];
    render();
  });
}

/* ---------------- Sections tab: generic confirm modal ---------------- */
let pendingSectionsAction = null;
function openSectionsConfirm(title, body, onConfirm){
  pendingSectionsAction = onConfirm;
  document.getElementById('sectionsConfirmTitle').textContent = title;
  document.getElementById('sectionsConfirmBody').textContent = body;
  document.getElementById('sectionsConfirmModal').classList.remove('hidden');
}
function closeSectionsConfirm(){
  pendingSectionsAction = null;
  document.getElementById('sectionsConfirmModal').classList.add('hidden');
}
function confirmSectionsAction(){
  const fn = pendingSectionsAction;
  closeSectionsConfirm();
  if(fn) fn();
}

/* ---------------- Sections tab: drag & drop ---------------- */
let sectionsRowSortable = null;
let sectionsSlotSortables = [];
function destroySectionsDragDrop(){
  if(sectionsRowSortable){ sectionsRowSortable.destroy(); sectionsRowSortable = null; }
  sectionsSlotSortables.forEach(s=>s.destroy());
  sectionsSlotSortables = [];
}
function initSectionsDragDrop(){
  destroySectionsDragDrop();
  if(!window.Sortable) return;
  const rowsWrap = document.getElementById('sectionsRowsWrap');
  if(rowsWrap){
    sectionsRowSortable = Sortable.create(rowsWrap, {
      handle: '.layout-row-tag', animation:150, ghostClass:'sortable-ghost', chosenClass:'sortable-chosen',
      onEnd:function(evt){
        if(evt.oldIndex===evt.newIndex) return;
        const moved = editing.sections.splice(evt.oldIndex,1)[0];
        editing.sections.splice(evt.newIndex,0,moved);
        render();
      }
    });
  }
  document.querySelectorAll('.layout-row-cols').forEach(function(el){
    const rIdx = Number(el.dataset.rowIdx);
    sectionsSlotSortables.push(Sortable.create(el, {
      handle:'.slot-drag-handle', animation:150, ghostClass:'sortable-ghost', chosenClass:'sortable-chosen',
      onEnd:function(evt){
        if(evt.oldIndex===evt.newIndex) return;
        const slots = editing.sections[rIdx].slots;
        const moved = slots.splice(evt.oldIndex,1)[0];
        slots.splice(evt.newIndex,0,moved);
        render();
      }
    }));
  });
}

/* The real KPI names inside each grid module (GRID_SECTIONS in
   dashboard-data.js) — settings.html doesn't load that file (see note
   below), so the names are mirrored here, keyed the same as
   COMPONENT_LIBRARY.grid's own keys. Store Health's 4 modules carry 3
   KPIs each; every Compliance/Risk module carries 4 — used both for the
   Sections-tab preview table and the KPI Settings (target value) modal. */
const GRID_SECTION_KPIS = {
  labor_performance:       ['Scheduled Labor %','Variance','SPLH'],
  inventory_control:       ['Food Cost %','Variance','Waste'],
  payroll_management:      ['Actual Labor %','Variance','SPLH'],
  cash_control:             ['Refunds/Voids/Comps','Cash Over/Short','Net Sales'],
  attendance_behaviour:    ['Early Clock In','Late Clock Out','Dropped Shifts','Unapproved Shifts'],
  minors_compliance:       ['OT Violations','Late Night Work','Minor Violations','Break Violations'],
  breaks_management:       ['Paid Break Violations','Unpaid Break Violations','No. of Employees Violated Break','Violation Rate'],
  labor_exceptions:        ['Mismatch Punches','Unauthorized OT','Manual Time Edits','Unscheduled Labor'],
  scheduling_optimization: ['Overstaffed Hours','Understaffed Hours','Scheduled Efficiency','Forecasted Hours'],
  fair_work_week:          ['Average Weekly Premium','Rest Premium','Scheduled Publication Compliance','Act vs Sch Variance %'],
  labor_risk:              ['Unauthorized OT','Mismatch Punches','Manual Edit Rate','Opening Exposure'],
  inventory_risk:          ['Food Cost Variable','Food Cost ($)','Waste Cost ($)','Stockout Alerts'],
  compliance_risk:         ['Break Violations','Minor Violations','Total Unpaid Break Violations','Unapproved Shifts'],
  sch_risk:                ['Understaffed Hours','Overstaffed Hours','Scheduled Changes','Late Publishing'],
  sales_risk:              ['Sales Forecast','Voids','Refund Amount ($)','Compensation']
};
/* Same illustrative CUR/WTD/LW(SD)/LW(WTD)/LW(TOT)/SCORE placeholders as
   before (this preview was never meant to mirror live figures — see note
   below), just cycled per row instead of hardcoded twice, now that a
   module can show 3 or 4 rows. */
const GRID_PREVIEW_SAMPLE_VALUES = [
  ['12%','18%','10%','16%','20%','86%'],
  ['$1.2K','$4.8K','$1.1K','$4.6K','$5.0K','92%'],
  ['8%','11%','7%','9%','13%','78%'],
  ['$420','$680','$390','$540','$710','100%']
];
/* Only Store Health's 4 grid modules carry a per-row SCORE in
   GRID_SECTIONS (dashboard-data.js) — Compliance/Risk modules don't, on
   the real dashboard either — so the preview table matches that instead
   of showing a SCORE column (and CUR/LW(SD)/LW(TOT) shading, per
   dashboard-render.js's own shadeIdx) uniformly for every module. */
const GRID_SECTION_HAS_SCORE = new Set(['labor_performance','inventory_control','payroll_management','cash_control']);
/* COMPONENT_LIBRARY.kpi labels carry a "(Store Health)"/"(DAR)"/etc. source
   suffix so the picker list can tell same-named KPIs from different
   dashboards apart — useful there, redundant once the tile is actually
   sitting in a layout preview, so it's stripped for display. */
function stripSourceSuffix(label){
  return String(label||'').replace(/\s*\([^()]*\)\s*$/,'');
}
function gridPreviewHeadHtml(slot){
  const scoreTh = GRID_SECTION_HAS_SCORE.has(slot.key) ? '<th>SCORE</th>' : '';
  return `<tr><th>KPI</th><th class="shade">CUR</th><th>WTD</th><th class="shade">LW (SD)</th><th>LW (WTD)</th><th class="shade">LW (TOT)</th>${scoreTh}</tr>`;
}
/* KPI names a placed grid slot currently shows — its picked KPIs for a
   configurable module (see GRID_KPI_CONFIGURABLE in dashboard-data.js),
   otherwise the module's fixed list. */
function gridSlotKpiLabels(slot){
  if(GRID_KPI_CONFIGURABLE.indexOf(slot.key)!==-1 && Array.isArray(slot.kpis) && slot.kpis.length) return slot.kpis.map(k=>k.label);
  return GRID_SECTION_KPIS[slot.key] || [];
}
function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function gridPreviewRowsHtml(slot){
  // Configurable modules show their picked KPIs (chosen in the KPI Settings
  // popup) with that KPI's own figures; other modules keep sample values.
  if(GRID_KPI_CONFIGURABLE.indexOf(slot.key)!==-1){
    const options = gridKpiOptionsFor(slot.key);
    return gridSlotKpiLabels(slot).map((label,i)=>{
      const opt = options.find(o=>o.label===label);
      const v = opt ? opt.row.slice(1) : GRID_PREVIEW_SAMPLE_VALUES[i % GRID_PREVIEW_SAMPLE_VALUES.length];
      return `<tr><td>${label}</td><td class="shade">${v[0]}</td><td>${v[1]}</td><td class="shade">${v[2]}</td><td>${v[3]}</td><td class="shade">${v[4]}</td><td class="score">${v[5]}</td></tr>`;
    }).join('');
  }
  const names = GRID_SECTION_KPIS[slot.key] || ['Sample Metric 1','Sample Metric 2'];
  const hasScore = GRID_SECTION_HAS_SCORE.has(slot.key);
  return names.map((name,i) => {
    const v = GRID_PREVIEW_SAMPLE_VALUES[i % GRID_PREVIEW_SAMPLE_VALUES.length];
    const scoreTd = hasScore ? `<td class="score">${v[5]}</td>` : '';
    return `<tr><td>${name}</td><td class="shade">${v[0]}</td><td>${v[1]}</td><td class="shade">${v[2]}</td><td>${v[3]}</td><td class="shade">${v[4]}</td>${scoreTd}</tr>`;
  }).join('');
}

/* Sections-tab slot preview. settings.html doesn't load the real dashboard
   data/render files (dashboard-data.js/dashboard-render.js — loading those
   would also auto-run initDashboardTabs() looking for #dashTabBar, which
   doesn't exist here), so this builds a self-contained mini version of the
   real tile using the SAME CSS classes as the live dashboard (style.css is
   already shared), filled with representative sample numbers instead of
   live-bound data — same look, not the same literal figures. KPI *names*
   in grid modules are the real ones (GRID_SECTION_KPIS above) though,
   since those are fixed per module rather than something that changes. */
function componentPreviewHtml(slot){
  if(slot.kind==='banner'){
    return `
    <div class="op-banner" style="--banner-a:#fdf1e7;--banner-b:#eef1f6;">
      <div>
        <div class="op-eyebrow">Operational Summary</div>
        <div class="op-title">${slot.label.toUpperCase()}</div>
        <div class="op-sub">AI Verified Index · America/Los Angeles</div>
      </div>
      <div class="op-score-card">
        <div class="op-score-value">86%</div>
        <span class="op-score-badge">Excellent</span>
        <div class="op-score-bar-wrap"><div class="op-score-bar"></div><div class="op-score-bar-label">AI Index</div></div>
      </div>
    </div>`;
  }
  if(slot.kind==='grid'){
    return `
    <div class="grid-section section-${slot.color||'blue'}">
      <div class="grid-section-head">
        <div class="grid-section-title-row">
          <span class="grid-section-title">${slot.label}:</span>
          <span class="grid-section-score">86%</span>
        </div>
      </div>
      <div style="overflow-x:auto;">
      <table class="kpi-table">
        <thead>${gridPreviewHeadHtml(slot)}</thead>
        <tbody>
          ${gridPreviewRowsHtml(slot)}
        </tbody>
      </table>
      </div>
    </div>`;
  }
  if(slot.kind==='kpi'){
    if((slot.key||'').indexOf('ai_tile') !== -1){
      return `
      <div class="ai-tile">
        <div class="ai-tile-head"><div class="ai-tile-badge"><span class="ai-tile-icon"><i data-lucide="lightbulb"></i></span> AI INSIGHT</div></div>
        <div class="ai-tile-item">Sample AI insight line goes here.</div>
        <div class="ai-tile-item">A second observation would show here.</div>
      </div>`;
    }
    const kpiColors = { indigo:{bg:'#e9edfb',fg:'#4f46e5'}, orange:{bg:'#fdecd8',fg:'#d97706'}, teal:{bg:'#dbf3f5',fg:'#0891b2'}, blue:{bg:'#dbe7fb',fg:'#2563eb'}, purple:{bg:'#efe4fb',fg:'#9333ea'} };
    const kc = kpiColors[slot.color] || kpiColors.indigo;
    return `
    <div class="kpi-mini">
      <div class="kpi-mini-head">
        <div class="kpi-mini-title">
          <div class="kpi-icon" style="background:${kc.bg}"><i data-lucide="${slot.icon||'activity'}" style="color:${kc.fg}"></i></div>
          <div class="kpi-mini-label">${stripSourceSuffix(slot.label)}</div>
        </div>
      </div>
      <div class="kpi-mini-values">
        <div class="kmv2-value-col">
          <div class="kpi-mini-value">24.7%</div>
          <div class="kmv2-value-sub"><span class="kmv2-sub-lbl">WTD</span>30.8%</div>
        </div>
        <div class="kpi-mini-wtd"><div class="wl">MTD</div><div class="wv">31.9%</div></div>
      </div>
      <div class="kpi-mini-table">
        <span class="t-lbl">CUR</span><span class="t-group"><span class="t-tag">vs LW</span><b class="t-val up-red">-11.2%</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val up-green">+21.1%</b></span>
        <span class="t-lbl">WTD</span><span class="t-group"><span class="t-tag">vs LW</span><b class="t-val up-green">+2.1%</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val up-green">+1.3%</b></span>
      </div>
    </div>`;
  }
  if(slot.kind==='table'){
    return `
    <div class="chart-card">
      <div class="font-bold text-[15px] text-slate-800 mb-3">${slot.label}</div>
      <div style="overflow-x:auto;">
      <table class="hist-table">
        <thead><tr><th>Start Date</th><th>Store #</th><th>Actual Sales ($)</th><th>Labor %</th></tr></thead>
        <tbody>
          <tr><td class="hist-date">01/05/2026</td><td>1018</td><td>$32,862.63</td><td>18.71%</td></tr>
          <tr><td class="hist-date">12/29/2025</td><td>1018</td><td>$58,555.81</td><td>18.66%</td></tr>
        </tbody>
      </table>
      </div>
    </div>`;
  }
  if(slot.kind==='chart'){
    return `
    <div class="chart-card">
      <div class="font-bold text-[15px] text-slate-800 mb-3">${slot.label}</div>
      <div style="height:120px; display:flex; align-items:flex-end; gap:6px; padding:0 4px;">
        ${[40,65,50,80,55,70,90].map(h=>`<div style="flex:1;height:${h}%;background:#93c5fd;border-radius:3px 3px 0 0;"></div>`).join('')}
      </div>
    </div>`;
  }
  return `<div class="flex items-center gap-2 text-slate-600 font-semibold text-[12.5px]"><i data-lucide="${slot.icon||'box'}" style="width:16px;height:16px"></i>${slot.label}</div>`;
}

function addLayoutRow(layoutKey){
  const layout = LAYOUT_TYPES.find(l=>l.key===layoutKey);
  editing.sections = editing.sections || [];
  editing.sections.push({ layout:layoutKey, slots: Array.from({length:layout.cols}).map(()=>null) });
  render();
}
function removeLayoutRow(idx){
  editing.sections.splice(idx,1);
  render();
}
function removeComponent(rIdx,sIdx){
  editing.sections[rIdx].slots[sIdx] = null;
  render();
}

/* ---------------- Grid KPI Settings (per-KPI target value) ----------------
   Opened from a grid module's pencil icon. Targets are stored on the slot
   itself (slot.targets = { "KPI name": number }), saved with the rest of
   editing.sections when the dashboard is saved — so a target follows this
   specific placement of the module, the same way its color/icon do. */
function gridKpiSettingsCtxOptionsCount(slot){ return (GRID_KPI_OPTIONS[slot.key] || []).length; }
/* For Store Health's configurable modules (GRID_KPI_CONFIGURABLE) the KPI
   name on each row is a dropdown of the module's fixed KPI list, so
   the popup is also where the module's 3 KPIs are picked. Nothing touches
   the slot until Save Settings — Cancel discards both KPI and target edits. */
let gridKpiSettingsCtx = null;
function gridTargetDefaultFor(slot, name){
  const targets = slot.targets || {};
  if(targets[name]!==undefined) return targets[name];
  const fallback = GRID_KPI_TARGET_DEFAULTS[slot.key + '|' + name];
  return fallback!==undefined ? fallback : '';
}
function gridKpiSettingsRowHtml(slot, name, i, options){
  const note = GRID_KPI_TARGET_NOTES[slot.key + '|' + name];
  let nameHtml = `<div class="text-[13.5px] font-medium text-slate-700">${name}</div>`;
  if(options){
    nameHtml = `<select class="grid-kpi-pick" data-row-idx="${i}" title="Change KPI" onchange="onGridKpiPickChange(this)">${
      options.map(o=>`<option value="${escAttr(o.label)}"${o.label===name?' selected':''}>${escAttr(o.label)}</option>`).join('')
    }</select>`;
  }
  return `
    <div class="flex items-center justify-between gap-4 py-2.5 border-b border-slate-100" data-kpi-row="${i}">
      <div class="min-w-0 flex-1">
        ${nameHtml}
        <div class="grid-kpi-note text-[11px] text-amber-600 mt-0.5${note?'':' hidden'}">${note||''}</div>
      </div>
      <input type="number" step="any" data-kpi-name="${escAttr(name)}"
        value="${gridTargetDefaultFor(slot, name)}" placeholder="e.g. 25"
        class="w-28 border border-slate-300 rounded-lg px-3 py-1.5 text-[13px] text-right focus:outline-none focus:ring-2 focus:ring-blue-400">
    </div>`;
}
function renderGridKpiSettingsRows(slot, names){
  const options = gridKpiSettingsCtx.options;
  document.getElementById('gridKpiSettingsRows').innerHTML = names.map((name,i) => gridKpiSettingsRowHtml(slot, name, i, options)).join('')
    || `<div class="text-slate-400 text-[13px] py-4 text-center">No KPIs found for this module.</div>`;
  refreshGridKpiPickDisabled();
}
function openGridKpiSettings(rIdx, sIdx){
  const slot = editing.sections[rIdx] && editing.sections[rIdx].slots[sIdx];
  if(!slot) return;
  const configurable = GRID_KPI_CONFIGURABLE.indexOf(slot.key)!==-1;
  gridKpiSettingsCtx = { rIdx, sIdx, options: configurable ? gridKpiOptionsFor(slot.key) : null };
  document.getElementById('gridKpiSettingsSubtitle').textContent = slot.label;
  document.getElementById('gridKpiSettingsHint').innerHTML = configurable
    ? `<i data-lucide="sliders-horizontal"></i><span>Pick any <b>${GRID_KPI_SLOT_COUNT}</b> of this module's ${gridKpiSettingsCtxOptionsCount(slot)} KPIs and set a target for each.</span>`
    : '';
  document.getElementById('gridKpiSettingsHint').classList.toggle('hidden', !configurable);
  document.getElementById('gridKpiSettingsResetBtn').classList.toggle('hidden', !configurable);
  document.getElementById('gridKpiSettingsModal').querySelector('.modal-box').style.width = configurable ? 'min(560px,92vw)' : 'min(460px,92vw)';
  renderGridKpiSettingsRows(slot, gridSlotKpiLabels(slot));
  document.getElementById('gridKpiSettingsModal').classList.remove('hidden');
  if(window.lucide) lucide.createIcons();
}
// Each KPI may appear only once per module — options picked in another row are disabled.
function refreshGridKpiPickDisabled(){
  const sels = [...document.querySelectorAll('#gridKpiSettingsRows select.grid-kpi-pick')];
  const picked = sels.map(s=>s.value);
  sels.forEach((s,i)=>{
    [...s.options].forEach(o=>{
      const used = picked.indexOf(o.value)!==-1 && picked[i]!==o.value;
      o.disabled = used;
      o.textContent = o.value + (used ? ' (in use)' : '');
    });
  });
}
// A swapped-in KPI starts from its own target (saved or default), not the previous KPI's.
function onGridKpiPickChange(sel){
  const { rIdx, sIdx } = gridKpiSettingsCtx;
  const slot = editing.sections[rIdx].slots[sIdx];
  const row = sel.closest('[data-kpi-row]');
  const inp = row.querySelector('input[data-kpi-name]');
  inp.dataset.kpiName = sel.value;
  inp.value = gridTargetDefaultFor(slot, sel.value);
  const note = GRID_KPI_TARGET_NOTES[slot.key + '|' + sel.value];
  const noteEl = row.querySelector('.grid-kpi-note');
  noteEl.textContent = note || '';
  noteEl.classList.toggle('hidden', !note);
  refreshGridKpiPickDisabled();
}
function resetGridKpiSettings(){
  if(!gridKpiSettingsCtx) return;
  const { rIdx, sIdx } = gridKpiSettingsCtx;
  const slot = editing.sections[rIdx].slots[sIdx];
  const defaults = GRID_SECTION_KPIS[slot.key] || [];
  renderGridKpiSettingsRows({ key:slot.key, targets:gridTargetsFor(slot.key) }, defaults);
}
function closeGridKpiSettings(){
  gridKpiSettingsCtx = null;
  document.getElementById('gridKpiSettingsModal').classList.add('hidden');
}
function saveGridKpiSettings(){
  if(!gridKpiSettingsCtx) return;
  const { rIdx, sIdx, options } = gridKpiSettingsCtx;
  const slot = editing.sections[rIdx] && editing.sections[rIdx].slots[sIdx];
  if(slot){
    if(options){
      const labels = [...document.querySelectorAll('#gridKpiSettingsRows select.grid-kpi-pick')].map(s=>s.value);
      const defaults = GRID_SECTION_KPIS[slot.key] || [];
      if(labels.join('|')===defaults.join('|')) delete slot.kpis;
      else slot.kpis = labels.map(l => { const o = options.find(x=>x.label===l); return { label:l, row:(o ? o.row : [l]).slice() }; });
    }
    const targets = {};
    document.querySelectorAll('#gridKpiSettingsRows input[data-kpi-name]').forEach(inp=>{
      const v = inp.value.trim();
      if(v!=='') targets[inp.dataset.kpiName] = parseFloat(v);
    });
    slot.targets = targets;
  }
  closeGridKpiSettings();
  render();
}

function openComponentModal(rowIdx, slotIdx, kind){
  pendingSlot = { rowIdx, slotIdx, kind };
  if(kind==='kpi') syncCustomKpisIntoComponentLibrary();
  const list = COMPONENT_LIBRARY[kind] || [];
  document.getElementById('componentModalGrid').innerHTML = list.map(c => `
    <div class="comp-card" onclick="selectComponent('${c.key}')">
      <i data-lucide="${c.icon}"></i>
      <span>${c.label}</span>
    </div>`).join('') || `<div class="text-slate-400 text-sm p-4">No components available for this layout yet.</div>`;
  document.getElementById('componentModal').classList.remove('hidden');
  if(window.lucide) lucide.createIcons();
}
function closeComponentModal(){ document.getElementById('componentModal').classList.add('hidden'); pendingSlot=null; }
function selectComponent(key){
  const kind = pendingSlot.kind;
  const c = (COMPONENT_LIBRARY[kind]||[]).find(x=>x.key===key);
  editing.sections[pendingSlot.rowIdx].slots[pendingSlot.slotIdx] = { kind, key:c.key, label:c.label, icon:c.icon, color:c.color };
  closeComponentModal();
  render();
}

function rolesTabHtml(){
  return `
  <div class="flex items-center justify-end mb-4">
    <input type="text" id="roleSearch" placeholder="Search keyword" oninput="filterRoles(this.value)"
      class="border border-slate-300 rounded-lg px-3 py-2 text-[13px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-400">
  </div>
  <div style="overflow-x:auto;">
  <table class="w-full text-[13.5px]" id="rolesTable">
    <thead><tr class="bg-slate-100"><th class="text-left px-4 py-3 font-bold text-slate-600">Role</th><th class="text-center px-4 py-3 font-bold text-slate-600">Actions</th></tr></thead>
    <tbody>
      ${ROLES.map(r => `
        <tr class="border-b border-slate-100 role-row" data-role="${r.toLowerCase()}">
          <td class="px-4 py-3 text-slate-700">${r}</td>
          <td class="px-4 py-3 text-center"><button class="toggle ${editing.roles[r]?'on':''}" onclick="toggleRole('${r}')" style="margin:0 auto;"></button></td>
        </tr>`).join('')}
    </tbody>
  </table>
  </div>`;
}
function toggleRole(r){ editing.roles[r] = !editing.roles[r]; render(); }
function filterRoles(q){
  q = q.toLowerCase();
  document.querySelectorAll('#rolesTable .role-row').forEach(row=>{
    row.style.display = row.dataset.role.includes(q) ? '' : 'none';
  });
}

function applicationsTabHtml(){
  return `
  <div class="flex items-center justify-end mb-4">
    <input type="text" id="appSearch" placeholder="Search keyword" oninput="filterApps(this.value)"
      class="border border-slate-300 rounded-lg px-3 py-2 text-[13px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-400">
  </div>
  <div style="overflow-x:auto;">
  <table class="w-full text-[13.5px]" id="appsTable">
    <thead><tr class="bg-slate-100"><th class="text-left px-4 py-3 font-bold text-slate-600">Application</th><th class="text-center px-4 py-3 font-bold text-slate-600">Actions</th></tr></thead>
    <tbody>
      ${apps.map(a => `
        <tr class="border-b border-slate-100 app-row" data-app="${a.name.toLowerCase()}">
          <td class="px-4 py-3 text-slate-700">
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style="background:${a.color}">
                <i data-lucide="${a.icon}" class="w-4 h-4 text-white"></i>
              </span>
              ${a.name}
            </div>
          </td>
          <td class="px-4 py-3 text-center"><button class="toggle ${editing.apps[a.id]!==false?'on':''}" onclick="toggleAppInEditor('${a.id}')" style="margin:0 auto;"></button></td>
        </tr>`).join('')}
    </tbody>
  </table>
  </div>`;
}
function toggleAppInEditor(id){
  editing.apps[id] = editing.apps[id]===false ? true : false;
  render();
}
function filterApps(q){
  q = q.toLowerCase();
  document.querySelectorAll('#appsTable .app-row').forEach(row=>{
    row.style.display = row.dataset.app.includes(q) ? '' : 'none';
  });
}

/* ============================================================
   KPI Settings — Direction (Lower/Higher is Better) per KPI
   ============================================================ */
const KPI_MODULE_COLORS = {
  Labor:'#4338ca', 'Food Cost':'#d97706', Sales:'#2563eb', Attendance:'#0891b2', Minors:'#dc2626',
  Breaks:'#16a34a', Scheduling:'#7c3aed', 'Time Loss':'#ea580c', Other:'#64748b'
};
function kpiModuleChip(mod){
  const c = KPI_MODULE_COLORS[mod] || KPI_MODULE_COLORS.Other;
  return `<span style="font-size:11.5px;font-weight:700;color:${c};background:${c}1A;padding:3px 10px;border-radius:999px;white-space:nowrap;">${mod||'Other'}</span>`;
}
function kpiUnitChip(unit){
  const label = unit==='$' ? '$' : unit==='%' ? '%' : '#';
  return `<span style="font-size:12px;font-weight:700;color:#475569;background:#f1f5f9;padding:3px 9px;border-radius:6px;">${label}</span>`;
}
function kpiFamilyNameMap(){
  const map = {};
  loadKpiFamilies().forEach(f => (f.memberKeys||[]).forEach(k => { if(map[k]===undefined) map[k]=f.name; }));
  return map;
}
function populateKpiModuleFilter(famNameMap){
  const sel = document.getElementById('kpiModuleFilter');
  if(!sel) return;
  const catalog = buildKpiCatalog();
  const names = [...new Set(catalog.map(m => famNameMap[m.key] || m.module))].sort();
  const cur = kpiModuleFilterVal;
  sel.innerHTML = `<option value="">All Modules</option>` + names.map(n=>`<option value="${n}" ${n===cur?'selected':''}>${n}</option>`).join('');
}
function onKpiSearchInput(v){ kpiSearchTerm = v; renderKpiSettingsList(); }
function onKpiModuleFilterChange(v){ kpiModuleFilterVal = v; renderKpiSettingsList(); }
function renderKpiSettingsList(){
  const famNameMap = kpiFamilyNameMap();
  populateKpiModuleFilter(famNameMap);
  const wrap = document.getElementById('kpiSettingsRows');
  const settingsMap = loadKpiSettings();
  const term = kpiSearchTerm.trim().toLowerCase();
  let rows = buildKpiCatalog().map(m => Object.assign({}, m, { moduleName: famNameMap[m.key] || m.module }));
  if(kpiModuleFilterVal) rows = rows.filter(m=>m.moduleName===kpiModuleFilterVal);
  if(term) rows = rows.filter(m=> m.label.toLowerCase().includes(term) || m.moduleName.toLowerCase().includes(term) || m.dashLabel.toLowerCase().includes(term));
  rows = [...rows].sort((a,b)=> a.moduleName===b.moduleName ? a.label.localeCompare(b.label) : a.moduleName.localeCompare(b.moduleName));
  if(!rows.length){
    wrap.innerHTML = `<tr><td colspan="4" class="px-5 py-8 text-center text-slate-400">No KPIs match "${kpiSearchTerm}".</td></tr>`;
    return;
  }
  wrap.innerHTML = rows.map(m => {
    const dir = KPI_DIRECTION_VALUES.indexOf(settingsMap[m.key]) !== -1 ? settingsMap[m.key] : 'lower';
    return `
    <tr class="border-b border-slate-100">
      <td class="px-5 py-3">${kpiModuleChip(m.moduleName)}</td>
      <td class="px-5 py-3 font-bold text-slate-800">
        <div class="flex items-center gap-1.5">${m.label}${m.formulated ? '<i data-lucide="sparkles" style="width:12px;height:12px;color:#7c3aed" title="Formulated metric — has related KPIs"></i>' : ''}</div>
      </td>
      <td class="px-5 py-3 text-center">${kpiUnitChip(m.unit)}</td>
      <td class="px-5 py-3 text-center">
        <select onchange="setKpiDirection('${m.key}', this.value)" class="border border-slate-300 rounded-lg px-2 py-1.5 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="lower" ${dir==='lower'?'selected':''}>Lower is Better</option>
          <option value="higher" ${dir==='higher'?'selected':''}>Higher is Better</option>
          <option value="zero" ${dir==='zero'?'selected':''}>Closer to Zero is Better</option>
        </select>
      </td>
    </tr>`;
  }).join('');
  if(window.lucide) lucide.createIcons();
}
function setKpiDirection(key, val){
  const map = loadKpiSettings();
  map[key] = KPI_DIRECTION_VALUES.indexOf(val) !== -1 ? val : 'lower';
  saveKpiSettings(map);
}

/* ============================================================
   KPI Family — CRUD groupings that drive the KPI trend popup's
   Add Metric overlay picker (see lmFamilyMembersFor in trend-modal.js
   and lmBuildAddMetricMenu/lmApplyOverlay in trend-modal-engine.js).
   ============================================================ */
function familyDataTypes(fam){
  const cat = buildKpiCatalog();
  const units = new Set();
  (fam.memberKeys||[]).forEach(k=>{
    const m = cat.find(c=>c.key===k);
    if(m) units.add(m.unit==='$'?'$':m.unit==='%'?'%':'#');
  });
  return [...units];
}
function renderKpiFamilyList(){
  const wrap = document.getElementById('kpiFamilyRows');
  const families = loadKpiFamilies();
  if(!families.length){
    wrap.innerHTML = `<tr><td colspan="4" class="px-5 py-8 text-center text-slate-400">No families yet.</td></tr>`;
    return;
  }
  wrap.innerHTML = [...families].sort((a,b)=>a.name.localeCompare(b.name)).map(f => {
    const types = familyDataTypes(f);
    return `
    <tr class="border-b border-slate-100">
      <td class="px-5 py-3 font-bold text-slate-800">${f.name}</td>
      <td class="px-5 py-3 text-center text-slate-600">${(f.memberKeys||[]).length}</td>
      <td class="px-5 py-3 text-center">${types.map(t=>kpiUnitChip(t)).join(' ')}${types.length>1?' <span style="font-size:11px;color:#7c3aed;font-weight:700;">2-axis</span>':''}</td>
      <td class="px-5 py-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button class="icon-btn" title="Edit" onclick="openKpiFamilyEditor('${f.id}')"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
          <button class="icon-btn danger" title="Delete" onclick="deleteKpiFamily('${f.id}')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
  if(window.lucide) lucide.createIcons();
}
function openKpiFamilyEditor(id){
  const families = loadKpiFamilies();
  if(id){
    isNewFamily = false;
    editingFamily = clone(families.find(f=>f.id===id));
  }else{
    isNewFamily = true;
    editingFamily = { id: uid('fam'), name:'New Family', module:'', memberKeys:[] };
  }
  kpiFamilyView = 'editor';
  render();
}
function backToKpiFamilyList(){
  kpiFamilyView = 'list';
  editingFamily = null;
  render();
}
function saveKpiFamilyEditor(){
  const families = loadKpiFamilies();
  const nameInput = document.getElementById('kpiFamilyNameInput');
  editingFamily.name = (nameInput.value || '').trim() || editingFamily.name;
  if(isNewFamily){
    families.push(editingFamily);
  }else{
    const idx = families.findIndex(f=>f.id===editingFamily.id);
    if(idx!==-1) families[idx] = editingFamily; else families.push(editingFamily);
  }
  saveKpiFamilies(families);
  backToKpiFamilyList();
}
function deleteKpiFamily(id){
  const families = loadKpiFamilies();
  const fam = families.find(f=>f.id===id);
  if(!fam) return;
  openSectionsConfirm('Delete Family', `Delete "${fam.name}"? Its member KPIs will no longer share an Add Metric overlay group.`, ()=>{
    saveKpiFamilies(families.filter(f=>f.id!==id));
    renderKpiFamilyList();
  });
}
function toggleKpiFamilyMember(key){
  const idx = editingFamily.memberKeys.indexOf(key);
  if(idx!==-1) editingFamily.memberKeys.splice(idx,1);
  else editingFamily.memberKeys.push(key);
  renderKpiFamilyMemberPicker();
}
function renderKpiFamilyMemberPicker(){
  const wrap = document.getElementById('kpiFamilyMemberPicker');
  const cat = buildKpiCatalog();
  const byModule = {};
  cat.forEach(m=>{ (byModule[m.module] = byModule[m.module]||[]).push(m); });
  const modules = Object.keys(byModule).sort();
  wrap.innerHTML = modules.map(mod => `
    <div class="mb-4">
      <div class="mb-2">${kpiModuleChip(mod)}</div>
      <div class="grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));">
        ${byModule[mod].map(m => {
          const checked = editingFamily.memberKeys.indexOf(m.key)!==-1;
          return `
          <label class="flex items-center gap-2 px-3 py-2 rounded-lg border ${checked?'border-blue-400 bg-blue-50':'border-slate-200'} cursor-pointer text-[13px]">
            <input type="checkbox" ${checked?'checked':''} onchange="toggleKpiFamilyMember('${m.key}')">
            <span class="flex-1">${m.label}</span>
            ${kpiUnitChip(m.unit)}
          </label>`;
        }).join('')}
      </div>
    </div>`).join('');
  if(window.lucide) lucide.createIcons();
}
function renderKpiFamilyEditor(){
  if(!editingFamily) return;
  const input = document.getElementById('kpiFamilyNameInput');
  if(input) input.value = editingFamily.name;
  renderKpiFamilyMemberPicker();
}

/* ============================================================
   KPI Advanced Insight — fullscreen historical trend / behavior /
   stats page, plus related-KPI detail for formulated metrics.
   Reuses tmCfgFromTile/tmCfgFromRow (trend-modal.js) to generate
   the same seeded historical series the KPI trend-modal popup uses.
   ============================================================ */
let _insightCharts = [];
function destroyInsightCharts(){
  _insightCharts.forEach(c=>{ try{ c.destroy(); }catch(e){} });
  _insightCharts = [];
}
function kpiInsightCfgFor(entry){
  if(entry.kind==='tile') return tmCfgFromTile(entry._tile, entry.key);
  const colorHex = TM_COLOR_HEX[entry._sectionColor] || '#2563eb';
  return tmCfgFromRow(entry._row, colorHex, entry.key);
}
function kpiTrendStat(arr){
  const avg = arr.reduce((s,v)=>s+v,0)/arr.length;
  const first = arr[0], last = arr[arr.length-1];
  const change = first!==0 ? ((last-first)/Math.abs(first))*100 : 0;
  let volSum = 0;
  for(let i=1;i<arr.length;i++) volSum += Math.abs(arr[i]-arr[i-1]);
  const volatility = arr.length>1 ? volSum/(arr.length-1) : 0;
  return { avg, first, last, change, volatility };
}
function kpiFmtValLike(v, cfg){
  if(cfg.isCur){ const a = Math.abs(v); return (v<0?'-$':'$')+a.toLocaleString(undefined,{maximumFractionDigits:2}); }
  return v.toFixed(2)+cfg.unit;
}
const KPI_DIRECTION_LABELS = { lower:'Lower is Better', higher:'Higher is Better', zero:'Closer to Zero is Better' };
const KPI_DIRECTION_COLORS = { lower:{fg:'#16a34a',bg:'#dcfce7'}, higher:{fg:'#2563eb',bg:'#dbeafe'}, zero:{fg:'#7c3aed',bg:'#ede9fe'} };
function openKpiInsight(key){
  const entry = findKpiCatalogEntry(key);
  if(!entry) return;
  destroyInsightCharts();
  document.getElementById('kpiInsightTitle').textContent = entry.label;
  document.getElementById('kpiInsightSub').textContent = entry.dashLabel + (entry.section ? ' · '+entry.section : '') + ' · Advanced Insight';
  const dir = kpiDirectionOf(key);
  const dirColor = KPI_DIRECTION_COLORS[dir];
  document.getElementById('kpiInsightDirBadge').innerHTML =
    `<span style="font-size:12px;font-weight:700;color:${dirColor.fg};background:${dirColor.bg};padding:5px 12px;border-radius:999px;">${KPI_DIRECTION_LABELS[dir]}</span>`;
  document.getElementById('kpiInsightBody').innerHTML = buildKpiInsightBody(entry);
  if(window.lucide) lucide.createIcons();
  document.getElementById('kpiInsightView').classList.remove('hidden');
  renderKpiInsightCharts(entry);
}
function closeKpiInsight(){
  destroyInsightCharts();
  document.getElementById('kpiInsightView').classList.add('hidden');
}
function buildKpiInsightBody(entry){
  const cfg = kpiInsightCfgFor(entry);
  const stat = kpiTrendStat(cfg.quarter);
  const dir = kpiDirectionOf(entry.key);
  const trendGood = dir==='zero' ? Math.abs(stat.last) <= Math.abs(stat.first) : dir==='lower' ? stat.change<=0 : stat.change>=0;

  let statsHtml;
  if(entry.kind==='tile'){
    const k = entry._tile;
    statsHtml = `
    <div class="grid gap-4 mb-6" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));">
      <div class="card p-4"><div class="text-[11.5px] text-slate-500 font-bold mb-1">CURRENT</div><div class="text-[20px] font-bold text-slate-800">${k.value}</div></div>
      <div class="card p-4"><div class="text-[11.5px] text-slate-500 font-bold mb-1">WTD</div><div class="text-[20px] font-bold text-slate-800">${k.wtd}</div></div>
      <div class="card p-4"><div class="text-[11.5px] text-slate-500 font-bold mb-1">VS LAST WEEK</div><div class="text-[18px] font-bold ${k.cur.lwUp?'up-green':'up-red'}">${k.cur.lw}</div></div>
      <div class="card p-4"><div class="text-[11.5px] text-slate-500 font-bold mb-1">VS LAST YEAR</div><div class="text-[18px] font-bold ${k.cur.lyUp?'up-green':'up-red'}">${k.cur.ly}</div></div>
    </div>`;
  }else{
    const row = entry._row;
    const cols = ['CUR','WTD','LW (SD)','LW (WTD)','LW (TOT)'];
    statsHtml = `
    <div class="grid gap-4 mb-6" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));">
      ${cols.map((c,i)=>`<div class="card p-4"><div class="text-[11.5px] text-slate-500 font-bold mb-1">${c}</div><div class="text-[18px] font-bold text-slate-800">${row[i+1]}</div></div>`).join('')}
    </div>`;
  }

  const behaviorHtml = `
  <div class="card p-5 mb-6">
    <div class="font-bold text-[14px] text-slate-800 mb-3">Behavior Analysis</div>
    <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
      <div><div class="text-[11.5px] text-slate-500 font-bold mb-1">13-WEEK AVERAGE</div><div class="text-[16px] font-bold text-slate-800">${kpiFmtValLike(stat.avg, cfg)}</div></div>
      <div><div class="text-[11.5px] text-slate-500 font-bold mb-1">TREND (13 WEEKS)</div><div class="text-[16px] font-bold ${trendGood?'up-green':'up-red'}">${stat.change>=0?'+':''}${stat.change.toFixed(1)}%</div></div>
      <div><div class="text-[11.5px] text-slate-500 font-bold mb-1">VOLATILITY (AVG SWING)</div><div class="text-[16px] font-bold text-slate-800">${kpiFmtValLike(stat.volatility, cfg)}</div></div>
      <div><div class="text-[11.5px] text-slate-500 font-bold mb-1">DIRECTION SIGNAL</div><div class="text-[16px] font-bold ${trendGood?'up-green':'up-red'}">${trendGood?'Improving':'Needs Attention'}</div></div>
    </div>
  </div>`;

  const trendHtml = `
  <div class="chart-card mb-6">
    <div class="font-bold text-[14px] text-slate-800 mb-3">Historical Trend (Quarter)</div>
    <div style="height:280px;"><canvas id="kpiInsightMainChart"></canvas></div>
  </div>`;

  let relatedHtml = '';
  if(entry.formulated && entry.related.length){
    relatedHtml = `
    <div class="card p-5">
      <div class="font-bold text-[14px] text-slate-800 mb-1">Formulated Metric — Related KPIs</div>
      <div class="text-[12.5px] text-slate-500 mb-4">"${entry.label}" is derived from / related to these supporting metrics.</div>
      <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
        ${entry.related.map((r,i)=>`
          <div class="card p-4">
            <div class="text-[12px] text-slate-500 font-bold mb-1">${r.label}</div>
            <div class="text-[17px] font-bold text-slate-800 mb-2">${r.value}</div>
            <div style="height:60px;"><canvas id="kpiInsightSupChart${i}"></canvas></div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  return statsHtml + trendHtml + behaviorHtml + relatedHtml;
}
function renderKpiInsightCharts(entry){
  const cfg = kpiInsightCfgFor(entry);
  const mainCtx = document.getElementById('kpiInsightMainChart');
  if(mainCtx){
    const chart = new Chart(mainCtx, {
      type:'line',
      data:{ labels: cfg.quarter.map((_,i)=>'W'+(i+1)), datasets:[{
        label: entry.label, data: cfg.quarter, borderColor: cfg.color, backgroundColor: cfg.color+'25',
        borderWidth:2.5, pointRadius:3, pointBackgroundColor:cfg.color, tension:0.35, fill:true
      }]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>kpiFmtValLike(c.parsed.y,cfg)}} },
        scales:{ x:{grid:{display:false}}, y:{ticks:{callback:v=>kpiFmtValLike(v,cfg)}, grid:{color:'rgba(0,0,0,.06)'}} } }
    });
    _insightCharts.push(chart);
  }
  (cfg.supporting||[]).forEach((s,i)=>{
    const ctx = document.getElementById('kpiInsightSupChart'+i);
    if(!ctx) return;
    const chart = new Chart(ctx, {
      type:'line',
      data:{ labels: s.week.map((_,j)=>j+1), datasets:[{ data: s.week, borderColor: s.iconColor, backgroundColor:'transparent', borderWidth:2, pointRadius:0, tension:0.35, fill:false }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}} }
    });
    _insightCharts.push(chart);
  });
}

/* ============================================================
   Dashboard Scheduling (Organization Setting only) — per-dashboard
   scheduled email: a popup to configure scheduling type / timing /
   content, plus a list of every currently scheduled dashboard.
   ============================================================ */
const SCHED_STORES = ['236 - Bressi Ranch', '104 - Downtown Plaza', '212 - Westside Center', '310 - Lakeside Mall', '418 - Northgate Commons'];
const SCHED_EMAILS_PER_ROLE_PER_STORE = 6;

let dashSchedules = [];
let editingScheduleId = null;

function openDashScheduleList(){
  view = 'dashSchedule';
  render();
}

function statusPill(active){
  return `<span style="font-size:11.5px;font-weight:700;color:${active?'#16a34a':'#64748b'};background:${active?'#dcfce7':'#f1f5f9'};padding:4px 10px;border-radius:999px;">${active?'Active':'Inactive'}</span>`;
}

function describeScheduleFrequency(s){
  if(s.frequency==='Daily'){
    if(s.dailyMode==='everyWeekday') return 'Daily · Every weekday';
    if(s.dailyMode==='everyN') return `Daily · Every ${s.dailyN||2} days`;
    return 'Daily · Every day';
  }
  if(s.frequency==='Weekly'){
    if(s.weeklyMode==='everyN') return `Weekly · Every ${s.weeklyN||2} weeks on ${(s.weeklyDays||[]).join(', ')||'—'}`;
    return `Weekly · Every ${s.weeklyDay||'Monday'}`;
  }
  if(s.frequency==='Monthly'){
    if(s.monthlyMode==='nthWeekday') return `Monthly · The ${s.monthlyNth||'first'} ${s.monthlyWeekdayType||'Monday'} of every ${s.monthlyMonths2||1} mo.`;
    return `Monthly · Day ${s.monthlyDay||1} of every ${s.monthlyMonths1||1} mo.`;
  }
  return s.frequency;
}
function describeScheduleEnd(s){
  if(s.endType==='endAfter') return `After ${s.endOccurrences||1} occurrence(s)`;
  if(s.endType==='endBy') return s.endDate || '-';
  return '-';
}

function renderDashScheduleList(){
  dashSchedules = loadDashboardSchedules();
  const wrap = document.getElementById('dashScheduleRows');
  if(!dashSchedules.length){
    wrap.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No dashboards are scheduled yet.</td></tr>`;
    return;
  }
  const sorted = [...dashSchedules].sort((a,b)=>a.dashboardName.localeCompare(b.dashboardName));
  wrap.innerHTML = sorted.map(s => {
    return `
    <tr class="border-b border-slate-100">
      <td class="px-5 py-3 font-bold text-slate-800">${s.dashboardName}</td>
      <td class="px-5 py-3 text-center">${describeScheduleFrequency(s)}</td>
      <td class="px-5 py-3 text-center">${s.time}</td>
      <td class="px-5 py-3 text-center">${s.startDate}</td>
      <td class="px-5 py-3 text-center">${describeScheduleEnd(s)}</td>
      <td class="px-5 py-3 text-center">${statusPill(s.active)}</td>
      <td class="px-5 py-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button class="icon-btn" title="Edit" onclick="openDashScheduleModal(null, '${s.id}')"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
          <button class="icon-btn danger" title="Delete" onclick="deleteDashSchedule('${s.id}')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
  if(window.lucide) lucide.createIcons();
}

function deleteDashSchedule(id){
  const list = loadDashboardSchedules();
  const s = list.find(x=>x.id===id);
  if(!s) return;
  openSectionsConfirm('Delete Schedule', `Stop the scheduled email for "${s.dashboardName}"?`, ()=>{
    saveDashboardSchedules(list.filter(x=>x.id!==id));
    renderDashScheduleList();
  });
}

function populateScheduleDashboardSelect(selectedId){
  const sel = document.getElementById('schedDashboardSelect');
  const eligible = [...dashboards].filter(d=>!d.isPageLink).sort((a,b)=>a.order-b.order);
  sel.innerHTML = eligible.map(d=>`<option value="${d.id}" ${d.id===selectedId?'selected':''}>${d.name}</option>`).join('');
}
function buildDefaultScheduleSubject(dashName, frequency){
  return `${dashName} | ${frequency}`;
}
function buildDefaultScheduleBody(dashName){
  return `<div>Hi Team,</div><div><br></div><div>Please find attached the <strong>${dashName}</strong>.</div>`
    + `<div>This is an automated email generated as part of the scheduled dashboard reporting process.</div><div><br></div>`
    + `<div>Best regards,</div><div>Altametrics Growth</div>`;
}

/* ---- Scheduling Type (mode / stores / roles) ---- */
function onScheduleModeChange(){
  const mode = document.querySelector('input[name="schedMode"]:checked').value;
  document.getElementById('schedSelfBlock').classList.toggle('hidden', mode!=='self');
  document.getElementById('schedRoleBlock').classList.toggle('hidden', mode!=='role');
  if(mode==='self') document.getElementById('schedSelfEmail').value = CURRENT_USER_EMAIL;
}
function populateScheduleStoreList(selectedStores){
  const wrap = document.getElementById('schedStoreList');
  const sel = new Set(selectedStores||[]);
  document.getElementById('schedStoreAllLabel').textContent = `Corporate (${SCHED_STORES.length})`;
  wrap.innerHTML = SCHED_STORES.map(store => `
    <label class="flex items-center gap-2 px-3 py-2 pl-7 hover:bg-slate-50 cursor-pointer text-[13px]">
      <input type="checkbox" class="sched-store-cb" value="${store}" ${sel.has(store)?'checked':''} onchange="onScheduleStoreChange()"> ${store}
    </label>`).join('');
  document.getElementById('schedStoreSelectAll').checked = sel.size===SCHED_STORES.length;
  updateScheduleStoreSelectedText();
}
function updateScheduleStoreSelectedText(){
  const checked = Array.from(document.querySelectorAll('.sched-store-cb:checked')).map(cb=>cb.value);
  const el = document.getElementById('schedStoreSelectedText');
  const full = checked.length ? checked.join(', ') : 'None selected';
  el.textContent = checked.length===0 ? 'None selected' : checked.length===1 ? checked[0] : `${checked.length} stores selected`;
  el.title = full;
}
function toggleAllScheduleStores(checked){
  document.querySelectorAll('.sched-store-cb').forEach(cb=>cb.checked=checked);
  onScheduleStoreChange();
}
function onScheduleStoreChange(){
  updateScheduleStoreSelectedText();
  const all = document.querySelectorAll('.sched-store-cb').length;
  const checked = document.querySelectorAll('.sched-store-cb:checked').length;
  document.getElementById('schedStoreSelectAll').checked = all>0 && all===checked;
  updateScheduleEmailCount();
}
function populateScheduleRoleDropdown(selectedRoles){
  const wrap = document.getElementById('schedRoleDropdown');
  const sel = new Set(selectedRoles||[]);
  wrap.innerHTML = ROLES.map(r => `
    <label class="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer text-[13px]">
      <input type="checkbox" class="sched-role-cb" value="${r}" ${sel.has(r)?'checked':''} onchange="onScheduleRoleChange()"> ${r}
    </label>`).join('');
  onScheduleRoleChange();
}
function onScheduleRoleChange(){
  const checked = Array.from(document.querySelectorAll('.sched-role-cb:checked')).map(cb=>cb.value);
  document.getElementById('schedRoleSelectedText').textContent = checked.length ? checked.join(', ') : 'Select role(s)...';
  updateScheduleEmailCount();
}
function updateScheduleEmailCount(){
  const roles = Array.from(document.querySelectorAll('.sched-role-cb:checked')).map(cb=>cb.value);
  const stores = Array.from(document.querySelectorAll('.sched-store-cb:checked')).map(cb=>cb.value);
  const tile = document.getElementById('schedEmailCountTile');
  const textEl = document.getElementById('schedEmailCountText');
  if(roles.length && stores.length){
    const total = SCHED_EMAILS_PER_ROLE_PER_STORE * roles.length * stores.length;
    textEl.textContent = `${total} Email ID's Added (${roles.join(', ')})`;
    tile.classList.remove('hidden');
  }else{
    tile.classList.add('hidden');
  }
}
/* ---- Schedule Timing ---- */
function onScheduleFrequencyChange(){
  const f = document.getElementById('schedFrequency').value;
  document.getElementById('schedDailyOpts').classList.toggle('hidden', f!=='Daily');
  document.getElementById('schedWeeklyOpts').classList.toggle('hidden', f!=='Weekly');
  document.getElementById('schedMonthlyOpts').classList.toggle('hidden', f!=='Monthly');
}
function onScheduleEndTypeChange(){
  const type = document.querySelector('input[name="schedEndType"]:checked').value;
  document.getElementById('schedEndOccurrences').disabled = type!=='endAfter';
  document.getElementById('schedEndDate').disabled = type!=='endBy';
  if(type==='noEnd'){
    document.getElementById('schedEndOccurrences').value = '1';
    document.getElementById('schedEndDate').value = '';
  }
}

function onScheduleDashboardChange(){
  const dash = dashboards.find(d=>d.id===document.getElementById('schedDashboardSelect').value);
  const dashName = dash ? dash.name : 'Dashboard';
  const frequency = document.getElementById('schedFrequency').value;
  document.getElementById('schedSubject').value = buildDefaultScheduleSubject(dashName, frequency);
  document.getElementById('schedEmailBody').innerHTML = buildDefaultScheduleBody(dashName);
}

function openDashScheduleModal(dashboardId, scheduleId){
  const list = loadDashboardSchedules();
  let sched = null;
  if(scheduleId) sched = list.find(s=>s.id===scheduleId);
  else if(dashboardId) sched = list.find(s=>s.dashboardId===dashboardId);
  editingScheduleId = sched ? sched.id : null;

  document.getElementById('dashScheduleModalTitle').textContent = sched ? 'Edit Dashboard Schedule' : 'Schedule Dashboard';
  populateScheduleDashboardSelect(dashboardId || (sched && sched.dashboardId) || null);

  const mode = (sched && sched.schedulingMode==='role') ? 'role' : 'self';
  document.querySelector(`input[name="schedMode"][value="${mode}"]`).checked = true;
  document.getElementById('schedSelfEmail').value = CURRENT_USER_EMAIL;
  populateScheduleStoreList(sched ? sched.stores : []);
  populateScheduleRoleDropdown(sched ? sched.roles : []);
  onScheduleModeChange();

  document.getElementById('schedStartDate').value = sched ? sched.startDate : '';
  document.getElementById('schedTime').value = sched ? sched.time : '10:00';
  document.getElementById('schedFrequency').value = 'Daily';
  onScheduleFrequencyChange();

  document.querySelector(`input[name="schedDailyMode"][value="${sched ? (sched.dailyMode||'everyDay') : 'everyDay'}"]`).checked = true;
  document.getElementById('schedDailyN').value = sched ? (sched.dailyN||2) : 2;

  document.querySelector(`input[name="schedWeeklyMode"][value="${sched ? (sched.weeklyMode||'single') : 'single'}"]`).checked = true;
  document.getElementById('schedWeeklyDay').value = sched ? (sched.weeklyDay||'Monday') : 'Monday';
  document.getElementById('schedWeeklyN').value = sched ? (sched.weeklyN||2) : 2;
  const weeklyDaysSel = new Set(sched ? (sched.weeklyDays||[]) : []);
  document.querySelectorAll('.sched-weekly-daycb').forEach(cb=> cb.checked = weeklyDaysSel.has(cb.value));

  document.querySelector(`input[name="schedMonthlyMode"][value="${sched ? (sched.monthlyMode||'dayOfMonth') : 'dayOfMonth'}"]`).checked = true;
  document.getElementById('schedMonthlyDay').value = sched ? (sched.monthlyDay||1) : 1;
  document.getElementById('schedMonthlyMonths1').value = sched ? (sched.monthlyMonths1||1) : 1;
  document.getElementById('schedMonthlyNth').value = sched ? (sched.monthlyNth||'first') : 'first';
  document.getElementById('schedMonthlyWeekdayType').value = sched ? (sched.monthlyWeekdayType||'Monday') : 'Monday';
  document.getElementById('schedMonthlyMonths2').value = sched ? (sched.monthlyMonths2||1) : 1;

  document.querySelector(`input[name="schedEndType"][value="${sched ? (sched.endType||'noEnd') : 'noEnd'}"]`).checked = true;
  document.getElementById('schedEndOccurrences').value = sched ? (sched.endOccurrences||1) : 1;
  document.getElementById('schedEndDate').value = sched ? (sched.endDate||'') : '';
  onScheduleEndTypeChange();

  if(sched){
    document.getElementById('schedSubject').value = sched.subject;
    document.getElementById('schedEmailBody').innerHTML = sched.emailBody;
  }else{
    onScheduleDashboardChange();
  }
  document.getElementById('schedActiveToggle').classList.toggle('on', sched ? sched.active!==false : true);

  document.getElementById('dashScheduleModal').classList.remove('hidden');
  if(window.lucide) lucide.createIcons();
}
function closeDashScheduleModal(){
  document.getElementById('dashScheduleModal').classList.add('hidden');
  editingScheduleId = null;
}
function saveDashSchedule(){
  const dashboardId = document.getElementById('schedDashboardSelect').value;
  if(!dashboardId){ alert('Please select a dashboard.'); return; }
  const startDate = document.getElementById('schedStartDate').value;
  const time = document.getElementById('schedTime').value;
  if(!startDate || !time){ alert('Please set a start date and trigger time.'); return; }

  const stores = Array.from(document.querySelectorAll('.sched-store-cb:checked')).map(cb=>cb.value);
  if(!stores.length){ alert('Please select at least one franchise/store.'); return; }

  const mode = document.querySelector('input[name="schedMode"]:checked').value;
  const selfEmail = document.getElementById('schedSelfEmail').value.trim();
  const roles = Array.from(document.querySelectorAll('.sched-role-cb:checked')).map(cb=>cb.value);
  if(mode==='self' && !selfEmail){ alert('Please enter your email.'); return; }
  if(mode==='role' && !roles.length){ alert('Please select at least one role.'); return; }

  const frequency = document.getElementById('schedFrequency').value;
  const endType = document.querySelector('input[name="schedEndType"]:checked').value;

  const dash = dashboards.find(d=>d.id===dashboardId);
  const schedule = {
    id: editingScheduleId || uid('sched'),
    dashboardId, dashboardName: dash ? dash.name : dashboardId,
    schedulingMode: mode, selfEmail, roles, stores,
    subject: document.getElementById('schedSubject').value.trim() || buildDefaultScheduleSubject(dash ? dash.name : 'Dashboard', frequency),
    emailBody: document.getElementById('schedEmailBody').innerHTML,
    frequency,
    dailyMode: document.querySelector('input[name="schedDailyMode"]:checked').value,
    dailyN: +document.getElementById('schedDailyN').value || 2,
    weeklyMode: document.querySelector('input[name="schedWeeklyMode"]:checked').value,
    weeklyDay: document.getElementById('schedWeeklyDay').value,
    weeklyN: +document.getElementById('schedWeeklyN').value || 2,
    weeklyDays: Array.from(document.querySelectorAll('.sched-weekly-daycb:checked')).map(cb=>cb.value),
    monthlyMode: document.querySelector('input[name="schedMonthlyMode"]:checked').value,
    monthlyDay: +document.getElementById('schedMonthlyDay').value || 1,
    monthlyMonths1: +document.getElementById('schedMonthlyMonths1').value || 1,
    monthlyNth: document.getElementById('schedMonthlyNth').value,
    monthlyWeekdayType: document.getElementById('schedMonthlyWeekdayType').value,
    monthlyMonths2: +document.getElementById('schedMonthlyMonths2').value || 1,
    time, startDate,
    endType,
    endOccurrences: +document.getElementById('schedEndOccurrences').value || 1,
    endDate: endType==='endBy' ? document.getElementById('schedEndDate').value : '',
    format: 'PNG',
    active: document.getElementById('schedActiveToggle').classList.contains('on')
  };

  const list = loadDashboardSchedules();
  const idx = list.findIndex(s=>s.id===schedule.id);
  if(idx>=0) list[idx] = schedule; else list.push(schedule);
  saveDashboardSchedules(list);

  closeDashScheduleModal();
  if(SECTION==='dashboards' && view==='dashSchedule') renderDashScheduleList();
}

/* ============================================================
   Custom KPI — formula builder combining two existing KPIs into a
   new derived metric. Structured after the reference "Ad Hoc Keys
   Settings" popup (Key Information + Formula Configuration), but
   built on this app's own 78-KPI catalog instead of raw report
   fields, and kept on this app's own theme.
   ============================================================ */
const CUSTOM_KPI_FORMULAS = [
  { id:'ratio', expr:'X ÷ Y', label:'Ratio of X to Y', unitHint:'' },
  { id:'percentOf', expr:'(X ÷ Y) × 100', label:'X as a % of Y', unitHint:'%' },
  { id:'difference', expr:'X − Y', label:'Difference between X and Y', unitHint:'' },
  { id:'percentVariance', expr:'((X − Y) ÷ Y) × 100', label:'% variance of X vs Y', unitHint:'%' },
  { id:'sum', expr:'X + Y', label:'Sum of X and Y', unitHint:'' },
  { id:'average', expr:'(X + Y) ÷ 2', label:'Average of X and Y', unitHint:'' }
];

let editingCustomKpiId = null;
let customKpiXKey = null, customKpiXLabel = null;
let customKpiYKey = null, customKpiYLabel = null;
let customKpiFormulaId = null;

function customKpiFormulaExpr(entry){
  const f = CUSTOM_KPI_FORMULAS.find(x=>x.id===entry.formulaId);
  if(!f) return '—';
  return f.expr.replace(/X/g, entry.xLabel||'X').replace(/Y/g, entry.yLabel||'Y');
}
function onCustomKpiSearchInput(v){ customKpiSearchTerm = v; renderCustomKpiList(); }
function renderCustomKpiList(){
  const wrap = document.getElementById('customKpiRows');
  const term = customKpiSearchTerm.trim().toLowerCase();
  let list = loadCustomKpis();
  if(term) list = list.filter(c=> c.name.toLowerCase().includes(term) || (c.module||'').toLowerCase().includes(term));
  list = [...list].sort((a,b)=>a.name.localeCompare(b.name));
  if(!list.length){
    wrap.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No custom KPIs yet. Click "Add" to build one from two existing KPIs.</td></tr>`;
    return;
  }
  wrap.innerHTML = list.map(c => {
    const expr = customKpiFormulaExpr(c);
    return `
    <tr class="border-b border-slate-100">
      <td class="px-5 py-3 font-bold text-slate-800">${c.name}</td>
      <td class="px-5 py-3">${kpiModuleChip(c.module)}</td>
      <td class="px-5 py-3 text-slate-600" style="max-width:260px;" title="${expr}">
        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${expr}</div>
      </td>
      <td class="px-5 py-3 text-center">${kpiUnitChip(c.unit)}</td>
      <td class="px-5 py-3 text-center">${KPI_DIRECTION_LABELS[c.direction]||'—'}</td>
      <td class="px-5 py-3 text-center">${statusPill(c.active)}</td>
      <td class="px-5 py-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button class="icon-btn" title="Edit" onclick="openCustomKpiModal('${c.id}')"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
          <button class="icon-btn danger" title="Delete" onclick="deleteCustomKpi('${c.id}')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
  if(window.lucide) lucide.createIcons();
}
function deleteCustomKpi(id){
  const list = loadCustomKpis();
  const c = list.find(x=>x.id===id);
  if(!c) return;
  openSectionsConfirm('Delete Custom KPI', `Delete "${c.name}"? This won't affect the KPIs it was built from.`, ()=>{
    saveCustomKpis(list.filter(x=>x.id!==id));
    renderCustomKpiList();
  });
}
function populateCustomKpiModuleSelect(selected){
  const sel = document.getElementById('customKpiModuleSelect');
  const modules = [...new Set(buildKpiCatalog().map(m=>m.module))].sort();
  if(!modules.length) modules.push('Other');
  sel.innerHTML = modules.map(m=>`<option value="${m}" ${m===selected?'selected':''}>${m}</option>`).join('');
}
function customKpiVarOptionLabel(m){
  return `${m.label} — ${m.dashLabel}${m.section ? ' · '+m.section : ''}`;
}
function populateCustomKpiVarList(which){
  const wrap = document.getElementById(which==='x' ? 'customKpiXList' : 'customKpiYList');
  // X/Y can only be real KPIs — never another Custom KPI, so formulas can't chain into a cycle.
  const catalog = buildKpiCatalog().filter(m=>!m.isCustom);
  const byModule = {};
  catalog.forEach(m=>{ (byModule[m.module]=byModule[m.module]||[]).push(m); });
  const modules = Object.keys(byModule).sort();
  wrap.innerHTML = modules.map(mod => `
    <div class="px-2 py-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">${mod}</div>
    ${byModule[mod].map(m => `
      <div class="opt-item px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 cursor-pointer rounded" onclick="selectCustomKpiVar('${which}','${m.key}')">
        ${customKpiVarOptionLabel(m)}
      </div>`).join('')}
  `).join('');
}
function filterCustomKpiVarList(listId, q){
  q = q.toLowerCase();
  document.querySelectorAll('#'+listId+' .opt-item').forEach(el=>{
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function selectCustomKpiVar(which, key){
  const entry = buildKpiCatalog().find(m=>m.key===key);
  const label = entry ? entry.label : key;
  if(which==='x'){
    customKpiXKey = key; customKpiXLabel = label;
    const el = document.getElementById('customKpiXText'); el.textContent = label; el.classList.remove('text-slate-500');
    document.getElementById('customKpiXDropdown').classList.add('hidden');
  }else{
    customKpiYKey = key; customKpiYLabel = label;
    const el = document.getElementById('customKpiYText'); el.textContent = label; el.classList.remove('text-slate-500');
    document.getElementById('customKpiYDropdown').classList.add('hidden');
  }
  updateCustomKpiPreview();
}
function populateCustomKpiFormulaList(){
  const wrap = document.getElementById('customKpiFormulaDropdown');
  wrap.innerHTML = CUSTOM_KPI_FORMULAS.map(f => `
    <div class="px-3 py-2 text-[12.5px] text-slate-700 hover:bg-slate-50 cursor-pointer" onclick="selectCustomKpiFormula('${f.id}')">
      <div class="font-bold text-slate-800">${f.expr}</div>
      <div class="text-slate-500 text-[11.5px]">${f.label}</div>
    </div>`).join('');
}
function selectCustomKpiFormula(id){
  const f = CUSTOM_KPI_FORMULAS.find(x=>x.id===id);
  if(!f) return;
  customKpiFormulaId = id;
  const el = document.getElementById('customKpiFormulaText');
  el.textContent = f.expr + ' — ' + f.label;
  el.classList.remove('text-slate-500');
  document.getElementById('customKpiFormulaDropdown').classList.add('hidden');
  if(f.unitHint) document.getElementById('customKpiUnitSelect').value = f.unitHint;
  updateCustomKpiPreview();
}
function updateCustomKpiPreview(){
  const el = document.getElementById('customKpiPreviewText');
  if(customKpiXKey && customKpiYKey && customKpiFormulaId){
    const f = CUSTOM_KPI_FORMULAS.find(x=>x.id===customKpiFormulaId);
    el.textContent = f.expr.replace(/X/g, customKpiXLabel).replace(/Y/g, customKpiYLabel);
  }else{
    el.textContent = 'Pick X, Formula and Y to preview';
  }
}
function openCustomKpiModal(id){
  const list = loadCustomKpis();
  const c = id ? list.find(x=>x.id===id) : null;
  editingCustomKpiId = c ? c.id : null;

  document.getElementById('customKpiModalTitle').textContent = c ? 'Edit Custom KPI' : 'Add Custom KPI';
  document.getElementById('customKpiNameInput').value = c ? c.name : '';
  populateCustomKpiModuleSelect(c ? c.module : null);
  document.getElementById('customKpiUnitSelect').value = c ? c.unit : '%';
  document.getElementById('customKpiDirectionSelect').value = c ? c.direction : 'higher';
  document.getElementById('customKpiNotesInput').value = c ? (c.notes||'') : '';
  document.getElementById('customKpiActiveToggle').classList.toggle('on', c ? c.active!==false : true);

  customKpiXKey = c ? c.xKey : null; customKpiXLabel = c ? c.xLabel : null;
  customKpiYKey = c ? c.yKey : null; customKpiYLabel = c ? c.yLabel : null;
  customKpiFormulaId = c ? c.formulaId : null;

  const xEl = document.getElementById('customKpiXText');
  xEl.textContent = customKpiXLabel || 'Select KPI...'; xEl.classList.toggle('text-slate-500', !customKpiXLabel);
  const yEl = document.getElementById('customKpiYText');
  yEl.textContent = customKpiYLabel || 'Select KPI...'; yEl.classList.toggle('text-slate-500', !customKpiYLabel);
  const fEntry = customKpiFormulaId ? CUSTOM_KPI_FORMULAS.find(x=>x.id===customKpiFormulaId) : null;
  const fEl = document.getElementById('customKpiFormulaText');
  fEl.textContent = fEntry ? (fEntry.expr+' — '+fEntry.label) : 'Select formula type...';
  fEl.classList.toggle('text-slate-500', !fEntry);

  populateCustomKpiVarList('x');
  populateCustomKpiVarList('y');
  populateCustomKpiFormulaList();
  updateCustomKpiPreview();

  document.getElementById('customKpiModal').classList.remove('hidden');
  if(window.lucide) lucide.createIcons();
}
function closeCustomKpiModal(){
  document.getElementById('customKpiModal').classList.add('hidden');
  editingCustomKpiId = null;
}
function saveCustomKpi(){
  const name = document.getElementById('customKpiNameInput').value.trim();
  if(!name){ alert('Please enter a KPI name.'); return; }
  if(!customKpiXKey){ alert('Please select an X (KPI).'); return; }
  if(!customKpiFormulaId){ alert('Please select a formula.'); return; }
  if(!customKpiYKey){ alert('Please select a Y (KPI).'); return; }

  const entry = {
    id: editingCustomKpiId || uid('customkpi'),
    name,
    module: document.getElementById('customKpiModuleSelect').value,
    unit: document.getElementById('customKpiUnitSelect').value,
    direction: document.getElementById('customKpiDirectionSelect').value,
    notes: document.getElementById('customKpiNotesInput').value.trim(),
    xKey: customKpiXKey, xLabel: customKpiXLabel,
    yKey: customKpiYKey, yLabel: customKpiYLabel,
    formulaId: customKpiFormulaId,
    active: document.getElementById('customKpiActiveToggle').classList.contains('on')
  };

  const list = loadCustomKpis();
  const idx = list.findIndex(x=>x.id===entry.id);
  if(idx>=0) list[idx] = entry; else list.push(entry);
  saveCustomKpis(list);

  closeCustomKpiModal();
  renderCustomKpiList();
}

document.addEventListener('DOMContentLoaded', init);
