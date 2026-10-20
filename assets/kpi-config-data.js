/* ============================================================
   KPI Configuration — master KPI list (Manage Account > My
   Organization > KPIs Configuration). Mirrors the source system's
   KPI table: each KPI has a data format, an internal key, a display
   name, a description and the functional module it belongs to. The
   KPI Family screen seeds its families from these modules.
   ============================================================ */
const KC_FMT_META = {
    DOLLAR: { icon:'dollar-sign', tint:'#dcfce7', color:'#15803d', label:'Dollar' },
    NUMBER: { icon:'hash',        tint:'#dbeafe', color:'#1d4ed8', label:'Number' },
    HOURS:  { icon:'clock',       tint:'#fef3c7', color:'#b45309', label:'Hours'  },
};

// [format, key, name, description, module]
const KC_RAW_KPIS = [
    ['DOLLAR','sales','Net Sales','Total net sales revenue after discounts and refunds.','Cash'],
    ['NUMBER','transCount','Transaction #','Total number of sales transactions recorded.','Cash'],
    ['HOURS','norHrs','Normal Hours','Regular, non-overtime hours worked by staff.','Labor'],
    ['HOURS','otHrs','OT Hours','Overtime hours worked beyond the standard shift length.','Labor'],
    ['DOLLAR','salesDollar','Net Sales (Register)','Net sales dollar value reported at the register level.','Cash'],
    ['NUMBER','laborPercentRpt','Labor %','Labor cost as a percentage of net sales.','Labor'],
    ['DOLLAR','ttlLabourDollars','Labor $','Total labor cost in dollars for the period.','Labor'],
    ['DOLLAR','fctSales','Forecasted Sales','Sales amount forecasted for the selected period.','Forecast'],
    ['HOURS','dtHrs','DT Hours','Hours worked at the drive-thru station.','Labor'],
    ['HOURS','ttlMnts','Schedule Hours','Total scheduled labor hours for the period.','Schedule'],
    ['HOURS','timeLossDollar','Time Loss','Labor hours lost to inefficiencies, tracked as a time value.','Labor'],
    ['NUMBER','actualUsagePer','Actual Usage %','Actual ingredient usage as a percentage of sales.','Inventory'],
    ['NUMBER','theoUsagePer','Ideal Usage %','Theoretical ideal usage percentage based on recipe costing.','Inventory'],
    ['NUMBER','variancePer','Variance %','Percentage variance between actual and ideal values.','Inventory'],
    ['DOLLAR','schDollar','Schedule Dollars','Total scheduled labor cost in dollars.','Schedule'],
    ['DOLLAR','fcdSales','Proj Sales','Projected sales amount for the period.','DAR'],
    ['NUMBER','fcdTransCount','ForeCasted Trans Count','Forecasted number of transactions expected.','DAR'],
    ['NUMBER','noOfMinorViolation','Minor Voilations','Count of labor law violations involving minor employees.','Labor'],
    ['NUMBER','idealStaff','Targeted SPLH Logic','Ideal staff count calculated from targeted Sales Per Labor Hour.','Forecast'],
    ['NUMBER','mgrSales','ML Demand Forecast','Machine-learning based sales demand forecast.','Forecast'],
    ['NUMBER','mgrTransCount','Predictive Count','Predicted transaction count from the demand forecasting model.','Forecast'],
    ['NUMBER','grossSales','Total POS Revenue','Total gross revenue recorded by the POS system.','Cash'],
    ['NUMBER','guestCount','SUM(Pax)','Total number of guests served.','Cash'],
    ['NUMBER','discounts','SUM(Discounts)','Total dollar value of discounts applied.','Cash'],
    ['NUMBER','totalComps','Total Comps','Total dollar value of complimentary (comped) items.','Cash'],
    ['NUMBER','refundAmount','SUM(Refunds)','Total dollar value of refunds issued to guests.','Cash'],
    ['NUMBER','totalVoids','Total Voids','Total dollar value of voided transactions.','Cash'],
    ['NUMBER','cshOverShort','Cash Over/Short','Cash drawer over or short amount at register close.','Cash'],
    ['NUMBER','otPay','OT Pay','Total overtime pay amount for the period.','Labor'],
    ['NUMBER','dtPay','DT Pay','Total double-time pay amount for the period.','Labor'],
    ['NUMBER','norPay','Regular Pay','Total regular (non-overtime) pay amount for the period.','Labor'],
    ['NUMBER','ccTips','Credit Card Tips','Total credit card tips collected.','Labor'],
    ['NUMBER','cashTips','Cash Tips','Total cash tips collected.','Labor'],
    ['HOURS','ttlLaborHrs','Labor Hours','Total actual labor hours worked.','DAR'],
    ['HOURS','actVsIdealHrs','Act vs Ideal','Variance between actual hours worked and ideal target hours.','DAR'],
    ['HOURS','idealHrs','Ideal Hours','Ideal labor hours based on the staffing model.','DAR'],
    ['HOURS','schHrs','Schedule Hours (DAR)','Total scheduled hours for the period.','DAR'],
    ['DOLLAR','actualVsFcdSalesDlr','Act/Proj Sales','Dollar variance between actual sales and projected sales.','DAR'],
    ['NUMBER','actualVsFcdTrans','Act/Frcst Sales','Variance between actual and forecasted transaction counts.','DAR'],
    ['NUMBER','theoCostValue','Recipe Build Cost * Sales','Theoretical food cost derived from recipe build cost and sales.','Inventory'],
    ['NUMBER','earlyClockIn','Early Clock-In','Instances where an employee clocked in earlier than scheduled.','Labor'],
    ['NUMBER','unApprovedShifts','Unapproved Shifts','Shifts worked without manager approval.','Labor'],
    ['NUMBER','lateClockOut','Late Clock Out','Instances where an employee clocked out later than scheduled.','Labor'],
    ['NUMBER','minorViolation','Minor Violation','Scheduling violations involving minor employees.','Labor'],
    ['NUMBER','brkViolation','Break Violation','Missed or non-compliant meal and rest breaks.','Labor'],
    ['NUMBER','missedPunches','Missed Punches','Missing clock in or clock out punches.','Labor'],
    ['NUMBER','manualEdits','Manual Edits','Manager edits made to employee time punches.','Labor'],
    ['NUMBER','otLossDollar','Overtime Loss','Dollar cost attributed to unplanned overtime.','Labor'],
    ['NUMBER','brkLoss','Break Loss','Dollar cost attributed to break violations.','Labor'],
    ['NUMBER','totalPunches','Total Punches','Total number of clock in and clock out punches recorded.','Labor'],
    ['NUMBER','lateNightWork','Late Night Work','Shifts worked during late-night hours.','Labor'],
    ['NUMBER','mealBrkHrs','Meal Break Hours','Total hours taken as meal breaks.','Labor'],
    ['NUMBER','timeLossPerc','Time Loss Percentage','Lost labor time as a percentage of scheduled hours.','Labor'],
    ['DOLLAR','idealDollar','Ideal Dollar','Ideal labor cost in dollars based on the staffing model.','Schedule'],
    ['NUMBER','idealPercentage','Ideal Percentage','Ideal labor cost as a percentage of sales.','Schedule'],
    ['NUMBER','avgTicketVar','Avg Ticket Var','Variance in average ticket size versus target.','Forecast'],
    ['NUMBER','promoLeakge','Promo Leakage','Revenue lost to unauthorized or excess promotions.','Forecast'],
    ['DOLLAR','forecastedDollar','Forecasted Dollar','Forecasted labor cost in dollars.','Forecast'],
    ['NUMBER','forecastedLaborPerc','Forecasted Labor Percentage','Forecasted labor cost as a percentage of forecasted sales.','Forecast'],
    ['NUMBER','schChanges','Schedule Changes','Number of changes made to a published schedule.','Schedule'],
    ['NUMBER','underStaffed','Under Staffed','Shifts or periods identified as understaffed.','Forecast'],
    ['NUMBER','overStaffed','Over Staffed','Shifts or periods identified as overstaffed.','Forecast'],
    ['NUMBER','latePublishing','Late Publishing','Schedules published after the required deadline.','Schedule'],
    ['HOURS','schedVsFcdHrs','Schedule Forecasted Variance','Hour variance between scheduled hours and forecasted hours.','DAR'],
    ['DOLLAR','schVsFrcstDlr','Schedule Forecasted Variance Dollar','Dollar variance between scheduled cost and forecasted cost.','DAR'],
    ['DOLLAR','schVsActDlr','Schedule Actual Variance Dollar','Dollar variance between scheduled cost and actual cost.','DAR'],
    ['DOLLAR','idealVsActDlr','Ideal Actual Variance Dollar','Dollar variance between ideal cost and actual cost.','DAR'],
    ['DOLLAR','schVsIdealDlr','Schedule Ideal Variance Dollar','Dollar variance between scheduled cost and ideal cost.','DAR'],
    ['NUMBER','schedVsFcdHrsPerc','Schedule Forecasted Percetage','Scheduled hours as a percentage of forecasted hours.','DAR'],
    ['NUMBER','schVsActHrsPrec','Schedule Actual Percentage','Scheduled hours as a percentage of actual hours worked.','DAR'],
    ['NUMBER','idealVsActualHrsPrec','Schedule Ideal Variance Percentage','Percentage variance between ideal hours and actual hours.','DAR'],
    ['NUMBER','schVsIdealHrsPrec','Schedule Ideal Percentage','Scheduled hours as a percentage of ideal hours.','DAR'],
    ['DOLLAR','splh','SPLH Dollar','Sales generated per scheduled labor hour.','Labor'],
    ['HOURS','ttlHrs','Total Hours','Total hours across all labor categories.','Labor'],
    ['HOURS','restBrkHrs','Rest Break Hours','Total hours taken as rest breaks.','Labor'],
    ['NUMBER','ttlPay','Total Pay','Total pay amount across all pay categories.','Labor'],
    ['NUMBER','ttlTips','Total Tips','Total tips collected, cash and credit combined.','Labor'],
    ['NUMBER','actVsIdealDlr','Actual Vs Ideal Dollar','Dollar variance between actual labor cost and ideal labor cost.','DAR'],
    ['NUMBER','actVsIdealDlrPerc','Actual Vs Ideal Percentage','Percentage variance between actual and ideal labor cost.','DAR'],
    ['HOURS','actVsSchHrs','Actual Vs Schedule Hours','Hour variance between actual hours worked and scheduled hours.','DAR'],
    ['DOLLAR','actVsSchDlr','Actual Vs Schedule Dollars','Dollar variance between actual labor cost and scheduled cost.','DAR'],
    ['NUMBER','actVsSchPerc','Actual Vs Schedule Percentage','Percentage variance between actual and scheduled labor hours.','DAR'],
    ['NUMBER','inventoryCost','Inventory Cost','Total dollar value of inventory on hand or consumed.','Inventory'],
    ['NUMBER','foodCostPerc','Food Cost Percentage','Food cost as a percentage of net sales.','DAR'],
    ['HOURS','schVsActHrs','Schedule vs Actual Hours','Hour variance between scheduled and actual hours worked.','DAR'],
    ['HOURS','schVsIdealHrs','Schedule vs Ideal Hours','Hour variance between scheduled hours and ideal hours.','DAR'],
    ['NUMBER','avgWeeklyPremium','Avg Weekly Premium','Average weekly premium pay per employee.','Labor'],
    ['NUMBER','restPremium','Rest Premium','Premium pay owed for missed or late rest breaks.','Labor'],
    ['NUMBER','laborGapRisk','Labor Gap Risk','Risk score indicating potential labor coverage gaps.','Labor'],
    ['NUMBER','timeGapViolCnt','Clopening Exposure','Employees scheduled with insufficient rest between closing and opening shifts.','Labor'],
    ['NUMBER','ttlViolation','Total Violation','Total count of all labor compliance violations.','Labor'],
    ['NUMBER','overStaffingCost','Over Staffed Cost','Dollar cost attributed to overstaffed shifts.','Labor'],
    ['NUMBER','actualOTPerc','Actual OT Percentage','Actual overtime hours as a percentage of total hours worked.','Labor'],
    ['NUMBER','timelossHrs','Timeloss Hour','Total hours lost to scheduling or attendance inefficiencies.','Labor'],
    ['NUMBER','lateClockOutCnt','Late Clock Out Count','Count of late clock-out instances.','Labor'],
    ['NUMBER','earlyClockInCnt','Early Clock-In Count','Count of early clock-in instances.','Labor'],
    ['NUMBER','activeMinorEmpCnt','Active Minor Employee','Number of active employees who are minors.','Labor'],
    ['NUMBER','ttlSchShift','Total Schedule shift','Total number of shifts scheduled.','Labor'],
    ['NUMBER','authorizedOtHrs','Authorized Ot Hours','Overtime hours pre-authorized by a manager.','Labor'],
    ['NUMBER','unauthorizedOtHrs','UnAuthorized Ot Hours','Overtime hours worked without prior authorization.','Labor'],
    ['NUMBER','daySchHrs','Scheduled Hours (Daily)','Scheduled hours for the selected day.','Labor'],
    ['NUMBER','totalWasteCost','Total Waste Cost','Total dollar cost of food and product waste.','Waste'],
    ['NUMBER','paidBrkViol','Paid Break Violation','Violations related to paid break requirements.','Labor'],
    ['NUMBER','unPaidBrkViol','Un-paid break violation','Violations related to unpaid break requirements.','Labor'],
    ['NUMBER','brkViolEmpCount','Employees with Break Violations','Number of employees with at least one break violation.','Labor'],
    ['NUMBER','totalFoodCost','Total Food Cost','Total actual food cost in dollars.','Inventory'],
    ['NUMBER','theoFoodCost','Thoe Food Cost','Theoretical food cost calculated from recipe costing.','Inventory'],
    ['NUMBER','earlyClockInHrs','Early Clock-In Hrs','Total hours accumulated from early clock-ins.','Labor'],
    ['NUMBER','lateClockOutHrs','Late Clock Out Hrs','Total hours accumulated from late clock-outs.','Labor'],
    ['NUMBER','schLbrPerc','Schedule Labor Percent','Scheduled labor cost as a percentage of forecasted sales.','Schedule'],
    ['NUMBER','postedActSales','Posted Actual Sales','Actual sales amount posted for the period.','Inventory'],
    ['NUMBER','fctStaff','Forecasted Hrs','Forecasted staffing hours needed for the period.','Forecast'],
    ['NUMBER','schPublishComp','Schedule Publish Compliance','Schedules published within the required timeframe.','Schedule'],
    ['NUMBER','minorOTViolation','Minor OT Violation','Overtime violations involving minor employees.','Labor'],
    ['NUMBER','unScheduledLabor','Un Scheduled Labor','Hours worked by employees without a matching schedule.','Labor'],
    ['NUMBER','schCompliance','Schedule Compliance','Shifts worked that matched the published schedule.','Labor'],
    ['NUMBER','minorBrkViolation','Minor Break Violation','Break violations involving minor employees.','Labor'],
    ['NUMBER','brkLossHrs','Break Loss Hrs','Total hours lost due to break violations.','Labor'],
    ['NUMBER','stockOutAlert','Stock Out Alert','Active stock-out alerts for menu items.','Inventory'],
    ['NUMBER','underStaffedHrs','Under Staffed Hrs','Total hours identified as understaffed.','Labor'],
    ['NUMBER','overStaffedHrs','Over Staffed Hrs','Total hours identified as overstaffed.','Labor'],
    ['NUMBER','schEfficiency','Schedule Efficiency','Overall efficiency score of the published schedule.','Labor'],
    ['NUMBER','activeEmployeeCount','Total Employee Count','Total number of currently active employees.','STR'],
    ['NUMBER','totalActiveMenuItem','Total Active Menu Item','Total number of menu items currently active for sale.','Inventory'],
    ['NUMBER','minorEmpShiftCnt','Minor Emp Shift Count','Number of shifts scheduled for minor employees.','Labor'],
    ['NUMBER','checklistCompletedPercent','Check List Completed %','Operational checklist tasks completed.','Checklist'],
    ['NUMBER','checklistFailedTemperature','Failed Temperature Task %','Temperature-check tasks that failed compliance.','Checklist'],
    ['DOLLAR','loyaltySales','Loyalty Sales','Total sales generated from loyalty program members.','Cash'],
    ['NUMBER','loyaltyTransCount','Loyalty Transactions','Number of transactions made using the loyalty program.','Cash'],
    ['DOLLAR','loyaltySalesWithDisc','Sales with Offer','Sales amount that included a loyalty offer or discount.','Cash'],
    ['DOLLAR','loyaltyDisc','Redemptions Amount','Total dollar value of loyalty rewards redeemed.','Cash'],
    ['NUMBER','loyaltyWithDiscTransCount','Redemptions Count','Number of transactions with a loyalty reward redemption.','Cash'],
    ['NUMBER','noOfOTViolation','OT Incidents','Number of overtime policy violation incidents.','Labor'],
];

