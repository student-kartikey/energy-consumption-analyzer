import time
import os
import psutil

# Configuration Parameters
SYSTEM_TDP_WATTS = 65.0      # Estimated max CPU TDP (e.g., 15W for laptop, 65W–125W for desktop)
IDLE_POWER_WATTS = 5.0       # Estimated base idle power consumption
SAMPLING_INTERVAL = 1.0      # Default polling rate in seconds
ALERT_THRESHOLD_WATTS = 50.0 # Power threshold in Watts to trigger alerts


class EnergyCollector:
    def __init__(self, tdp_watts=SYSTEM_TDP_WATTS, idle_watts=IDLE_POWER_WATTS, alert_threshold=ALERT_THRESHOLD_WATTS):
        self.tdp = tdp_watts
        self.idle_power = idle_watts
        self.alert_threshold = alert_threshold
        self.total_joules = 0.0
        self.last_time = time.time()
        
        # Initialize psutil CPU measurement baseline
        psutil.cpu_percent(interval=None)

    def estimate_power(self, cpu_percent: float) -> float:
        """Estimates power consumption in Watts based on CPU usage percentage using a thermal TDP model."""
        dynamic_power = (self.tdp - self.idle_power) * (cpu_percent / 100.0)
        return self.idle_power + dynamic_power

    def get_system_metrics(self) -> dict:
        """Calculates real-time metrics, dynamic time deltas, cumulative energy, and alert states."""
        current_time = time.time()
        time_delta = current_time - self.last_time
        self.last_time = current_time

        # Prevent large initial spike if first request delay is long
        if time_delta > 10.0:
            time_delta = 1.0

        cpu_percent = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()

        power_watts = self.estimate_power(cpu_percent)
        joules_consumed = power_watts * time_delta
        self.total_joules += joules_consumed

        # Threshold alert evaluation
        is_alert = power_watts >= self.alert_threshold

        return {
            "timestamp": current_time,
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "power_watts": round(power_watts, 2),
            "energy_joules_total": round(self.total_joules, 2),
            "energy_kwh_total": round(self.total_joules / 3_600_000, 6),
            "alert": {
                "triggered": is_alert,
                "threshold_watts": self.alert_threshold,
                "message": f"High power consumption detected: {round(power_watts, 2)} W exceeds threshold of {self.alert_threshold} W!" if is_alert else "Normal operation"
            }
        }

    def get_top_processes(self, limit: int = 5) -> list:
        """Returns the top N active processes sorted by estimated power impact."""
        processes = []
        cpu_cores = psutil.cpu_count() or 1
        
        for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
            try:
                cpu_p = proc.cpu_percent(interval=None) / cpu_cores
                mem_p = proc.info['memory_percent'] or 0.0

                if cpu_p > 0.0:
                    proc_power = self.estimate_power(cpu_p) - (self.idle_power / cpu_cores)
                    processes.append({
                        "pid": proc.info['pid'],
                        "name": proc.info['name'],
                        "cpu_percent": round(cpu_p, 2),
                        "memory_percent": round(mem_p, 2),
                        "estimated_power_watts": round(max(proc_power, 0.0), 2)
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
        return processes[:limit]


# Global singleton instance for FastAPI import across application modules
collector = EnergyCollector()

if __name__ == "__main__":
    print("⚡ Starting Energy Collector Service... Press Ctrl+C to stop.\n")
    try:
        while True:
            metrics = collector.get_system_metrics()
            top_apps = collector.get_top_processes(limit=5)

            os.system('cls' if os.name == 'nt' else 'clear')

            print("==========================================")
            print("        ENERGY CONSUMPTION MONITOR        ")
            print("==========================================")
            print(f"System CPU Usage  : {metrics['cpu_percent']}%")
            print(f"System RAM Usage  : {metrics['memory_percent']}%")
            print(f"Current Power Draw: {metrics['power_watts']} W")
            print(f"Total Energy Used : {metrics['energy_joules_total']} J ({metrics['energy_kwh_total']} kWh)")
            if metrics['alert']['triggered']:
                print(f"⚠️ ALERT: {metrics['alert']['message']}")
            print("------------------------------------------")
            print(" TOP ENERGY-CONSUMING PROCESSES:")
            print(" PID    | Name                 | CPU %  | Est. Power")
            print("------------------------------------------")
            for p in top_apps:
                print(f" {p['pid']:<6} | {p['name'][:20]:<20} | {p['cpu_percent']:<6}% | {p['estimated_power_watts']} W")
            print("==========================================")

            time.sleep(SAMPLING_INTERVAL)

    except KeyboardInterrupt:
        print("\nStopping collector.")