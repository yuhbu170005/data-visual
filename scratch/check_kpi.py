import csv
total_rev = 0
occupancy_sum = 0
count = 0
with open('public/data/listings_cleaned.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        total_rev += float(row['estimated_revenue_l365d'] or 0)
        occupancy_sum += float(row['estimated_occupancy_l365d'] or 0)
        count += 1
print(f"Total Revenue: {total_rev}")
print(f"Avg Occupancy: {occupancy_sum / count if count > 0 else 0}")
