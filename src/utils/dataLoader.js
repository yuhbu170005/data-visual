/**
 * dataLoader.js — Utility for loading and parsing datasets
 */

import * as d3 from 'd3';

/**
 * 1. Hàm nạp dữ liệu tổng quát (Generic Loaders)
 * Dùng cho các trường hợp nạp file đơn giản không cần xử lý phức tạp ngay lập tức.
 */
export async function loadCSV(path, rowParser) {
  return d3.csv(path, rowParser);
}

export async function loadJSON(path) {
  return d3.json(path);
}

/**
 * 2. Hàm nạp và làm sạch dữ liệu Listings (Specific Loader)
 * Hàm này thực hiện ép kiểu dữ liệu (parsing) và lọc bỏ các bản ghi lỗi 
 * để các file charts chỉ việc sử dụng dữ liệu "sạch".
 */
export async function loadListingsData() {
  const path = '/data/listings_cleaned.csv';
  
  const raw = await d3.csv(path, d => {
    // Chuyển đổi kiểu dữ liệu số
    const price = parseFloat(d.price);
    const rating = parseFloat(d.review_scores_rating);
    const listings = parseFloat(d.calculated_host_listings_count);
    
    // Xử lý năm linh hoạt các định dạng ngày
    const year = d.host_since ? new Date(d.host_since).getFullYear() : null;

    // Kiểm tra tính hợp lệ của khu vực
    if (!d.neighbourhood_cleansed || d.neighbourhood_cleansed.trim() === '') return null;

    return {
      neighbourhood:  d.neighbourhood_cleansed.trim(),
      roomType:       d.room_type?.trim() || 'Unknown',
      rating:         isNaN(rating) ? null : rating,
      price:          isNaN(price)  ? null : price,
      // Kiểm tra superhost (xử lý nhiều định dạng text khác nhau)
      isSuperhost:    ['TRUE', 'true', 't', '1'].includes(String(d.host_is_superhost).trim()),
      listingsCount:  isNaN(listings) ? 1 : listings,
      // Phân loại chủ nhà
      hostType:       listings <= 1 ? 'Single-host' : 'Multi-host',
      responseTime:   d.host_response_time?.trim() || 'N/A',
      hasAvailability: d.has_availability?.trim() === 't',
      hostId:         d.host_id,
      hostSinceYear:  year,
    };
  });

  // Lọc bỏ các bản ghi null (do hàm rowParser trả về null khi dữ liệu lỗi)
  return raw.filter(Boolean);
}