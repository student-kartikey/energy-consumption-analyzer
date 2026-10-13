# ⚡ Energy Consumption Analyzer

A full-stack, real-time hardware and software energy profiling application. The system monitors live system metrics (CPU, RAM, estimated power draw in Watts, cumulative kWh usage), logs time-series historical data into SQLite, triggers high-power alerts, and visualizes trends via an interactive React dashboard.

## 🛠️ Tech Stack

### **Backend**

* **Python 3.11+**

* **FastAPI** — High-performance RESTful API framework

* **Uvicorn** — ASGI web server implementation

* **SQLite** — Lightweight time-series database for logging metrics

* **psutil** — Cross-platform library for retrieving system utilization data

### **Frontend**

* **React (Vite)** — Fast, component-based user interface

* **Recharts** — Responsive time-series charts and visualizations

* **Lucide React** — Modern UI icons

### **DevOps & Infrastructure**

* **Docker & Docker Compose** — Containerized multi-container deployment

* **WSL 2** — Windows Subsystem for Linux backend integration

* **Docker Volumes** — Persistent storage for SQLite database files

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React / Vite Frontend                 │
│                   (http://localhost:5173)                │
└─────────────────────────────┬────────────────────────────┘
                              │ REST API Polls (1s)
                              ▼
┌──────────────────────────────────────────────────────────┐
│                   FastAPI Backend API                    │
│                   (http://localhost:8000)                │
├─────────────────────────────┬────────────────────────────┤
│  Async Background Logger    │  REST Endpoints            │
│  (Polls metrics every 2s)   │  - Live Summary            │
│                             │  - Top Processes           │
│                             │  - Historical Stats        │
│                             │  - CSV Export              │
└──────────────┬──────────────┴────────────────────────────┘
               │
               ▼ Persistent Volume Mount (/app/data)
┌──────────────────────────────────────────────────────────┐
│                   SQLite Database                        │
│                (energy_history.db)                       │
└──────────────────────────────────────────────────────────┘

```

## 🚀 Getting Started (Docker Compose) - Recommended

### **Prerequisites**

* Windows 10/11 with **WSL 2** enabled

* **Docker Desktop** installed and running

### **1. Clone the Repository**

```
git clone https://github.com/student-kartikey/energy-consumption-analyzer.git
cd energy-consumption-analyzer

```

### **2. Launch the Stack**

Run Docker Compose to build images and spin up containers in detached mode:

```
docker compose up -d --build

```

### **3. Access the Applications**

* **Frontend Dashboard:** <http://localhost:5173>

* **Interactive API Docs (Swagger):** <http://localhost:8000/docs>

* **Backend Status:** <http://localhost:8000/>

### **4. Stop Containers**

```
docker compose down

```

## 💻 Manual Local Setup (Without Docker)

### **Backend Setup**

1. Navigate to the backend directory and set up a Python virtual environment:

   ```
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   
   ```

2. Install Python dependencies:

   ```
   pip install -r requirements.txt
   
   ```

3. Start the FastAPI development server:

   ```
   uvicorn app:app --reload
   
   ```

### **Frontend Setup**

1. Open a separate terminal, navigate to the `frontend` directory:

   ```
   cd frontend
   
   ```

2. Install Node packages:

   ```
   npm install
   
   ```

3. Launch the Vite development server:

   ```
   npm run dev
   
   ```

## 📡 API Endpoints Summary

| Endpoint | Method | Description | 
| ----- | ----- | ----- | 
| `/` | `GET` | Health check & list of available routes | 
| `/api/metrics/live` | `GET` | Current CPU %, RAM %, power draw (W), cumulative kWh | 
| `/api/processes/top` | `GET` | Top N power-consuming processes | 
| `/api/summary` | `GET` | Combined live system metrics and top process list | 
| `/api/alerts/threshold` | `GET` | Dynamically set alert threshold in Watts (`?threshold=50.0`) | 
| `/api/history/logs` | `GET` | Time-series historical energy logs (`?minutes=60`) | 
| `/api/history/stats` | `GET` | Aggregate stats: average power, peak power, cost, CO2 | 
| `/api/history/export` | `GET` | Export historical logs as a downloadable CSV file | 

## 📊 Features

* **Real-Time Monitoring:** 1-second live polling of system metrics and process energy shares.

* **Dynamic Alerting:** Visually flags system metrics when power consumption exceeds configured limits.

* **Historical Trends:** Selectable range views (10 mins, 1 hour, 24 hours) displaying average draw, estimated electricity cost, and carbon footprint.

* **Data Portability:** Download time-series logs directly as CSV files.

* **Persistent Storage:** Docker named volumes retain SQLite database records across container restarts.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).