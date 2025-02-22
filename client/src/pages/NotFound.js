import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import logo from '../css/images/logo-dark.png';
import '../css/notfound.css';

function NotFound() {

    return (
        <div>
            <Navbar />
            <div className='not-found-container'>
                <div className='not-found-header-container'>
                    <img src={logo} className="not-found-logo" alt="logo" />
                    <div className="not-found-header">
                        In<span style={{ fontSize: '60%', lineHeight: '1' }}> </span>a<span style={{ fontSize: '60%', lineHeight: '1' }}> </span>Pinch
                    </div>
                </div>
                <div className="not-found-subheader">404</div>
                <div className="not-found-text">Page not found</div>
                <div className="not-found-warning">Oops! The page you are looking for doesn't exist or has been moved.</div>
            </div>
        </div>
    );
}

export default NotFound;