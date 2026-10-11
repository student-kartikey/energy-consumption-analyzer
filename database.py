import sqlite3
import time
from typing import List, Dict, Any

DB_NAME = "energy_history.db"


def init_db():
    """Initializes the SQLite database schema for storing energy logs."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS energy_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL NOT NULL,
            cpu_percent REAL NOT NULL,
            memory_percent REAL NOT NULL,
            power_watts REAL NOT NULL,
            energy_joules_total REAL NOT NULL,
            energy_kwh_total REAL NOT NULL
        )
    """)
    # Index on timestamp for fast time-range querying
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON energy_logs(timestamp)")
    conn.commit()
    conn.close()


def save_reading(metrics: dict):
    """Saves a single snapshot reading into SQLite."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO energy_logs (timestamp, cpu_percent, memory_percent, power_watts, energy_joules_total, energy_kwh_total)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        metrics["timestamp"],
        metrics["cpu_percent"],
        metrics["memory_percent"],
        metrics["power_watts"],
        metrics["energy_joules_total"],
        metrics["energy_kwh_total"]
    ))
    conn.commit()
    conn.close()


def get_historical_logs(minutes: int = 60) -> List[Dict[str, Any]]:
    """Retrieves energy logs from the last N minutes."""
    cutoff_time = time.time() - (minutes * 60)
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, cpu_percent, memory_percent, power_watts, energy_joules_total, energy_kwh_total
        FROM energy_logs
        WHERE timestamp >= ?
        ORDER BY timestamp ASC
    """, (cutoff_time,))
    
    rows = cursor.fetchall()
    conn.close()

    logs = []
    for row in rows:
        logs.append({
            "timestamp": row[0],
            "cpu_percent": row[1],
            "memory_percent": row[2],
            "power_watts": row[3],
            "energy_joules_total": row[4],
            "energy_kwh_total": row[5]
        })
    return logs


def get_historical_stats(minutes: int = 60, electricity_rate: float = 0.15, carbon_factor_g: float = 475.0) -> Dict[str, Any]:
    """Calculates aggregated metrics (Average Power, Total kWh, Estimated Cost, CO2 footprint) over a given period."""
    cutoff_time = time.time() - (minutes * 60)
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            AVG(power_watts) as avg_power,
            MAX(power_watts) as peak_power,
            AVG(cpu_percent) as avg_cpu,
            COUNT(*) as sample_count
        FROM energy_logs
        WHERE timestamp >= ?
    """, (cutoff_time,))
    
    row = cursor.fetchone()
    conn.close()

    if not row or row[3] == 0:
        return {
            "period_minutes": minutes,
            "sample_count": 0,
            "avg_power_watts": 0.0,
            "peak_power_watts": 0.0,
            "avg_cpu_percent": 0.0,
            "estimated_kwh": 0.0,
            "estimated_cost_usd": 0.0,
            "estimated_co2_grams": 0.0
        }

    avg_power = round(row[0] or 0.0, 2)
    peak_power = round(row[1] or 0.0, 2)
    avg_cpu = round(row[2] or 0.0, 2)
    
    # Calculate energy consumed during this window (kWh = avg_power (W) * hours / 1000)
    hours = minutes / 60.0
    est_kwh = round((avg_power * hours) / 1000.0, 6)
    est_cost = round(est_kwh * electricity_rate, 4)
    est_co2 = round(est_kwh * carbon_factor_g, 2)

    return {
        "period_minutes": minutes,
        "sample_count": row[3],
        "avg_power_watts": avg_power,
        "peak_power_watts": peak_power,
        "avg_cpu_percent": avg_cpu,
        "estimated_kwh": est_kwh,
        "estimated_cost_usd": est_cost,
        "estimated_co2_grams": est_co2
    }