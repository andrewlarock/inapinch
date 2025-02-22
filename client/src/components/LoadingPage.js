import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import logo from '../css/images/logo-dark.png';
import '../css/loading.css';

function LoadingPage() {

    return (
        <div>
            <Navbar />
            <div className='loading-container'>
                <div className='loading-header-container'>
                    <img src={logo} className="loading-logo" alt="logo" />
                    <div className="loading-header">
                        In<span style={{ fontSize: '60%', lineHeight: '1' }}> </span>a<span style={{ fontSize: '60%', lineHeight: '1' }}> </span>Pinch
                    </div>
                </div>
                <div className="loading-text">
                    Loading<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
            </div>
        </div>
    );
}

export default LoadingPage;