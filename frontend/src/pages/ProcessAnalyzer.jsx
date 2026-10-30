import React, { useState } from 'react';
import { Cpu, Search, AlertTriangle, ShieldAlert, CheckCircle, X } from 'lucide-react';

export default function ProcessAnalyzer({ topProcesses = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [terminatedPids, setTerminatedPids] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, proc: null });
  const [notification, setNotification] = useState(null);

  // Categorize process by estimated power draw
  const getPowerTier = (watts) => {
    if (watts >= 20) return 'high';
    if (watts >= 5) return 'medium';
    return 'low';
  };

  // Filter out terminated processes and apply search & tier filters
  const filteredProcesses = topProcesses
    .filter((proc) => !terminatedPids.includes(proc.pid))
    .filter((proc) => {
      const matchesSearch = proc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            proc.pid.toString().includes(searchTerm);
      const tier = getPowerTier(proc.estimated_power_watts);
      const matchesTier = selectedTier === 'all' || tier === selectedTier;
      return matchesSearch && matchesTier;
    });

  const handleOpenTerminate = (proc) => {
    setConfirmModal({ open: true, proc });
  };

  const handleConfirmTerminate = () => {
    if (!confirmModal.proc) return;
    const { pid, name } = confirmModal.proc;

    setTerminatedPids((prev) => [...prev, pid]);
    setConfirmModal({ open: false, proc: null });

    setNotification(`Process "${name}" (PID: ${pid}) was successfully terminated.`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu color="#38bdf8" /> Process Energy Inspector
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Inspect high-consumption software tasks and manage system power overhead.
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div style={{
          backgroundColor: '#064e3b', border: '1px solid #34d399', color: '#a7f3d0',
          padding: '10px 16px', borderRadius: '8px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#34d399" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Process Name or PID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              color: '#fff',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Tier Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
          {[
            { id: 'all', label: 'All Tiers' },
            { id: 'high', label: 'High (>20W)' },
            { id: 'medium', label: 'Mid (5-20W)' },
            { id: 'low', label: 'Low (<5W)' }
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              style={{
                backgroundColor: selectedTier === tier.id ? '#0284c7' : 'transparent',
                color: selectedTier === tier.id ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      {/* Process Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '14px' }}>
              <th style={{ padding: '12px' }}>PID</th>
              <th style={{ padding: '12px' }}>Process Name</th>
              <th style={{ padding: '12px' }}>CPU Load</th>
              <th style={{ padding: '12px' }}>Estimated Power</th>
              <th style={{ padding: '12px' }}>Impact Tier</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProcesses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  No active processes match the specified filter criteria.
                </td>
              </tr>
            ) : (
              filteredProcesses.map((proc) => {
                const tier = getPowerTier(proc.estimated_power_watts);
                const tierStyles = {
                  high: { bg: '#451a03', color: '#f97316', label: 'High Draw' },
                  medium: { bg: '#3f6212', color: '#a3e635', label: 'Moderate' },
                  low: { bg: '#064e3b', color: '#34d399', label: 'Efficient' }
                }[tier];

                return (
                  <tr key={proc.pid} style={{ borderBottom: '1px solid #0f172a' }}>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>{proc.pid}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{proc.name}</td>
                    <td style={{ padding: '12px', color: '#f59e0b' }}>{proc.cpu_percent}%</td>
                    <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{proc.estimated_power_watts} W</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: tierStyles.bg,
                        color: tierStyles.color,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {tierStyles.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenTerminate(proc)}
                        style={{
                          backgroundColor: '#991b1b',
                          color: '#fef2f2',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Terminate
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Warning Modal */}
      {confirmModal.open && confirmModal.proc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#1e293b', border: '1px solid #ef4444',
            borderRadius: '12px', padding: '24px', maxWidth: '420px', width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <ShieldAlert size={28} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>Terminate Process?</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to terminate <strong>{confirmModal.proc.name}</strong> (PID: {confirmModal.proc.pid})? Unsaved data associated with this task may be lost.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setConfirmModal({ open: false, proc: null })}
                style={{
                  backgroundColor: '#334155', color: '#f8fafc', border: 'none',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTerminate}
                style={{
                  backgroundColor: '#dc2626', color: '#ffffff', border: 'none',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Force Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}