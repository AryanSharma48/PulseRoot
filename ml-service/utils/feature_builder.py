from typing import Dict, Any

class FeatureBuilder:
    """
    Transforms raw input data into a structured feature set for the ETA model.
    Focuses on time-of-day and area-type encoding.
    """

    @staticmethod
    def build_features(data: Dict[str, Any]) -> Dict[str, float]:
        distance = float(data.get("distance", 0.0))
        time_of_day = int(data.get("time_of_day", 12))
        traffic_level = float(data.get("traffic_level", 1.0))
        area_type = data.get("area_type", "urban")

        # 🏎️ Rush Hour Logic (8-11 and 17-20)
        # We use the raw integer 0-23 as requested by the user.
        is_rush_hour = 1.0 if (8 <= time_of_day <= 11) or (17 <= time_of_day <= 20) else 0.0
        
        # 🏡 Area Type Scaling
        area_multiplier = 1.2 if area_type == "urban" else 0.8

        return {
            "distance": distance,
            "time_of_day": float(time_of_day),
            "is_rush_hour": is_rush_hour,
            "traffic_level": traffic_level,
            "area_multiplier": area_multiplier
        }
