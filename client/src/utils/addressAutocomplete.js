// Uitilize googles autocomplete service for addresses to help the user select an address
export const initializeAutocompleteService = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      return new window.google.maps.places.AutocompleteService();
    }
    return null;
  };
  
export const getAddressSuggestions = (service, input) => {
    return new Promise((resolve, reject) => {
    if (!service || !input.trim()) {
        resolve([]);
        return;
    }

    service.getPlacePredictions({ input, types: ['address'] }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        resolve(predictions.map((p) => p.description));
        } else {
        resolve([]);
        }
    });
    });
};