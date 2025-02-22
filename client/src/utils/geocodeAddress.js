// Takes the users delivery address string and encodes it into latitude and longitude
export const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {

        // Create a hidden div to use as a container for the PlacesService
        const div = document.createElement('div');
        
        // Initialize the PlacesService with the created div element
        const service = new window.google.maps.places.PlacesService(div);
    
        // Use the textSearch method to search for the users address
        service.textSearch({ query: address }, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                const location = results[0].geometry.location;
                resolve({
                  lat: location.lat(),
                  lng: location.lng(),
                });
            } else {
                console.error("Places Service failed:", status);
                reject(`Geocoding failed: ${status}`);
            }
        });
    });
};

// Extract a city and state from an address. This is for showing the general region where a provider is from
export const extractCityState = (address) => {
  if (!address) return "Unknown Location"; // Handle empty or invalid addresses

  const parts = address.split(",").map(part => part.trim()); // Split by commas and trim spaces

  if (parts.length >= 3) {
      const city = parts[1]; // The second element is ALMOST always the city. For 100% accuracy I would just use API calls with googles geocoding API but we are limited on resources
      const state = parts[2].split(" ")[0]; // The first part of the third element is the state
      return `${city}, ${state}`;
  }

  return "Unknown Location"; // Fallback in case address format is unexpected
};