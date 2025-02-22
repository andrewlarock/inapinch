import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/navbar.css';
import menu from '../css/images/menu.png';
import close from '../css/images/close.png';
import logo from '../css/images/logo.png';

const Navbar = ( {selectedType} ) => {
    const { user, isProvider } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const firstName = user?.displayName?.split(' ')[0] || ''; // Extract users first name for a welcome message
    const greeting = user?.displayName?.length >= 12 ? 'Hello, ' : 'Hey, '; // This is a way of conserving space on the navbar for long names
    const isActive = (path) => location.pathname === path ? 'active' : ''; // Check the users path to mark it accordingly on the navbar

    const providerButtonPage = location.pathname === '/' || location.pathname === '/provider/profile' || location.pathname === '/provider/my-jobs' || location.pathname === '/provider/available';
    const isProviderPage = location.pathname === '/provider'; // Signify that the user is on a provider page when their route is /provider

    // Make sure the user cant scroll the page when the menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [isMenuOpen]);

    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
      <div>
        {user ? ( // Authenticated navbar
          <>
            <div className={selectedType === 'Snow Removal' ? 'navbar-blue' : 'navbar'}> {/* Turn the navbar blue when the user selects Snow Removal on the home page */}
              {providerButtonPage ? ( // Conditionally load a "Become a Provider" button on certain pages. If the user is a provider, this Become a Provider button turns into a link to the provider dashboard
                <div className="navbar-left">
                  <button className="provider-button" onClick={() => navigate(isProvider ? '/provider' : '/apply')}>
                    {isProvider ? 'Provider Dashboard' : 'Become a Provider!'}
                  </button>
                </div>
              ) : (
                <div className="navbar-left" style={{ paddingLeft: '0' }}>
                  <img src={logo} className="navbar-lite-logo" onClick={() => navigate('/')}/>
                  <div className="navbar-lite-header" onClick={() => navigate('/')}>In a Pinch {isProviderPage && <span className="navbar-provider-text">Provider</span>}</div>
                </div>
              )}
                <div className="navbar-right">
                  <div className="welcome-text">{greeting}{firstName}!</div>
                  <img src={isMenuOpen ? close : menu} className={isMenuOpen ? 'navbar-close-logo' : 'navbar-menu-logo'} onClick={() => setIsMenuOpen((prev) => !prev)}/>
                </div>
            </div>
            <div className={`open-menu-container ${isMenuOpen ? 'open' : ''}`}>
                <div className={`open-menu ${isMenuOpen ? 'open' : ''}`}>
                  <div className={`menu-option ${isActive('/')}`} onClick={() => handleNavigate('/')}>Home</div>
                  <div className={`menu-option ${isActive('/orders')}`} onClick={() => handleNavigate('/orders')}>My Orders</div>
                  <div className={`menu-option ${isActive('/request')}`} onClick={() => handleNavigate('/request')}>Request Service</div>
                  {isProvider && (<div className={`menu-option ${isActive('/provider')}`} onClick={() => handleNavigate('/provider')}>Provider Dash</div>)}
                  <div className={`menu-option ${isActive('/account')}`} onClick={() => handleNavigate('/account')}>My Profile</div>
                  <div className="menu-user" onClick={() => handleNavigate('/account')}>{user.displayName}</div>
                </div>
            </div>
          </>
        ) : ( // Default navbar for unauthenticated users
          <>
            <div className={selectedType === 'Snow Removal' ? 'navbar-blue' : 'navbar'}> {/* Turn the navbar blue when the user selects Snow Removal on the home page */}
              {providerButtonPage ? ( // Conditionally load a "Become a Provider" button on certain pages. If the user is a provider, this Become a Provider button turns into a link to the provider dashboard
                <div className="navbar-left">
                  <button className="provider-button" onClick={() => navigate('/login')}>Become a Provider!</button>
                </div>
              ) : (
                <div className="navbar-left" style={{ paddingLeft: '0' }}>
                  <img src={logo} className="navbar-logo" onClick={() => navigate('/')}/>
                    <div className="navbar-logo-header" onClick={() => navigate('/')}>In a Pinch</div>
                  </div>
              )}
                <div className="navbar-right">
                  <button className="login-button" onClick={() => navigate('/login')}>Login</button>
                  <button className="signup-button" onClick={() => navigate('/signup')}>Sign Up</button>
                </div>
            </div>
          </>
        )}
      </div>
    );
};

export default Navbar;