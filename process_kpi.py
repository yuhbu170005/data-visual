import pandas as pd
import json

print("Loading data...")
lst = pd.read_csv("public/data/listings_cleaned.csv", low_memory=False)

# Clean price
lst['price'] = lst['price'].replace('[\$,]', '', regex=True).astype(float)
lst = lst[lst['price'] > 0]

# Occupancy rate calculation
lst['occupancy_rate'] = (365 - lst['availability_365']) / 365
avg_occupancy = lst['occupancy_rate'].mean()

total_listings = len(lst)

# Load calendar to compute precise total revenue
cal = pd.read_csv("public/data/calendar_cleaned.csv", low_memory=False)
booked = cal[cal['available'] == False].copy()

# Join with listings to get the price per day
booked = booked.merge(lst[['id', 'price']], left_on='listing_id', right_on='id', how='inner')

total_est_rev = booked['price'].sum()

kpi_data = {
    "total_listings": int(total_listings),
    "total_est_rev": float(total_est_rev),
    "occupancy_rate": float(avg_occupancy)
}

with open("public/data/kpi.json", "w") as f:
    json.dump(kpi_data, f, indent=2)

print("\nKPI Data calculated successfully:")
print(f"Total Listings: {kpi_data['total_listings']:,}")
print(f"Total Est Rev: ${kpi_data['total_est_rev']:,.2f}")
print(f"Average Occupancy Rate: {kpi_data['occupancy_rate']:.2%}")
