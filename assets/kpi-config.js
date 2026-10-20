/* ============================================================
   KPIs Configuration screen (Manage Account > My Organization >
   KPIs Configuration) — enable KPIs for the manager mobile app,
   set their display order, module and supporting KPIs. Data lives
   in kpi-config-data.js (loadKpiConfig / saveKpiConfig).
   ============================================================ */
let kcKpis = [];
let kcDirty = false;
let kcStatusFilter = 'all', kcTypeFilter = 'ALL', kcModuleFilter = 'ALL', kcSearchTerm = '';
let kcDragId = null;

function initKpiConfig(){
    kcKpis = loadKpiConfig();
    kcDirty = false;
    kcRenderFilterModules();
    kcUpdateSaveBtn();
    renderKpiConfig();
}
function kcIdx(id){ return kcKpis.findIndex(k => k.id === id); }
function kcMarkDirty(){ kcDirty = true; kcUpdateSaveBtn(); }
function kcUpdateSaveBtn(){
    const btn = document.getElementById('kcSaveBtn');
    if(!btn) return;
    btn.disabled = !kcDirty;
    let dot = btn.querySelector('.kc-dirty-dot');
    if(kcDirty && !dot){ dot = document.createElement('span'); dot.className = 'kc-dirty-dot'; btn.appendChild(dot); }
    else if(!kcDirty && dot) dot.remove();
}
function kcSave(){
    if(!kcDirty) return;
    const before = loadKpiConfig();
    saveKpiConfig(kcKpis);
    // a changed module moves the KPI to that module's KPI Family too
    if(typeof kfSyncModuleChanges === 'function') kfSyncModuleChanges(before, kcKpis);
    kcDirty = false;
    kcUpdateSaveBtn();
    kcToast('KPI configuration saved');
}
function kcReset(){
    const before = loadKpiConfig();
    resetKpiConfig();
    kcKpis = loadKpiConfig();
    if(typeof kfSyncModuleChanges === 'function') kfSyncModuleChanges(before, kcKpis);
    kcDirty = false;
    kcUpdateSaveBtn();
    renderKpiConfig(kcCaptureRects());
    kcToast('Restored default configuration');
}
function kcToast(msg){
    document.getElementById('kcToastMsg').innerText = msg;
    const t = document.getElementById('kcToast');
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}
function kcToggle(id){
    const i = kcIdx(id), k = kcKpis[i];
    const turningOn = !k.enabled;
    k.enabled = !k.enabled;
    // newly-enabled KPIs join the end of the active list (next display order)
    if(turningOn){ kcKpis.splice(i, 1); kcKpis.push(k); }
    kcMarkDirty();
    renderKpiConfig(kcCaptureRects());
}

/* ---------- filters ---------- */
function kcRenderFilterModules(){
    const wrap = document.getElementById('kcModuleFilterList');
    if(!wrap) return;
    wrap.innerHTML = `
        <label class="kc-filter-opt"><span><input type="radio" name="kcModuleRadio" value="ALL" checked> All Modules</span></label>` +
        KC_MODULES.map(m => `
        <label class="kc-filter-opt"><span><input type="radio" name="kcModuleRadio" value="${m}"> ${m}</span><span class="kc-filter-n" data-kc-mod="${m}"></span></label>`).join('');
}
function kcToggleFilters(){
    const p = document.getElementById('kcFiltersPopover');
    if(p.classList.contains('hidden')){
        [['kcStatusRadio', kcStatusFilter], ['kcTypeRadio', kcTypeFilter], ['kcModuleRadio', kcModuleFilter]].forEach(([n, v]) => {
            const el = document.querySelector(`input[name="${n}"][value="${v}"]`);
            if(el) el.checked = true;
        });
    }
    p.classList.toggle('hidden');
}
function kcClearFilters(){
    kcStatusFilter = 'all'; kcTypeFilter = 'ALL'; kcModuleFilter = 'ALL';
    document.getElementById('kcFiltersPopover').classList.add('hidden');
    renderKpiConfig();
}
function kcApplyFilters(){
    const v = n => { const el = document.querySelector(`input[name="${n}"]:checked`); return el ? el.value : null; };
    kcStatusFilter = v('kcStatusRadio') || 'all';
    kcTypeFilter = v('kcTypeRadio') || 'ALL';
    kcModuleFilter = v('kcModuleRadio') || 'ALL';
    document.getElementById('kcFiltersPopover').classList.add('hidden');
    renderKpiConfig();
}
function kcOnSearch(v){ kcSearchTerm = v.trim().toLowerCase(); renderKpiConfig(); }
function kcVisible(){
    const q = kcSearchTerm;
    return kcKpis.filter(k => {
        if(kcStatusFilter === 'on'  && !k.enabled) return false;
        if(kcStatusFilter === 'off' &&  k.enabled) return false;
        if(kcTypeFilter !== 'ALL' && k.fmt !== kcTypeFilter) return false;
        if(kcModuleFilter !== 'ALL' && k.module !== kcModuleFilter) return false;
        if(q && !k.name.toLowerCase().includes(q) && !k.key.toLowerCase().includes(q) && !k.desc.toLowerCase().includes(q) && !k.module.toLowerCase().includes(q)) return false;
        return true;
    });
}

