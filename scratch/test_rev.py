import csv
total_rev = 0
with open('public/data/listings_cleaned.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        price = float(row['price'].replace('$','').replace(',','') or 0)
        avail = float(row['availability_365'] or 365)
        booked_days = 365 - avail
        total_rev += price * booked_days
print(f"Calculated Total Rev: {total_rev}")
