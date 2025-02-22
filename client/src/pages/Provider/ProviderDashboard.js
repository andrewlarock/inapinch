import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../../components/Map';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Loading from '../../components/LoadingPage';
import { useAuth } from '../../context/AuthContext';
import '../../css/dashboard.css';
import available from '../../css/images/available.png';
import my_jobs from '../../css/images/my_jobs.png';
import profile from '../../css/images/provider_profile.png';

function ProviderDashboard() {
    const navigate = useNavigate();
    const { user, isProvider, providerDetails, loading } = useAuth();

    // Route the user to either the login page or home if they are not logged in, or not a provider
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        } else if (!loading && user && !isProvider) {
            navigate('/')
        }
    }, [user, providerDetails, loading, navigate]);

    if (loading || !providerDetails.providerCoords) {
        return <Loading />;
    }

    return (
        <div>
            <Navbar />
            <div className='dashboard-container'>
                <div className='dashboard-header-container'>
                    {/* <img src={logo} className="dashboard-logo" /> */}
                    <div className="dashboard-header">Provider Dashboard</div>
                </div>
                <div className="dashboard-subheader">Manage your landscaping services with ease. Access available jobs, track your current assignments, and update your provider profile.</div>
                <div className="dashboard-options-container">
                    <div className="dashboard-option-wrapper" onClick={() => navigate('/provider/available')}>
                        <div className="dashboard-option">
                            <img src={available} className="dashboard-available-image" />
                        </div>
                        <p className="dashboard-option-text">Available</p>
                    </div>
                    <div className="dashboard-option-wrapper" onClick={() => navigate('/provider/my-jobs')}>
                        <div className="dashboard-option">
                            <img src={my_jobs} className="dashboard-jobs-image" />
                        </div>
                        <p className="dashboard-option-text">My Jobs</p>
                    </div>
                    <div className="dashboard-option-wrapper" onClick={() => navigate(`/provider/profile/${providerDetails.user}`)}>
                        <div className="dashboard-option">
                            <img src={profile} className="dashboard-profile-image" />
                        </div>
                        <p className="dashboard-option-text">Profile</p>
                    </div>
                </div>
                <div className="dashboard-text">My Service Range ({providerDetails.serviceRange} miles):</div>
                <Map center={{lat: providerDetails.providerCoords.lat, lng: providerDetails.providerCoords.lon}} zoom={12} serviceRange={providerDetails.serviceRange} className='map-container' />
            </div>
            <Footer />
        </div>
    );
}

export default ProviderDashboard;