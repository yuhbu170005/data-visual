/**
 * tooltip.js — Reusable tooltip component
 *
 * Một tooltip nhẹ, có thể gắn vào bất kỳ biểu đồ D3 nào. 
 * Nó sẽ đi theo con trỏ chuột và hiển thị chi tiết dữ liệu.
 */

/**
 * Tạo và quản lý một phần tử tooltip lơ lửng.
 *
 * @returns {{ show: Function, move: Function, hide: Function, remove: Function }}
 */
export function createTooltip() {
  // Tạo phần tử div cho tooltip nếu chưa tồn tại
  let tip = document.querySelector('.tooltip');
  
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'tooltip';
    document.body.appendChild(tip);
  }

  return {
    /**
     * Hiển thị tooltip với nội dung HTML tại vị trí chuột.
     * @param {MouseEvent} event - Sự kiện chuột từ D3
     * @param {string} html - Nội dung HTML muốn hiển thị
     */
    show(event, html) {
      tip.innerHTML = html;
      tip.classList.add('visible');
      this.move(event);
    },

    /**
     * Cập nhật vị trí của tooltip theo con trỏ chuột.
     * @param {MouseEvent} event - Sự kiện chuột từ D3
     */
    move(event) {
      // Offset 14px để tránh tooltip đè lên con trỏ chuột
      const x = event.clientX + 14;
      const y = event.clientY - 10;
      
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
      
      // Kiểm tra nếu tooltip bị tràn mép phải màn hình
      const tipRect = tip.getBoundingClientRect();
      if (x + tipRect.width > window.innerWidth) {
        tip.style.left = `${event.clientX - tipRect.width - 14}px`;
      }
    },

    /**
     * Ẩn tooltip.
     */
    hide() {
      tip.classList.remove('visible');
    },

    /**
     * Xóa hoàn toàn phần tử tooltip khỏi DOM (Dùng khi hủy component).
     */
    remove() {
      if (tip && tip.parentNode) {
        tip.parentNode.removeChild(tip);
      }
    }
  };
}