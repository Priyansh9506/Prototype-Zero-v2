// Sample data and utility functions for SmartContainer Risk Engine
export const SAMPLE_DATA = [
  { Container_ID: 'CNTR-90421', Risk_Score: 0.91, Risk_Level: 'Critical', Anomaly_Flag: 1, Declared_Value: 2450000, Declared_Weight: 800, Measured_Weight: 1520, Dwell_Time_Hours: 156, Origin_Country: 'GT', Destination_Country: 'US', HS_Code: 847130, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-06-12', Declaration_Time: '02:15:00', Explanation_Summary: '⚠ Critical (score=0.910) | Drivers: elevated absolute weight discrepancy (%), elevated dwell time (hours), elevated value per kg. Weight Δ=90.0%, value/kg=3062.50. Isolation Forest flagged as statistical anomaly.' },
  { Container_ID: 'CNTR-18237', Risk_Score: 0.78, Risk_Level: 'Critical', Anomaly_Flag: 1, Declared_Value: 0, Declared_Weight: 450, Measured_Weight: 712, Dwell_Time_Hours: 134, Origin_Country: 'QA', Destination_Country: 'DE', HS_Code: 711311, Trade_Regime: 'Transit', Shipping_Line: 'LINE_MODE_10', Declaration_Date: '2021-06-11', Declaration_Time: '23:48:00', Explanation_Summary: '⚠ Critical (score=0.780) | Drivers: elevated zero value declared, elevated weight discrepancy (%), elevated off-hours declaration. Weight Δ=58.2%, value/kg=0.00. Isolation Forest flagged as statistical anomaly.' },
  { Container_ID: 'CNTR-55102', Risk_Score: 0.42, Risk_Level: 'Medium Risk', Anomaly_Flag: 1, Declared_Value: 89500, Declared_Weight: 3200, Measured_Weight: 4160, Dwell_Time_Hours: 98, Origin_Country: 'CD', Destination_Country: 'FR', HS_Code: 440890, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-06-10', Declaration_Time: '04:22:00', Explanation_Summary: '⚡ Medium Risk (score=0.420) | Drivers: elevated weight discrepancy (%), elevated off-hours declaration, elevated dwell time (hours). Weight Δ=30.0%, value/kg=27.97.' },
  { Container_ID: 'CNTR-33781', Risk_Score: 0.38, Risk_Level: 'Medium Risk', Anomaly_Flag: 0, Declared_Value: 1250000, Declared_Weight: 150, Measured_Weight: 189, Dwell_Time_Hours: 112, Origin_Country: 'SA', Destination_Country: 'GB', HS_Code: 710239, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_10', Declaration_Date: '2021-06-09', Declaration_Time: '14:30:00', Explanation_Summary: '⚡ Medium Risk (score=0.380) | Drivers: elevated value per kg, elevated weight discrepancy (%), elevated dwell time (hours). Weight Δ=26.0%, value/kg=8333.33.' },
  { Container_ID: 'CNTR-67294', Risk_Score: 0.34, Risk_Level: 'Medium Risk', Anomaly_Flag: 0, Declared_Value: 45000, Declared_Weight: 5800, Measured_Weight: 7250, Dwell_Time_Hours: 88, Origin_Country: 'UA', Destination_Country: 'IT', HS_Code: 720839, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-06-13', Declaration_Time: '21:15:00', Explanation_Summary: '⚡ Medium Risk (score=0.340) | Drivers: elevated weight discrepancy (%), elevated off-hours declaration, low origin country trade frequency. Weight Δ=25.0%, value/kg=7.76.' },
  { Container_ID: 'CNTR-02914', Risk_Score: 0.12, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 9672, Declared_Weight: 95, Measured_Weight: 96.2, Dwell_Time_Hours: 38, Origin_Country: 'CN', Destination_Country: 'NL', HS_Code: 620822, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_10', Declaration_Date: '2021-06-08', Declaration_Time: '09:15:00', Explanation_Summary: '✓ Low Risk (score=0.120) | Drivers: low weight discrepancy (%), low dwell time (hours), low value per kg. Weight Δ=1.3%, value/kg=101.81.' },
  { Container_ID: 'CNTR-41028', Risk_Score: 0.08, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 375751, Declared_Weight: 11352, Measured_Weight: 11541, Dwell_Time_Hours: 52, Origin_Country: 'CN', Destination_Country: 'CA', HS_Code: 690722, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-06-07', Declaration_Time: '10:43:00', Explanation_Summary: '✓ Low Risk (score=0.080) | Drivers: low weight discrepancy (%), low dwell time (hours), low origin country trade frequency. Weight Δ=1.7%, value/kg=33.10.' },
  { Container_ID: 'CNTR-76532', Risk_Score: 0.06, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 5353, Declared_Weight: 20.7, Measured_Weight: 20.4, Dwell_Time_Hours: 31, Origin_Country: 'VN', Destination_Country: 'BA', HS_Code: 620822, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-06-06', Declaration_Time: '06:15:00', Explanation_Summary: '✓ Low Risk (score=0.060) | Drivers: low weight discrepancy (%), low dwell time (hours), low value per kg. Weight Δ=-1.4%, value/kg=258.60.' },
  { Container_ID: 'CNTR-89103', Risk_Score: 0.05, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 1477645, Declared_Weight: 9218, Measured_Weight: 8814, Dwell_Time_Hours: 12, Origin_Country: 'VN', Destination_Country: 'MN', HS_Code: 940350, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-06-05', Declaration_Time: '04:04:00', Explanation_Summary: '✓ Low Risk (score=0.050) | Drivers: low dwell time (hours), low value per kg, low weight discrepancy (%). Weight Δ=-4.4%, value/kg=160.30.' },
  { Container_ID: 'CNTR-14520', Risk_Score: 0.04, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 6364800, Declared_Weight: 24000, Measured_Weight: 24880, Dwell_Time_Hours: 71, Origin_Country: 'VN', Destination_Country: 'LV', HS_Code: 71080, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_10', Declaration_Date: '2021-06-04', Declaration_Time: '03:36:00', Explanation_Summary: '✓ Low Risk (score=0.040) | Drivers: low weight discrepancy (%), low dwell time (hours), low origin country trade frequency. Weight Δ=3.7%, value/kg=265.20.' },
  { Container_ID: 'CNTR-22847', Risk_Score: 0.03, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 1248, Declared_Weight: 1.0, Measured_Weight: 1.04, Dwell_Time_Hours: 68, Origin_Country: 'RO', Destination_Country: 'UZ', HS_Code: 420231, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-06-03', Declaration_Time: '04:38:00', Explanation_Summary: '✓ Low Risk (score=0.030) | Drivers: low weight discrepancy (%), low dwell time (hours), low value per kg. Weight Δ=4.0%, value/kg=1248.00.' },
  { Container_ID: 'CNTR-50913', Risk_Score: 0.02, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 1365, Declared_Weight: 4.7, Measured_Weight: 4.92, Dwell_Time_Hours: 11, Origin_Country: 'TH', Destination_Country: 'FI', HS_Code: 711311, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_10', Declaration_Date: '2021-06-02', Declaration_Time: '22:33:00', Explanation_Summary: '✓ Low Risk (score=0.020) | Drivers: low dwell time (hours), low weight discrepancy (%), low declared value. Weight Δ=4.7%, value/kg=290.43.' },
  { Container_ID: 'CNTR-63781', Risk_Score: 0.02, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 1105800, Declared_Weight: 19000, Measured_Weight: 19308, Dwell_Time_Hours: 57, Origin_Country: 'CN', Destination_Country: 'NO', HS_Code: 390690, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_10', Declaration_Date: '2021-06-01', Declaration_Time: '12:39:00', Explanation_Summary: '✓ Low Risk (score=0.020) | Drivers: low weight discrepancy (%), low dwell time (hours), low value per kg. Weight Δ=1.6%, value/kg=58.20.' },
  { Container_ID: 'CNTR-84290', Risk_Score: 0.01, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 165, Declared_Weight: 275, Measured_Weight: 288, Dwell_Time_Hours: 6, Origin_Country: 'CN', Destination_Country: 'FI', HS_Code: 392690, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-05-31', Declaration_Time: '08:37:00', Explanation_Summary: '✓ Low Risk (score=0.010) | Drivers: low dwell time (hours), low declared value, low weight discrepancy (%). Weight Δ=4.7%, value/kg=0.60.' },
  { Container_ID: 'CNTR-95401', Risk_Score: 0.01, Risk_Level: 'Low Risk', Anomaly_Flag: 0, Declared_Value: 113938, Declared_Weight: 42, Measured_Weight: 40.6, Dwell_Time_Hours: 18, Origin_Country: 'CN', Destination_Country: 'AM', HS_Code: 871390, Trade_Regime: 'Import', Shipping_Line: 'LINE_MODE_40', Declaration_Date: '2021-05-30', Declaration_Time: '21:07:00', Explanation_Summary: '✓ Low Risk (score=0.010) | Drivers: low dwell time (hours), low weight discrepancy (%), low origin country trade frequency. Weight Δ=-3.3%, value/kg=2712.81.' },
];

export function computeMockRisk(row) {
  const dw = parseFloat(row.Declared_Weight) || 0;
  const mw = parseFloat(row.Measured_Weight) || 0;
  const dv = parseFloat(row.Declared_Value) || 0;
  const dt = parseFloat(row.Dwell_Time_Hours) || 0;

  const discPct = dw > 0 ? Math.abs((mw - dw) / dw) * 100 : 0;
  const vpk = dw > 0 ? dv / dw : 0;

  let score = 0;
  const reasons = [];
  if (discPct > 30) { score += 0.35; reasons.push(`elevated absolute weight discrepancy (${discPct.toFixed(1)}%)`); }
  else if (discPct > 15) { score += 0.15; reasons.push(`moderate weight discrepancy (${discPct.toFixed(1)}%)`); }
  if (dv === 0) { score += 0.2; reasons.push('elevated zero value declared'); }
  if (dt > 120) { score += 0.2; reasons.push(`elevated dwell time (${dt}h)`); }
  else if (dt > 80) { score += 0.1; reasons.push(`moderate dwell time (${dt}h)`); }
  if (vpk > 5000) { score += 0.15; reasons.push('elevated value per kg'); }
  const hr = parseInt((row.Declaration_Time || '12:00').split(':')[0]);
  if (hr < 6 || hr > 20) { score += 0.08; reasons.push('off-hours declaration'); }

  score += (Math.random() - 0.5) * 0.08;
  score = Math.max(0.005, Math.min(0.99, score));
  const level = score >= 0.5 ? 'Critical' : score >= 0.25 ? 'Medium Risk' : 'Low Risk';
  const anomaly = score > 0.6 || (discPct > 40 && Math.random() > 0.5) ? 1 : 0;
  const icons = { Critical: '⚠', 'Medium Risk': '⚡', 'Low Risk': '✓' };
  const reasonText = reasons.length ? reasons.slice(0, 3).join(', ') : 'normal trade pattern';
  const explanation = `${icons[level]} ${level} (score=${score.toFixed(3)}) | Drivers: ${reasonText}. Weight Δ=${discPct.toFixed(1)}%, value/kg=${vpk.toFixed(2)}.${anomaly ? ' Isolation Forest flagged as statistical anomaly.' : ''}`;

  return { ...row, Risk_Score: parseFloat(score.toFixed(4)), Risk_Level: level, Anomaly_Flag: anomaly, Explanation_Summary: explanation };
}

export function getRiskColor(level) {
  if (level === 'Critical') return '#C62828';
  if (level === 'Medium Risk') return '#E65100';
  return '#2E7D32';
}

export function getRiskGlow(level) {
  if (level === 'Critical') return 'rgba(198,40,40,0.06)';
  if (level === 'Medium Risk') return 'rgba(230,81,0,0.06)';
  return 'rgba(46,125,50,0.06)';
}

