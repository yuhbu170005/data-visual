import pandas as pd
import numpy as np

# Use the cleaned listings file
df = pd.read_csv("public/data/listings_cleaned.csv", low_memory=False)

# Loại bỏ outlier giá
df['price'] = df['price'].replace('[\$,]', '', regex=True).astype(float) # Ensure price is numeric
df = df[df['price'] > 0]
df = df[df['price'] < df['price'].quantile(0.99)]

# Tạo est_rev_monthly
df['occupancy_rate']  = (365 - df['availability_365']) / 365
df['est_rev_monthly'] = df['price'] * df['occupancy_rate'] * 30

# Tạo accommodates_segment
df['size_segment'] = pd.cut(
    df['accommodates'],
    bins=[0, 2, 4, 99],
    labels=['Small (1–2)', 'Medium (3–4)', 'Large (5+)']
)

# Giữ lại 4 room_type chính
df = df[df['room_type'].isin([
    'Entire home/apt', 'Private room', 'Shared room', 'Hotel room'
])]

# Export JSON cho D3
agg = df.groupby(['room_type', 'size_segment'], observed=True).agg(
    avg_price        = ('price', 'mean'),
    avg_occupancy    = ('occupancy_rate', 'mean'),
    avg_est_rev_monthly = ('est_rev_monthly', 'mean'),
    listing_count    = ('id', 'count'),
    avg_reviews_pm   = ('reviews_per_month', 'mean')
).reset_index()

agg.to_json("public/data/q3_agg.json", orient='records')
print("q3_agg.json has been created in public/data/")
