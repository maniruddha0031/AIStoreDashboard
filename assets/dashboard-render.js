/* ============================================================
   Rendering + tab-switching logic for the Dashboard screen
   ============================================================ */

function renderBanner(cfg){
  return `
  <div class="op-banner" style="--banner-a:${cfg.bannerA};--banner-b:${cfg.bannerB}">
    <div>
      <div class="op-eyebrow">${cfg.eyebrow}</div>
      <div class="op-title">${cfg.title}</div>
      <div class="op-sub">${cfg.sub}</div>
    </div>
    <div class="flex items-stretch gap-4 flex-wrap">
      <div class="op-score-card">
        <div>
          <div class="op-score-value">${cfg.score}%</div>
        </div>
        <span class="op-score-badge">${cfg.scoreLabel}</span>
        <div class="op-score-bar-wrap">
          <div class="op-score-bar"></div>
          <div class="op-score-bar-label">AI Index</div>
        </div>
      </div>
      <div class="op-stat-card">
        <div class="op-stat-icon"><i data-lucide="bar-chart-3"></i></div>
        <div>
          <div class="op-stat-value">${cfg.lastWeek} <i data-lucide="arrow-up"></i></div>
          <div class="op-stat-label">Last Week</div>
        </div>
      </div>
      <div class="op-stat-card">
        <div class="op-stat-icon"><i data-lucide="bar-chart-3"></i></div>
        <div>
          <div class="op-stat-value">${cfg.lastYear} <i data-lucide="arrow-up"></i></div>
          <div class="op-stat-label">Last Year</div>
        </div>
      </div>
      ${cfg.aiEmbed ? `
      <div class="op-ai-embed">
        <div class="op-ai-embed-head">
          <div class="op-ai-embed-badge"><i data-lucide="lightbulb"></i> AI INSIGHT</div>
          <button class="op-ai-embed-more" onclick="openAiInsight()">View More</button>
        </div>
        ${cfg.aiEmbed.lines.map(l=>`<div class="op-ai-embed-line">${l}</div>`).join('')}
      </div>` : ``}
    </div>
  </div>`;
}

/* The Global/Organization Setting page used to let an admin switch between
   4 KPI tile designs (this one, V1, V3 and the original sparkline tile) via
   3 checkboxes. Those are gone now — "New KPI Tile" (V2) is the permanent
   design. renderKpiMini/V1/V3 are kept, unused, in case an alternate design
   is wanted again later. */
function renderKpiMiniAny(k, id){
  return renderKpiMiniV2(k, id);
}

function renderKpiMini(k, id){
  const upCls = (up)=> up ? 'up-green' : 'up-red';
  const upArrow = (up)=> up ? 'arrow-up' : 'arrow-down';
  if(id) KPI_REGISTRY[id] = k;
  return `
  <div class="kpi-mini">
    <div class="kpi-mini-head">
      <div class="kpi-mini-title">
        <div class="kpi-icon" style="background:${k.iconBg}"><i data-lucide="${k.icon}" style="color:${k.iconColor}"></i></div>
        <div class="kpi-mini-label">${k.label}</div>
      </div>
      <div class="kpi-chart-btn" title="View trend" ${id ? `onclick="event.stopPropagation();openKpiTrend('${id}')"` : ''}><svg class="chart-bar-icon" viewBox="0 0 20.604 18.029" fill="currentColor"><path d="M144.484,114.029h3.091A1.108,1.108,0,0,0,148.6,113V102.181a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,144.484,114.029Zm-15.454,0h3.091a1.108,1.108,0,0,0,1.03-1.03v-5.666a1.108,1.108,0,0,0-1.03-1.03H129.03a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,129.03,114.029Zm7.727,0h3.091a1.108,1.108,0,0,0,1.03-1.03V97.03a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,136.757,114.029Z" transform="translate(-128 -96)"/></svg></div>
    </div>
    <div class="kpi-mini-values">
      <div class="kpi-mini-value">${k.value}</div>
      <div class="kpi-mini-wtd"><div class="wl">WTD</div><div class="wv">${k.wtd}</div></div>
    </div>
    ${sparkline(k.spark)}
    <div class="kpi-mini-table">
      <span class="t-lbl">CUR</span><span class="t-group"><span class="t-tag">vs LW</span><b class="t-val ${upCls(k.cur.lwUp)}">${k.cur.lw}</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val ${upCls(k.cur.lyUp)}">${k.cur.ly}</b></span>
      <span class="t-lbl">WTD</span><span class="t-group"><span class="t-tag">vs LW</span><b class="t-val ${upCls(k.wk.lwUp)}">${k.wk.lw}</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val ${upCls(k.wk.lyUp)}">${k.wk.ly}</b></span>
    </div>
    ${k.footer && k.footer[0][0] ? `
    <div class="kpi-mini-footer">
      <div class="f-pair"><span class="f-lbl">${k.footer[0][0]}</span><span class="f-val">${k.footer[0][1]}</span></div>
      <div class="f-divider"></div>
      <div class="f-pair"><span class="f-lbl">${k.footer[1][0]}</span><span class="f-val">${k.footer[1][1]}</span></div>
    </div>` : ``}
  </div>`;
}

