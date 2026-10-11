import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  Activity, Cpu, HardDrive, Zap, AlertTriangle, Database, Clock, DollarSign, Leaf, TrendingUp, Bell
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  
  // Live State
  const [liveMetrics, setLiveMetrics] = useState({
    cpu_percent: 0,
    memory_percent: 0,
    power_watts: 0,
    energy_joules_total: 0,
    energy_kwh_total: 0,
    alert: { triggered: false, threshold_watts: 50, message: "Normal operation" }
  });
  const [topProcesses, setTopProcesses] = useState([]);
  const [liveChartData, setLiveChartData] = useState([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [alertLogs, setAlertLogs] = useState([]);
  const [thresholdInput, setThresholdInput] = useState(50);

  // History State
  const [timeRange, setTimeRange] = useState(60);
  const [tariffRate, setTariffRate] = useState(0.15);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyStats, setHistoryStats] = useState({
    avg_power_watts: 0,
    peak_power_watts: 0,
    estimated_kwh: 0,
    estimated_cost_usd: 0,
    estimated_co2_grams: 0,
    sample_count: 0
  });

  // Poll Live Data every 1 second
  useEffect(() => {
    const fetchLiveSummary = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/summary`);
        if (!res.ok) throw new Error("API Offline");
        const data = await res.json();

        setLiveMetrics(data.system);
        setTopProcesses(data.top_processes || []);
        setIsLiveConnected(true);

        // Check for alert trigger to log into alert history
        if (data.system.alert && data.system.alert.triggered) {
          const timestamp = new Date(data.system.timestamp * 1000).toLocaleTimeString();
          setAlertLogs(prev => [
            { id: Date.now(), time: timestamp, watts: data.system.power_watts, msg: data.system.alert.message },
            ...prev.slice(0, 9) // Keep last 10 alerts
          ]);
        }

        const timeLabel = new Date(data.system.timestamp * 1000).toLocaleTimeString();
        setLiveChartData(prev => [
          ...prev.slice(-19),
          { time: timeLabel, power: data.system.power_watts, cpu: data.system.cpu_percent }
        ]);
      } catch (err) {
        setIsLiveConnected(false);
      }
    };

    fetchLiveSummary();
    const interval = setInterval(fetchLiveSummary, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateThreshold = async () => {
    try {
      await fetch(`${API_BASE}/api/alerts/threshold?threshold=${thresholdInput}`);
    } catch (err) {
      console.error("Failed to update alert threshold", err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', padding: '24px' }}>
      
      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap style={{ color: '#38bdf8' }} /> Energy Consumption Analyzer
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Real-Time Hardware & Software Energy Profiling System
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('live')}
              style={{ backgroundColor: activeTab === 'live' ? '#0284c7' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Live Monitor
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{ backgroundColor: activeTab === 'history' ? '#0284c7' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Historical Trends
            </button>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
            backgroundColor: isLiveConnected ? '#064e3b' : '#7f1d1d',
            color: isLiveConnected ? '#34d399' : '#f87171',
            padding: '6px 12px', borderRadius: '20px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLiveConnected ? '#34d399' : '#f87171' }}></span>
            {isLiveConnected ? 'API Connected' : 'Backend Disconnected'}
          </div>
        </div>
      </header>

      {/* HIGH-POWER ALERT BANNER */}
      {liveMetrics.alert?.triggered && (
        <div style={{
          backgroundColor: '#991b1b', border: '1px solid #f87171', color: '#fef2f2',
          padding: '14px 20px', borderRadius: '12px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'pulse 1.5s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#fca5a5" />
            <div>
              <strong style={{ fontSize: '16px' }}>High Power Draw Threshold Exceeded!</strong>
              <div style={{ fontSize: '14px', color: '#fecaca' }}>{liveMetrics.alert.message}</div>
            </div>
          </div>
          <span style={{ backgroundColor: '#7f1d1d', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>
            {liveMetrics.power_watts} W
          </span>
        </div>
      )}

      {/* LIVE MONITOR TAB */}
      {activeTab === 'live' && (
        <div>
          {/* Threshold Config Row */}
          <div style={{ backgroundColor: '#1e293b', padding: '12px 20px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px' }}>
              <Bell size={18} color="#f59e0b" />
              <span>Alert Threshold Settings:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(parseFloat(e.target.value) || 50)}
                style={{ width: '80px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '14px' }}
              />
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Watts</span>
              <button
                onClick={handleUpdateThreshold}
                style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Set Threshold
              </button>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: liveMetrics.alert?.triggered ? '1px solid #ef4444' : '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
                <span>Power Draw</span>
                <Zap size={18} color={liveMetrics.alert?.triggered ? "#ef4444" : "#38bdf8"} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0', color: liveMetrics.alert?.triggered ? "#ef4444" : "#38bdf8" }}>
                {liveMetrics.power_watts} <span style={{ fontSize: '16px' }}>W</span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Limit: {liveMetrics.alert?.threshold_watts || 50} W</span>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
                <span>Total Energy Used</span>
                <Activity size={18} color="#a855f7" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0', color: '#a855f7' }}>
                {liveMetrics.energy_kwh_total} <span style={{ fontSize: '16px' }}>kWh</span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{liveMetrics.energy_joules_total} Joules</span>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
                <span>CPU Load</span>
                <Cpu size={18} color="#f59e0b" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0', color: '#f59e0b' }}>
                {liveMetrics.cpu_percent} <span style={{ fontSize: '16px' }}>%</span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Processor Utilization</span>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
                <span>Memory Load</span>
                <HardDrive size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0', color: '#10b981' }}>
                {liveMetrics.memory_percent} <span style={{ fontSize: '16px' }}>%</span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>RAM Utilization</span>
            </div>
          </div>

          {/* Real-Time Power Draw Chart */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#38bdf8" /> Real-Time Power Draw (Watts)
            </h2>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveChartData}>
                  <defs>
                    <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={liveMetrics.alert?.triggered ? "#ef4444" : "#38bdf8"} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={liveMetrics.alert?.triggered ? "#ef4444" : "#38bdf8"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 'dataMax + 10']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                  <Area type="monotone" dataKey="power" stroke={liveMetrics.alert?.triggered ? "#ef4444" : "#38bdf8"} strokeWidth={2} fillOpacity={1} fill="url(#powerGrad)" name="Power (W)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Processes Table & Recent Alert History */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>Top Power-Consuming Processes</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '14px' }}>
                    <th style={{ padding: '10px' }}>PID</th>
                    <th style={{ padding: '10px' }}>Process Name</th>
                    <th style={{ padding: '10px' }}>CPU Usage</th>
                    <th style={{ padding: '10px' }}>Est. Power</th>
                  </tr>
                </thead>
                <tbody>
                  {topProcesses.map((proc) => (
                    <tr key={proc.pid} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px', color: '#64748b' }}>{proc.pid}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{proc.name}</td>
                      <td style={{ padding: '10px', color: '#f59e0b' }}>{proc.cpu_percent}%</td>
                      <td style={{ padding: '10px', color: '#38bdf8', fontWeight: 'bold' }}>{proc.estimated_power_watts} W</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Alert Event Log */}
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="#f87171" /> Alert Log History
              </h2>
              {alertLogs.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '14px', paddingTop: '20px' }}>No power threshold breaches logged yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                  {alertLogs.map(log => (
                    <div key={log.id} style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{log.time}</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fca5a5' }}>{log.watts} W Exceeded Threshold</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}