import React, { useState, useEffect, useRef } from 'react';
import { initializeAutocompleteService, getAddressSuggestions } from '../../utils/addressAutocomplete';
import { geocodeAddress } from '../../utils/geocodeAddress';
import '../../css/request.css';

// These are the forms the user are presented with when requesting service. This is the starting form,
// and then the subsequent data is passed throught the child components to the parent to make the api
// call to request the service

const Starting = ({data, updateFormData, onNext}) => {
    const [selectedType, setSelectedType] = useState('Lawn Care');
    const [suggestions, setSuggestions] = useState([]);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [address, setAddress] = useState("");
    const [addressSelected, setAddressSelected] = useState(false);
    const [error, setError] = useState("");
    const autocompleteService = useRef(null);

    // Pre-fill the form if the user has already filled it out
    useEffect(() => {
        // Pre-fill job type
        if (data.job_type === "Snow Removal") {
            setSelectedType('Snow Removal');
        } else {
            setSelectedType('Lawn Care');
        }

        // Pre-fill delivery address
        if (data.delivery_address) {
            setAddress(data.delivery_address);
            setAddressSelected(true);
        }
    
    }, [data.job_type, data.delivery_address]);

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
        setAddress(value);

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
        setAddress(suggestion);
        updateFormData("delivery_address", suggestion);
        setDropdownVisible(false);
        setSuggestions([]);
    };

    // Handle the toggling between lawn care and snow removal. Every time the user toggles between these
    // two, it resets the entire form
    const handleTypeToggle = (type) => {
        updateFormData("job_type", type);
        updateFormData("job_details", []);
        updateFormData("custom_instructions", "");
        updateFormData("scheduled_type", "");
        updateFormData("scheduled_time", "");
        updateFormData("size", "");
        updateFormData("before_photos", []);
    };

    const handleSubmit = async () => {
        // Validate that none of the fields are blank before continuing
        if (!address.trim()) {
            setError("Please don't leave any of the fields blank before continuing.")
            return;
        }

        if (!addressSelected) {
            setError("Please select an address from the dropdown.")
            return;
        }

        // Get lat/lon from geocodeAddress function. this is so we can store it and efficiently calculate
        // the distance to show the provider the distance between them and this job
        try {
            const coords = await geocodeAddress(address);
            updateFormData("delivery_coords", {lat: coords.lat, lon: coords.lng});
            setError("");
            onNext();
        } catch (error) {
            setError(`Error getting coordinates, please try again: ${error}`);
        }
    };

    return (
        <div className='request-body'>
            <div className='request-header'>Request a Service with In a Pinch</div>
            <div className='request-subheader'>Please confirm the type of service you'd like to request and the address where the service will be delivered.</div>

            <div className="toggle-type-container">
                <div
                    className={`toggle-type-button ${selectedType === 'Lawn Care' ? 'active' : ''}`}
                    onClick={() => handleTypeToggle('Lawn Care')}
                >
                    Lawn Care
                </div>
                <div
                    className={`toggle-type-button ${selectedType === 'Snow Removal' ? 'active' : ''}`}
                    onClick={() => handleTypeToggle('Snow Removal')}
                >
                    Snow Removal
                </div>
            </div>

            <div className="request-input-header">Delivery Address</div>
            <input
                type="text"
                placeholder="Enter the delivery address"
                className="request-input"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)} // Update parent state
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

            <div className='request-continue-button' onClick={handleSubmit}>
                <div className='request-continue-button-text'>Continue</div>
            </div>

        </div>
    );
}

export default Starting;