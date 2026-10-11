import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from collector import collector
import database as db

# Background task to continuously record energy metrics into SQLite
async def bg_db_logger():
    while True:
        try:
            metrics = collector.get_system_metrics()
            db.save_reading(metrics)
        except Exception as e:
            print(f"Error logging to DB: {e}")
        await asyncio.sleep(2.0)  # Log every 2 seconds

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database and start background logging task
    db.init_db()
    logger_task = asyncio.create_task(bg_db_logger())
    yield
    # Shutdown: Cancel background task
    logger_task.cancel()

app = FastAPI(
    title="Energy Consumption Analyzer API",
    description="Real-time and historical system power, CPU, memory, and process energy profiling API.",
    version="1.2.0",
    lifespan=lifespan
)

# Enable CORS for local frontend development (e.g., React / Vite on port 5173 or 3000)
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
            "live_metrics": "/api/metrics/live",
            "top_processes": "/api/processes/top",
            "full_summary": "/api/summary",
            "alert_threshold": "/api/alerts/threshold?threshold=50.0",
            "historical_logs": "/api/history/logs?minutes=60",
            "historical_stats": "/api/history/stats?minutes=60&tariff_rate=0.15"
        }
    }

# --- REAL-TIME ENDPOINTS ---

@app.get("/api/metrics/live")
def get_live_metrics():
    """Returns current real-time CPU, RAM, power draw (W), cumulative energy (kWh), and alert status."""
    return collector.get_system_metrics()

@app.get("/api/processes/top")
def get_top_processes(limit: int = Query(default=5, ge=1, le=20)):
    """Returns top N running processes ranked by CPU usage and estimated power share."""
    return collector.get_top_processes(limit=limit)

@app.get("/api/summary")
def get_full_summary(limit: int = Query(default=5, ge=1, le=20)):
    """Combined endpoint providing system metrics and top consuming processes in a single payload."""
    return {
        "system": collector.get_system_metrics(),
        "top_processes": collector.get_top_processes(limit=limit)
    }

# --- ALERT CONFIGURATION ENDPOINT ---

@app.get("/api/alerts/threshold")
def set_alert_threshold(threshold: float = Query(default=50.0, ge=10.0, le=500.0)):
    """Dynamically updates the power consumption alert threshold (in Watts)."""
    collector.alert_threshold = threshold
    return {
        "status": "updated",
        "new_threshold_watts": threshold
    }

# --- HISTORICAL DATA ENDPOINTS ---

@app.get("/api/history/logs")
def get_history_logs(minutes: int = Query(default=60, ge=1, le=1440)):
    """Returns time-series energy logs from SQLite for the past N minutes (up to 24 hours)."""
    return db.get_historical_logs(minutes=minutes)

@app.get("/api/history/stats")
def get_history_stats(
    minutes: int = Query(default=60, ge=1, le=1440),
    tariff_rate: float = Query(default=0.15, description="Electricity rate in USD per kWh")
):
    """Calculates aggregated metrics (Average Power, Peak Power, kWh, Estimated Cost, CO2 Footprint) over a given time range."""
    return db.get_historical_stats(minutes=minutes, electricity_rate=tariff_rate)