/* ============================================================
   Pulse Index — rendering + interaction.
   Concept borrowed from the "📊 Pulse Index" screen in the
   zip-dashboard.html reference (current value vs a peer-average band,
   click a KPI to focus it) — rebuilt here with this app's own
   fonts/colors/components instead of that file's styling.
   ============================================================ */
const PULSE_STATE = { metric: PULSE_METRICS[0].id, peer: 'all' };

function pulseSetMetric(id){
  PULSE_STATE.metric = id;
  pulseRender();
}

function pulseSetPeer(peer){
  PULSE_STATE.peer = peer;
  pulseRender();
}

function pulseScopeBarHtml(){
  const opts = [['all','All Stores'],['corporate','Corporate'],['franchise','Franchise']];
  return `<div class="pi-scope">${opts.map(o=>{
    const n = pulseStoresFor(o[0]).length;
    return `<span class="${PULSE_STATE.peer===o[0]?'on':''}" onclick="pulseSetPeer('${o[0]}')">${o[1]} <i class="pi-scope-n">${n}</i></span>`;
  }).join('')}</div>`;
}

function pulseTilesHtml(m){
  const stats = pulsePeerStats(m, PULSE_STATE.peer);
  const peerLabel = pulsePeerLabel(PULSE_STATE.peer);
  const corpLeads = m.lowerIsBetter ? stats.corpAvg < stats.franAvg : stats.corpAvg > stats.franAvg;
  return `
  <div class="pi-tile blue"><div class="k">Peer Group</div><div class="n">${stats.peers.length} stores</div><div class="s">${peerLabel}</div></div>
  <div class="pi-tile green"><div class="k">Best in Group</div><div class="n">${pulseFmt(m, stats.best.v)}</div><div class="s">${stats.best.store.name}</div></div>
  <div class="pi-tile rose"><div class="k">Trailing the Group</div><div class="n">${pulseFmt(m, stats.worst.v)}</div><div class="s">${stats.worst.store.name}</div></div>
  <div class="pi-tile violet"><div class="k">Corporate vs Franchise</div><div class="n">${pulseFmt(m, stats.corpAvg)} &middot; ${pulseFmt(m, stats.franAvg)}</div><div class="s">${corpLeads?'Corporate leads':'Franchise leads'}</div></div>`;
}

function pulseBandSvg(m, avg){
  const beats = pulseBeats(m, avg);
  const lo = Math.min(m.current, avg) * 0.85;
  const hi = Math.max(m.current, avg) * 1.15;
  const span = Math.max(hi - lo, 1e-9);
  const X = v => Math.max(2, Math.min(98, ((v - lo) / span) * 100));
  const avgX = X(avg), curX = X(m.current);
  const grad = m.lowerIsBetter ? 'linear-gradient(90deg,#bbf7d0,#fef08a,#fecaca)' : 'linear-gradient(90deg,#fecaca,#fef08a,#bbf7d0)';
  return `
  <div class="pi-band">
    <div class="pi-band-track" style="background:${grad}"></div>
    <div class="pi-band-med" style="left:${avgX}%"></div>
    <div class="pi-band-medlbl" style="left:${avgX}%">Average ${pulseFmt(m, avg)}</div>
    <div class="pi-band-you ${beats ? 'good' : 'bad'}" style="left:${curX}%"><i></i></div>
  </div>`;
}

function pulseMiniBand(m, avg){
  const beats = pulseBeats(m, avg);
  const lo = Math.min(m.current, avg) * 0.85;
  const hi = Math.max(m.current, avg) * 1.15;
  const span = Math.max(hi - lo, 1e-9);
  const X = v => Math.max(4, Math.min(96, ((v - lo) / span) * 100));
  const grad = m.lowerIsBetter ? 'linear-gradient(90deg,#bbf7d0,#fef08a,#fecaca)' : 'linear-gradient(90deg,#fecaca,#fef08a,#bbf7d0)';
  return `<span class="pi-mini">
    <span class="pi-mini-track" style="background:${grad}"></span>
    <span class="pi-mini-med" style="left:${X(avg)}%"></span>
    <span class="pi-mini-dot ${beats ? 'good' : 'bad'}" style="left:${X(m.current)}%"></span>
  </span>`;
}

/* Short, scope-aware read of where the metric stands — fills out the
   focus card so it earns its space rather than ending on a bare band. */
