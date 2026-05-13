import pandas as pd

df = pd.read_csv("public/data/listings_cleaned.csv")
print(df.columns.tolist())           # xem tất cả tên cột
print(df.dtypes)                     # xem kiểu dữ liệu
# Tìm cột có chứa "date" hoặc "review"
date_cols = [c for c in df.columns if 'date' in c.lower() or 'review' in c.lower()]
print("Date-related columns:", date_cols)