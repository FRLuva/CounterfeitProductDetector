from math import asin, cos, radians, sin, sqrt
import re
from uuid import uuid4


def generate_trace_id(barcode, batch_number):
    clean_barcode = re.sub(r"[^A-Z0-9]", "", str(barcode or "UNKNOWN").upper())[:12] or "UNKNOWN"
    clean_batch = re.sub(r"[^A-Z0-9]", "", str(batch_number or "BATCH").upper())[:8] or "BATCH"
    return f"TRC-{clean_barcode}-{clean_batch}-{uuid4().hex[:6].upper()}"

def distance_km(latitude_a, longitude_a, latitude_b, longitude_b):
    lat_a, lon_a, lat_b, lon_b = map(radians, [latitude_a, longitude_a, latitude_b, longitude_b])
    d_lat, d_lon = lat_b - lat_a, lon_b - lon_a
    value = sin(d_lat / 2) ** 2 + cos(lat_a) * cos(lat_b) * sin(d_lon / 2) ** 2
    return 6371.0088 * 2 * asin(sqrt(value))

def verify_location(record, latitude, longitude, threshold_km=5):
    latest = record.events.exclude(latitude__isnull=True).exclude(longitude__isnull=True).order_by("-event_time").first()
    if latest is None:
        return {"status": "unavailable", "distance_km": None, "within_range": False}
    distance = distance_km(latitude, longitude, latest.latitude, latest.longitude)
    return {"status": "matched" if distance <= threshold_km else "outside_range", "distance_km": round(distance, 2), "within_range": distance <= threshold_km, "event": latest}
