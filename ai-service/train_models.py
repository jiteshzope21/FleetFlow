import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

def generate_logistics_dataset(n_samples=2500, random_state=42):
    """
    Generates realistic, physically grounded freight transport trip data based on Indian logistics operations.
    Features:
      - distance_km: Trip distance (15 to 2500 km)
      - cargo_weight_kg: Payload (100 to 28000 kg)
      - vehicle_type_factor: 1.0 (VAN), 1.4 (TRUCK), 1.9 (TRAILER), 2.1 (TANKER), 1.6 (CONTAINER)
      - fuel_type_factor: 1.0 (DIESEL), 1.08 (PETROL), 0.78 (CNG), 0.42 (ELECTRIC)
      - fuel_price_per_liter: Typically 85 - 110 INR
    Target:
      - trip_operating_cost (INR): fuel cost + driver wage/bata + tolls + vehicle wear/depreciation
    """
    np.random.seed(random_state)
    
    distance = np.random.uniform(20, 2200, n_samples)
    cargo_weight = np.random.uniform(200, 25000, n_samples)
    
    vehicle_types = np.random.choice(['VAN', 'TRUCK', 'TRAILER', 'TANKER', 'CONTAINER'], n_samples)
    type_multipliers = {'VAN': 0.85, 'TRUCK': 1.25, 'TRAILER': 1.85, 'TANKER': 1.95, 'CONTAINER': 1.65}
    vehicle_factor = np.array([type_multipliers[v] for v in vehicle_types])
    
    fuel_types = np.random.choice(['DIESEL', 'PETROL', 'CNG', 'ELECTRIC'], n_samples, p=[0.75, 0.05, 0.15, 0.05])
    fuel_multipliers = {'DIESEL': 1.0, 'PETROL': 1.15, 'CNG': 0.80, 'ELECTRIC': 0.45}
    fuel_factor = np.array([fuel_multipliers[f] for f in fuel_types])
    
    fuel_price = np.random.uniform(85, 105, n_samples)
    
    # Base physics-informed consumption (liters per 100km): base + load factor
    # A heavy truck consumes ~25-35 L/100km; van ~10-15 L/100km
    liters_per_km = (0.12 * vehicle_factor + (cargo_weight / 25000) * 0.15) * fuel_factor
    fuel_cost = distance * liters_per_km * fuel_price
    
    # Toll charges: average ~2.5 INR/km on national highways with vehicles
    toll_cost = distance * (1.8 * vehicle_factor) * np.random.uniform(0.85, 1.15, n_samples)
    
    # Driver wage & daily allowance (Bata): ~3.5 INR/km + fixed 400 per trip
    driver_cost = 400 + distance * 3.2
    
    # Maintenance & tire wear: ~2.2 INR/km * vehicle_factor
    wear_cost = distance * (1.8 * vehicle_factor)
    
    # Total operating cost + minor stochastic operational variance
    noise = np.random.normal(0, 150, n_samples)
    total_cost = fuel_cost + toll_cost + driver_cost + wear_cost + noise
    total_cost = np.maximum(total_cost, 500)  # Min cost floor
    
    df = pd.DataFrame({
        'distance_km': distance,
        'cargo_weight_kg': cargo_weight,
        'vehicle_type': vehicle_types,
        'fuel_type': fuel_types,
        'fuel_price': fuel_price,
        'total_cost': total_cost
    })
    return df

def train_and_evaluate():
    print("Generating training dataset...")
    df = generate_logistics_dataset(3000)
    
    # One-hot encode categoricals
    df_encoded = pd.get_dummies(df, columns=['vehicle_type', 'fuel_type'], drop_first=False)
    
    X = df_encoded.drop(columns=['total_cost'])
    y = df_encoded['total_cost']
    
    # 80/20 train/test split to prevent data leakage
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training Gradient Boosting Cost Model on {len(X_train)} samples...")
    model = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=4,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))
    
    print("=" * 50)
    print("MODEL EVALUATION RESULTS:")
    print(f"  Mean Absolute Error (MAE): INR {mae:.2f}")
    print(f"  Root Mean Squared Error (RMSE): INR {rmse:.2f}")
    print(f"  R² Score (Explained Variance): {r2:.4f}")
    print("=" * 50)
    
    os.makedirs('ai-service/models', exist_ok=True)
    
    # Save model and metadata
    model_path = 'ai-service/models/trip_cost_model.joblib'
    joblib.dump(model, model_path)
    
    meta = {
        'model_name': 'FleetFlow GradientBoosting Cost Predictor',
        'version': '1.0.0',
        'feature_columns': list(X.columns),
        'metrics': {
            'mae': mae,
            'rmse': rmse,
            'r2_score': r2
        },
        'training_samples': len(X_train),
        'test_samples': len(X_test)
    }
    
    with open('ai-service/models/model_meta.json', 'w') as f:
        json.dump(meta, f, indent=2)
        
    print(f"Model saved to {model_path} with metadata.")
    return meta

if __name__ == '__main__':
    train_and_evaluate()