/* "KPI Version1" tile design (flag-gated, see newKpiVersion1Enabled() in
   app.js): keeps the sparkline — WTD moves under the main value (single
   "WTD: value" line, same spot V2 uses) so the side box only has to carry
   MTD alone, which keeps the tile shorter than stacking WTD+MTD there.
   The comparison table still gains the MTD vs LM / vs LY row. */
function renderKpiMiniV1(k, id){
  const upCls = (up)=> up ? 'up-green' : 'up-red';
  if(id) KPI_REGISTRY[id] = k;
  const d = deriveMtd(k);
  return `
  <div class="kpi-mini">
    <div class="kpi-mini-head">
      <div class="kpi-mini-title">
        <div class="kpi-icon" style="background:${k.iconBg}"><i data-lucide="${k.icon}" style="color:${k.iconColor}"></i></div>
        <div class="kpi-mini-label">${k.label}</div>
      </div>
      <div class="kpi-chart-btn" title="View trend" ${id ? `onclick="event.stopPropagation();openKpiTrend('${id}')"` : ''}><svg class="chart-bar-icon" viewBox="0 0 20.604 18.029" fill="currentColor"><path d="M144.484,114.029h3.091A1.108,1.108,0,0,0,148.6,113V102.181a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,144.484,114.029Zm-15.454,0h3.091a1.108,1.108,0,0,0,1.03-1.03v-5.666a1.108,1.108,0,0,0-1.03-1.03H129.03a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,129.03,114.029Zm7.727,0h3.091a1.108,1.108,0,0,0,1.03-1.03V97.03a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,136.757,114.029Z" transform="translate(-128 -96)"/></svg></div>
    </div>
    <div class="kpi-mini-values">
      <div class="kmv2-value-col">
        <div class="kpi-mini-value">${k.value}</div>
        <div class="kmv2-value-sub"><span class="kmv2-sub-lbl">WTD</span>${k.wtd}</div>
      </div>
      <div class="kpi-mini-wtd"><div class="wl">MTD</div><div class="wv">${d.mtd}</div></div>
    </div>
    ${sparkline(k.spark)}
    <div class="kpi-mini-table">
      <span class="t-lbl">CUR</span><span class="t-group"><span class="t-tag">vs LW</span><b class="t-val ${upCls(k.cur.lwUp)}">${k.cur.lw}</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val ${upCls(k.cur.lyUp)}">${k.cur.ly}</b></span>
      <span class="t-lbl">WTD</span><span class="t-group"><span class="t-tag">vs LW</span><b class="t-val ${upCls(k.wk.lwUp)}">${k.wk.lw}</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val ${upCls(k.wk.lyUp)}">${k.wk.ly}</b></span>
      <span class="t-lbl">MTD</span><span class="t-group"><span class="t-tag">vs LM</span><b class="t-val ${upCls(d.mo.lmUp)}">${d.mo.lm}</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val ${upCls(d.mo.lyUp)}">${d.mo.ly}</b></span>
    </div>
    ${k.footer && k.footer[0][0] ? `
    <div class="kpi-mini-footer">
      <div class="f-pair"><span class="f-lbl">${k.footer[0][0]}</span><span class="f-val">${k.footer[0][1]}</span></div>
      <div class="f-divider"></div>
      <div class="f-pair"><span class="f-lbl">${k.footer[1][0]}</span><span class="f-val">${k.footer[1][1]}</span></div>
    </div>` : ``}
  </div>`;
}

