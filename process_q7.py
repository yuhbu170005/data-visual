import pandas as pd
import json

print("Loading listings data...")
listings = pd.read_csv('public/data/listings_cleaned.csv', usecols=['id', 'reviews_per_month'])
listings['reviews_per_month'] = pd.to_numeric(listings['reviews_per_month'], errors='coerce')
top5_ids = listings.nlargest(5, 'reviews_per_month')['id'].tolist()

print("Loading reviews data...")
reviews = pd.read_csv('public/data/reviews_cleaned.csv', usecols=['listing_id', 'date'])
reviews['date'] = pd.to_datetime(reviews['date'], errors='coerce')

# Filter for Nov 2024 - Oct 2025 and top 5 listings
reviews_period = reviews[
    (reviews['date'] >= '2024-11-01') & 
    (reviews['date'] <= '2025-10-31') &
    (reviews['listing_id'].isin(top5_ids))
].copy()

reviews_period['year_month'] = reviews_period['date'].dt.to_period('M')
reviews_period['month'] = reviews_period['date'].dt.month
reviews_period['year'] = reviews_period['date'].dt.year

agg = reviews_period.groupby(['year_month', 'month', 'year', 'listing_id']).size().reset_index(name='count')

# Get unique year-month combinations in chronological order (Nov 2024 first)
year_months = sorted(reviews_period['year_month'].unique())
month_names_map = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
    5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
    9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
}

# Build data for each month in the period (starting from Nov 2024)
data = []
for ym in year_months:
    period_str = str(ym)  # e.g., "2024-11"
    parts = period_str.split('-')
    year = int(parts[0])
    month = int(parts[1])
    
    month_data = {
        "month": month,
        "year": year,
        "monthName": f"{month_names_map[month]} {year}"
    }
    for lid in top5_ids:
        row = agg[(agg['year_month'] == ym) & (agg['listing_id'] == lid)]
        val = int(row['count'].values[0]) if not row.empty else 0
        month_data[str(lid)] = val
    data.append(month_data)

output_path = 'public/data/q7_reviews_area.json'
with open(output_path, 'w') as f:
    json.dump({
        "listings": [str(x) for x in top5_ids],
        "data": data
    }, f)

print(f"Done! Exported {len(data)} months (Nov 2024 - Oct 2025) for Top 5 listings to {output_path}")
