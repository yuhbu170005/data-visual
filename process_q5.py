import pandas as pd
import json

print("Loading listings data...")
df = pd.read_csv('public/data/listings_cleaned.csv', usecols=[
    'id', 'price', 'estimated_revenue_l365d', 'room_type', 
    'neighbourhood_group_cleansed', 'number_of_reviews', 'estimated_occupancy_l365d'
])

print("Processing...")
# Convert numeric columns
for col in ['price', 'estimated_revenue_l365d', 'number_of_reviews', 'estimated_occupancy_l365d']:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Filter valid entries
df = df.dropna(subset=['price', 'estimated_revenue_l365d', 'room_type', 'neighbourhood_group_cleansed'])
df = df[(df['price'] > 0) & (df['estimated_revenue_l365d'] >= 0)]

# Giới hạn dữ liệu để tránh biểu đồ quá nặng, hoặc có thể lấy toàn bộ nhưng bỏ bớt outlier lố bịch
# Bỏ những listing có giá > 2000 để biểu đồ scatter plot dễ nhìn hơn (zoom scale)
df = df[df['price'] <= 2000]

# Chọn ngẫu nhiên 5000 listings nếu dữ liệu quá lớn, hoặc lấy những listing có reviews > 0
df_filtered = df[df['number_of_reviews'] > 0]
if len(df_filtered) > 6000:
    # Lấy 6000 listing phổ biến nhất (nhiều review nhất)
    df_filtered = df_filtered.sort_values('number_of_reviews', ascending=False).head(6000)

data = []
for _, row in df_filtered.iterrows():
    data.append({
        "id": str(row['id']),
        "price": float(row['price']),
        "revenue": float(row['estimated_revenue_l365d']),
        "roomType": row['room_type'],
        "neighbourhood": row['neighbourhood_group_cleansed'],
        "reviews": int(row['number_of_reviews']),
        "occupancy": float(row['estimated_occupancy_l365d']) if pd.notnull(row['estimated_occupancy_l365d']) else 0
    })

output_path = 'public/data/q5_scatter.json'
with open(output_path, 'w') as f:
    json.dump(data, f)

print(f"Exported {len(data)} items to {output_path}")