/* New KPI tile design (flag-gated, see newKpiTileEnabled() in app.js):
   no sparkline; WTD moves under the main value; the side box shows MTD
   instead of WTD; the comparison table gains an MTD vs LM / vs LY row. */
function renderKpiMiniV2(k, id){
  const upCls = (up)=> up ? 'up-green' : 'up-red';
  if(id) KPI_REGISTRY[id] = k;
  const d = deriveMtd(k);
  return `
  <div class="kpi-mini">
    <div class="kpi-mini-head">
      <div class="kpi-mini-title">
        <div class="kpi-icon" style="background:${k.iconBg}"><i data-lucide="${k.icon}" style="color:${k.iconColor}"></i></div>
        <div class="kpi-mini-label">${k.label}</div>
      </div>
      <div class="kpi-chart-btn" title="View trend" ${id ? `onclick="event.stopPropagation();openKpiTrend('${id}')"` : ''}><svg class="chart-bar-icon" viewBox="0 0 20.604 18.029" fill="currentColor"><path d="M144.484,114.029h3.091A1.108,1.108,0,0,0,148.6,113V102.181a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,144.484,114.029Zm-15.454,0h3.091a1.108,1.108,0,0,0,1.03-1.03v-5.666a1.108,1.108,0,0,0-1.03-1.03H129.03a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,129.03,114.029Zm7.727,0h3.091a1.108,1.108,0,0,0,1.03-1.03V97.03a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,136.757,114.029Z" transform="translate(-128 -96)"/></svg></div>
    </div>
    <div class="kpi-mini-values">
      <div class="kmv2-value-col">
        <div class="kpi-mini-value">${k.value}</div>
        <div class="kmv2-value-sub"><span class="kmv2-sub-lbl">WTD</span>${k.wtd}</div>
      </div>
      <div class="kpi-mini-wtd"><div class="wl">MTD</div><div class="wv">${d.mtd}</div></div>
    </div>
    <div class="kpi-mini-table">
      <span class="t-lbl">CUR</span><span class="t-group"><span class="t-tag">vs LW</span><b class="t-val ${upCls(k.cur.lwUp)}">${k.cur.lw}</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val ${upCls(k.cur.lyUp)}">${k.cur.ly}</b></span>
      <span class="t-lbl">WTD</span><span class="t-group"><span class="t-tag">vs LW</span><b class="t-val ${upCls(k.wk.lwUp)}">${k.wk.lw}</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val ${upCls(k.wk.lyUp)}">${k.wk.ly}</b></span>
      <span class="t-lbl">MTD</span><span class="t-group"><span class="t-tag">vs LM</span><b class="t-val ${upCls(d.mo.lmUp)}">${d.mo.lm}</b></span><span class="t-group"><span class="t-tag">vs LY</span><b class="t-val ${upCls(d.mo.lyUp)}">${d.mo.ly}</b></span>
    </div>
    ${k.footer && k.footer[0][0] ? `
    <div class="kpi-mini-footer">
      <div class="f-pair"><span class="f-lbl">${k.footer[0][0]}</span><span class="f-val">${k.footer[0][1]}</span></div>
      <div class="f-divider"></div>
      <div class="f-pair"><span class="f-lbl">${k.footer[1][0]}</span><span class="f-val">${k.footer[1][1]}</span></div>
    </div>` : ``}
  </div>`;
}

