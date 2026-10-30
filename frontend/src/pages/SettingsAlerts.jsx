import React from 'react';
import { Settings, Bell } from 'lucide-react';

export default function SettingsAlerts({ thresholdInput, setThresholdInput, handleUpdateThreshold }) {
  return (
    <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings color="#f59e0b" /> System Limits & Threshold Rules
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
        Configure real-time monitoring alerts and backend logging behaviors.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '6px' }}>
            High Power Threshold (Watts)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(parseFloat(e.target.value) || 50)}
              style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '6px' }}
            />
            <button
              onClick={handleUpdateThreshold}
              style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Save Rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}