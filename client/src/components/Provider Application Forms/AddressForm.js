import React, { useState, useEffect, useRef } from 'react';
import { initializeAutocompleteService, getAddressSuggestions } from '../../utils/addressAutocomplete';
import { geocodeAddress } from '../../utils/geocodeAddress';
import '../../css/request.css';

// This is the form that asks the user the address from which they will be providing services.

const AddressForm = ({data, updateFormData, onNext, onBack}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [providerAddress, setProviderAddress] = useState("");
    const [addressSelected, setAddressSelected] = useState(false);
    const [error, setError] = useState("");
    const autocompleteService = useRef(null);

    // Pre-fill the form if the user has already filled their providerAddress out
    useEffect(() => {
        if (data.providerAddress) {
            setProviderAddress(data.providerAddress);
            setAddressSelected(true);
        }
    
    }, [data.providerAddress]);

    // Initialize the address autocomplete function from Google API
    useEffect(() => {
        autocompleteService.current = initializeAutocompleteService();
        if (!autocompleteService.current) {
            console.error("Google Maps API not loaded or missing required libraries.");
        }
    }, []);

    // Handle providing the address suggestions when the user types
    const handleAddressChange = async (value) => {
        setAddressSelected(false);
        setProviderAddress(value);

        if (!value.trim()) {
            setSuggestions([]);
            setDropdownVisible(false);
            return;
        }

        // Use the utility function to fetch suggestions
        try {
            const results = await getAddressSuggestions(autocompleteService.current, value);
            setSuggestions(results);
            setDropdownVisible(results.length > 0);
        } catch (err) {
            console.error("Error fetching address suggestions:", err);
            setSuggestions([]);
            setDropdownVisible(false);
        }
    };

    // Handle the user clicking an address from the suggestion dropdown
    const handleSuggestionClick = (suggestion) => {
        setAddressSelected(true);
        setProviderAddress(suggestion);
        updateFormData("providerAddress", suggestion);
        setDropdownVisible(false);
        setSuggestions([]);
    };

    const handleSubmit = async () => {
        // Validate that none of the fields are blank before continuing
        if (!providerAddress.trim()) {
            setError("Please don't leave any of the fields blank before continuing.")
            return;
        }

        if (!addressSelected) {
            setError("Please select an address from the dropdown.")
            return;
        }

        // Get lat/lon from geocodeAddress function. this is so we can store it and efficiently calculate
        // the distance between the provider and available jobs in the future
        try {
            const coords = await geocodeAddress(providerAddress);
            updateFormData("providerCoords", {lat: coords.lat, lon: coords.lng});
            setError("");
            onNext();
        } catch (error) {
            console.error("Error getting coordinates:", error);
        }
    };

    return (
        <div className='request-body'>
            <div className='request-header'>Apply to Become a Provider</div>
            <div className='request-subheader'>Please provide the address where you are based to continue.</div>

            <div className="request-input-header">Provider Address</div>
            <input
                type="text"
                placeholder="Enter the delivery address"
                className="request-input"
                value={providerAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
            />

            {isDropdownVisible && (
                <ul className="autocomplete-dropdown">
                    {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </li>
                        ))
                    ) : (
                        <li>No suggestions available</li>
                    )}
                </ul>
            )}

            {error && <div className="form-error-message">{error}</div>}

            <div className='two-buttons-container'>
                <div className='request-back-button' onClick={onBack}>
                    <div className='request-back-button-text'>Back</div>
                </div>
                <div className='request-forward-button' onClick={handleSubmit}>
                    <div className='request-forward-button-text'>Continue</div>
                </div>
            </div>

        </div>
    );
}

export default AddressForm;