/* Third KPI tile design (flag-gated, see newVersionKpiEnabled() in app.js).
   Same top section as V2 (no sparkline, WTD under the value, MTD in the
   side box) but the comparison section becomes 3 side-by-side columns
   (CUR / WTD / MTD) instead of 3 stacked rows — each column stacks its
   own "vs LW/LM" tag+value above its "vs LY" tag+value. */
function renderKpiMiniV3(k, id){
  const upCls = (up)=> up ? 'up-green' : 'up-red';
  if(id) KPI_REGISTRY[id] = k;
  const d = deriveMtd(k);
  const col = (period, a, b)=> `
      <div class="kmv3-col">
        <div class="kmv3-period">${period}</div>
        <div class="kmv3-tag">${a.tag}</div>
        <div class="kmv3-val ${upCls(a.up)}">${a.val}</div>
        <div class="kmv3-tag">${b.tag}</div>
        <div class="kmv3-val ${upCls(b.up)}">${b.val}</div>
      </div>`;
  return `
  <div class="kpi-mini">
    <div class="kpi-mini-head">
      <div class="kpi-mini-title">
        <div class="kpi-icon" style="background:${k.iconBg}"><i data-lucide="${k.icon}" style="color:${k.iconColor}"></i></div>
        <div class="kpi-mini-label">${k.label}</div>
      </div>
      <div class="kpi-chart-btn" title="View trend" ${id ? `onclick="event.stopPropagation();openKpiTrend('${id}')"` : ''}><svg class="chart-bar-icon" viewBox="0 0 20.604 18.029" fill="currentColor"><path d="M144.484,114.029h3.091A1.108,1.108,0,0,0,148.6,113V102.181a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,144.484,114.029Zm-15.454,0h3.091a1.108,1.108,0,0,0,1.03-1.03v-5.666a1.108,1.108,0,0,0-1.03-1.03H129.03a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,129.03,114.029Zm7.727,0h3.091a1.108,1.108,0,0,0,1.03-1.03V97.03a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,136.757,114.029Z" transform="translate(-128 -96)"/></svg></div>
    </div>
    <div class="kpi-mini-values">
      <div class="kmv2-value-col">
        <div class="kpi-mini-value">${k.value}</div>
        <div class="kmv2-value-sub"><span class="kmv2-sub-lbl">WTD</span>${k.wtd}</div>
      </div>
      <div class="kpi-mini-wtd"><div class="wl">MTD</div><div class="wv">${d.mtd}</div></div>
    </div>
    <div class="kmv3-cols">
      ${col('CUR', {tag:'vs LW', val:k.cur.lw, up:k.cur.lwUp}, {tag:'vs LY', val:k.cur.ly, up:k.cur.lyUp})}
      ${col('WTD', {tag:'vs LW', val:k.wk.lw, up:k.wk.lwUp}, {tag:'vs LY', val:k.wk.ly, up:k.wk.lyUp})}
      ${col('MTD', {tag:'vs LM', val:d.mo.lm, up:d.mo.lmUp}, {tag:'vs LY', val:d.mo.ly, up:d.mo.lyUp})}
    </div>
    ${k.footer && k.footer[0][0] ? `
    <div class="kpi-mini-footer">
      <div class="f-pair"><span class="f-lbl">${k.footer[0][0]}</span><span class="f-val">${k.footer[0][1]}</span></div>
      <div class="f-divider"></div>
      <div class="f-pair"><span class="f-lbl">${k.footer[1][0]}</span><span class="f-val">${k.footer[1][1]}</span></div>
    </div>` : ``}
  </div>`;
}