/* ---------- render (with FLIP animation) ---------- */
function kcCaptureRects(){
    const map = {};
    document.querySelectorAll('.kc-row').forEach(el => { map[el.dataset.id] = el.getBoundingClientRect(); });
    return map;
}
function kcComboCellHtml(k, slot){
    const supId = slot === 1 ? k.support1 : k.support2;
    const sup = supId ? kcKpis.find(x => x.id === supId) : null;
    return `
        <div class="kc-combo-wrap" data-slot="${slot}">
            <button type="button" class="kc-combo-trigger ${sup ? '' : 'is-placeholder'}" title="${sup ? escAttr(sup.name + ' (' + sup.key + ')') : 'Select a supporting KPI'}"
                onclick="kcOpenCombo(this, '${k.id}', ${slot})">${sup ? sup.name : 'Select KPI…'}</button>
        </div>`;
}
function kcModuleSelectHtml(k){
    return `<select class="kc-module-select" title="Module: ${k.module}" onchange="kcOnModuleChange('${k.id}', this.value)">${
        KC_MODULES.map(m => `<option value="${m}" ${m === k.module ? 'selected' : ''}>${m}</option>`).join('')}</select>`;
}
function renderKpiConfig(animateFrom){
    const list = document.getElementById('kcList');
    if(!list) return;
    const visible = kcVisible();
    list.innerHTML = visible.map(k => {
        const m = KC_FMT_META[k.fmt];
        return `
        <div class="kc-row kc-grid ${k.enabled ? '' : 'is-off'}" data-id="${k.id}" draggable="true"
             ondragstart="kcDragStart(event, '${k.id}')" ondragover="kcDragOver(event, '${k.id}')"
             ondragleave="kcDragLeave(event)" ondrop="kcDrop(event, '${k.id}')" ondragend="kcDragEnd(event)">
            <div class="kc-drag" title="Drag to reorder"><i data-lucide="grip-vertical"></i></div>
            <div class="kc-name-cell">
                <span class="kc-ic" title="${m.label} KPI" style="background:${m.tint}"><i data-lucide="${m.icon}" style="color:${m.color}"></i></span>
                <div class="kc-name" title="${escAttr(k.name)}">${k.name}</div>
            </div>
            <div class="kc-desc" title="${escAttr(k.desc)}">${k.desc}</div>
            <div>${kcModuleSelectHtml(k)}</div>
            ${kcComboCellHtml(k, 1)}
            ${kcComboCellHtml(k, 2)}
            <div class="kc-center">
                <button class="kc-toggle ${k.enabled ? 'on' : ''}" title="${k.enabled ? 'Disable' : 'Enable'} on mobile"
                    onclick="kcToggle('${k.id}')" role="switch" aria-checked="${k.enabled}"></button>
            </div>
            <div class="kc-center">
                <button class="kc-edit-btn" title="Edit KPI" onclick="kcOpenEdit('${k.id}')"><i data-lucide="pencil"></i></button>
            </div>
        </div>`;
    }).join('');

    document.getElementById('kcVisibleCount').innerText = visible.length === kcKpis.length ? '' : 'Showing ' + visible.length + ' of ' + kcKpis.length;
    document.getElementById('kcEmpty').classList.toggle('hidden', visible.length > 0);
    list.classList.toggle('hidden', visible.length === 0);

    const on = kcKpis.filter(k => k.enabled).length;
    const pct = kcKpis.length ? Math.round(on / kcKpis.length * 100) : 0;
    document.getElementById('kcDonut').style.setProperty('--p', pct);
    document.getElementById('kcDonutLabel').innerText = on + '/' + kcKpis.length;

    const cnt = { DOLLAR:0, NUMBER:0, HOURS:0 }, modCnt = {};
    kcKpis.forEach(k => { cnt[k.fmt]++; modCnt[k.module] = (modCnt[k.module] || 0) + 1; });
    const set = (id, v) => { const el = document.getElementById(id); if(el) el.innerText = v; };
    set('kcCntAll', kcKpis.length); set('kcCntOn', on); set('kcCntOff', kcKpis.length - on);
    set('kcCntDollar', cnt.DOLLAR); set('kcCntNumber', cnt.NUMBER); set('kcCntHours', cnt.HOURS);
    document.querySelectorAll('[data-kc-mod]').forEach(el => { el.innerText = modCnt[el.dataset.kcMod] || 0; });
    document.getElementById('kcFiltersDot').classList.toggle('hidden', kcStatusFilter === 'all' && kcTypeFilter === 'ALL' && kcModuleFilter === 'ALL');

    if(window.lucide) lucide.createIcons();

    if(animateFrom){
        document.querySelectorAll('.kc-row').forEach(el => {
            const prev = animateFrom[el.dataset.id];
            if(!prev) return;
            const dy = prev.top - el.getBoundingClientRect().top;
            if(dy){
                el.style.transform = 'translateY(' + dy + 'px)';
                el.style.transition = 'none';
                requestAnimationFrame(() => { el.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; });
            }
        });
    }
}

