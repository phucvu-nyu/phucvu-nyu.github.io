// Initialize the map
const map = L.map('map').setView([20, 0], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Color scale for temperatures
const getColor = (temp) => {
    if (temp <= -10) return '#313695';
    if (temp <= 0) return '#4575b4';
    if (temp <= 10) return '#74add1';
    if (temp <= 15) return '#abd9e9';
    if (temp <= 20) return '#fee090';
    if (temp <= 25) return '#fdae61';
    if (temp <= 30) return '#f46d43';
    return '#d73027';
};

// Load and process the data
d3.csv('../assets/station_statistics.csv').then(data => {
    // Process each station
    data.forEach(station => {
        // Create marker with temperature-based color
        const circle = L.circleMarker([
            parseFloat(station.latitude),
            parseFloat(station.longitude)
        ], {
            radius: 8,
            fillColor: getColor(parseFloat(station.mean)),
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });

        // Add popup with station information
        circle.bindPopup(`
            <strong>${station.station}</strong><br>
            Mean: ${parseFloat(station.mean).toFixed(1)}°C<br>
            Median: ${parseFloat(station.median).toFixed(1)}°C<br>
            Min: ${parseFloat(station.min).toFixed(1)}°C<br>
            Max: ${parseFloat(station.max).toFixed(1)}°C<br>
            SD: ${parseFloat(station.sd).toFixed(1)}°C
        `);

        circle.addTo(map);
    });
});
