import React, { useState, useEffect } from 'react';
import { auth } from "../auth/firebase";
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from "../context/NotificationContext";
import Navbar from '../components/Navbar';
import Loading from '../components/LoadingPage';
import Footer from '../components/Footer';
import '../css/account.css';
import display from '../css/images/display.png';
import email from '../css/images/email.png';
import password from '../css/images/password.png';
import pin from '../css/images/pin-dark.png';
import right from '../css/images/right.png';
import signout from '../css/images/signout.png';

function Account() {
    const { user, userDetails, loading } = useAuth();
    const navigate = useNavigate();
    const { addNotification } = useNotification();

    // Makes sure users are authenticated before being able to access their profile
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, userDetails, loading, navigate]);

    // Hide email/password settings for users already signed up through google
    const isGoogleUser = user?.providerData.some(
        (provider) => provider.providerId === 'google.com'
    );

    const handleSignout = async () => {
        try {
            await signOut(auth);
            navigate("/");
            addNotification("You have been successfully signed out!")
        } catch (error) {
            console.error('Error during sign-out:', error.message);
        }
    };

    // Show loading page while the profile is being retrieved
    if (loading || !user) {
        return <Loading />;
    }

    return (
        <div>
            <Navbar />
            <div className='account-header-container'>
                <div className='account-header'>My Profile</div>
                <div className='account-subheader'>{user.displayName}</div>
            </div>
            <div className='account-body-container'>
                <div className='account-body-header'>Basic Information & Security</div>

                <div className='account-option-container' onClick={() => navigate('/account/change-name')}>
                    <div className='circle-container'>
                        <img src={display}/>
                    </div>
                    <div className='account-option-text-container'>
                        <div className='account-option-header'>Name</div>
                        <div className='account-option-subheader'>{user.displayName}</div>
                    </div>
                    <img src={right} className="arrow-right"/>
                </div>

                {!isGoogleUser && (
                    <>
                    <div className='account-option-container' onClick={() => navigate('/account/change-email')}>
                        <div className='circle-container'>
                            <img src={email}/>
                        </div>
                        <div className='account-option-text-container'>
                            <div className='account-option-header'>Email Address</div>
                            <div className='account-option-subheader'>{user.email}</div>
                        </div>
                        <img src={right} className="arrow-right"/>
                    </div>

                    <div className='account-option-container' onClick={() => navigate('/account/change-pass')}>
                        <div className='circle-container'>
                            <img src={password}/>
                        </div>
                        <div className='account-option-text-container'>
                            <div className='account-option-header'>Password</div>
                            <div className='account-option-subheader'>************</div>
                        </div>
                        <img src={right} className="arrow-right"/>
                    </div>
                    </>
                )}

                <div className='account-body-header'>Data</div>
                <div className='account-option-container-no-margin' onClick={() => navigate('/account/change-address')}>
                    <div className='circle-container'>
                        <img src={pin}/>
                    </div>
                    <div className='account-option-text-container'>
                        <div className='account-option-header'>My Home</div>
                        <div className='account-option-subheader'>{userDetails.homeAddress ? userDetails.homeAddress : 'Not set'}</div>
                    </div>
                    <img src={right} className="arrow-right"/>
                </div>
            </div>

            <div className='account-mini-body-container'>
                <div className='account-option-container-no-margin' onClick={handleSignout}>
                    <div className='circle-container'>
                        <img src={signout}/>
                    </div>
                    <div className='account-option-text-container'>
                        <div className='account-option-header'>Sign Out</div>
                    </div>
                    <img src={right} className="arrow-right"/>
                </div>
            </div>

            <Footer />
        </div>
        
    );
}

export default Account;