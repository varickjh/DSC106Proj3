import pandas as pd
from datetime import timedelta
import http.server
import socketserver
import webbrowser
import threading
import time
import os

# === Same as before: Process Dexcom and Food Data ===
dexcom_df = pd.read_csv('Dexcom_001.csv')
dexcom_df = dexcom_df[12:].drop(columns=['Index'], errors='ignore')
dexcom_df['ID'] = int('001')

ids = ['002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014', '015', '016']
for id in ids:
    temp_df = pd.read_csv(f'Dexcom_{id}.csv')
    temp_df = temp_df[12:].drop(columns=['Index'], errors='ignore')
    temp_df['ID'] = int(id)
    dexcom_df = pd.concat([dexcom_df, temp_df], ignore_index=True)

dexcom_df = dexcom_df.rename(columns={
    'Timestamp (YYYY-MM-DDThh:mm:ss)': 'Timestamp',
    'Glucose Value (mg/dL)': 'Glucose'
})
dexcom_df['Timestamp'] = pd.to_datetime(dexcom_df['Timestamp'], errors='coerce')
dexcom_df['Glucose'] = pd.to_numeric(dexcom_df['Glucose'], errors='coerce')

food_df = pd.read_csv('Food_Log_001.csv')
food_df['ID'] = int('001')

for id in ids:
    temp_df = pd.read_csv(f'Food_Log_{id}.csv')
    temp_df['ID'] = int(id)
    food_df = pd.concat([food_df, temp_df], ignore_index=True)

food_df = food_df.drop(columns=[
    '2020-02-22', '10:30:00', '2020-02-22 10:30:00', 'Chicken Nuggets',
    '8.0', 'piece', 'Chicken Nuggets.1', '393.0', '19.0', '0.1', '20.0'
], errors='ignore')
food_df['time_begin'] = pd.to_datetime(food_df['time_begin'], errors='coerce')

# Add nutrient flags
daily_values = {
    'total_carb': 275,
    'protein': 50,
    'sugar': 50,
    'total_fat': 78,
    'dietary_fiber': 28
}
for nutrient, value in daily_values.items():
    flag = f"{nutrient}_present"
    food_df[flag] = pd.to_numeric(food_df[nutrient], errors='coerce') >= (0.05 * value)

# Demographics
demographics_df = pd.read_csv('Demographics.csv')
demographics_df = demographics_df.rename(columns={'Gender': 'gender'})
demographics_df['ID'] = pd.to_numeric(demographics_df['ID'], errors='coerce')

# Compute glucose peaks
def get_all_nutrient_profiles(food_df, dexcom_df, demographics_df, window_hrs=2):
    feature_map = {
        'total_carb_present': 'Carbs',
        'protein_present': 'Protein',
        'sugar_present': 'Sugar',
        'total_fat_present': 'Fat',
        'dietary_fiber_present': 'Fiber'
    }

    records = []
    for flag, nutrient_name in feature_map.items():
        for pid in food_df['ID'].unique():
            meals = food_df[(food_df['ID'] == pid) & (food_df[flag])]
            glucose_data = dexcom_df[dexcom_df['ID'] == pid]

            peaks = []
            for _, meal in meals.iterrows():
                start = meal['time_begin']
                end = start + timedelta(hours=2)
                window = glucose_data[(glucose_data['Timestamp'] >= start) & (glucose_data['Timestamp'] <= end)]
                if not window.empty:
                    peaks.append(window['Glucose'].max())

            if peaks:
                records.append({
                    'ID': pid,
                    'Avg_Peak_Glucose': sum(peaks) / len(peaks),
                    'Meal_Count': len(peaks),
                    'Nutrient': nutrient_name
                })

    df = pd.DataFrame(records)
    df = df.merge(demographics_df[['ID', 'gender', 'HbA1c']], on='ID', how='left')
    return df

# Generate and save CSV
final_df = get_all_nutrient_profiles(food_df, dexcom_df, demographics_df)
final_df.to_csv('glucose_peaks_by_nutrient.csv', index=False)
print("✅ Saved glucose_peaks_by_nutrient.csv")

# === Start local server and open browser ===
def start_server():
    PORT = 8000
    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Serving at http://localhost:{PORT}")
        httpd.serve_forever()

def open_browser():
    webbrowser.open("http://localhost:8000/index.html")

# Start server in background
threading.Thread(target=start_server, daemon=True).start()

# Wait briefly and launch browser
time.sleep(1)
open_browser()
