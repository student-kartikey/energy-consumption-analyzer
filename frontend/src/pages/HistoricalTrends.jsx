import React, { useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, DollarSign, Download, Zap, Activity, Leaf, Database } from 'lucide-react';

export default function HistoricalTrends({
  apiBase,
  timeRange,
  setTimeRange,
  tariffRate,
  setTariffRate,
  historyLogs,
  setHistoryLogs,
  historyStats,
  setHistoryStats,
  handleExportCSV
}) {
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const logsRes = await fetch(`${apiBase}/api/history/logs?minutes=${timeRange}`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          const formattedLogs = logsData.map(log => ({
            ...log,
            timeLabel: new Date(log.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }));
          setHistoryLogs(formattedLogs);
        }

        const statsRes = await fetch(`${apiBase}/api/history/stats?minutes=${timeRange}&tariff_rate=${tariffRate}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setHistoryStats(statsData);
        }
      } catch (err) {
        console.error("Failed to fetch historical analytics", err);
      }
    };

    fetchHistory();
  }, [apiBase, timeRange, tariffRate, setHistoryLogs, setHistoryStats]);

  return (
    <div>
      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#94a3b8" />
          <span style={{ fontSize: '14px', color: '#94a3b8', marginRight: '8px' }}>Time Frame:</span>
          {[
            { label: '10 Minutes', value: 10 },
            { label: '1 Hour', value: 60 },
            { label: '24 Hours', value: 1440 }
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setTimeRange(item.value)}
              style={{
                backgroundColor: timeRange === item.value ? '#0284c7' : '#0f172a',
                color: '#fff', border: '1px solid #334155', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="#10b981" />
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>Tariff Rate ($/kWh):</span>
            <input
              type="number"
              step="0.01"
              value={tariffRate}
              onChange={(e) => setTariffRate(parseFloat(e.target.value) || 0.15)}
              style={{ width: '70px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#059669', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
              fontWeight: '600', fontSize: '13px'
            }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Aggregate Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
            <span>Avg Power Draw</span>
            <Zap size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '8px 0', color: '#38bdf8' }}>
            {historyStats.avg_power_watts} <span style={{ fontSize: '14px' }}>W</span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Peak: {historyStats.peak_power_watts} W</span>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
            <span>Est. Energy Used</span>
            <Activity size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '8px 0', color: '#a855f7' }}>
            {historyStats.estimated_kwh} <span style={{ fontSize: '14px' }}>kWh</span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Over {timeRange} mins</span>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
            <span>Estimated Cost</span>
            <DollarSign size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '8px 0', color: '#10b981' }}>
            ${historyStats.estimated_cost_usd}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>At ${tariffRate}/kWh</span>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
            <span>CO2 Footprint</span>
            <Leaf size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '8px 0', color: '#34d399' }}>
            {historyStats.estimated_co2_grams} <span style={{ fontSize: '14px' }}>g</span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Carbon Emissions</span>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
            <span>Data Samples</span>
            <Database size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '8px 0', color: '#f59e0b' }}>
            {historyStats.sample_count}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Recorded Logs</span>
        </div>
      </div>

      {/* Historical Area Chart */}
      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="#a855f7" /> Historical Power Load (Watts)
        </h2>
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyLogs}>
              <defs>
                <linearGradient id="histPowerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="timeLabel" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[0, 'dataMax + 10']} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
              <Area type="monotone" dataKey="power_watts" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#histPowerGrad)" name="Power (W)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}