function pulseFocusSummary(m, avg, beats, delta){
  const abs = Math.abs(delta).toFixed(1);
  const peerLabel = pulsePeerLabel(PULSE_STATE.peer);
  if(beats){
    return `${m.label} is running <b>${abs}% ${m.lowerIsBetter ? 'under' : 'over'}</b> the ${peerLabel} average of ${pulseFmt(m, avg)} — a solid position this week, worth holding the current pace.`;
  }
  return `${m.label} is running <b>${abs}% ${m.lowerIsBetter ? 'over' : 'under'}</b> the ${peerLabel} average of ${pulseFmt(m, avg)} — worth a closer look to close the gap.`;
}

function pulseFocusPanelHtml(m, avg, beats){
  const delta = pulseDeltaPct(m, avg);
  return `
  <div class="pi-focus-top">
    <div class="pi-focus-icon" style="background:${m.iconBg}"><i data-lucide="${m.icon}" style="color:${m.iconColor}"></i></div>
    <div class="pi-focus-namewrap">
      <span class="pi-focus-label">${m.label}</span>
      <span class="pi-focus-value">${pulseFmt(m, m.current)}</span>
      <span class="pi-focus-delta ${beats ? 'up-green' : 'up-red'}">${delta > 0 ? '+' : ''}${delta.toFixed(1)}%</span>
    </div>
    <span class="severity-badge severity-${beats ? 'low' : 'high'}">${beats ? 'Beats' : 'Lags'} Average</span>
  </div>
  <div class="pi-focus-summary">${pulseFocusSummary(m, avg, beats, delta)}</div>
  ${pulseBandSvg(m, avg)}`;
}

function pulseRowHtml(m){
  const avg = pulseAverageForPeer(m, PULSE_STATE.peer);
  const beats = pulseBeats(m, avg);
  const delta = pulseDeltaPct(m, avg);
  const active = m.id === PULSE_STATE.metric;
  return `
  <tr class="${active ? 'pi-row-active' : ''}" onclick="pulseSetMetric('${m.id}')">
    <td class="pi-td-name"><i data-lucide="${m.icon}" style="width:14px;height:14px;color:${m.iconColor};"></i>${m.label}${m.lowerIsBetter ? ' <span class="pi-dir" title="Lower is better">&darr;</span>' : ''}</td>
    <td><b>${pulseFmt(m, m.current)}</b></td>
    <td>${pulseFmt(m, avg)}</td>
    <td class="${beats ? 'up-green' : 'up-red'}">${delta > 0 ? '+' : ''}${delta.toFixed(1)}%</td>
    <td>${pulseMiniBand(m, avg)}</td>
    <td><span class="severity-badge severity-${beats ? 'low' : 'high'}">${beats ? 'Beats' : 'Lags'}</span></td>
  </tr>`;
}

function pulseRender(){
  const wrap = document.getElementById('content-pulseindex');
  if(!wrap) return;
  const m = pulseMetric(PULSE_STATE.metric) || PULSE_METRICS[0];
  const avg = pulseAverageForPeer(m, PULSE_STATE.peer);
  const beats = pulseBeats(m, avg);
  wrap.innerHTML = `
  <div class="pi-wrap">
    <div class="pi-top">
      <div>
        <div class="text-[19px] font-bold text-slate-800">Pulse Index</div>
        <div class="text-[12.5px] text-slate-500 mt-0.5">Current value vs average benchmark for your key ratio KPIs — click any KPI below for a full view.</div>
      </div>
      ${pulseScopeBarHtml()}
    </div>
    <div class="pi-grid">
      <div class="pi-main">
        <div class="chart-card pi-focus-card ${beats ? 'pi-focus-good' : 'pi-focus-bad'}">${pulseFocusPanelHtml(m, avg, beats)}</div>
        <div class="chart-card pi-table-card">
          <div class="font-bold text-[15px] text-slate-800 mb-1">All KPIs vs Average</div>
          <div class="text-[12px] text-slate-400 font-medium mb-3">Click any row to focus it above</div>
          <div class="pi-table-scroll">
            <table class="pi-table">
              <thead><tr><th>KPI</th><th>Current</th><th>Average</th><th>vs Average</th><th>Band</th><th>Verdict</th></tr></thead>
              <tbody>${PULSE_METRICS.map(pulseRowHtml).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="pi-side">${pulseTilesHtml(m)}</div>
    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

function buildPulseIndex(){ pulseRender(); }
