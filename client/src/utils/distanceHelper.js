// Function to calculate the distance in miles between two sets of coordinates. Uses the haversine formula
const getDistanceInMiles = (coord1, coord2) => {
    // Radius of Earth in miles
    const R = 3958.8; 

    // Convert degrees to radians
    const lat1 = coord1.lat * (Math.PI / 180);
    const lon1 = coord1.lon * (Math.PI / 180);
    const lat2 = coord2.lat * (Math.PI / 180);
    const lon2 = coord2.lon * (Math.PI / 180);

    // Haversine formula
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in miles
    const distance = R * c;

    return parseFloat(distance.toFixed(1));
};

export default getDistanceInMiles;