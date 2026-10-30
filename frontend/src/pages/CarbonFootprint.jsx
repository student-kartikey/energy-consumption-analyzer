import React from 'react';
import { Leaf, DollarSign } from 'lucide-react';

export default function CarbonFootprint({ historyStats, tariffRate }) {
  return (
    <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Leaf color="#34d399" /> Sustainability & Energy Cost Reports
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
        Financial and environmental translation of raw electrical consumption metrics.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} color="#10b981" /> Total Projected Cost
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '8px' }}>
            ${historyStats.estimated_cost_usd}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Based on active tariff rate: ${tariffRate}/kWh
          </div>
        </div>

        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Leaf size={16} color="#34d399" /> Total Carbon Output
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#34d399', marginTop: '8px' }}>
            {historyStats.estimated_co2_grams} grams CO₂
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Estimated grid emission conversion factor
          </div>
        </div>
      </div>
    </div>
  );
}