import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { geocodeAddress } from '../utils/geocodeAddress';
import { initializeAutocompleteService, getAddressSuggestions } from '../utils/addressAutocomplete';
import { useNotification } from "../context/NotificationContext";
import '../css/home.css';
import logo from '../css/images/logo.png';
import lawn from '../css/images/lawn.png';
import snow from '../css/images/snow.png';
import calendar from '../css/images/calendar.png';
import landscape from '../css/images/landscape.png';
import lawnmower from '../css/images/lawnmower.png';
import edging from '../css/images/edging.png';
import snow_cloud from '../css/images/snow_cloud.png';
import earn from '../css/images/earn.png';
import work from '../css/images/work.png';
import impact from '../css/images/impact.png';
import safety from '../css/images/safety.png';
import feedback from '../css/images/feedback.png';
import youtube from '../css/images/youtube.png';

function Home() {
    const [selectedType, setSelectedType] = useState("Lawn Care");
    const [address, setAddress] = useState("");
    const [addressSelected, setAddressSelected] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [mapCenter, setMapCenter] = useState(null);
    const [mapZoom, setMapZoom] = useState(14);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const navigate = useNavigate();
    const autocompleteService = useRef(null);
    const { userDetails, loading } = useAuth();
    const { addNotification } = useNotification();

    // Function to pre-fill the address input box if the user has set a home address
    useEffect(() => {
        if (!loading && userDetails.homeAddress) {
            setAddress(userDetails.homeAddress);
            setMapCenter({lat: userDetails.homeCoords.lat, lng: userDetails.homeCoords.lon})
            setMapZoom(16);
            setAddressSelected(true);
        } else if (!loading && !userDetails.homeAddress) {
            setMapCenter({ lat: 40.7128, lng: -74.0060 }) // the default map will just show NYC
        }
    }, [userDetails.homeAddress]);

    // Initialize the address autocomplete function from Google API
    useEffect(() => {
        autocompleteService.current = initializeAutocompleteService();
        if (!autocompleteService.current) {
            console.error("Google Maps API not loaded or missing required libraries.");
        }
    }, []);

    // Handle providing the address suggestions when the user types into the address field
    const handleAddressChange = async (value) => {
        setAddress(value);
        setAddressSelected(false);

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
    const handleSuggestionClick = async (suggestion) => {
        setAddress(suggestion);
        setAddressSelected(true);
        setDropdownVisible(false);
        setSuggestions([]);
        const coords = await geocodeAddress(suggestion);
        setMapCenter({ lat: coords.lat, lng: coords.lng })
        setMapZoom(16);
    };

    // Function to navigate when the "Go" button is clicked, routing the user to the request service page
    // with the values they inputted
    const handleGoClick = () => {
        if (address.trim() && addressSelected) {
            navigate('/request', { state: { address, selectedType } });
            window.scrollTo(0, 0);
        } else {
            addNotification("Please select an address before continuing")
        }
    };

    return (
        <div>
            <Navbar selectedType={selectedType}/>
            <div className={selectedType === 'Snow Removal' ? 'home-container-snow' : 'home-container-lawn'}>
                <img src={logo} className="home-logo" />
                <div className="home-header">In<span style={{ fontSize: '60%', lineHeight: '1' }}> </span>a<span style={{ fontSize: '60%', lineHeight: '1' }}> </span>Pinch</div>
                <div className="home-subheader">Fast, Reliable Residential Landscaping, Whenever You Need It.</div>
                
                <div className='search-container'>
                <input
                    type="text"
                    placeholder="Enter Your Address to Get Started"
                    className="home-search-bar"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                />

                {isDropdownVisible && (
                    <ul className="home-autocomplete-dropdown">
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
                
                </div>
                <div className='home-selection-container'>
                    <div className="option-container">
                        <div
                        className={`selectable-button ${selectedType === "Lawn Care" ? 'selected' : ''}`}
                        onClick={() => setSelectedType("Lawn Care")}
                        >
                            <img src={lawn} className="button-icon" />
                            <span>Lawn Care</span>
                        </div>
                        <div
                        className={`selectable-button ${selectedType === "Snow Removal" ? 'selected' : ''}`}
                        onClick={() => setSelectedType("Snow Removal")}
                        >
                            <img src={snow} className="button-icon" />
                            <span>Snow Removal</span>
                        </div>
                    </div>
                        <div className='go-button-text' onClick={handleGoClick}>Go</div>
                </div>
                <Map center={mapCenter} zoom={mapZoom} isScrollable={true} className={'map-container'}/>
            </div>

            <div className="home-info-container">
                <div className="home-info-wrapper">

                    {/* Clickable youTube thumbnail for demo video */}
                    <div className="thumbnail-header-container">
                        <img src={youtube} className="click-icon" />
                        <div className="thumbnail-header-text">See How It Works!</div>
                    </div>
                    <div className="thumbnail-subheader-text">Watch a Quick Demo Below</div>
                    <div className="video-thumbnail-container">
                        <a href="https://www.youtube.com/watch?v=H0Y_L142oF0" target="_blank" rel="noopener noreferrer">
                            <img 
                                src="https://img.youtube.com/vi/H0Y_L142oF0/maxresdefault.jpg" 
                                alt="Watch Video on YouTube" 
                                className="video-thumbnail"
                            />
                            <div className="play-button-overlay"></div>
                        </a>
                    </div>

                    <div className="divider"></div>

                    <div className="home-info-text-container">
                        <div className="home-info-header-left-aligned">On-demand Lawn<br></br> Care and Snow <br></br>Removal, Made Easy.</div>
                        <img src={landscape} className="home-info-image-left-aligned" />
                    </div>
                    <div className="home-info-subheader-left-aligned">Request residential lawn care or snow removal, and get matched with local landscapers ready to help.</div>

                    <div className="side-info-container">
                        <img src={lawnmower} className="side-info-image" />
                        <div className="side-info-text">Lawn Trimming</div>
                    </div>
                    <div className="side-info-container">
                        <img src={edging} className="side-info-image" />
                        <div className="side-info-text">Lawn Edging</div>
                    </div>
                    <div className="side-info-container">
                        <img src={snow_cloud} className="side-info-image" />
                        <div className="side-info-text">Driveway & Sidewalk Snow Clearing</div>
                    </div>

                    <div className="home-info-text-container-right-aligned">
                        <img src={calendar} className="home-info-image-right-aligned" />
                        <div className="home-info-header-right-aligned">Get Help Fast or <br></br>Schedule at Your <br></br>Convenience.</div>
                    </div>
                    <div className="home-info-subheader-right-aligned">Need help right away? We offer ASAP service for urgent situations, like clearing snow to help a loved one. Or, schedule in advance for tasks like lawn prep.</div>
                    
                    <div className="divider"></div>

                    <div className="provider-header-text">Become a Provider with In a Pinch</div>
                    <div className="provider-subheader-text">Set your own schedule, grow your own earnings</div>

                    <div className="provider-info-container">
                        <div className="provider-info-text-container">
                            <img src={earn} className="provider-info-image" />
                            <div className="provider-info-header">Earn What You Deserve</div>
                        </div>
                        <div className="provider-info-subheader">Keep 100% of your earnings and tips, with no hidden fees.</div>
                    </div>

                    <div className="provider-info-container">
                        <div className="provider-info-text-container">
                            <img src={work} className="provider-info-image" />
                            <div className="provider-info-header">Work on Your Terms</div>
                        </div>
                        <div className="provider-info-subheader">Choose when and how often you work—flexibility at its best.</div>
                    </div>

                    <div className="provider-info-container">
                        <div className="provider-info-text-container">
                            <img src={impact} className="provider-info-image" />
                            <div className="provider-info-header">Give Back While You Earn</div>
                        </div>
                        <div className="provider-info-subheader">Help your neighbors and make a positive impact, all while getting paid.</div>
                    </div>
                    <button className="get-started-button" onClick={() => navigate("/apply")}>Get Started Today!</button>

                    <div className="divider"></div>

                    <img src={safety} className="bottom-info-image" />
                    <div className="bottom-info-header-text">Reliable, Vetted Providers.</div>
                    <div className="bottom-info-subheader-text">All our providers are carefully vetted to ensure they have the right equipment to deliver reliable service every time.</div>
                    
                    <img src={feedback} className="bottom-info-image" />
                    <div className="bottom-info-header-text">Trust Through Feedback.</div>
                    <div className="bottom-info-subheader-text">Our rating system lets you see real reviews from others, giving you confidence in the providers delivering your service.</div>
                    
                    <div className="bottom-divider"></div>

                </div>
            </div>

            <Footer selectedType={selectedType}/>

        </div>
    );
}

export default Home;