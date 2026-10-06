/* ============================================================
   AI Hub — advanced root-cause drilldown data.
   Ported verbatim from the "Advanced Insights" screen inside
   org-dashboard.html (ADVANCED_KPI_DATA / IMPACT_DATA) so the
   Dashboard-screen AI Hub tab shows the same figures and the same
   3-level tree (KPI → driver → store-level table) that the Org
   Dashboard's Advanced Insights modal shows. Names are prefixed
   AHUB_ to avoid colliding with anything already on window.
   ============================================================ */

const AHUB_KPI_DATA = [
  {
    id:'actuallabor', label:'Actual Labor % Overage', sbVal:'30.9%', sbVar:'▲ +1.4 pts', sev:'wn', sbTgt:'Target 29.5%',
    l1:{ eyebrow:'Actual Labor % · This Week · 236 - Bressi Ranch', val:'30.9%', valCls:'wn',
      chip:'▲ +1.4 pts above target', chipCls:'wn', tgt:'',
      stats:[{lbl:'Actual Labor $',val:'$22,190',note:'Target $21,200',cls:'nm'},
             {lbl:'Actual Sales',val:'$71,850',note:'Forecast $74,600',cls:'wn'},
             {lbl:'Actual Hours',val:'934h',note:'Scheduled 910h',cls:'wn'},
             {lbl:'OT/DT Hours',val:'9h',note:'1 of 3 justified',cls:'al'}]},
    segs:[
      {key:'sales', lbl:'Sales Shortfall Effect', pct:51, amt:'$860 est.', ov:'Est. +1.2 pts', ovCls:'wn', col:'#1A3A6B'},
      {key:'hours', lbl:'Hours Above Schedule', pct:23, amt:'$408', ov:'+$408', ovCls:'al', col:'#2E5FA3'},
      {key:'premium', lbl:'Premium Pay', pct:13, amt:'$235', ov:'+$235', ovCls:'wn', col:'#5680BC'},
      {key:'highrate', lbl:'High-Rate Staffing', pct:7, amt:'$128', ov:'+$128', ovCls:'wn', col:'#8AA8CC'},
      {key:'ot', lbl:'Avoidable OT', pct:6, amt:'$113', ov:'+$113', ovCls:'nm', col:'#BFCFDE'},
    ],
    ai:'Actual Labor % is running <strong>+1.4 pts above target</strong> this week — the factors driving it are listed below.',
    drivers:[
      { key:'hours', n:1, sev:'al', seg:'hours', icon:'calendar-clock', name:'Actual hours are running 24h above the posted schedule and 59h above ideal', sub:'Actual hours ran 24h above the posted schedule and 59h above ideal labor for the week\'s actual sales — a repeat group of early clock-ins and late clock-outs is the biggest piece.', impact:'+$408 over schedule', impCls:'al',
        insight:'<strong>Actual hours came in 24 hours above the posted schedule (934h vs 910h) — and 59 hours above the system\'s ideal labor requirement for this week\'s actual sales (875h).</strong> That\'s a stronger signal than a schedule miss alone: even the posted schedule already ran 35h above ideal, and actual execution added on top of it. About half of the overage traces to early clock-ins and late clock-outs from a small repeat group of employees.',
        subs:[
          { name:'Scheduled vs Actual Hours by Day',
            cols:['Date','Scheduled Hrs','Actual Hrs','Variance'],
            rows:[['08/03/2026','128h','131h',{v:'+3h',c:'tc-wn'}],
                  ['08/04/2026','126h','129h',{v:'+3h',c:'tc-wn'}],
                  ['08/05/2026','122h','124h',{v:'+2h',c:'tc-wn'}],
                  ['08/06/2026','135h','141h',{v:'+6h',c:'tc-al'}],
                  ['08/07/2026','133h','136h',{v:'+3h',c:'tc-wn'}],
                  ['08/08/2026','140h','145h',{v:'+5h',c:'tc-al'}],
                  ['08/09/2026','126h','128h',{v:'+2h',c:'tc-wn'}]]},
          { name:'Early Clock-In / Late Clock-Out Detail',
            cols:['Date','Employee','Sched Start','Actual Clock-In','Sched End','Actual Clock-Out','Extra Hrs','Extra $'],
            rows:[['08/06/2026','John P.','6:00 AM',{v:'5:32 AM',c:'tc-wn'},'2:00 PM','2:00 PM',{v:'0.72h',c:'tc-wn'},{v:'$13.32',c:'tc-wn'}],
                  ['08/07/2026','Sarah M.','2:00 PM','2:00 PM','10:00 PM',{v:'10:45 PM',c:'tc-wn'},{v:'0.75h',c:'tc-wn'},{v:'$15.75',c:'tc-wn'}],
                  ['08/06/2026','Maria L.','11:00 AM',{v:'10:41 AM',c:'tc-wn'},'5:00 PM','5:00 PM',{v:'0.32h',c:'tc-nm'},{v:'$5.36',c:'tc-nm'}],
                  ['08/08/2026','Tom K.','5:00 PM','5:00 PM','10:00 PM',{v:'10:38 PM',c:'tc-wn'},{v:'0.63h',c:'tc-wn'},{v:'$11.28',c:'tc-wn'}]]}
        ],
        fixRecs:['Review the 4 employees with repeated early/late punches and reinforce schedule adherence. Estimated avoidable labor: $82/week.']},
      { key:'highrate', n:2, sev:'wn', seg:'highrate', icon:'circle-dollar-sign', name:'High-rate employees clocked in over available lower-rate, same-skill staff', sub:'Employees paid well above the store average clocked 4 shifts this week, while equally-skilled lower-rate staff were available for the same shifts.', impact:'+$128 avoidable cost', impCls:'wn',
        insight:'<strong>4 shifts this week were actually worked by employees paid well above the $16.40/hr store average.</strong> This isn\'t a wage adjustment or performance-review case — same-skilled staff at lower rates were available for every one of these shifts and were not called in.',
        subs:[
          { name:'High-Rate Employees Worked',
            cols:['Shift','Employee','Actual Rate','Store Avg','Rate Diff','Hrs','Excess $'],
            rows:[['6:00 AM–11:00 AM','Grace T.',{v:'$21.40',c:'tc-al'},'$16.40',{v:'+$5.00',c:'tc-al'},'8h',{v:'$40.00',c:'tc-al'}],
                  ['11:00 AM–2:00 PM','Victor H.',{v:'$20.40',c:'tc-wn'},'$16.40',{v:'+$4.00',c:'tc-wn'},'6h',{v:'$24.00',c:'tc-wn'}],
                  ['2:00 PM–5:00 PM','Naomi R.',{v:'$19.90',c:'tc-wn'},'$16.40',{v:'+$3.50',c:'tc-wn'},'8h',{v:'$28.00',c:'tc-wn'}],
                  ['5:00 PM–10:00 PM','Carlos D.',{v:'$20.90',c:'tc-wn'},'$16.40',{v:'+$4.50',c:'tc-wn'},'8h',{v:'$36.00',c:'tc-wn'}]]},
          { name:'Available Lower-Rate Same-Skill Employees',
            cols:['Shift','Alternative Employee','Rate','Skill Match','Availability','Potential Savings'],
            rows:[['6:00 AM–11:00 AM','Priya S.',{v:'$16.50',c:'tc-gd'},'✓ Full match','Available',{v:'$39.20',c:'tc-gd'}],
                  ['11:00 AM–2:00 PM','Malik J.',{v:'$15.90',c:'tc-gd'},'✓ Full match','Available',{v:'$27.00',c:'tc-gd'}],
                  ['2:00 PM–5:00 PM','Diane W.',{v:'$16.10',c:'tc-gd'},'✓ Full match','Available',{v:'$30.40',c:'tc-gd'}],
                  ['5:00 PM–10:00 PM','Reggie F.',{v:'$15.80',c:'tc-gd'},'✓ Full match','Available',{v:'$40.80',c:'tc-gd'}]]}
        ],
        fixRecs:['Swap these 4 shifts to the lower-rate, same-skill alternates listed above — saves ~$128/week.']},
      { key:'ot', n:3, sev:'wn', seg:'ot', icon:'alarm-clock', name:'2 of 3 overtime cases were avoidable — the third lines up with a sales spike', sub:'3 overtime cases this week — 2 avoidable (a call-out and an unbackfilled swap) and 1 manager-requested shift that lines up with a sales spike.', impact:'+$113 avoidable OT', impCls:'wn',
        insight:'<strong>2 of 3 overtime cases this week were avoidable</strong> — a call-out and an unbackfilled shift swap that could have gone to a lower-hours employee. The third (Ray O., Saturday dinner) was manager-requested on a day actual sales ran +9.1% above forecast — that additional labor appears demand-supported and isn\'t flagged as an issue.',
        subs:[
          { name:'Overtime Cases This Week',
            cols:['Date','Employee','Sched Hrs (Wk)','OT Hrs','Cause','OT Rate','OT $'],
            rows:[['08/06/2026','Derek M.','40h',{v:'3h',c:'tc-al'},'Covered a call-out','$22.00',{v:'$66.00',c:'tc-al'}],
                  ['08/07/2026','Angela F.','40h',{v:'2h',c:'tc-wn'},'Shift swap not backfilled','$23.50',{v:'$47.00',c:'tc-wn'}],
                  ['08/08/2026','Ray O.','40h',{v:'4h',c:'tc-gd'},'Manager-requested — Saturday dinner rush (sales +9.1%)','$24.00',{v:'$96.00 · justified',c:'tc-gd'}]]},
          { name:'Available Lower-Hours Staff (for the avoidable cases)',
            cols:['Employee','Sched Hrs (Wk)','Hrs Available','Regular Rate','Could Have Covered'],
            rows:[['Priya S.','30h','6h open','$16.50','Derek M.\'s 08/06 shift'],
                  ['Malik J.','31h','5h open','$15.90','Angela F.\'s 08/07 shift']]}
        ],
        fixRecs:['Reassign Derek M.\'s and Angela F.\'s flagged shifts to the available lower-hours employees above before the next schedule cycle — avoids $113 in avoidable OT. Ray O.\'s Saturday OT looks demand-supported; no action needed there.']},
      { key:'premium', n:4, sev:'al', seg:'premium', icon:'shield-alert', name:'2 shifts triggered mandatory break/meal premium pay this week', sub:'2 shifts triggered mandatory break/meal premium pay this week, adding $235 to actual labor cost.', impact:'+$235 · 2 violations', impCls:'al',
        insight:'Premium pay was triggered based on the available timekeeping data for 2 shifts this week. <strong>This is a compliance matter, not a scheduling-efficiency one</strong> — review the applicable labor rule with the shift managers involved before taking corrective action.',
        subs:[
          { name:'Premium Pay Detail',
            cols:['Employee','Date','Premium Type','Premium $','Reason / Trigger'],
            rows:[['Layla H.','08/05/2026','Missed 2nd rest break',{v:'$70.00',c:'tc-al'},'Break not taken within required window'],
                  ['Oscar N.','08/08/2026','Missed 30-min meal period',{v:'$165.00',c:'tc-al'},'Meal period started after the 5th hour']]}
        ],
        fixRecs:['Confirm the break/meal timing for Layla H. (08/05) and Oscar N. (08/08) with the shift managers involved; escalate if this is a repeat pattern.']},
      { key:'sales', n:5, sev:'info', seg:'sales', icon:'trending-down', name:'Actual sales missed forecast by 3.7%, and hours didn\'t scale down to match', sub:'Actual sales missed forecast by 3.7% this week, and hours didn\'t scale down to match on the softest days.', impact:'Est. +1.2 pts', impCls:'nm',
        insight:'<strong>Actual sales came in 3.7% below forecast this week ($71,850 vs $74,600), but actual hours didn\'t scale down to match.</strong> Sunday 08/09 is the clearest case — sales were 11.7% below forecast, yet actual hours ran 19 hours above the system\'s ideal labor requirement for that volume. Saturday 08/08 is the exception: sales ran +9.1% above forecast and hours tracked closely with the higher ideal requirement — the desired pattern.',
        factors:[
          { impact:'Est. +1.2 pts', label:'Sales missed forecast every day but Saturday', detail:'Actual labor $ held roughly flat while the sales denominator shrank, mechanically pushing Labor % up on the softer days.' }
        ],
        subs:[
          { name:'Daily Sales vs Ideal Hours',
            cols:['Date','Forecast Sales','Actual Sales','Variance','Actual Hrs','Ideal Hrs'],
            rows:[['08/03/2026','$10,200','$9,650',{v:'−5.4%',c:'tc-wn'},'131h','122h'],
                  ['08/04/2026','$10,000','$9,300',{v:'−7.0%',c:'tc-al'},'129h','118h'],
                  ['08/05/2026','$9,700','$9,150',{v:'−5.7%',c:'tc-wn'},'124h','115h'],
                  ['08/06/2026','$11,200','$10,680',{v:'−4.6%',c:'tc-wn'},'141h','132h'],
                  ['08/07/2026','$11,000','$10,750',{v:'−2.3%',c:'tc-nm'},'136h','131h'],
                  ['08/08/2026','$11,800','$12,870',{v:'+9.1%',c:'tc-gd'},'145h','148h'],
                  ['08/09/2026','$10,700','$9,450',{v:'−11.7%',c:'tc-al'},'128h','109h']]}
        ],
        fixRecs:['On low-volume days like Sunday 08/09 and Tuesday 08/04, review whether staff can be released earlier once the ideal-hours target is met — an estimated $95/week opportunity across the week\'s softest days.']},
    ],
    recs:['Review the 4 employees with repeated early/late punches and reinforce schedule adherence — estimated avoidable labor: $82/week.',
          'Swap the 4 high-rate shifts flagged below to the listed lower-rate, same-skill alternates — saves ~$128/week.',
          'Reassign Derek M.\'s and Angela F.\'s flagged shifts to the available lower-hours employees before the next schedule cycle — avoids $113 in avoidable OT.',
          'Confirm the break/meal timing for Layla H. (08/05) and Oscar N. (08/08) with the shift managers involved.',
          'On low-volume days like Sunday 08/09 and Tuesday 08/04, review whether staff can be released earlier once the ideal-hours target is met — an estimated $95/week opportunity.']
  },
  {
    id:'schedlabor', label:'Scheduled Labor % Overage', sbVal:'28.8%', sbVar:'▲ +1.0 pts', sev:'wn', sbTgt:'Target 27.8%',
    l1:{ eyebrow:'Scheduled Labor % · This Week\'s Schedule · 236 - Bressi Ranch', val:'28.8%', valCls:'wn',
      chip:'▲ +1.0 pts above forecast', chipCls:'wn', tgt:'',
      stats:[{lbl:'Total Scheduled $',val:'$17,650',note:'Forecast $17,000',cls:'nm'},
             {lbl:'Over Forecast',val:'+$650',note:'This week',cls:'wn'},
             {lbl:'Scheduled Hours',val:'532h',note:'Forecast 505h',cls:'wn'},
             {lbl:'OT Hours Scheduled',val:'7h',note:'3 shifts flagged',cls:'al'}]},
    segs:[
      {key:'overshed', lbl:'Overscheduled Hrs', pct:46, amt:'$300', ov:'+$300', ovCls:'al', col:'#1A3A6B'},
      {key:'highrate', lbl:'High-Rate Scheduling', pct:22, amt:'$140', ov:'+$140', ovCls:'wn', col:'#2E5FA3'},
      {key:'ot', lbl:'Avoidable OT', pct:24, amt:'$158', ov:'+$158', ovCls:'al', col:'#5680BC'},
      {key:'forecast', lbl:'Forecast Override', pct:8, amt:'$52', ov:'+$52', ovCls:'nm', col:'#8AA8CC'},
    ],
    ai:'Scheduled Labor % is running <strong>+1.0 pts above forecast</strong> this week — the factors driving it are listed below.',
    drivers:[
      { key:'overshed', n:1, sev:'al', seg:'overshed', icon:'calendar-clock', name:'Regular hours scheduled are running 20h above the system-forecasted baseline', sub:'Total scheduled regular hours are outpacing the system\'s forecasted hours for the week — shifts were added beyond what the demand forecast actually supports.', impact:'+$300 avoidable cost', impCls:'al',
        insight:'<strong>Scheduled regular hours are running 20 hours above the system-forecasted baseline for this week.</strong> Forecasted hours call for 505h; the posted schedule has 525h before any overtime is even counted — employees are overscheduled by roughly 4% against the forecast.',
        subs:[
          { name:'Scheduled vs Forecasted Hours by Day',
            cols:['Date','Forecasted Hrs','Scheduled Hrs','Variance'],
            rows:[['08/03/2026','72h','75h',{v:'+3h',c:'tc-wn'}],
                  ['08/04/2026','70h','73h',{v:'+3h',c:'tc-wn'}],
                  ['08/05/2026','68h','71h',{v:'+3h',c:'tc-wn'}],
                  ['08/06/2026','75h','80h',{v:'+5h',c:'tc-al'}],
                  ['08/07/2026','74h','77h',{v:'+3h',c:'tc-wn'}],
                  ['08/08/2026','78h','81h',{v:'+3h',c:'tc-wn'}],
                  ['08/09/2026','68h','68h',{v:'+0h',c:'tc-gd'}]]},
          { name:'Shifts Added Beyond Forecasted Demand',
            cols:['Date','Shift','Extra Staff Added','Reason Logged','Extra Hrs'],
            rows:[['08/06/2026','5:00 PM–10:00 PM','+1 extra closer','No stated reason on schedule note',{v:'5h',c:'tc-al'}],
                  ['08/03/2026','6:00 AM–11:00 AM','+1 extra opener','"Just in case" per manager note',{v:'3h',c:'tc-wn'}],
                  ['08/08/2026','11:00 AM–2:00 PM','+1 extra mid-shift','No stated reason on schedule note',{v:'3h',c:'tc-wn'}],
                  ['08/04/2026','2:00 PM–5:00 PM','+1 extra prep','No stated reason on schedule note',{v:'3h',c:'tc-wn'}]]}
        ],
        fixRecs:['Trim the flagged shifts back to forecasted headcount — start with Friday 08/06 evening (+5h) and Tuesday 08/04 (+3h) — saves ~$300/week without adding OT risk.']},
      { key:'highrate', n:2, sev:'wn', seg:'highrate', icon:'circle-dollar-sign', name:'High-payrate staff scheduled over available lower-rate, same-skill employees', sub:'4 shifts on this week\'s posted schedule assign employees well above the $15.30/hr store average, while equally-skilled lower-rate staff had open availability for the same shifts.', impact:'+$140 avoidable cost', impCls:'wn',
        insight:'<strong>4 shifts on the posted schedule assign employees well above the store\'s average pay rate.</strong> This isn\'t explained by a recent wage adjustment or performance review — these are simply higher-base-rate staff scheduled when same-skilled staff at lower rates were marked available for every one of these shifts.',
        subs:[
          { name:'High-Rate Employees Scheduled',
            cols:['Shift','Employee','Scheduled Rate','Store Avg','Premium/hr','Hrs','Excess $'],
            rows:[['6:00 AM–11:00 AM','Derek W.',{v:'$21.80',c:'tc-al'},'$15.30',{v:'+$6.50',c:'tc-al'},'8h',{v:'$52.00',c:'tc-al'}],
                  ['11:00 AM–2:00 PM','Nina F.',{v:'$19.30',c:'tc-wn'},'$15.30',{v:'+$4.00',c:'tc-wn'},'8h',{v:'$32.00',c:'tc-wn'}],
                  ['2:00 PM–5:00 PM','Marcus B.',{v:'$18.80',c:'tc-wn'},'$15.30',{v:'+$3.50',c:'tc-wn'},'8h',{v:'$28.00',c:'tc-wn'}],
                  ['5:00 PM–10:00 PM','Elena V.',{v:'$18.80',c:'tc-wn'},'$15.30',{v:'+$3.50',c:'tc-wn'},'8h',{v:'$28.00',c:'tc-wn'}]]},
          { name:'Available Lower-Rate Same-Skill Staff',
            cols:['Shift','Alternative Employee','Rate','Skill Match','Save/Shift'],
            rows:[['6:00 AM–11:00 AM','Jamie T.',{v:'$15.50',c:'tc-gd'},'✓ Full match',{v:'$50.40',c:'tc-gd'}],
                  ['11:00 AM–2:00 PM','Sam N.',{v:'$14.80',c:'tc-gd'},'✓ Full match',{v:'$36.00',c:'tc-gd'}],
                  ['2:00 PM–5:00 PM','Aisha K.',{v:'$15.20',c:'tc-gd'},'✓ Full match',{v:'$28.00',c:'tc-gd'}],
                  ['5:00 PM–10:00 PM','Ben H.',{v:'$15.00',c:'tc-gd'},'✓ Full match',{v:'$30.40',c:'tc-gd'}]]}
        ],
        fixRecs:['Swap these 4 shifts to the lower-rate, same-skill alternates before publishing the schedule — saves ~$140/week.']},
      { key:'ot', n:3, sev:'al', seg:'ot', icon:'alarm-clock', name:'Overtime scheduled from crew unavailability, not manager choice', sub:'3 shifts push employees into overtime because of a call-out or an unbackfilled shift swap — other staff with fewer scheduled hours had open availability to cover the same time.', impact:'+$158 avoidable OT', impCls:'al',
        insight:'<strong>3 scheduled shifts push employees past 40 hours into overtime.</strong> This excludes any overtime a manager directly and deliberately approved — these 3 are crew-side cases caused by a call-out or a shift swap that wasn\'t backfilled, while other staff sat under-scheduled with open availability for the exact same shift.',
        subs:[
          { name:'Overtime Scheduled by Shift',
            cols:['Date','Employee','Sched Hrs (Wk)','OT Hrs','Cause','OT Rate','OT $'],
            rows:[['08/06/2026','Josh P.','43h',{v:'3h',c:'tc-al'},'Covered a call-out','$22.00',{v:'$66.00',c:'tc-al'}],
                  ['08/07/2026','Sarah M.','42h',{v:'2h',c:'tc-wn'},'Shift swap not backfilled','$23.00',{v:'$46.00',c:'tc-wn'}],
                  ['08/08/2026','Dan W.','44h',{v:'2h',c:'tc-wn'},'Covered a call-out','$23.00',{v:'$46.00',c:'tc-wn'}]]},
          { name:'Available Lower-Hours Staff',
            cols:['Employee','Sched Hrs (Wk)','Hrs Available','Regular Rate','Could Have Covered'],
            rows:[['Priya K.','32h','6h open','$15.10','Josh P.\'s 08/06 shift'],
                  ['Sam N.','29h','4h open','$14.80','Sarah M.\'s 08/07 shift'],
                  ['Ben H.','30h','8h open','$15.00','Dan W.\'s 08/08 shift']]}
        ],
        fixRecs:['Reassign Josh P., Sarah M. and Dan W.\'s flagged overtime shifts to the lower-hours staff listed above before the schedule posts — removes $158 in avoidable OT.']},
      { key:'forecast', n:4, sev:'info', seg:'forecast', icon:'trending-up', name:'Manager sales-forecast overrides are adding a net $52 to scheduled labor', sub:'The forecast used to build this week\'s schedule was manually adjusted on 3 days — two upward, one downward — with a net effect of adding scheduled hours.', impact:'+$52 net addition', impCls:'nm',
        insight:'<strong>The sales forecast that drives scheduled hours was manually overridden on 3 days this week, each roughly 9–12% off the system baseline.</strong> The two upward overrides outweighed the one downward correction, adding a net $52 in scheduled labor beyond the system baseline.',
        subs:[
          { name:'Sales Forecast Override by Day',
            cols:['Date','System Forecast','Manager-Adjusted','Delta','Sched Hrs Added','$ Impact'],
            rows:[['08/04/2026','$7,500','$6,800',{v:'−$700',c:'tc-gd'},{v:'−2.0h',c:'tc-gd'},{v:'−$30',c:'tc-gd'}],
                  ['08/06/2026','$6,800','$7,600',{v:'+$800',c:'tc-wn'},{v:'+2.8h',c:'tc-wn'},{v:'+$40',c:'tc-wn'}],
                  ['08/09/2026','$9,400','$10,500',{v:'+$1,100',c:'tc-wn'},{v:'+3.0h',c:'tc-wn'},{v:'+$42',c:'tc-wn'}]]}
        ],
        fixRecs:['Review the 08/06 and 08/09 overrides (~12% above system baseline) against actual demand trend before next week\'s schedule posts.']},
    ],
    recs:['Trim the flagged shifts back to forecasted headcount — start with Friday 08/06 evening (+5h) and Tuesday 08/04 (+3h) — saves ~$300/week without adding OT risk.',
          'Swap the 4 high-rate shifts flagged below to the listed lower-rate, same-skill alternates before publishing the schedule — saves ~$140/week.',
          'Reassign the 3 flagged overtime shifts to the available lower-hours employees listed below — removes $158 in avoidable OT before the schedule posts.',
          'Review the manager\'s 08/06 and 08/09 forecast overrides against actual demand trend before next week\'s schedule is built.']
  },
  {
    id:'food', label:'Food Cost Overage', hidden:true, sbVal:'28.6%', sbVar:'▲ +1.8 pts', sev:'al', sbTgt:'Target 26.8%',
    l1:{ eyebrow:'Food Cost % · This Week · 236 - Bressi Ranch', val:'28.6%', valCls:'al',
      chip:'▲ +1.8 pts above forecast', chipCls:'al', tgt:'',
      stats:[{lbl:'Total Food Cost $',val:'$16,480',note:'Forecast $15,432',cls:'nm'},
             {lbl:'Over Forecast',val:'+$1,048',note:'This week',cls:'wn'},
             {lbl:'Estimated Waste',val:'$3,680',note:'This period',cls:'al'},
             {lbl:'Prep Windows Flagged',val:'3 Windows',note:'AM prep primarily',cls:'nm'}]},
    segs:[
      {lbl:'Protein Waste', pct:41, amt:'$1,456', ov:'+$1,010', ovCls:'al', col:'#1A3A6B'},
      {lbl:'Produce Waste', pct:22, amt:'$840',   ov:'+$392',   ovCls:'al', col:'#2E5FA3'},
      {lbl:'Portioning',    pct:15, amt:'$514',   ov:'+$214',   ovCls:'wn', col:'#5680BC'},
      {lbl:'Shrinkage',     pct:13, amt:'$468',   ov:'+$168',   ovCls:'wn', col:'#8AA8CC'},
      {lbl:'Vendor Var.',   pct:9,  amt:'$182',   ov:'+$82',    ovCls:'nm', col:'#BFCFDE'},
    ],
    ai:'Food Cost % is running <strong>+1.8 pts above forecast</strong> this week — the factors driving it are listed below.',
    drivers:[
      { key:'protein', n:1, sev:'al', name:'Over-thawing across 4 prep shifts is wasting $1,456 in chicken and beef', sub:'This accounts for 61% of the total overage — thaw quantities aren\'t aligned to demand during morning prep.', impact:'+$1,010 over budget', impCls:'al',
        insight:'<strong>Raw chicken and beef waste is the largest Food Cost driver.</strong> Over-thawing during morning prep is the root cause across 4 prep shifts this week. Reduce thaw quantities by 15–20% immediately.',
        subs:[
          { name:'Raw Chicken Waste by Day',
            cols:['Date','Thaw Qty (lbs)','Used (lbs)','Waste (lbs)','Waste $','Root Cause'],
            rows:[['08/03/2026','48 lbs','36 lbs',{v:'12 lbs',c:'tc-al'},{v:'$312',c:'tc-al'},'Over-thaw at AM prep'],
                  ['08/04/2026','42 lbs','33 lbs',{v:'9 lbs',c:'tc-al'},{v:'$234',c:'tc-al'},'Over-thaw at AM prep'],
                  ['08/05/2026','38 lbs','30 lbs',{v:'8 lbs',c:'tc-wn'},{v:'$208',c:'tc-wn'},'Forecast mismatch'],
                  ['08/06/2026','36 lbs','30 lbs',{v:'6 lbs',c:'tc-wn'},{v:'$156',c:'tc-wn'},'Over-thaw at AM prep']]},
          { name:'Beef Patty Waste by Day',
            cols:['Date','Par Level','Used','Wasted','Waste $','Fix'],
            rows:[['08/03/2026','120 units','94 units',{v:'26 units',c:'tc-al'},{v:'$182',c:'tc-al'},'Reduce par by 20%'],
                  ['08/04/2026','110 units','88 units',{v:'22 units',c:'tc-al'},{v:'$154',c:'tc-al'},'Reduce par by 15%'],
                  ['08/05/2026','100 units','82 units',{v:'18 units',c:'tc-wn'},{v:'$126',c:'tc-wn'},'Adjust par levels']]}
        ]},
      { key:'produce', n:2, sev:'wn', name:'Produce over-prep waste is rising for the 3rd consecutive day', sub:'$840 in waste so far, mainly lettuce, avocado and mixed greens — over-cutting during prep is the main cause.', impact:'+$392 over budget', impCls:'wn',
        insight:'<strong>Produce waste has increased 3 consecutive days.</strong> Over-prep (cutting too much for anticipated demand) and expiry-based waste are both contributing.',
        subs:[
          { name:'Over-Prep Waste by Item',
            cols:['Item','Prep Qty','Used Qty','Waste Qty','Waste $'],
            rows:[['Lettuce (heads)','48 heads','32 heads',{v:'16 heads',c:'tc-al'},{v:'$64',c:'tc-al'}],
                  ['Avocado (units)','60 units','42 units',{v:'18 units',c:'tc-al'},{v:'$90',c:'tc-al'}],
                  ['Tomatoes (lbs)','36 lbs','24 lbs',{v:'12 lbs',c:'tc-wn'},{v:'$48',c:'tc-wn'}],
                  ['Mixed greens','44 bags','30 bags',{v:'14 bags',c:'tc-wn'},{v:'$112',c:'tc-wn'}]]}
        ]},
      { key:'portioning', n:3, sev:'wn', name:'3 menu items portioned 12–18% above target weight at this location', sub:'$514 in excess cost across chicken, beef and cheese — a scale audit is needed.', impact:'+$214 over budget', impCls:'wn',
        insight:'<strong>Three items are consistently over-portioned across morning and afternoon shifts.</strong> Protein components show the largest gap — 12–18% above target weight.',
        subs:[
          { name:'Over-Portioned Items — Weight Variance',
            cols:['Item','Target Weight','Actual Avg','Variance %','Daily Excess $'],
            rows:[['Grilled chicken','4.0 oz (113g)',{v:'4.7 oz (133g)',c:'tc-al'},{v:'+17.5%',c:'tc-al'},{v:'$284',c:'tc-al'}],
                  ['Beef patty','4.0 oz (113g)',{v:'4.5 oz (128g)',c:'tc-al'},{v:'+12.5%',c:'tc-al'},{v:'$148',c:'tc-al'}],
                  ['Cheese (shredded)','0.75 oz (21g)',{v:'0.88 oz (25g)',c:'tc-wn'},{v:'+17.3%',c:'tc-wn'},{v:'$82',c:'tc-wn'}]]}
        ]},
      { key:'vendor', n:4, sev:'info', name:'3 vendor invoices exceed contracted price, adding $182 to food cost', sub:'Chicken, avocado and mixed greens were all invoiced above contract — alternate sourcing is available for 2 of the 3.', impact:'+$82 over budget', impCls:'nm',
        insight:'<strong>Three items were invoiced above contracted price.</strong> Total impact is $182. Raise with vendor purchasing team — two items have alternate sourcing available.',
        subs:[
          { name:'Invoice vs Contract Price',
            cols:['Item','Contract Price','Invoice Price','Variance/Unit','Units','Total Impact'],
            rows:[['Chicken breast (lb)','$2.84/lb',{v:'$3.12/lb',c:'tc-wn'},{v:'+$0.28',c:'tc-wn'},'240 lbs',{v:'+$67.20',c:'tc-wn'}],
                  ['Avocado (unit)','$0.62',{v:'$0.74',c:'tc-wn'},{v:'+$0.12',c:'tc-wn'},'480 units',{v:'+$57.60',c:'tc-wn'}],
                  ['Mixed greens (bag)','$4.20',{v:'$4.78',c:'tc-wn'},{v:'+$0.58',c:'tc-wn'},'98 bags',{v:'+$56.84',c:'tc-wn'}]]}
        ]},
    ],
    recs:['Reduce morning protein thaw quantities by 15–20% today.',
          'Cut produce prep quantities by 20%; implement hourly waste tracking during AM prep.',
          'Conduct a scale audit this week; schedule portioning retraining for the flagged prep shifts.',
          'Flag the 3 invoice discrepancies with purchasing team — escalate to vendor if unresolved by EOD.',
          'Review and correct demand forecast for Wednesday to prevent repeat overage on produce and protein.']
  },
];

