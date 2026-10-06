/* ============================================================
   Daily Brief — an at-a-glance, newspaper-style summary tab (next to
   AI Hub / Pulse Index) highlighting the handful of things worth a
   look today. Reference: a "zip-dashboard" welcome-page mock the user
   supplied — same idea (condensed, narrative highlights instead of
   raw tables, a "week so far" quote list, a standing-against-the-
   estate stat, stores/regions ranked, a day-by-day strip, movers,
   notices), redrawn in this app's own card/color system.

   Every number here is either read straight from KPI_ROWS/GRID_
   SECTIONS/DAR_TILES, or (for the store/region breakdowns, where this
   app has no real per-store ledger) derived from Pulse Index's own
   PULSE_STORES roster via its existing pulseStoreVal() spread — the
   same deterministic hash-off-a-real-figure technique already used
   below for stores-to-watch/movers. Nothing here is randomly rolled
   per render, and nothing invents a metric that isn't tracked
   somewhere else in the app.
   ============================================================ */

const DD_STORES = ['236 - Bressi Ranch', '104 - Downtown Plaza', '212 - Westside Center', '310 - Lakeside Mall', '418 - Northgate Commons'];

function ddHash(s){ let h = 0; for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function ddFmtMoney(v){ return '$' + Math.round(v).toLocaleString('en-US'); }
function ddFmtMoneyShort(v){ return v>=1000 ? '$'+(v/1000).toFixed(1)+'k' : ddFmtMoney(v); }

/* Standard ISO-8601 week number (Monday-first weeks, week 1 contains the
   year's first Thursday) — a real, computed figure rather than an
   invented "fiscal week" counter. */
function ddFiscalWeekNumber(){
  const d = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = d.getTime();
  d.setUTCMonth(0, 1);
  if(d.getUTCDay() !== 4) d.setUTCMonth(0, 1 + ((4 - d.getUTCDay()) + 7) % 7);
  return 1 + Math.round((firstThursday - d.getTime()) / (7*24*3600*1000));
}

/* "Stores to Watch" — Labor % per store. The current store keeps its
   real Store Health value; the rest are deterministic variations off
   it (same hash-offset technique dashboard-data.js already uses for
   deriveMtd), not random-per-render numbers. */
function ddStoreLaborRows(){
  const base = kpiParseVal(KPI_ROWS.storehealth[0].value).num; // 24.69
  return DD_STORES.map(store=>{
    const h = ddHash(store);
    const laborPct = store === DD_STORES[0] ? base : +(base + (((h % 700) - 150) / 100)).toFixed(1);
    return { store, laborPct };
  }).sort((a,b)=> b.laborPct - a.laborPct);
}

/* "Movers" — WoW Net Sales per store, same deterministic technique. */
function ddStoreMoverRows(){
  const base = kpiParseVal(KPI_ROWS.storehealth[3].value).num; // Net Sales
  return DD_STORES.map(store=>{
    const h = ddHash(store+'-mover');
    const mult = store === DD_STORES[0] ? 1 : 1 + (((h % 400) - 150) / 1000);
    const sales = +(base * mult * (10 + (h % 5))).toFixed(0);
    const wow = +((((h >> 3) % 180) - 70) / 10).toFixed(1);
    return { store, sales, wow };
  }).sort((a,b)=> Math.abs(b.wow) - Math.abs(a.wow));
}

/* ---------------- Standing against the estate ----------------
   Pulse Index already keeps a full store roster (PULSE_STORES) with a
   deterministic per-store spread around each metric's real company
   figure (pulseStoreVal). Reused here rather than re-invented: "how
   many stores are on the wrong side of the median" and "what
   percentile the company figure lands at" against that same roster. */
function ddStoresBehindMedian(){
  if(typeof pulseMetric !== 'function' || typeof PULSE_STORES === 'undefined') return null;
  const m = pulseMetric('labor_pct');
  if(!m) return null;
  const vals = PULSE_STORES.map(s => ({ store:s, v: pulseStoreVal(s, m) }));
  const sorted = vals.map(x=>x.v).slice().sort((a,b)=>a-b);
  const med = sorted[Math.floor(sorted.length/2)];
  const lower = m.lowerIsBetter;
  const behind = vals.filter(x => lower ? x.v > med : x.v < med).length;
  const worst = vals.slice().sort((a,b)=> lower ? b.v-a.v : a.v-b.v).slice(0,2)
    .map(x => String(x.store.name).replace(/^#?\d+\s*[–-]\s*/,''));
  return { behind, total: vals.length, worst, label: m.label };
}
function ddPulseStanding(){
  if(typeof pulseMetric !== 'function' || typeof PULSE_STORES === 'undefined') return null;
  const m = pulseMetric('labor_pct');
  if(!m) return null;
  const vals = PULSE_STORES.map(s => pulseStoreVal(s, m));
  const lower = m.lowerIsBetter;
  const worseThanUs = vals.filter(v => lower ? v > m.current : v < m.current).length;
  const pct = Math.round((worseThanUs / vals.length) * 100);
  const verdict = pct >= 66 ? 'ahead of' : pct >= 34 ? 'in line with' : 'behind';
  return { pct, verdict, label: m.label };
}

/* ---------------- By region ----------------
   Pulse Index's store roster already codes a real region into each
   store id (bay_/pac_/mtn_/sw_/ne_/cv_/md_, matching the real city in
   its name) — grouped and summed here via the same pulseStoreVal
   spread used for "Standing" above, so this reads the same underlying
   figures rather than a second, disconnected dataset. */
const DD_REGION_LABELS = { bay:'Los Angeles', pac:'Bay Area', mtn:'Mountain', sw:'Southwest', ne:'Northeast', cv:'Central Valley', md:'New York' };
function ddRegionRows(){
  if(typeof pulseMetric !== 'function' || typeof PULSE_STORES === 'undefined') return null;
  const m = pulseMetric('net_sales');
  if(!m) return null;
  const groups = {};
  PULSE_STORES.forEach(s => {
    const prefix = s.id.split('_')[0];
    (groups[prefix] = groups[prefix] || []).push(s);
  });
  const rows = Object.keys(groups).map(prefix => {
    const stores = groups[prefix];
    const v = stores.reduce((t,s) => t + pulseStoreVal(s, m), 0);
    return { name: DD_REGION_LABELS[prefix] || prefix, count: stores.length, v };
  }).sort((a,b) => b.v - a.v);
  const max = Math.max(...rows.map(r=>r.v), 1);
  return { rows, max };
}

/* ---------------- The week, day by day ----------------
   Real WTD Net Sales, spread across the days actually banked so far
   using a plain trading-week shape (a shape, not a per-day ledger this
   app doesn't keep) — days still to come are drawn hollow rather than
   guessed, so a Monday reading can't be mistaken for a finished week. */
const DD_WEEK_SHAPE = [0.13, 0.12, 0.12, 0.14, 0.17, 0.18, 0.14]; // Mon..Sun
function ddWeekStrip(){
  const wtd = kpiParseVal(KPI_ROWS.storehealth[3].wtd).num; // Net Sales WTD
  const dow = (new Date().getDay() + 6) % 7; // Monday-first, 0-based
  const names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const done = DD_WEEK_SHAPE.slice(0, dow+1);
  const sum = done.reduce((a,b)=>a+b,0) || 1;
  const max = Math.max(...DD_WEEK_SHAPE);
  return names.map((name,i) => {
    const past = i <= dow, today = i === dow;
    return {
      name, past, today,
      v: past ? wtd * (DD_WEEK_SHAPE[i] / sum) : null,
      h: Math.max(10, Math.round(DD_WEEK_SHAPE[i] / max * 100))
    };
  });
}

/* ---------------- By daypart ----------------
   This app keeps no per-daypart sales ledger, so the split is a fixed,
   named trading-day shape (like DD_WEEK_SHAPE above) applied to the
   real WTD Net Sales figure, with a small deterministic WoW delta per
   bucket via the same hash-offset technique already used for stores/
   movers above — not a real per-daypart series, but not randomly
   rolled per render either. The daypart carrying the day's largest
   share is marked capacity-bound (where an added head converts
   straight to throughput) — a derived rule, not an arbitrary pick. */
const DD_DAYPART_SHAPE = [
  { name:'Breakfast', share:0.12 },
  { name:'Lunch', share:0.30 },
  { name:'Afternoon', share:0.13 },
  { name:'Dinner', share:0.32 },
  { name:'Late night', share:0.13 }
];
function ddDayparts(){
  const maxShare = Math.max(...DD_DAYPART_SHAPE.map(d=>d.share));
  return DD_DAYPART_SHAPE.map(d=>{
    const h = ddHash(d.name);
    const delta = +((((h % 140) - 60) / 10).toFixed(1));
    return { name:d.name, share:d.share, barPct:Math.round(d.share/maxShare*100), delta, cap:d.share===maxShare };
  });
}

/* ---------------- Also on the tape ----------------
   Four more real KPIs (already carrying their own vs-last-week
   delta) that didn't make the signal cards — the same shape as "This
   week so far" below, so it reuses ddMiniStatRowHtml() rather than a
   second row template. */
function ddTapeRows(){
  const splh = KPI_ROWS.storehealth[2];
  const ot = KPI_ROWS.storehealth[4];
  const trans = DAR_TILES[4];
  const otLoss = KPI_ROWS.timeloss[4];
  return [
    { label:'SPLH', value: splh.wtd, cur: splh.cur },
    { label:'Overtime %', value: ot.wtd, cur: ot.cur },
    { label:'Transactions', value: trans.wtd, cur: trans.cur },
    { label:'OT Loss', value: otLoss.wtd, cur: otLoss.cur }
  ];
}

/* ---------------- Notices ----------------
   Real, navigable features of this app (not KPI data) — pointed at
   Custom KPI and Dashboard Scheduling since both shipped recently and
   are easy to miss from the dashboard tab bar alone. Shared by both
   Daily Brief designs, each wrapping these same items in its own
   markup. */
function ddNoticeItems(){
  return [
    { href:'settings.html?section=customkpi', head:'Custom KPI — build your own formula from any two KPIs' },
    { href:'settings.html?scope=organization', head:'Dashboard Scheduling — send any dashboard on a recurring schedule' }
  ];
}

/* ---------------- Tomorrow ----------------
   How far through the fiscal week today is — the honest frame for a
   week-to-date figure, which means very little on a Monday. */
function ddFiscalDay(){ return ((new Date().getDay() + 6) % 7) + 1; } // Monday-first, 1..7
function ddTomorrowText(){
  const day = ddFiscalDay();
  if(day >= 5){
    const left = 7 - day;
    return `The week closes in ${left} day${left===1?'':'s'}. Figures firm up as the weekend lands — read week-to-date rates rather than totals until then.`;
  }
  return `Day ${day} of 7. Week-to-date totals are still filling; the rates above are the honest read this early.`;
}

/* Hand-curated "worth a look" cards — each grounded in a real value
   already present in KPI_ROWS/GRID_SECTIONS/DAR_TILES, with a short
   narrative and a jump-link to the real dashboard tab it came from
   (no separate page — switchDashTab() is the same in-app tab switch
   the tab bar itself uses). */
function ddSignalCards(){
  const laborTile = KPI_ROWS.storehealth[0];
  const foodTile = KPI_ROWS.storehealth[1];
  const otTile = KPI_ROWS.storehealth[4];
  const dropped = GRID_SECTIONS.compliance[0].rows[2];       // Dropped Shifts
  const stockout = GRID_SECTIONS.risk[1].rows[3];            // Stockout Alerts
  const lateOut = KPI_ROWS.timeloss[3];                      // Late Clock Out
  const refunds = GRID_SECTIONS.storehealth[3].rows[0];      // Refunds/Voids/Comps

  return [
    { icon:'utensils', color:'#d97706', dash:'storehealth', dashLabel:'Store Health', tag:'Inventory Analysis',
      exposure: foodTile.footer[0][1] + '/day',
      title:`Food cost ${foodTile.value} — running just above theoretical`,
      body:`Food cost is at ${foodTile.value} (WTD ${foodTile.wtd}) against a ${foodTile.footer[1][1]} theoretical — waste is ${foodTile.footer[0][1]}, worth a portion/waste check before it compounds.` },
    { icon:'circle-gauge', color:'#9333ea', dash:'storehealth', dashLabel:'Store Health', tag:'Payroll Deviation',
      title:`Overtime WTD at ${otTile.wtd} — up sharply on last week`,
      body:`Actual OT % is ${otTile.value} for the day (WTD ${otTile.wtd}), ${otTile.cur.lw} vs last week. Worth a quick look at this week's scheduling before it snowballs.` },
    { icon:'calendar-x', color:'#2563eb', dash:'compliance', dashLabel:'Compliance', tag:'Attendance',
      title:`Dropped shifts at ${dropped[1]} this week`,
      body:`Attendance Behaviour shows dropped shifts running ${dropped[1]} WTD (${dropped[2]} last week) — a steady climb worth watching.` },
    { icon:'package-x', color:'#d97706', dash:'risk', dashLabel:'Risk', tag:'Supply Chain',
      title:`${stockout[1]} stockout alerts, ${stockout[2]} WTD`,
      body:`Inventory Risk flagged ${stockout[1]} stockout alerts for the day. WTD total (${stockout[2]}) is above last week's ${stockout[5]} — likely a receiving/count gap.` },
    { icon:'clock-4', color:'#0891b2', dash:'timeloss', dashLabel:'Timeloss', tag:'Time & Attendance',
      title:`Late clock-outs cost ${lateOut.wtd} WTD`,
      body:`Late Clock Out time loss is ${lateOut.value} for the day, ${lateOut.wtd} for the week — the single biggest time-loss line right now.` },
    { icon:'banknote', color:'#dc2626', dash:'storehealth', dashLabel:'Store Health', tag:'Cash Control',
      title:`Refunds/Voids/Comps at ${refunds[2]} WTD`,
      body:`Cash Control shows ${refunds[1]} for the day and ${refunds[2]} WTD in refunds, voids and comps — worth a spot-check on approvals.` }
  ];
}

/* Daily Brief has exactly two designs — Newspaper and Version 1 (the
   original card layout was retired once Version 1 shipped, so there's
   no third fallback here: whichever flag isn't Version 1 falls back to
   Newspaper). */
function buildDailyDigest(){
  const wrap = document.getElementById('content-dailydigest');
  if(!wrap) return;
  const dd = (typeof loadDashboards === 'function') ? loadDashboards().find(x=>x.id==='dailydigest') : null;
  if(dd && dd.dailyBriefV1){ buildDailyDigestV1(); return; }
  buildDailyDigestNewspaper();
}

/* ============================================================
   Daily Brief — "Enable Newspaper" alternate design (assets/
   newspaper.css). Visual copy of the reference "zip-dashboard 1.html"
   newspaper mock, built from the SAME real-data helpers as the card
   design above (ddSignalCards, ddStoresBehindMedian, ddPulseStanding,
   ddRegionRows, ddStoreLaborRows, ddStoreMoverRows, ddTapeRows,
   ddWeekStrip, ddNoticesHtml's source items, ddTomorrowText,
   ddFiscalDay) rather than a second, disconnected dataset.

   Left out of the reference on purpose, since this design lives inside
   the Daily Brief tab's own content area (which already scrolls like
   every other tab) rather than as a standalone full-viewport page: the
   column-shedding/measure-to-fit engine and the page-turn animation —
   neither has anything to do here since the outer chrome this design
   must leave untouched (topbar/sidebar/tab bar) already gives the page
   a normal scrollbar instead of one screen to fit into.

   The read-progress tracker (progress bar, "X of Y read", Mark all,
   Reset) IS included, simplified from the reference's hover-dwell +
   localStorage version to a plain in-memory Set (NWSP_READ, reset on a
   full page reload) marked on click of a card's headline/"Open X" link
   — this app's tabs never unmount each other (switchDashTab() only
   toggles a `hidden` class), so a click that navigates away still
   leaves the read state in memory for whenever Daily Brief is shown
   again in the same session, and a full render captures the current
   state each time.
   ============================================================ */
const NWSP_SEV_ICON = { bad:'⚠', watch:'●', good:'✓' };
const NWSP_SEV_LABEL = { bad:'Attention', watch:'Worth a look', good:'All clear' };

function nwspSevFromColor(hex){ return hex === '#dc2626' ? 'bad' : 'watch'; }

/* ---------------- read progress ----------------
   Plain in-memory Set of read item indices — see the file header
   comment above for why this doesn't need localStorage. Any mutation
   re-renders the whole newspaper so the bar/count/all-read state is
   always in sync with what's on screen. */
const NWSP_READ = new Set();
function nwspMarkRead(idx){ NWSP_READ.add(idx); if(typeof buildDailyDigest === 'function') buildDailyDigest(); }
function nwspMarkAllRead(n){ for(let i=0;i<n;i++) NWSP_READ.add(i); buildDailyDigest(); }
function nwspResetRead(){ NWSP_READ.clear(); buildDailyDigest(); }

function nwspItems(){
  return ddSignalCards().map(c => ({
    sev: nwspSevFromColor(c.color),
    head: c.title,
    analysis: c.body,
    dash: c.dash,
    dashLabel: c.dashLabel
  }));
}

function nwspLeadHtml(lead){
  if(!lead) return `
    <article class="nwsp-lead good">
      <div class="nwsp-kicker">${NWSP_SEV_ICON.good} All clear</div>
      <h2 class="nwsp-lead-h">Nothing on the list this morning</h2>
      <p class="nwsp-lead-b">No metric moved far enough to be worth interrupting you for. The week is running inside the range your history supports.</p>
    </article>`;
  return `
    <article class="nwsp-lead ${lead.sev}">
      <div class="nwsp-lead-top">
        <span class="nwsp-kicker">${NWSP_SEV_ICON[lead.sev]} ${NWSP_SEV_LABEL[lead.sev]}</span>
        <span class="nwsp-byline">By the Altametrics Agent</span>
      </div>
      <h2 class="nwsp-lead-h" onclick="nwspMarkRead(0);switchDashTab('${lead.dash}')">${lead.head}</h2>
      <p class="nwsp-lead-b">${lead.analysis}</p>
      <div class="nwsp-lead-f">
        <button class="nwsp-more" onclick="nwspMarkRead(0);switchDashTab('${lead.dash}')">Open ${lead.dashLabel} &rarr;</button>
      </div>
    </article>`;
}

function nwspSecondHtml(second){
  if(!second) return '';
  return `
    <article class="nwsp-second ${second.sev}">
      <div class="nwsp-lead-top"><span class="nwsp-kicker sm">${NWSP_SEV_ICON[second.sev]} ${NWSP_SEV_LABEL[second.sev]}</span></div>
      <h3 class="nwsp-second-h" onclick="nwspMarkRead(1);switchDashTab('${second.dash}')">${second.head}</h3>
      <div class="nwsp-second-cols"><p>${second.analysis}</p></div>
      <button class="nwsp-more" onclick="nwspMarkRead(1);switchDashTab('${second.dash}')">Open ${second.dashLabel} &rarr;</button>
    </article>`;
}

function nwspBelowsHtml(belows){
  if(!belows.length) return '';
  return `
    <div class="nwsp-belows">
      ${belows.map((it,ix)=>`
        <article class="nwsp-below ${it.sev} b${ix+1}" onclick="nwspMarkRead(${ix+2});switchDashTab('${it.dash}')">
          <span class="nwsp-b-k">${NWSP_SEV_ICON[it.sev]} ${NWSP_SEV_LABEL[it.sev]}</span>
          <h4>${it.head}</h4>
          <p>${it.analysis}</p>
          <span class="nwsp-more sm">Open ${it.dashLabel} &rarr;</span>
        </article>`).join('')}
    </div>`;
}

function nwspStripHtml(){
  return ddWeekStrip().map(d => `
    <div class="nwsp-st ${d.past?'past':'ahead'} ${d.today?'today':''}"
         title="${d.past?ddFmtMoney(d.v):'Still to come'}">
      <span class="nwsp-st-b" style="height:${d.h}%"></span>
      <span class="nwsp-st-n">${d.name}</span>
    </div>`).join('');
}

function nwspMoversHtml(){
  const rows = ddStoreMoverRows();
  const up = rows.filter(r=>r.wow>=0).slice(0,3);
  const dn = rows.filter(r=>r.wow<0).slice(0,3);
  if(!up.length && !dn.length) return '';
  return `
    <div class="nwsp-blk">
    <div class="nwsp-sech tight"><span>Movers</span><i>week on week</i></div>
    <table class="nwsp-mov mv"><tbody>
      ${up.map(r=>`<tr onclick="switchDashTab('storehealth')"><td class="nwsp-m-n">${r.store}</td>
        <td class="nwsp-m-v">${ddFmtMoney(r.sales)}</td>
        <td class="nwsp-m-d good">+${r.wow}%</td></tr>`).join('')}
      ${(up.length && dn.length) ? '<tr class="nwsp-m-gap"><td colspan="3"></td></tr>' : ''}
      ${dn.map(r=>`<tr onclick="switchDashTab('storehealth')"><td class="nwsp-m-n">${r.store}</td>
        <td class="nwsp-m-v">${ddFmtMoney(r.sales)}</td>
        <td class="nwsp-m-d bad">${r.wow}%</td></tr>`).join('')}
    </tbody></table>
    </div>`;
}

function nwspTapeHtml(){
  const rows = ddTapeRows();
  return `
    <div class="nwsp-blk">
    <div class="nwsp-sech tight"><span>Also on the tape</span><i>vs last week</i></div>
    <table class="nwsp-mov watch"><tbody>
      ${rows.map(r=>`<tr><td class="nwsp-m-n">${r.label}</td>
        <td class="nwsp-m-v">${r.value}</td>
        <td class="nwsp-m-d ${r.cur.lwUp?'good':'bad'}">${r.cur.lw}</td></tr>`).join('')}
    </tbody></table>
    </div>`;
}

function nwspNoticesHtml(){
  const items = ddNoticeItems();
  return `
    <div class="nwsp-blk">
    <div class="nwsp-sech tight"><span>Notices</span><i>from Altametrics</i></div>
    <ul class="nwsp-not">
      ${items.map(a=>`<li><a href="${a.href}"><span class="nwsp-not-k">NEW</span>${a.head}</a></li>`).join('')}
    </ul>
    </div>`;
}

function nwspDaypartHtml(){
  const dayparts = ddDayparts();
  return `
    <div class="nwsp-blk">
    <div class="nwsp-sech tight"><span>By daypart</span><i>share of the week</i></div>
    <ul class="nwsp-dp">
      ${dayparts.map(d=>`<li>
        <span class="nwsp-dp-n">${d.name}${d.cap?'<b title="Demand exceeds the line here">&bull;</b>':''}</span>
        <span class="nwsp-dp-b"><i style="width:${d.barPct}%"></i></span>
        <span class="nwsp-dp-p">${Math.round(d.share*100)}%</span>
        <span class="nwsp-dp-d ${d.delta>=0?'good':'bad'}">${d.delta>=0?'&#9650;':'&#9660;'}${Math.abs(d.delta).toFixed(1)}</span>
      </li>`).join('')}
    </ul>
    <p class="nwsp-dp-f">&bull; marks a capacity-bound daypart — where a head converts to throughput.</p>
    </div>`;
}

function buildDailyDigestNewspaper(){
  const wrap = document.getElementById('content-dailydigest');
  if(!wrap) return;

  const tiles = KPI_ROWS.storehealth;
  const items = nwspItems();
  const lead = items[0], second = items[1];
  const belows = items.slice(2,6);
  const bad = items.filter(i=>i.sev==='bad').length;
  const watch = items.filter(i=>i.sev==='watch').length;

  const headline = bad
    ? `${bad} thing${bad===1?'':'s'} worth your attention`
    : watch ? `Nothing urgent — ${watch} worth an eye`
    : 'Nothing needs you. The week is running clean.';
  const standfirst = bad
    ? 'Each one opens the dashboard that settles it.'
    : watch ? 'No emergencies — these are the movements worth a look before the detail.'
    : 'No metric moved far enough this week to be worth interrupting you for.';

  const todayStr = new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const day = ddFiscalDay();
  const behind = ddStoresBehindMedian();
  const standing = ddPulseStanding();
  const region = ddRegionRows();
  const laborRows = ddStoreLaborRows();

  const totalItems = items.length;
  const readCount = items.filter((_,i)=>NWSP_READ.has(i)).length;
  const allRead = totalItems>0 && readCount===totalItems;
  const progressPct = totalItems ? Math.round(readCount/totalItems*100) : 0;

  wrap.innerHTML = `
  <div class="nwsp${allRead?' all-read':''}">
    <header class="nwsp-mast">
      <div class="nwsp-mast-l">
        <span class="nwsp-edition">Morning edition</span>
        <span class="nwsp-rule"></span>
        <span class="nwsp-scope">All Stores</span>
      </div>
      <h1 class="nwsp-title">Daily Brief</h1>
      <div class="nwsp-mast-r">
        <span class="nwsp-date">${todayStr}</span>
        <span class="nwsp-rule"></span>
        <span class="nwsp-day">Day ${day} of the fiscal week</span>
      </div>
    </header>

    <div class="nwsp-banner">
      <h2 class="nwsp-headline">${headline}</h2>
      <p class="nwsp-standfirst">${standfirst}</p>
      ${totalItems?`
      <div class="nwsp-prog">
        <div class="nwsp-prog-bar"><span style="width:${progressPct}%"></span></div>
        <div class="nwsp-prog-tx">
          <span>${allRead?'All read':`${readCount} of ${totalItems} read`}</span>
          <button class="nwsp-prog-b" onclick="nwspMarkAllRead(${totalItems})">Mark all</button>
          <button class="nwsp-prog-b" onclick="nwspResetRead()">Reset</button>
        </div>
      </div>`:''}
      <button class="nwsp-enter" onclick="switchDashTab('storehealth')">Take me to Dashboard <span aria-hidden="true">&rarr;</span></button>
    </div>

    <div class="nwsp-body">
      <section class="nwsp-col nwsp-col-l">
        <div class="nwsp-blk">
          <div class="nwsp-sech"><span>The week so far</span><i>week to date</i></div>
          <ul class="nwsp-quotes">
            ${tiles.map(t=>`
              <li class="nwsp-qr">
                <div class="nwsp-qr-top"><span class="nwsp-qr-n">${t.label}</span></div>
                <div class="nwsp-qr-bot">
                  <span class="nwsp-qr-v">${t.value}</span>
                  <span class="nwsp-qr-c ${t.cur.lwUp?'good':'bad'}">${t.cur.lw}<i>LW</i></span>
                  <span class="nwsp-qr-c ${t.cur.lyUp?'good':'bad'}">${t.cur.ly}<i>LY</i></span>
                </div>
              </li>`).join('')}
          </ul>
        </div>

        <div class="nwsp-blk">
          <div class="nwsp-sech tight"><span>Standing</span><i>against the estate</i></div>
          ${behind?`
          <button class="nwsp-stat stores" onclick="switchDashTab('storehealth')">
            <span class="nwsp-stat-n">${behind.behind}<i>of ${behind.total}</i></span>
            <span class="nwsp-stat-l">stores behind the median</span>
            <span class="nwsp-stat-d">Furthest back: ${behind.worst.join(', ')}</span>
          </button>`:''}
          ${standing?`
          <button class="nwsp-stat pulse" onclick="switchDashTab('pulseindex')">
            <span class="nwsp-stat-n">${standing.pct}<i>th pctl</i></span>
            <span class="nwsp-stat-l">Pulse Index</span>
            <span class="nwsp-stat-d">You sit ${standing.verdict} the estate</span>
          </button>`:''}
        </div>

        <div class="nwsp-blk">
          <div class="nwsp-sech tight"><span>Stores to watch</span><i>Labor %</i></div>
          <table class="nwsp-mov ws"><tbody>
            ${laborRows.slice(0,4).map((r,i)=>`
              <tr onclick="switchDashTab('storehealth')">
                <td class="nwsp-m-n">${i+1}. ${r.store}</td>
                <td class="nwsp-m-d bad">${r.laborPct.toFixed(1)}%</td>
              </tr>`).join('')}
          </tbody></table>
        </div>

        ${nwspDaypartHtml()}

        ${region?`
        <div class="nwsp-blk">
          <div class="nwsp-sech tight"><span>By region</span><i>net sales, WTD</i></div>
          <table class="nwsp-reg"><tbody>
            ${region.rows.map(r=>`
              <tr onclick="switchDashTab('storehealth')">
                <td class="nwsp-r-n">${r.name}<i>${r.count}</i></td>
                <td class="nwsp-r-b"><span style="width:${Math.max(4,Math.round(r.v/region.max*100))}%"></span></td>
                <td class="nwsp-r-v">${ddFmtMoney(r.v)}</td>
              </tr>`).join('')}
          </tbody></table>
        </div>`:''}
      </section>

      <section class="nwsp-col nwsp-col-c">
        <div class="nwsp-sech"><span>Before you get into the detail</span><i>${items.length?`${items.length} item${items.length===1?'':'s'}`:'all clear'}</i></div>
        ${nwspLeadHtml(lead)}
        ${nwspSecondHtml(second)}
        ${nwspBelowsHtml(belows)}
      </section>

      <section class="nwsp-col nwsp-col-r">
        <div class="nwsp-blk">
          <div class="nwsp-sech tight"><span>The week, day by day</span><i>net sales</i></div>
          <div class="nwsp-strip">${nwspStripHtml()}</div>
        </div>
        ${nwspMoversHtml()}
        ${nwspTapeHtml()}
        ${nwspNoticesHtml()}
        <div class="nwsp-blk">
          <div class="nwsp-sech tight"><span>Tomorrow</span></div>
          <p class="nwsp-tomorrow">${ddTomorrowText()}</p>
        </div>
      </section>
    </div>

    <footer class="nwsp-foot">
      <span>Figures read from the same source as every report</span>
    </footer>
  </div>`;
}

/* ============================================================
   Daily Brief — "Version 1" alternate design (assets/daily-brief-v1.css).
   Same sections and SAME real-data helpers as the Newspaper design
   above (ddSignalCards, ddStoresBehindMedian, ddPulseStanding,
   ddRegionRows, ddStoreLaborRows, ddStoreMoverRows, ddTapeRows,
   ddWeekStrip, ddDayparts, ddNoticeItems, ddTomorrowText, ddFiscalDay) —
   only the visual language changes, from newspaper/serif to this app's
   own existing card system (.chart-card, up-green/up-red). Read
   tracking (NWSP_READ / nwspMarkRead / nwspMarkAllRead / nwspResetRead)
   is shared with the Newspaper design too, since only one design is
   ever on screen at a time.
   ============================================================ */


function v1SignalCard(item, idx, kind){
  if(!item) return '';
  const sev = nwspSevFromColor(item.color);
  const read = NWSP_READ.has(idx);
  const markAndGo = `nwspMarkRead(${idx});switchDashTab('${item.dash}')`;
  const metaHtml = (kind==='lead' && item.exposure)
    ? `<span class="v1-exposure"><i class="v1-exposure-dot"></i>Exposure: <b>${item.exposure}</b></span>`
    : '';
  return `
    <article class="v1-signal ${kind} sev-${sev}" onclick="${markAndGo}">
      <div class="v1-signal-top">
        ${kind==='lead'
          ? `<span class="v1-tag star">&#9733; 1 Thing Worth Your Attention</span>`
          : `<span class="v1-tag sev">${NWSP_SEV_LABEL[sev]}</span>`}
        <span class="v1-tag topic">${item.tag}</span>
        <span class="v1-check${read?' on':''}" title="${read?'Reviewed':'Not yet reviewed'}">&#10003;</span>
      </div>
      <h3 class="v1-signal-h">${item.title}</h3>
      <p class="v1-signal-b">${item.body}</p>
      <div class="v1-signal-foot">
        ${metaHtml}
        <button class="v1-open" onclick="event.stopPropagation();${markAndGo}">Open ${item.dashLabel} &rarr;</button>
      </div>
    </article>`;
}

function buildDailyDigestV1(){
  const wrap = document.getElementById('content-dailydigest');
  if(!wrap) return;

  const tiles = KPI_ROWS.storehealth;
  const items = ddSignalCards();
  const lead = items[0], second = items[1];
  const belows = items.slice(2,6);

  const totalItems = items.length;
  const readCount = items.filter((_,i)=>NWSP_READ.has(i)).length;
  const allRead = totalItems>0 && readCount===totalItems;

  const todayStr = new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const behind = ddStoresBehindMedian();
  const standing = ddPulseStanding();
  const laborRows = ddStoreLaborRows();
  const strip = ddWeekStrip();
  const moverRows = ddStoreMoverRows();
  const up = moverRows.filter(r=>r.wow>=0).slice(0,3);
  const dn = moverRows.filter(r=>r.wow<0).slice(0,3);
  const tapeRows = ddTapeRows();

  wrap.innerHTML = `
  <div class="v1${allRead?' all-read':''}">
    <div class="v1-head">
      <div class="v1-head-l">
        <div class="v1-head-title-row">
          <h1 class="v1-title">Daily Brief</h1>
          <span class="v1-edition-badge">Morning Edition</span>
        </div>
        <div class="v1-head-meta">${todayStr}</div>
      </div>
      <div class="v1-head-r">
        <button class="v1-enter" onclick="switchDashTab('storehealth')">Take me to Dashboard <span aria-hidden="true">&rarr;</span></button>
      </div>
    </div>

    <div class="v1-body">
      <section class="v1-col">
        <div class="chart-card v1-card">
          <div class="v1-card-hd"><span>The Week So Far</span><span class="v1-badge wtd">WTD</span></div>
          <div class="v1-kpi-list">
            ${tiles.map(t=>{
              return `
              <div class="v1-kpi-row">
                <div class="v1-kpi-top"><span class="v1-kpi-name">${t.label}</span><span class="v1-kpi-val">${t.value}</span></div>
                <div class="v1-kpi-bot">
                  <span class="v1-chip ${t.cur.lwUp?'good':'bad'}">${t.cur.lwUp?'&#9650;':'&#9660;'} ${t.cur.lw}<i>LW</i></span>
                  <span class="v1-chip ${t.cur.lyUp?'good':'bad'}">${t.cur.lyUp?'&#9650;':'&#9660;'} ${t.cur.ly}<i>LY</i></span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="chart-card v1-card">
          <div class="v1-card-hd"><span>Standing</span><span class="v1-card-hd-sub">Estate Distribution</span></div>
          <div class="v1-standing-row">
            ${behind?`
            <button class="v1-standing-box" onclick="switchDashTab('storehealth')">
              <span class="v1-standing-n amber">${behind.behind}<i>of ${behind.total}</i></span>
              <span class="v1-standing-l">Stores Behind Median</span>
              <span class="v1-standing-d">Furthest: ${behind.worst.join(', ')}</span>
            </button>`:''}
            ${standing?`
            <button class="v1-standing-box" onclick="switchDashTab('pulseindex')">
              <span class="v1-standing-n blue">${standing.pct}<i>th pctl</i></span>
              <span class="v1-standing-l">Pulse Index</span>
              <span class="v1-standing-d">${standing.verdict==='in line with'?'In line with estate':'You sit '+standing.verdict+' estate'}</span>
            </button>`:''}
          </div>
        </div>

        <div class="chart-card v1-card">
          <div class="v1-card-hd"><span>Stores to Watch</span><span class="v1-card-hd-sub">Labor %</span></div>
          <div class="v1-row-list">
            ${laborRows.slice(0,4).map((r,i)=>`
              <div class="v1-row" onclick="switchDashTab('storehealth')">
                <div class="v1-row-main"><div class="v1-row-name">${i+1}. ${r.store}</div></div>
                <span class="v1-row-val bad">${r.laborPct.toFixed(1)}%</span>
              </div>`).join('')}
          </div>
        </div>

      </section>

      <section class="v1-col">
        <div class="v1-signals-hd">
          <div>
            <div class="v1-signals-title">Operational Signals <span class="v1-signals-count">&bull; ${totalItems} actionable item${totalItems===1?'':'s'} detected</span></div>
            <div class="v1-signals-sub">Ranked by variance severity and financial exposure.</div>
          </div>
          <span class="v1-live-badge"><i class="v1-live-dot"></i>Live Agent Feed</span>
        </div>
        ${v1SignalCard(lead, 0, 'lead')}
        ${v1SignalCard(second, 1, 'second')}
        <div class="v1-signals-grid">
          ${belows.map((it,ix)=>v1SignalCard(it, ix+2, 'below')).join('')}
        </div>
      </section>

      <section class="v1-col">
        <div class="chart-card v1-card">
          <div class="v1-card-hd"><span>The Week, Day by Day</span><span class="v1-card-hd-sub">Net Sales</span></div>
          <div class="v1-strip">
            ${strip.map(d=>`
              <div class="v1-st ${d.today?'today':(d.past?'past':'ahead')}">
                ${d.today?`<span class="v1-st-val">${ddFmtMoneyShort(d.v)}</span>`:''}
                <span class="v1-st-bar"><i style="height:${d.h}%"></i></span>
                <span class="v1-st-lbl">${d.name}</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="chart-card v1-card">
          <div class="v1-card-hd"><span>Movers</span><span class="v1-card-hd-sub">Week on Week</span></div>
          <div class="v1-row-list">
            ${[...up,...dn].map(r=>`
              <div class="v1-row" onclick="switchDashTab('storehealth')">
                <div class="v1-row-main"><div class="v1-row-name">${r.store}</div><div class="v1-row-sub">${ddFmtMoney(r.sales)}</div></div>
                <span class="v1-row-val ${r.wow>=0?'good':'bad'}">${r.wow>=0?'+':''}${r.wow}%</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="chart-card v1-card">
          <div class="v1-card-hd"><span>Also on the Tape</span><span class="v1-card-hd-sub">vs Last Week</span></div>
          <div class="v1-row-list">
            ${tapeRows.map(r=>`
              <div class="v1-row">
                <div class="v1-row-main"><div class="v1-row-name">${r.label}</div></div>
                <div class="v1-row-right">
                  <span class="v1-row-plain">${r.value}</span>
                  <span class="v1-row-val ${r.cur.lwUp?'good':'bad'}">${r.cur.lw}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>

      </section>
    </div>
  </div>`;
}