function renderAiTile(lines){
  return `
  <div class="ai-tile">
    <div class="ai-tile-head">
      <div class="ai-tile-badge"><span class="ai-tile-icon"><i data-lucide="lightbulb"></i></span> AI INSIGHT</div>
      <button class="ai-tile-more" onclick="openAiInsight()">View More</button>
    </div>
    ${lines.map(l=>`<div class="ai-tile-item">${l}</div>`).join('')}
  </div>`;
}

function renderGridSection(sec, id){
  const cols = sec.hasScore ? GRID_COLS_SCORE : GRID_COLS_PLAIN;
  const shadeIdx = [1,3,5]; // CUR, LW(SD), LW(TOT) shaded
  if(id) SECTION_REGISTRY[id] = sec;
  return `
  <div class="grid-section section-${sec.color}">
    <div class="grid-section-head">
      <div class="grid-section-title-row">
        <span class="grid-section-title">${sec.title}:</span>
        <span class="grid-section-score">${sec.score}</span>
      </div>
      <div class="grid-section-icon" title="View trend" ${id ? `onclick="openModuleTrend('${id}',0)"` : ''}><svg class="chart-bar-icon" viewBox="0 0 20.604 18.029" fill="currentColor"><path d="M144.484,114.029h3.091A1.108,1.108,0,0,0,148.6,113V102.181a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,144.484,114.029Zm-15.454,0h3.091a1.108,1.108,0,0,0,1.03-1.03v-5.666a1.108,1.108,0,0,0-1.03-1.03H129.03a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,129.03,114.029Zm7.727,0h3.091a1.108,1.108,0,0,0,1.03-1.03V97.03a1.108,1.108,0,0,0-1.03-1.03h-3.091a1.108,1.108,0,0,0-1.03,1.03V113A1.108,1.108,0,0,0,136.757,114.029Z" transform="translate(-128 -96)"/></svg></div>
    </div>
    <div style="overflow-x:auto;">
    <table class="kpi-table">
      <thead><tr>${cols.map((c,i)=>`<th class="${shadeIdx.includes(i)?'shade':''}">${c}</th>`).join('')}</tr></thead>
      <tbody>
        ${sec.rows.map(r=>`<tr>${r.map((v,i)=>`<td class="${shadeIdx.includes(i)?'shade':''}${(sec.hasScore && i===6)?' score':''}">${v}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
    </div>
  </div>`;
}

function renderKpiRowGrid(containerId, cols){
  document.getElementById(containerId).style.gridTemplateColumns = `repeat(auto-fit, minmax(200px, 1fr))`;
}

/* ---------------- Build the 3 hand-authored panels ---------------- */
function buildStoreHealth(){
  const el = document.getElementById('content-storehealth');
  el.innerHTML = `
    ${renderBanner(BANNERS.storehealth)}
    <div class="kpi-row mt-6" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
      ${KPI_ROWS.storehealth.map((k,i)=> renderKpiMiniAny(k,'storehealth-'+i)).join('')}
      ${renderAiTile(AI_TILES.storehealth)}
    </div>
    <div class="grid gap-5 mt-6" style="grid-template-columns:repeat(2,minmax(0,1fr));">
      ${GRID_SECTIONS.storehealth.map((s,i)=>renderGridSection(s,'storehealth-sec-'+i)).join('')}
    </div>`;
}

function buildCompliance(){
  const el = document.getElementById('content-compliance');
  el.innerHTML = `
    ${renderBanner(BANNERS.compliance)}
    <div class="grid gap-5 mt-6" style="grid-template-columns:repeat(2,minmax(0,1fr));">
      ${GRID_SECTIONS.compliance.map((s,i)=>renderGridSection(s,'compliance-sec-'+i)).join('')}
    </div>`;
}

function buildRisk(){
  const el = document.getElementById('content-risk');
  el.innerHTML = `
    ${renderBanner(BANNERS.risk)}
    <div class="grid gap-5 mt-6" style="grid-template-columns:repeat(2,minmax(0,1fr));">
      ${GRID_SECTIONS.risk.map((s,i)=>renderGridSection(s,'risk-sec-'+i)).join('')}
    </div>`;
}

function buildTimeloss(){
  const el = document.getElementById('content-timeloss');
  el.innerHTML = `
    ${renderBanner(BANNERS.timeloss)}
    <div class="kpi-row mt-6" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
      ${KPI_ROWS.timeloss.map((k,i)=> renderKpiMiniAny(k,'timeloss-'+i)).join('')}
      ${renderAiTile(AI_TILES.timeloss)}
    </div>
    <div class="grid gap-5 mt-6" style="grid-template-columns:repeat(2,minmax(0,1fr));">
      <div class="chart-card">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div class="font-bold text-[15px] text-slate-800">Current Week Time Loss</div>
          <div class="chart-toggle-group">
            <span class="chart-toggle active">7D</span><span class="chart-toggle">14D</span><span class="chart-toggle">4W</span><span class="chart-toggle">3M</span><span class="chart-toggle">6M</span>
          </div>
        </div>
        <div style="height:260px;"><canvas id="chartTimeloss1"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div class="font-bold text-[15px] text-slate-800">Time Loss Trend</div>
          <div class="chart-toggle-group">
            <span class="chart-toggle active">7D</span><span class="chart-toggle">14D</span><span class="chart-toggle">4W</span><span class="chart-toggle">3M</span><span class="chart-toggle">6M</span>
          </div>
        </div>
        <div style="height:260px;"><canvas id="chartTimeloss2"></canvas></div>
      </div>
    </div>
    <div class="chart-card mt-5">
      <div class="flex items-center justify-between mb-3">
        <div class="font-bold text-[15px] text-slate-800">Historical Data</div>
        <div class="flex items-center gap-2">
          <div class="chart-icon-btn"><i data-lucide="search"></i></div>
          <div class="chart-icon-btn"><i data-lucide="filter"></i></div>
          <div class="chart-icon-btn"><i data-lucide="download"></i></div>
          <div class="chart-icon-btn"><i data-lucide="maximize-2"></i></div>
        </div>
      </div>
      <div style="overflow-x:auto;">
      <table class="hist-table">
        <thead><tr><th>Start Date</th><th>Store #</th><th>Actual Sales ($)</th><th>Labor %</th><th>Loss %</th><th>Total Loss</th><th>Early In</th><th>Late Out</th><th>OT Loss</th><th>Break Loss</th></tr></thead>
        <tbody>
          ${HISTORICAL_ROWS.map(r=>`<tr><td class="hist-date">${r[0]}</td>${r.slice(1).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
      </div>
    </div>`;
  initTimelossCharts();
}

function buildDar(){
  const el = document.getElementById('content-dar');
  el.innerHTML = `
    ${renderBanner(BANNERS.dar)}
    <div class="grid gap-5 mt-6" style="grid-template-columns:repeat(6,minmax(0,1fr));">
      ${DAR_TILES.map((k,i)=> renderKpiMiniAny(k,'dar-'+i)).join('')}
    </div>`;
}

let _tlChart1, _tlChart2;
function initTimelossCharts(){
  if(!window.Chart) return;
  const c1 = document.getElementById('chartTimeloss1');
  const c2 = document.getElementById('chartTimeloss2');
  if(_tlChart1) _tlChart1.destroy();
  if(_tlChart2) _tlChart2.destroy();
  const d1 = TIMELOSS_CHART1, d2 = TIMELOSS_CHART2;
  _tlChart1 = new Chart(c1, {
    type:'bar',
    data:{ labels:d1.labels, datasets:[
      { type:'bar', label:'Early Clock In', data:d1.early, backgroundColor:'#38bdf8', stack:'s' },
      { type:'bar', label:'Late Clock Out', data:d1.late, backgroundColor:'#2dd4bf', stack:'s' },
      { type:'bar', label:'OT Loss', data:d1.ot, backgroundColor:'#f472b6', stack:'s' },
      { type:'bar', label:'Break Violation Loss', data:d1.brk, backgroundColor:'#facc15', stack:'s' },
      { type:'line', label:'Total', data:d1.total, borderColor:'#0f172a', backgroundColor:'#0f172a', pointBackgroundColor:'#0f172a', tension:.3 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}}}, scales:{ x:{ grid:{display:false} }, y:{ grid:{color:'#f1f5f9'} } } }
  });
  _tlChart2 = new Chart(c2, {
    data:{ labels:d2.labels, datasets:[
      { type:'bar', label:'Sales', data:d2.sales, backgroundColor:'#7dd3fc', yAxisID:'y' },
      { type:'line', label:'Labor Percent', data:d2.laborPct, borderColor:'#2563eb', backgroundColor:'#2563eb', yAxisID:'y1', tension:.3 },
      { type:'line', label:'Time Loss Percent', data:d2.lossPct, borderColor:'#a855f7', backgroundColor:'#a855f7', yAxisID:'y1', tension:.3 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}}},
      scales:{ x:{ grid:{display:false} }, y:{ position:'left', grid:{color:'#f1f5f9'} }, y1:{ position:'right', grid:{display:false}, ticks:{callback:v=>v+'%'} } } }
  });
}

/* ---------------- Generic renderer for custom dashboards (created via Settings) ---------------- */
function buildCustomDashboardPanel(dash){
  const rows = (dash.sections || []);
  let html = '';
  rows.forEach(row=>{
    const layout = LAYOUT_TYPES.find(l=>l.key===row.layout) || LAYOUT_TYPES[0];
    html += `<div class="grid gap-5 mt-6" style="grid-template-columns:repeat(${layout.cols},1fr);">`;
    row.slots.forEach(slot=>{
      if(!slot){ html += `<div class="layout-slot" style="min-height:80px;opacity:.4"></div>`; return; }
      html += renderComponentPreviewFull(slot);
    });
    html += `</div>`;
  });
  if(!rows.length){
    html = `<div class="card p-10 text-center text-slate-400 font-semibold mt-6">This dashboard has no sections configured yet. Go to Settings to add layout sections.</div>`;
  }
  return html;
}

function renderComponentPreviewFull(slot){
  if(slot.kind === 'banner'){
    return `<div class="op-banner" style="--banner-a:#fdf1e7;--banner-b:#eef1f6;">
      <div><div class="op-eyebrow">Operational Summary</div><div class="op-title">${slot.label.toUpperCase()}</div><div class="op-sub">AI Verified Index · America/Los Angeles</div></div>
      <div class="op-score-card"><div class="op-score-value">82%</div><span class="op-score-badge">Good</span>
        <div class="op-score-bar-wrap"><div class="op-score-bar"></div><div class="op-score-bar-label">AI Index</div></div></div>
    </div>`;
  }
  if(slot.kind === 'grid'){
    return renderGridSection({ title:slot.label, color:slot.color||'blue', score:'86%', hasScore:false, rows:[
      ['Sample KPI 1','12%','18%','10%','16%','20%'],
      ['Sample KPI 2','$1.2K','$4.8K','$1.1K','$4.6K','$5.0K']
    ]});
  }
  return `<div class="card p-5 text-slate-500 font-semibold text-sm">${slot.label}</div>`;
}

/* ---------------- Tabs ---------------- */
function initDashboardTabs(){
  const dashboards = loadDashboards().filter(d=>d.active && !d.isPageLink).sort((a,b)=>a.order-b.order);
  const tabBarWrap = document.getElementById('dashTabBar');
  tabBarWrap.innerHTML = `<div class="tab-bar" id="dashTabBarAI"></div><div class="tab-bar" id="dashTabBarMain"></div>`;
  const aiBar = document.getElementById('dashTabBarAI');
  const mainBar = document.getElementById('dashTabBarMain');

  const requestedTab = new URLSearchParams(location.search).get('tab');
  const defaultId = loadDefaultDashboard();
  const initialId = (requestedTab && dashboards.some(d=>d.id===requestedTab)) ? requestedTab
    : (defaultId && dashboards.some(d=>d.id===defaultId)) ? defaultId
    : (dashboards[0] && dashboards[0].id);

  const builtinBuilders = { aihub:buildAiHub, pulseindex:buildPulseIndex, storehealth:buildStoreHealth, compliance:buildCompliance, risk:buildRisk, timeloss:buildTimeloss, dar:buildDar };
  const panelsWrap = document.getElementById('dashPanels');

  dashboards.forEach((d)=>{
    const isInitial = d.id === initialId;
    const btn = document.createElement('button');
    btn.className = 'view-tab' + (isInitial ? ' active' : '');
    btn.dataset.target = d.id;
    btn.innerHTML = `<i data-lucide="${d.icon}"></i>${d.name.replace(' Dashboard','')}`;
    btn.onclick = ()=> switchDashTab(d.id);
    (d.group==='ai' ? aiBar : mainBar).appendChild(btn);

    let panel = document.getElementById('panel-'+d.id);
    if(!panel){
      panel = document.createElement('div');
      panel.id = 'panel-'+d.id;
      panel.className = 'tab-panel' + (isInitial ? '' : ' hidden');
      panel.innerHTML = `<div id="content-${d.id}"></div>`;
      panelsWrap.appendChild(panel);
    } else {
      panel.classList.toggle('hidden', !isInitial);
    }

    if(builtinBuilders[d.id]){
      builtinBuilders[d.id]();
    } else {
      document.getElementById('content-'+d.id).innerHTML = buildCustomDashboardPanel(d);
    }
  });

  aiBar.classList.toggle('hidden', !aiBar.children.length);
  mainBar.classList.toggle('hidden', !mainBar.children.length);

  if(window.lucide) lucide.createIcons();
  if(initialId==='timeloss') initTimelossCharts();
  updateEvaVisibility(initialId);
}

/* The global "Ask Eva" chatbot bubble is intentionally hidden on the AI Hub
   tab only — every other dashboard keeps it. Left alone while Eva's own
   fullscreen chat is open (closeChatbox() in chatbot.js re-checks the active
   tab itself once that closes). */
function updateEvaVisibility(tabId){
  const evaWidget = document.getElementById('chatbotWidget');
  const evaOverlay = document.getElementById('chatboxOverlay');
  if(!evaWidget) return;
  if(evaOverlay && evaOverlay.classList.contains('open')) return;
  const hide = tabId==='aihub';
  evaWidget.style.display = hide ? 'none' : 'block';
  if(hide && typeof cbHideIdleNudge === 'function') cbHideIdleNudge();
}

function switchDashTab(id){
  document.querySelectorAll('#dashTabBar .view-tab').forEach(b=> b.classList.toggle('active', b.dataset.target===id));
  document.querySelectorAll('.tab-panel').forEach(p=> p.classList.toggle('hidden', p.id !== 'panel-'+id));
  if(id==='timeloss') initTimelossCharts();
  updateEvaVisibility(id);
}

/* ---------------- AI Insight modal ---------------- */
function openAiInsight(){ document.getElementById('aiInsightModal').classList.remove('hidden'); }
function closeAiInsight(){ document.getElementById('aiInsightModal').classList.add('hidden'); }

document.addEventListener('DOMContentLoaded', function(){
  initDashboardTabs();
  const dateInput = document.getElementById('dashDatePicker');
  if(dateInput){
    const today = new Date();
    document.getElementById('dashDateLabel').textContent =
      String(today.getMonth()+1).padStart(2,'0')+'/'+String(today.getDate()).padStart(2,'0')+'/'+today.getFullYear();
  }
});
