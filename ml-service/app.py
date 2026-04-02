from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal
import uvicorn
import os

from models.eta_model import ETAModel
from utils.feature_builder import FeatureBuilder

app = FastAPI(title="PulseRoute ML Service", version="1.0.0")

# 🏛️ Initialize Model and Feature Builder
eta_model = ETAModel()
feature_builder = FeatureBuilder()

class PredictETAInput(BaseModel):
    distance: float
    time_of_day: int
    traffic_level: float
    area_type: Literal["urban", "rural"]

class PredictETAOutput(BaseModel):
    eta: float

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-service"}

@app.post("/predict-eta", response_model=PredictETAOutput)
async def predict_eta(data: PredictETAInput):
    """
    Predicts the Estimated Time of Arrival (ETA) based on distance, traffic, and time-of-day.
    
    This service acts as a **Learned Cost Oracle** for the A* routing engine.
    """
    try:
        # 🧪 Transform raw data into structured features
        features = feature_builder.build_features(data.dict())
        
        # ⏱️ Perform inference using the lightweight model
        eta = eta_model.predict(features)
        
        return PredictETAOutput(eta=eta)
        
    except Exception as e:
        print(f"Prediction Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Inference failed")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
