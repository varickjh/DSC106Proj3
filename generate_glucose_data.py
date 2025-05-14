import pandas as pd
from datetime import timedelta

# === Load Dexcom Data ===
dexcom_df = pd.read_csv('data/Dexcom_001.csv')
dexcom_df = dexcom_df[12:].drop(columns=['Index'], errors='ignore')
dexcom_df['ID'] = int('001')

ids = [f'{i:03}' for i in range(2, 17)]
for id in ids:
    temp_df = pd.read_csv(f'data/Dexcom_{id}.csv')
    temp_df = temp_df[12:].drop(columns=['Index'], errors='ignore')
    temp_df['ID'] = int(id)
    dexcom_df = pd.concat([dexcom_df, temp_df], ignore_index=True)

dexcom_df = dexcom_df.rename(columns={
    'Timestamp (YYYY-MM-DDThh:mm:ss)': 'Timestamp',
    'Glucose Value (mg/dL)': 'Glucose'
})
dexcom_df['Timestamp'] = pd.to_datetime(dexcom_df['Timestamp'], errors='coerce')
dexcom_df['Glucose'] = pd.to_numeric(dexcom_df['Glucose'], errors='coerce')

# === Load Food Logs ===
food_df = pd.read_csv('data/Food_Log_001.csv')
food_df['ID'] = int('001')
for id in ids:
    temp_df = pd.read_csv(f'data/Food_Log_{id}.csv')
    temp_df['ID'] = int(id)
    food_df = pd.concat([food_df, temp_df], ignore_index=True)

food_df = food_df.drop(columns=[
    '2020-02-22', '10:30:00', '2020-02-22 10:30:00', 'Chicken Nuggets',
    '8.0', 'piece', 'Chicken Nuggets.1', '393.0', '19.0', '0.1', '20.0'
], errors='ignore')

food_df['time_begin'] = pd.to_datetime(food_df['time_begin'], errors='coerce')

# === Add Nutrient Flags ===
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

# === Load Demographics ===
demographics_df = pd.read_csv('data/Demographics.csv')
demographics_df = demographics_df.rename(columns={'Gender': 'gender', 'HbA1c': 'HbA1C'})
demographics_df['ID'] = pd.to_numeric(demographics_df['ID'], errors='coerce')

# === Build Combined Records: One Row per Meal ===
records = []

# Participants to exclude due to missing data
exclude_ids = [3, 7, 13, 15, 16]

# Get only participants with valid data
participant_ids = [pid for pid in demographics_df['ID'].unique() if pid not in exclude_ids]


for pid in participant_ids:
    participant_meals = food_df[food_df['ID'] == pid]
    matched_peaks = []

    for _, meal in participant_meals.iterrows():
        start = meal['time_begin']
        end = start + timedelta(hours=2)

        glucose = dexcom_df[
            (dexcom_df['ID'] == pid) &
            (dexcom_df['Timestamp'] >= start) &
            (dexcom_df['Timestamp'] <= end)
        ]

        if not glucose.empty:
            peak = glucose['Glucose'].max()
            matched_peaks.append({
                'peak': peak,
                'nutrients': {
                    f"{nutrient}_present": meal.get(f"{nutrient}_present", False)
                    for nutrient in daily_values
                },
                'logged_food': meal.get('logged_food', 'Unknown')
            })


    # If we found matched peaks, output one row per meal
    if matched_peaks:
    # Sort peaks by glucose and limit to top 20
        top_meals = sorted(matched_peaks, key=lambda x: x['peak'], reverse=True)[:20]

        for meal in top_meals:
            record = {
                'ID': pid,
                'Avg_Peak_Glucose': meal['peak'],
                'Meal_Count': 1,
                **meal['nutrients'],
                'logged_food': meal.get('logged_food', 'Unknown')
            }

            demo = demographics_df[demographics_df['ID'] == pid]
            if not demo.empty:
                record['gender'] = demo.iloc[0]['gender']
                record['HbA1C'] = demo.iloc[0]['HbA1C']
            else:
                record['gender'] = None
                record['HbA1C'] = None

            records.append(record)


    else:
        # No matched meals — add one placeholder row
        demo = demographics_df[demographics_df['ID'] == pid]
        records.append({
            'ID': pid,
            'Avg_Peak_Glucose': None,
            'Meal_Count': 0,
            **{f"{nutrient}_present": False for nutrient in daily_values},
            'gender': demo.iloc[0]['gender'] if not demo.empty else None,
            'HbA1C': demo.iloc[0]['HbA1C'] if not demo.empty else None
        })


# === Save as CSV ===
meal_df = pd.DataFrame(records)
meal_df.to_csv("glucose_peaks_by_nutrient.csv", index=False)
print("✅ Saved: glucose_peaks_by_nutrient.csv (one row per meal)")