const AHUB_IMPACT_DATA = {
  actuallabor: {
    charts: [
      { title: 'Actual Labor % Trend (7D)', values: [29.8, 30.0, 30.2, 30.4, 30.6, 30.7, 30.9], lastVal: '30.9%', cls: 'wn', col: '#f59e0b' },
      { title: 'Actual Hrs Above Schedule (7D)', values: [3, 6, 8, 14, 17, 22, 24], lastVal: '24h', cls: 'wn', col: '#f59e0b' },
    ],
    vs: [
      { lbl: 'Actual Labor %', val: '30.9%', chg: '▲ 1.4 pts', cls: 'wn' },
      { lbl: 'Hours Above Schedule $', val: '$408', chg: '▲ $408', cls: 'al' },
      { lbl: 'Avoidable OT $', val: '$113', chg: '▲ $113', cls: 'wn' },
    ]
  },
  schedlabor: {
    charts: [
      { title: 'Scheduled Labor % Trend (7D)', values: [27.6, 27.8, 28.0, 28.2, 28.4, 28.6, 28.8], lastVal: '28.8%', cls: 'wn', col: '#f59e0b' },
      { title: 'Overscheduled Hrs (7D)', values: [8, 10, 12, 15, 17, 18, 20], lastVal: '20h', cls: 'wn', col: '#f59e0b' },
    ],
    vs: [
      { lbl: 'Scheduled Labor %', val: '28.8%', chg: '▲ 1.0 pts', cls: 'wn' },
      { lbl: 'Overscheduled Hrs $', val: '$300', chg: '▲ $300', cls: 'al' },
      { lbl: 'Avoidable OT $', val: '$158', chg: '▲ $158', cls: 'al' },
    ]
  },
  food: {
    charts: [
      { title: 'Food Cost % (7D)', values: [26.4, 26.8, 27.2, 27.6, 28.0, 28.4, 28.6], lastVal: '28.6%', cls: 'wn', col: '#f59e0b' },
      { title: 'Waste $ (7D)', values: [0, 320, 680, 1040, 1480, 1840, 2140], lastVal: '$2,140', cls: 'al', col: '#ef4444' },
    ],
    vs: [
      { lbl: 'Food Cost %', val: '28.6%', chg: '▲ 1.8 pts', cls: 'wn' },
      { lbl: 'Protein Waste', val: '$1,456', chg: '▲ $840', cls: 'al' },
      { lbl: 'Produce Waste', val: '$328', chg: '▲ $180', cls: 'wn' },
    ]
  },
};
