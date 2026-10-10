import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "FleetFlow AI Service"
    assert "metrics" in data
    assert data["metrics"]["r2_score"] > 0.90

def test_predict_trip_cost_truck():
    payload = {
        "distance_km": 450.0,
        "cargo_weight_kg": 12000.0,
        "vehicle_type": "TRUCK",
        "fuel_type": "DIESEL",
        "fuel_price_per_liter": 92.5
    }
    res = client.post("/predict/trip-cost", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["predicted_cost"] > 3000
    assert data["cost_per_km"] > 0
    assert data["cost_breakdown"]["fuel_cost"] > 0
    assert data["cost_breakdown"]["toll_charges"] > 0
    assert len(data["explainability"]) >= 3

def test_predict_trip_cost_van():
    payload = {
        "distance_km": 100.0,
        "cargo_weight_kg": 1500.0,
        "vehicle_type": "VAN",
        "fuel_type": "CNG",
        "fuel_price_per_liter": 80.0
    }
    res = client.post("/predict/trip-cost", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["predicted_cost"] >= 500

def test_invalid_distance_rejected():
    payload = {
        "distance_km": -10.0,
        "cargo_weight_kg": 1000.0
    }
    res = client.post("/predict/trip-cost", json=payload)
    assert res.status_code == 422

def test_fuel_insights():
    payload = {
        "vehicles": [
            {
                "id": "v1",
                "registration_number": "MH12AB1234",
                "type": "TRUCK",
                "current_odometer": 95000,
                "fuel_type": "DIESEL",
                "status": "ACTIVE",
                "last_service_odometer": 75000
            }
        ]
    }
    res = client.post("/insights/fuel", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["analyzed_vehicles"] == 1
    assert len(data["anomalies"]) >= 1

def test_maintenance_insights():
    payload = {
        "vehicles": [
            {
                "id": "v1",
                "registration_number": "MH12AB1234",
                "type": "TRUCK",
                "current_odometer": 25000,
                "fuel_type": "DIESEL",
                "status": "ACTIVE",
                "last_service_odometer": 12000
            }
        ]
    }
    res = client.post("/insights/maintenance", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["overdue_count"] == 1

def test_recommendations():
    payload = {
        "total_vehicles": 10,
        "active_vehicles": 6,
        "in_maintenance_vehicles": 2,
        "total_shipments": 20,
        "delivered_shipments": 15,
        "in_transit_shipments": 5
    }
    res = client.post("/recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 2
