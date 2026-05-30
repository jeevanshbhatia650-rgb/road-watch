import math
import time

class Deduplicator:
    def __init__(self, radius_meters=50, cooldown_seconds=300):
        self.radius_meters    = radius_meters
        self.cooldown_seconds = cooldown_seconds
        self.reported         = []  # list of {lat, lng, issue, time}

    def _distance_meters(self, lat1, lng1, lat2, lng2) -> float:
        R    = 6371000  # Earth radius in metres
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lng2 - lng1)
        a    = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    def is_duplicate(self, lat, lng, issue_class) -> bool:
        now = time.time()
        for r in self.reported:
            # Same issue class within radius and within cooldown window
            if (r["issue"] == issue_class and
                (now - r["time"]) < self.cooldown_seconds and
                self._distance_meters(lat, lng, r["lat"], r["lng"]) < self.radius_meters):
                return True
        return False

    def mark_reported(self, lat, lng, issue_class):
        self.reported.append({
            "lat":   lat,
            "lng":   lng,
            "issue": issue_class,
            "time":  time.time()
        })
        # Keep only last 500 entries in memory
        if len(self.reported) > 500:
            self.reported = self.reported[-500:]