// module display order (mirrors the source system's module sequence)
const KC_MODULES = ['Cash', 'Labor', 'Forecast', 'Schedule', 'Inventory', 'DAR', 'STR', 'Waste', 'Checklist'];

// KPIs enabled for mobile out of the box
const KC_ENABLED_DEFAULT = new Set(['sales','transCount','laborPercentRpt','ttlLabourDollars','fctSales','ttlMnts','otHrs','splh','schDollar','ttlLaborHrs']);

// default Supporting KPI 1 / Supporting KPI 2 pairs for variance-style KPIs
const KC_DEFAULT_SUPPORT = {
    laborPercentRpt:       ['ttlLabourDollars', 'sales'],
    actVsIdealHrs:         ['ttlLaborHrs', 'idealHrs'],
    actualVsFcdSalesDlr:   ['sales', 'fctSales'],
    actualVsFcdTrans:      ['transCount', 'fcdTransCount'],
    schedVsFcdHrs:         ['ttlMnts', 'fctStaff'],
    schVsFrcstDlr:         ['schDollar', 'forecastedDollar'],
    schVsActDlr:           ['schDollar', 'ttlLabourDollars'],
    idealVsActDlr:         ['idealDollar', 'ttlLabourDollars'],
    schVsIdealDlr:         ['schDollar', 'idealDollar'],
    schedVsFcdHrsPerc:     ['schLbrPerc', 'forecastedLaborPerc'],
    schVsActHrsPrec:       ['schLbrPerc', 'laborPercentRpt'],
    idealVsActualHrsPrec:  ['idealPercentage', 'laborPercentRpt'],
    schVsIdealHrsPrec:     ['schLbrPerc', 'idealPercentage'],
    actVsIdealDlr:         ['ttlLabourDollars', 'idealDollar'],
    actVsIdealDlrPerc:     ['laborPercentRpt', 'idealPercentage'],
    actVsSchHrs:           ['ttlLaborHrs', 'ttlMnts'],
    actVsSchDlr:           ['ttlLabourDollars', 'schDollar'],
    actVsSchPerc:          ['laborPercentRpt', 'schLbrPerc'],
    schVsActHrs:           ['ttlMnts', 'ttlLaborHrs'],
    schVsIdealHrs:         ['ttlMnts', 'idealHrs'],
    variancePer:           ['actualUsagePer', 'theoUsagePer'],
};

