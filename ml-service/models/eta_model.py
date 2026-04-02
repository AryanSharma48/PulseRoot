import random
from typing import Dict

class ETAModel:
    """
    Lightweight, parameterized ETA prediction model.
    Simulates a trained regression engine by using specific weights for features.
    
    Weights are tuned to favor hospital specializations and penalize peak-hour urban traffic.
    """

    def __init__(self):
        # 🧪 Simulated Model Weights
        self.weights = {
            "base_speed": 43.0,      # km/h base
            "rush_hour_penalty": 0.5, # 50% speed reduction
            "traffic_impact": 0.7,   # 70% impact from real-time traffic data
            "urban_slowdown": 0.85   # 15% reduction in urban centers
        }

    def predict(self, features: Dict[str, float]) -> float:
        distance = features.get("distance", 0.0)
        is_rush_hour = features.get("is_rush_hour", 0.0)
        traffic_level = features.get("traffic_level", 1.0)
        area_multiplier = features.get("area_multiplier", 1.0)

        # 🏎️ Calculate Adjusted Speed
        # Speed = Base * (TrafficImpact) * (RushHourPenalty) * (AreaMultiplier)
        adjusted_speed = self.weights["base_speed"]
        
        # Traffic level logic
        traffic_factor = 1.0 / max(0.5, traffic_level * self.weights["traffic_impact"])
        adjusted_speed *= traffic_factor
        
        if is_rush_hour:
            adjusted_speed *= self.weights["rush_hour_penalty"]
            
        adjusted_speed *= area_multiplier
        
        # ⏱️ ETA = Distance / Speed * 60 (to get minutes)
        speed = max(5.0, adjusted_speed)
        eta = (distance / speed) * 60.0
        
        # 🎲 Add a small amount of non-deterministic noise (±5%)
        noise = 1.0 + (random.random() * 0.1 - 0.05)
        eta *= noise
        
        return round(max(1.0, eta), 2)
