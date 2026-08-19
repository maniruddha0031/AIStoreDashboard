/* ============================================================
   Global Setting / Organization Setting screen logic
   Both sidebar entries point at this same page; `scope` query
   param only changes the title (feature set is identical).
   ============================================================ */

const params = new URLSearchParams(location.search);
const SCOPE = params.get('scope') === 'organization' ? 'organization' : 'global';
const SCOPE_LABEL = SCOPE === 'organization' ? 'Organization Setting' : 'Global Setting';

let dashboards = [];
let apps = [];
let view = 'list';               // 'list' | 'editor'
let editing = null;              // dashboard object being edited (clone)
let isNew = false;
let editorTab = 'general';       // 'general' | 'sections' | 'roles' | 'applications'
let pendingSlot = null;          // {rowIdx, slotIdx, kind}
let editingDefaultLanding = false; // staged "Is Default Landing" choice for the dashboard being edited (Organization scope only, applied on Save)
let dashSearchTerm = '';         // Dashboards-list search box (matches name or display order)

function init(){
  dashboards = loadDashboards();
  apps = loadApps();
  document.getElementById('scopeTitle').textContent = SCOPE_LABEL;
  document.title = SCOPE_LABEL + ' — AI Dashboard';
  document.getElementById('sideDashLink').classList.remove('active');
  document.getElementById('sideGlobalLink').classList.toggle('active', SCOPE==='global');
  document.getElementById('sideOrgLink').classList.toggle('active', SCOPE==='organization');
  document.getElementById('defaultColHead').classList.toggle('hidden', SCOPE!=='organization');
  render();
}

function render(){
  const listView = document.getElementById('listView');
  const editorView = document.getElementById('editorView');
  listView.classList.toggle('hidden', view!=='list');
  editorView.classList.toggle('hidden', view!=='editor');

  if(view==='list') renderDashboardList();
  else renderEditor();

  if(window.lucide) lucide.createIcons();
}

/* ---------------- Dashboards list (table) ---------------- */
function getVisibleDashboardsSorted(){
  const term = dashSearchTerm.trim().toLowerCase();
  const filtered = term ? dashboards.filter(d => d.name.toLowerCase().includes(term) || String(d.order).includes(term)) : dashboards;
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
          <button class="icon-btn danger" title="Delete" onclick="deleteDashboard('${d.id}')"><i data-lucide="trash-2" style="width:15px;height:15px"></i></button>
        </div>
      </td>
    </tr>`).join('');
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
  if(editorTab==='roles' && editing.enableAllRoles) editorTab = 'general';

  const body = document.getElementById('editorBody');
  if(editorTab==='general') body.innerHTML = generalTabHtml();
  else if(editorTab==='sections') body.innerHTML = sectionsTabHtml();
  else if(editorTab==='roles') body.innerHTML = rolesTabHtml();
  else body.innerHTML = applicationsTabHtml();

  if(window.lucide) lucide.createIcons();
  if(editorTab==='sections') initSectionsDragDrop();
}

function generalTabHtml(){
  const iconOptions = ICON_CHOICES.map(i=>`<option value="${i}" ${editing.icon===i?'selected':''}>${i}</option>`).join('');
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
        <div class="text-[13.5px] font-bold text-slate-700">Is Org</div>
        <div class="text-[12px] text-slate-500 mt-0.5">By enabling this flag, you allow users to choose store or organization-level views during dashboard creation.</div>
      </div>
      <button class="toggle ${editing.isOrg?'on':''}" onclick="editing.isOrg=!editing.isOrg; render();"></button>
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
              <span class="del" onclick="removeComponent(${rIdx},${sIdx})"><i data-lucide="x" style="width:14px;height:14px"></i></span>
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

function componentPreviewHtml(slot){
  if(slot.kind==='banner'){
    return `<div class="preview-banner"><div class="pb-title">${slot.label}</div><div class="pb-sub">Operational summary banner</div><div class="pb-score">86%</div></div>`;
  }
  if(slot.kind==='grid'){
    const colorHex = { blue:'#dbe7fb', green:'#d9f2e3', red:'#fbdede', orange:'#fbe7d2', purple:'#ece3fb', indigo:'#dfe3fb' };
    return `<div class="preview-grid"><div class="pg-head" style="background:${colorHex[slot.color]||'#dbe7fb'}">${slot.label}</div><div class="pg-body">KPI &middot; CUR &middot; WTD &middot; SCORE</div></div>`;
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

function openComponentModal(rowIdx, slotIdx, kind){
  pendingSlot = { rowIdx, slotIdx, kind };
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

document.addEventListener('DOMContentLoaded', init);
