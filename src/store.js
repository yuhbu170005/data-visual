class Store {
  constructor() {
    this.globalData = [];       // listings_cleaned.csv data
    this.q2Data = [];           // monthly aggregated data (not easily filterable by neighbourhood if already aggregated by borough, wait, Q2 is aggregated by borough)
    this.filters = { neighbourhood: null };
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
      // If filtering by neighbourhood (like "Midtown")
      data = data.filter(d => d.neighbourhood === this.filters.neighbourhood);
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
    const newQ2Data = this.getFilteredQ2Data();
    this.listeners.forEach(callback => callback(newData, newQ2Data));
  }
}

export const store = new Store();
