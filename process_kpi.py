import pandas as pd
import json

print("Loading data...")
lst = pd.read_csv("public/data/listings_cleaned.csv", low_memory=False)

# Clean price for listings that have it
lst['price'] = lst['price'].replace(r'[\$,]', '', regex=True).astype(float, errors='ignore')
lst['price'] = pd.to_numeric(lst['price'], errors='coerce')

# Total listings = ALL listings (not filtered by price)
total_listings = len(lst)

# Occupancy rate calculation for all listings
lst['occupancy_rate'] = (365 - lst['availability_365']) / 365
avg_occupancy = lst['occupancy_rate'].mean()

# Load calendar to compute precise total revenue (using only listings with valid price)
cal = pd.read_csv("public/data/calendar_cleaned.csv", low_memory=False)
booked = cal[cal['available'] == False].copy()

# Filter listings with price for revenue calculation
lst_with_price = lst[lst['price'] > 0].copy()
booked = booked.merge(lst_with_price[['id', 'price']], left_on='listing_id', right_on='id', how='inner')

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
