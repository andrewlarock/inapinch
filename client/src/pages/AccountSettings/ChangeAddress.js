import React, { useState, useEffect, useRef } from 'react';
import { auth } from "../../auth/firebase";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Loading from '../../components/LoadingPage';
import { useNotification } from "../../context/NotificationContext";
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { initializeAutocompleteService, getAddressSuggestions } from '../../utils/addressAutocomplete';
import { geocodeAddress } from '../../utils/geocodeAddress';
import '../../css/signup.css';

function ChangeAddress() {
    const { user, loading, userDetails } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [address, setAddress] = useState("");
    const [addressSelected, setAddressSelected] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const db = getFirestore();
    const autocompleteService = useRef(null);
    const { addNotification } = useNotification();

    // Makes sure users are authenticated before being able to access a page related to their profile
    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            }
        }
    }, [user, loading, navigate]);

    // Pre-fill the form if the user already has a homeAddress stored
    useEffect(() => {
        if (userDetails.homeAddress) {
            setAddress(userDetails.homeAddress);
            setAddressSelected(true);
        }
    
    }, [userDetails]);

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
        setDropdownVisible(false);
        setSuggestions([]);
    };

    // Show loading page while the profile is being retrieved
    if (loading || !user) {
        return <Loading />;
    }

    const handleSubmit = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setError("No user is signed in. Please try signing in again.");
                return;
            }
    
            // Validate that none of the fields are blank before continuing
            if (!address.trim()) {
                setError("Please select an address from the dropdown.");
                return;
            }
    
            if (!addressSelected) {
                setError("Please select an address from the dropdown.");
                return;
            }

            // Geocode the home address to get lat/lon. This is so we can input the coordinates into a map
            // to show the user when requesting service
            const coords = await geocodeAddress(address);
    
            // Update homeAddress and homeCoords in firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                homeAddress: address,
                homeCoords: { lat: coords.lat, lon: coords.lng },
            });
    
            addNotification("Home address updated successfully!")
            setError("");
        } catch (err) {
            console.error("Error updating home address:", err.message);
            setError("Failed to update home address. Please try again.");
        }
    };

    const handleClear = async () => {
        try {
            // Reset the address input
            setAddress("");
            setAddressSelected(false);
    
            // Clear homeAddress and homeCoords in firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                homeAddress: "",
                homeCoords: {},
            });
        
            addNotification("Home address cleared successfully!")
            setError("");
        } catch (err) {
            console.error("Error clearing home address:", err.message);
            setError("Failed to clear home address. Please try again.");
        }
    };


    return (
        <div>
            <Navbar />
            <div className='signup-body'>
                <div className='signup-header'>Home Address</div>
                <div className='signup-subheader'>Update the home address associated with your account. This will be used to auto-fill your home address when requesting service.</div>
                <div className='signup-subheader'>Current Address: <b>{userDetails.homeAddress ? userDetails.homeAddress : "No address set"}</b></div>
                
                <div className="signup-input-header">Home Address</div>
                <input
                type="text"
                placeholder="Enter your home address"
                className="request-input"
                value={address}
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

                {error && <div className="email-error-message" style={{marginBottom: '.45rem'}}>{error}</div>}

                <div className='two-buttons-container'>
                    <div className='request-back-button' onClick={handleClear}>
                        <div className='request-back-button-text'>Clear</div>
                    </div>
                    <div className='request-forward-button' onClick={handleSubmit}>
                        <div className='request-forward-button-text'>Update</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChangeAddress;