import pandas as pd
import json

# Load
cal = pd.read_csv("public/data/calendar_cleaned.csv", low_memory=False)
lst = pd.read_csv("public/data/listings_cleaned.csv", low_memory=False)

# Clean price từ listings
lst['price'] = lst['price'].replace('[\$,]', '', regex=True).astype(float)

# Chỉ giữ cột cần thiết từ listings
lst = lst[['id', 'price', 'neighbourhood_group_cleansed']].dropna()

# Parse date từ calendar
cal['date'] = pd.to_datetime(cal['date'], errors='coerce')
cal['month_index'] = cal['date'].dt.month
cal['month_name']  = cal['date'].dt.strftime('%B')

# Chỉ giữ ngày booked (available == False)
booked = cal[cal['available'] == False].copy()

# Join để lấy price + borough
booked = booked.merge(lst, left_on='listing_id', right_on='id', how='inner')

# Mỗi dòng = 1 ngày booked → revenue = price của ngày đó
booked['daily_rev'] = booked['price']

# Group theo tháng + borough
agg = booked.groupby(
    ['month_index', 'month_name', 'neighbourhood_group_cleansed']
)['daily_rev'].sum().reset_index()

# Pivot
pivot = agg.pivot_table(
    index=['month_index', 'month_name'],
    columns='neighbourhood_group_cleansed',
    values='daily_rev',
    fill_value=0
).reset_index()

pivot.columns.name = None
pivot = pivot.sort_values('month_index')
pivot = pivot.rename(columns={'month_name': 'month'})

# Kiểm tra
boroughs = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island']
pivot['total'] = pivot[boroughs].sum(axis=1)
print(pivot[['month', 'total']].to_string())
print("\nMax tháng cao nhất:", (pivot['total'].max() / 1e6).round(1), "M")

# Export
result = pivot.drop(columns=['total']).to_dict(orient='records')
with open('public/data/q2_monthly.json', 'w') as f:
    json.dump(result, f, indent=2)

print("\nDone.")