/* ---------- supporting KPI combobox (searchable floating portal) ---------- */
let kcComboRowId = null, kcComboSlot = null, kcComboTrigger = null;
function kcComboPortal(){
    let el = document.getElementById('kcComboDropdown');
    if(!el){ el = document.createElement('div'); el.id = 'kcComboDropdown'; el.className = 'kc-combo-portal hidden'; document.body.appendChild(el); }
    return el;
}
function kcPositionCombo(triggerEl){
    const portal = kcComboPortal(), rect = triggerEl.getBoundingClientRect();
    const width = Math.max(rect.width, 260);
    let left = rect.left;
    if(left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    portal.style.left = Math.max(8, left) + 'px';
    portal.style.width = width + 'px';
    if(window.innerHeight - rect.bottom < 260 && rect.top > 260){ portal.style.top = ''; portal.style.bottom = (window.innerHeight - rect.top + 4) + 'px'; }
    else { portal.style.bottom = ''; portal.style.top = (rect.bottom + 4) + 'px'; }
}
function kcCloseCombos(){
    const portal = document.getElementById('kcComboDropdown');
    if(portal){ portal.classList.add('hidden'); portal.innerHTML = ''; }
    if(kcComboTrigger) kcComboTrigger.classList.remove('active');
    kcComboTrigger = null; kcComboRowId = null; kcComboSlot = null;
}
function kcOpenCombo(triggerEl, rowId, slot){
    const portal = kcComboPortal();
    if(kcComboTrigger === triggerEl && !portal.classList.contains('hidden')){ kcCloseCombos(); return; }
    if(kcComboTrigger) kcComboTrigger.classList.remove('active');
    kcComboRowId = rowId; kcComboSlot = slot; kcComboTrigger = triggerEl;
    triggerEl.classList.add('active');
    portal.innerHTML = `
        <div class="kc-combo-search-wrap"><input id="kcComboSearch" type="text" class="kc-combo-search" placeholder="Search KPIs by name…"
            oninput="kcRenderComboList(this.value)" onkeydown="if(event.key==='Escape') kcCloseCombos()"></div>
        <div class="kc-combo-clear" onmousedown="event.preventDefault()" onclick="kcSelectSupport('${rowId}', ${slot}, '')">✕ No supporting KPI</div>
        <div class="kc-combo-list"></div>`;
    kcPositionCombo(triggerEl);
    portal.classList.remove('hidden');
    kcRenderComboList('');
    requestAnimationFrame(() => { const s = document.getElementById('kcComboSearch'); if(s) s.focus(); });
}
function kcRenderComboList(query){
    const portal = document.getElementById('kcComboDropdown');
    const listEl = portal && portal.querySelector('.kc-combo-list');
    if(!listEl || kcComboRowId === null) return;
    const rowId = kcComboRowId, slot = kcComboSlot, k = kcKpis[kcIdx(rowId)];
    const curId = slot === 1 ? k.support1 : k.support2;
    const q = query.trim().toLowerCase();
    const matches = kcKpis.filter(x => x.id !== rowId && (!q || x.name.toLowerCase().includes(q) || x.key.toLowerCase().includes(q))).slice(0, 40);
    listEl.innerHTML = matches.length
        ? matches.map(m => `<div class="kc-combo-item ${m.id === curId ? 'active' : ''}" onmousedown="event.preventDefault()" onclick="kcSelectSupport('${rowId}', ${slot}, '${m.id}')">${m.name}</div>`).join('')
        : '<div class="kc-combo-empty">No matching KPIs</div>';
}
function kcSelectSupport(rowId, slot, supportId){
    const k = kcKpis[kcIdx(rowId)];
    if(slot === 1) k.support1 = supportId; else k.support2 = supportId;
    kcMarkDirty();
    kcCloseCombos();
    renderKpiConfig();
}
function kcOnModuleChange(rowId, mod){
    kcKpis[kcIdx(rowId)].module = mod;
    kcMarkDirty();
    renderKpiConfig(kcCaptureRects());
}
window.addEventListener('scroll', function(e){
    if(e.target && e.target.closest && e.target.closest('#kcComboDropdown')) return;
    kcCloseCombos();
}, true);
window.addEventListener('resize', kcCloseCombos);

/* ---------- drag & drop (id-based, works under filters) ---------- */
function kcDragStart(e, id){
    if(e.target.closest('.kc-combo-wrap')){ e.preventDefault(); return; }
    kcDragId = id;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}
function kcDragOver(e, id){ e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if(id !== kcDragId) e.currentTarget.classList.add('drag-over'); }
function kcDragLeave(e){ e.currentTarget.classList.remove('drag-over'); }
function kcDrop(e, id){
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if(!kcDragId || kcDragId === id) return;
    const rects = kcCaptureRects();
    const [moved] = kcKpis.splice(kcIdx(kcDragId), 1);
    kcKpis.splice(kcIdx(id), 0, moved);
    kcDragId = null;
    kcMarkDirty();
    renderKpiConfig(rects);
}
function kcDragEnd(e){
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.kc-row.drag-over').forEach(r => r.classList.remove('drag-over'));
    kcDragId = null;
}

/* ---------- edit KPI modal ---------- */
let kcEditId = null, kcEditActive = false;
function kcOpenEdit(id){
    const k = kcKpis[kcIdx(id)], m = KC_FMT_META[k.fmt];
    kcEditId = id; kcEditActive = k.enabled;
    document.getElementById('kcEditName').value = k.name;
    document.getElementById('kcEditDesc').innerText = k.desc + ' (' + m.label + ' format)';
    const ic = document.getElementById('kcEditIcon');
    ic.style.background = m.tint;
    ic.innerHTML = '<i data-lucide="' + m.icon + '" style="color:' + m.color + '"></i>';
    kcSyncEditToggle();
    document.getElementById('kcEditModal').classList.remove('hidden');
    if(window.lucide) lucide.createIcons();
    document.getElementById('kcEditName').focus();
}
function kcToggleEditActive(){ kcEditActive = !kcEditActive; kcSyncEditToggle(); }
function kcSyncEditToggle(){
    const t = document.getElementById('kcEditToggle');
    t.classList.toggle('on', kcEditActive);
    t.setAttribute('aria-checked', kcEditActive);
}
function kcCloseEdit(){ document.getElementById('kcEditModal').classList.add('hidden'); kcEditId = null; }
function kcSaveEdit(){
    if(kcEditId === null) return kcCloseEdit();
    const i = kcIdx(kcEditId), k = kcKpis[i];
    const name = document.getElementById('kcEditName').value.trim();
    let changed = false;
    if(name && name !== k.name){ k.name = name; changed = true; }
    if(k.enabled !== kcEditActive){
        const turningOn = !k.enabled && kcEditActive;
        k.enabled = kcEditActive; changed = true;
        if(turningOn){ kcKpis.splice(i, 1); kcKpis.push(k); }
    }
    if(changed) kcMarkDirty();
    kcCloseEdit();
    renderKpiConfig();
}

/* ---------- update display order modal ---------- */
function kcOpenOrder(){
    kcRenderOrderRows();
    document.getElementById('kcOrderModal').classList.remove('hidden');
    if(window.lucide) lucide.createIcons();
}
function kcCloseOrder(){
    document.getElementById('kcOrderModal').classList.add('hidden');
    document.getElementById('kcOrderMsg').classList.add('hidden');
}
function kcRenderOrderRows(){
    const enabled = kcKpis.filter(k => k.enabled);
    const rows = document.getElementById('kcOrderRows');
    if(!enabled.length){
        rows.innerHTML = '<div class="kc-order-empty"><i data-lucide="inbox"></i><p>No active KPIs yet. Enable at least one KPI to set its display order.</p></div>';
        return;
    }
    rows.innerHTML = enabled.map((k, i) => `
        <div class="kc-order-row">
            <div class="kc-order-name" title="${escAttr(k.name)}">${k.name}</div>
            <div class="kc-order-cur">${i + 1}</div>
            <div class="kc-center"><input type="number" min="1" max="${enabled.length}" value="${i + 1}" data-id="${k.id}" class="kc-order-input"></div>
        </div>`).join('');
}
function kcSaveOrder(){
    const inputs = Array.from(document.querySelectorAll('.kc-order-input'));
    if(!inputs.length) return kcCloseOrder();
    const N = inputs.length, msg = document.getElementById('kcOrderMsg');
    inputs.forEach(inp => inp.classList.remove('input-error'));
    const entries = inputs.map(inp => ({ id: inp.dataset.id, val: parseInt(inp.value, 10), el: inp }));
    const invalid = entries.filter(e => !Number.isInteger(e.val) || e.val < 1 || e.val > N);
    if(invalid.length){
        invalid.forEach(e => e.el.classList.add('input-error'));
        msg.innerText = 'Display order must be a whole number between 1 and ' + N + '.';
        msg.classList.remove('hidden');
        return;
    }
    const counts = {};
    entries.forEach(e => { counts[e.val] = (counts[e.val] || 0) + 1; });
    const dupVals = Object.keys(counts).map(Number).filter(v => counts[v] > 1);
    if(dupVals.length){
        entries.forEach(e => { if(dupVals.includes(e.val)) e.el.classList.add('input-error'); });
        const dupNames = entries.filter(e => dupVals.includes(e.val)).map(e => kcKpis[kcIdx(e.id)].name);
        msg.innerText = 'Position ' + dupVals.join(', ') + ' is assigned to more than one KPI (' + dupNames.join(', ') + '). Please give each KPI a unique display order.';
        msg.classList.remove('hidden');
        return;
    }
    msg.classList.add('hidden');
    // enabled slots keep their place in the master list; refill them in the new order
    const sortedIds = entries.slice().sort((a, b) => a.val - b.val).map(e => e.id);
    const slots = [];
    kcKpis.forEach((k, i) => { if(k.enabled) slots.push(i); });
    const rects = kcCaptureRects();
    const next = kcKpis.slice();
    slots.forEach((s, i) => { next[s] = kcKpis[kcIdx(sortedIds[i])]; });
    kcKpis = next;
    kcMarkDirty();
    kcCloseOrder();
    renderKpiConfig(rects);
    kcToast('Display order updated — click Save Changes to publish.');
}

document.addEventListener('click', function(e){
    const p = document.getElementById('kcFiltersPopover');
    const b = document.getElementById('kcFiltersBtn');
    if(p && !p.classList.contains('hidden') && !p.contains(e.target) && !(b && b.contains(e.target))) p.classList.add('hidden');
    if(!e.target.closest('.kc-combo-wrap') && !e.target.closest('#kcComboDropdown')) kcCloseCombos();
});
document.addEventListener('keydown', function(e){
    if(!document.getElementById('kcEditModal')) return;
    if(e.key === 'Escape'){
        kcCloseEdit(); kcCloseOrder();
        const p = document.getElementById('kcFiltersPopover'); if(p) p.classList.add('hidden');
    }
    if(e.key === 'Enter' && document.activeElement === document.getElementById('kcEditName')) kcSaveEdit();
});
window.addEventListener('beforeunload', function(e){
    if(kcDirty){ e.preventDefault(); e.returnValue = ''; }
});
