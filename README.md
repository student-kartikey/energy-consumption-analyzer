# Energy Consumption Analyzer

A full-stack, real-time hardware and software resource monitoring system that profiles CPU utilization, memory allocation, and software process activity to estimate live power draw (Watts), cumulative energy usage (kWh), electricity costs ($), and CO2 carbon footprint.

---

## Key Features

* Real-Time Power & CPU Profiling: Dynamic estimation of power consumption using CPU thermal TDP models and process sampling via psutil.
* Top Energy-Consuming Processes: Identifies, ranks, and displays the top running software processes by CPU percentage and estimated power share.
* Persistent Time-Series Storage: Automatically logs system metrics every 2 seconds into a local SQLite database for historical trend analysis.
* High-Power Alert Thresholds: Displays instant visual alerts in the UI whenever power consumption exceeds user-configured thresholds (e.g., > 50 Watts).
* Historical Analytics & Cost Calculation: Interactive charts with 10m, 1h, and 24h filters displaying average power, peak usage, cost estimates based on regional tariffs, and carbon footprint (grams of CO2).
* Modern Dashboard: Built with React, Tailwind-style layouts, and Recharts streaming data visualizations.

---

## System Architecture

  Hardware & OS            --->    Python Collector Agent    --->    SQLite Database
  (psutil / System CPU)            (Thermal TDP Model)               (energy_history.db)
                                             |                                |
                                             v                                v
                                   FastAPI REST Server       <---    Historical Analytics
                                   (http://127.0.0.1:8000)           & Summary Queries
                                             |
                                             v
                                   React Dashboard (Vite)
                                   (http://localhost:5173)

---

## Tech Stack

* Backend: Python 3.9+, FastAPI, Uvicorn, psutil, asyncio
* Database: SQLite3 (time-series logging)
* Frontend: React 18, Vite, Recharts, Lucide React Icons

---

## Quick Start Guide

### Prerequisites
* Python 3.9+
* Node.js 16+ & npm

---

### 1. Backend Setup

1. Clone the repository and open the backend folder:
   git clone https://github.com/your-username/energy-consumption-analyzer.git
   cd energy-consumption-analyzer

2. Create and activate a virtual environment:
   * Windows:
     python -m venv venv
     .\venv\Scripts\activate
   * macOS / Linux:
     python -m venv venv
     source venv/bin/activate

3. Install Python dependencies:
   pip install psutil fastapi uvicorn

4. Start the FastAPI REST server:
   uvicorn app:app --reload --port 8000
   * API Swagger Docs: http://127.0.0.1:8000/docs
   * Live Summary Route: http://127.0.0.1:8000/api/summary

---

### 2. Frontend Setup

1. Open a new terminal tab, navigate to the frontend directory:
   cd frontend

2. Install frontend dependencies:
   npm install
   npm install lucide-react recharts

3. Start the Vite development server:
   npm run dev

4. Open the application:
   Navigate to http://localhost:5173 to view the live dashboard.

---

## API Endpoints

* GET /api/metrics/live — Current real-time CPU, RAM, power draw (W), and energy (kWh).
* GET /api/processes/top — Top N running processes ranked by CPU usage and power share.
* GET /api/summary — Combined payload of live metrics and top process list.
* GET /api/alerts/threshold — Dynamically update the high-power alert threshold (?threshold=50.0).
* GET /api/history/logs — Time-series energy logs from SQLite (?minutes=60).
* GET /api/history/stats — Aggregated stats: Avg Power, Peak Power, Cost ($), and CO2 Footprint (g).

---

## Formulas Used

* Power Draw (Watts):
  Power = Idle Power + (Max TDP - Idle Power) * (CPU Usage % / 100)

* Energy Consumption (kWh):
  Energy = (Power in Watts * Time in Hours) / 1000

* Carbon Footprint (grams of CO2):
  CO2 = Energy in kWh * 475 (Grid Intensity Factor in g/kWh)

---

## License

This project is open-source and available under the MIT License.