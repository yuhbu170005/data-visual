class Store {
  constructor() {
    this.globalData = [];
    this.filters = { neighbourhood: null, roomType: null };
    this.listeners = [];
  }

  setData(data) {
    this.globalData = data;
  }

  setQ2Data(q2Data) {
    this.q2Data = q2Data;
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  setFilter(key, value) {
    if (this.filters[key] === value) {
      this.filters[key] = null;
    } else {
      this.filters[key] = value;
    }
    this.notify();
  }

  getFilteredData() {
    let data = this.globalData;
    if (this.filters.neighbourhood) {
      data = data.filter(d => d.neighbourhood === this.filters.neighbourhood);
    }
    if (this.filters.roomType) {
      data = data.filter(d => d.roomType === this.filters.roomType);
    }
    return data;
  }

  getFilteredQ2Data() {
    let data = this.q2Data;
    // Q2 data is grouped by borough (Bronx, Brooklyn, Manhattan, Queens, Staten Island).
    // If the selected neighbourhood belongs to a specific borough, we can't easily filter it since Q2 doesn't have neighbourhood info!
    // But we can filter by the Borough if we had it. 
    // For now, if we just want to demonstrate cross-filtering:
    return data;
  }

  notify() {
    const newData = this.getFilteredData();
    this.listeners.forEach(callback => callback(newData, this.filters));
  }
}

export const store = new Store();
