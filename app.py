import asyncio
import csv
import io
import json
import time
import psutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import database as db

# Global configuration for threshold limits
ALERT_THRESHOLD_WATTS = 50.0


def get_system_metrics():
    """Captures system metrics and power estimates."""
    global ALERT_THRESHOLD_WATTS

    cpu_percent = psutil.cpu_percent(interval=None)
    memory_info = psutil.virtual_memory()
    memory_percent = memory_info.percent

    # Baseline TDP model: Base System Draw (15W) + Scaled CPU Draw (up to 45W)
    base_idle_watts = 15.0
    max_cpu_watts = 45.0
    power_watts = round(base_idle_watts + (cpu_percent / 100.0) * max_cpu_watts, 2)

    energy_joules_total = round(power_watts * 3600, 2)
    energy_kwh_total = round((power_watts * 1) / 1000, 4)

    is_triggered = power_watts > ALERT_THRESHOLD_WATTS
    alert_message = (
        f"Power consumption ({power_watts} W) exceeded threshold limit of {ALERT_THRESHOLD_WATTS} W!"
        if is_triggered
        else "Normal operation"
    )

    return {
        "timestamp": time.time(),
        "cpu_percent": cpu_percent,
        "memory_percent": memory_percent,
        "power_watts": power_watts,
        "energy_joules_total": energy_joules_total,
        "energy_kwh_total": energy_kwh_total,
        "alert": {
            "triggered": is_triggered,
            "threshold_watts": ALERT_THRESHOLD_WATTS,
            "message": alert_message,
        },
    }


def get_top_processes(limit: int = 5):
    """Gathers top N power-consuming processes."""
    max_cpu_watts = 45.0
    processes = []
    for proc in psutil.process_iter(["pid", "name", "cpu_percent"]):
        try:
            p_cpu = proc.info["cpu_percent"] or 0.0
            p_watts = round((p_cpu / 100.0) * max_cpu_watts, 2)
            processes.append({
                "pid": proc.info["pid"],
                "name": proc.info["name"] or "Unknown",
                "cpu_percent": round(p_cpu, 1),
                "estimated_power_watts": p_watts,
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    return sorted(processes, key=lambda x: x["cpu_percent"], reverse=True)[:limit]


def get_system_summary(limit: int = 5):
    """Combined system metrics and process profiling payload."""
    return {
        "system": get_system_metrics(),
        "top_processes": get_top_processes(limit=limit),
    }


# Background task to log energy metrics into SQLite
async def bg_db_logger():
    while True:
        try:
            metrics = get_system_metrics()
            db.save_reading(metrics)
        except Exception as e:
            print(f"Error logging to DB: {e}")
        await asyncio.sleep(2.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database and background logger
    db.init_db()
    logger_task = asyncio.create_task(bg_db_logger())
    yield
    # Shutdown: Cancel background logging task
    logger_task.cancel()


app = FastAPI(
    title="Energy Consumption Analyzer API",
    description="Real-time and historical system power, CPU, memory, and process energy profiling API.",
    version="1.3.0",
    lifespan=lifespan,
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Energy Consumption Analyzer API",
        "endpoints": {
            "summary": "/api/summary",
            "historical_logs": "/api/history/logs?minutes=60",
            "historical_stats": "/api/history/stats?minutes=60&tariff_rate=0.15",
            "export_csv": "/api/history/export?minutes=60",
            "websocket": "/ws/metrics",
        },
    }


# --- REST ENDPOINTS FOR REACT FRONTEND ---

@app.get("/api/summary")
def api_summary(limit: int = Query(default=5, ge=1, le=20)):
    return get_system_summary(limit=limit)


@app.get("/api/alerts/threshold")
def set_alert_threshold(threshold: float = Query(default=50.0, ge=10.0, le=500.0)):
    global ALERT_THRESHOLD_WATTS
    ALERT_THRESHOLD_WATTS = threshold
    return {"status": "updated", "new_threshold_watts": threshold}


@app.get("/api/history/logs")
def get_history_logs(minutes: int = Query(default=60, ge=1, le=1440)):
    return db.get_historical_logs(minutes=minutes)


@app.get("/api/history/stats")
def get_history_stats(
    minutes: int = Query(default=60, ge=1, le=1440),
    tariff_rate: float = Query(default=0.15, description="Electricity rate in USD per kWh"),
):
    return db.get_historical_stats(minutes=minutes, electricity_rate=tariff_rate)


@app.get("/api/history/export")
def export_history_csv(minutes: int = Query(default=60, ge=1, le=1440)):
    logs = db.get_historical_logs(minutes=minutes)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Timestamp", "CPU Usage (%)", "Memory Usage (%)",
        "Power Draw (Watts)", "Cumulative Energy (Joules)", "Cumulative Energy (kWh)"
    ])

    for log in logs:
        writer.writerow([
            log["timestamp"], log["cpu_percent"], log["memory_percent"],
            log["power_watts"], log["energy_joules_total"], log["energy_kwh_total"]
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=energy_history_{minutes}m.csv"},
    )


# --- WEBSOCKET ENDPOINT ---

@app.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = get_system_summary()
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected from /ws/metrics")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()