import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_profiles(days=180):
    # Generates synthetic data for the ML engine to consume.
    # Essential for proving the Variance and "Money Out" logic during the pitch.
    dates = [datetime.today() - timedelta(days=x) for x in range(days)]
    
    hawker_data = []
    for date in dates:
        is_raining = np.random.choice([True, False], p=[0.2, 0.8])
        sales = np.random.randint(20, 80) if not is_raining else np.random.randint(5, 25)
        stock_cost = np.random.randint(10, 40)
        hawker_data.append({
            "Date": date.strftime("%Y-%m-%d"), 
            "Cash_In": sales, 
            "Cash_Out": stock_cost, 
            "Weather_Issue": is_raining
        })
        
    taxi_data = []
    for date in dates:
        is_weekend = date.weekday() >= 5
        sales = np.random.randint(1800, 2500) if is_weekend else np.random.randint(1200, 1800)
        breakdown = np.random.choice([True, False], p=[0.05, 0.95])
        expenses = np.random.randint(4000, 7000) if breakdown else np.random.randint(400, 800)
        taxi_data.append({
            "Date": date.strftime("%Y-%m-%d"), 
            "Cash_In": sales, 
            "Cash_Out": expenses, 
            "Vehicle_Breakdown": breakdown
        })

    pd.DataFrame(hawker_data).to_csv("hawker.csv", index=False)
    pd.DataFrame(taxi_data).to_csv("taxi.csv", index=False)

if __name__ == "__main__":
    generate_profiles()