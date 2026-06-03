from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os

app = FastAPI(title="SmartCash Advanced ML Engine")

# Permissive CORS to allow the C# Backend proxy routing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

class UserLedgerData(BaseModel):
    user_id: str
    profile_type: str 
    omnibus_balance: float
    physical_cash_logged_30d: float
    transaction_count: int
    reward_points: int
    verified_outflows: float

@app.post("/api/evaluate")
def evaluate_credit(data: UserLedgerData):
    file_path = f"{data.profile_type.lower()}.csv"
    if not os.path.exists(file_path):
        file_path = "hawker.csv"
        
    df = pd.read_csv(file_path)
    
    # 1. Variance Analysis (Fraud Defense)
    std_in = df['Cash_In'].std()
    is_fraudulent = True if std_in < 2.0 else False
    
    # 2. Profit Margin Calculation (Relying on Cash_Out generation)
    df['Net_Cash'] = df['Cash_In'] - df['Cash_Out']
    net_margin = df['Net_Cash'].sum() / (df['Cash_In'].sum() + 1e-5)
    
    base_score = 30 + int(net_margin * 40) + (data.reward_points * 0.1)
    
    # 3. Verified Outflows (Money Out check to prevent hoarding bias)
    if data.verified_outflows > 500:
        base_score += 20
        
    # 4. Resilience Tracking
    if data.profile_type.lower() == "hawker" and df.get('Weather_Issue', pd.Series([False])).any():
        base_score += 10 

    stability_score = 5 if is_fraudulent else min(99, int(base_score))
    
    eligibility = False
    tier = 0
    approved_amount = 0.00
    method = "None"
    
    if is_fraudulent:
        msg = "FLAGGED: Zero-variance anomaly detected."
    elif stability_score >= 75:
        eligibility = True
        tier = 2
        approved_amount = 15000.00 if data.profile_type.lower() == "taxi" else 1500.00
        method = "MyMo_Transfer"
        msg = "Excellent stability! Approved for working capital advance."
    elif stability_score >= 50:
        eligibility = True
        tier = 1
        approved_amount = 200.00
        method = "Instant_Money"
        msg = "Approved for a R200 Instant Money stock voucher."
    else:
        msg = "Keep logging physical cash to unlock capital tiers."
        
    return {
        "eligibility": eligibility,
        "stability_score": stability_score,
        "loan_tier": tier,
        "approved_amount": approved_amount,
        "disbursement_method": method,
        "bank_message": msg,
        "is_fraudulent": is_fraudulent
    }