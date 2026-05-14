import pandas as pd
import json
import os

print("Loading listings data...")
listings = pd.read_csv('public/data/listings_cleaned.csv', usecols=['id', 'neighbourhood_group_cleansed', 'room_type'])
listings.rename(columns={'id': 'listing_id'}, inplace=True)

print("Loading calendar data (this might take a moment)...")
# Process in chunks if memory is an issue, but 500MB is usually fine for pandas.
df_cal = pd.read_csv('public/data/calendar_cleaned.csv', usecols=['listing_id', 'date', 'available'])

print("Merging data...")
df = pd.merge(df_cal, listings, on='listing_id', how='inner')

print("Processing dates...")
df['date'] = pd.to_datetime(df['date'], errors='coerce')
df = df.dropna(subset=['date'])
df['month_year'] = df['date'].dt.to_period('M').astype(str)

print("Aggregating...")
# available: True means available, False means booked
# Group by month, neighbourhood_group_cleansed, room_type
agg = df.groupby(['month_year', 'neighbourhood_group_cleansed', 'room_type']).agg(
    available_count=('available', lambda x: x.sum()),
    booked_count=('available', lambda x: (~x).sum())
).reset_index()

data = []
for _, row in agg.iterrows():
    data.append({
        "month": row['month_year'],
        "neighbourhood": row['neighbourhood_group_cleansed'],
        "roomType": row['room_type'],
        "available": int(row['available_count']),
        "booked": int(row['booked_count'])
    })

output_path = 'public/data/q6_supply_demand.json'
with open(output_path, 'w') as f:
    json.dump(data, f)

print(f"Done! Exported {len(data)} records to {output_path}")
