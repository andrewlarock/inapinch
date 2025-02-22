import React from 'react';
import { useNavigate  } from 'react-router-dom';
import '../css/navbar_lite.css';
import logo from '../css/images/logo.png';

const NavbarLite = ({ isSignedUp }) => {
    const navigate = useNavigate();

    // This function handles navigation back to the home page. Includes handling for a very specific case
    // where if the user never sets their display name after signing up and tries to navigate back to the
    // home page through the navbar, it forces a refresh so the global context can pick it up immediately
    const handleNavigation = () => {
        if (isSignedUp) {
            window.location.href = '/';
        } else {
            navigate('/');
        }
    };

    return (
        <div className="navbar-lite">
            <img src={logo} className="navbar-lite-logo" onClick={handleNavigation}/>
            <div className="navbar-lite-header" onClick={handleNavigation}>In a Pinch</div>
        </div>
    );
};

export default NavbarLite;