const KC_DEFAULT_KPIS = (function(){
    const seen = {};
    return KC_RAW_KPIS.map(function(r){
        const fmt = r[0], key = r[1], name = r[2], desc = r[3], module = r[4];
        seen[key] = (seen[key] || 0) + 1;
        const id = seen[key] > 1 ? key + '_' + seen[key] : key;
        const sup = KC_DEFAULT_SUPPORT[id] || ['', ''];
        return { id: id, key: key, name: name, fmt: fmt, desc: desc, module: module, enabled: KC_ENABLED_DEFAULT.has(id), support1: sup[0], support2: sup[1] };
    });
})();

const KC_STORAGE_KEY = 'aidash_kpi_config_v1';

// saved order/name/enabled/module/support, merged over the defaults
function loadKpiConfig(){
    try{
        const raw = localStorage.getItem(KC_STORAGE_KEY);
        if(!raw) return KC_DEFAULT_KPIS.map(k => ({...k}));
        const saved = JSON.parse(raw);
        const out = [];
        saved.forEach(s => {
            const def = KC_DEFAULT_KPIS.find(d => d.id === s.id);
            if(def) out.push({ ...def, name: s.name || def.name, enabled: !!s.enabled,
                module: s.module || def.module,
                support1: s.support1 !== undefined ? s.support1 : def.support1,
                support2: s.support2 !== undefined ? s.support2 : def.support2 });
        });
        KC_DEFAULT_KPIS.forEach(d => { if(!out.some(k => k.id === d.id)) out.push({...d}); });
        return out;
    }catch(e){ return KC_DEFAULT_KPIS.map(k => ({...k})); }
}
function saveKpiConfig(list){
    try{ localStorage.setItem(KC_STORAGE_KEY, JSON.stringify(list.map(k => ({ id:k.id, name:k.name, enabled:k.enabled, module:k.module, support1:k.support1, support2:k.support2 })))); }catch(e){}
}
function resetKpiConfig(){ try{ localStorage.removeItem(KC_STORAGE_KEY); }catch(e){} }
