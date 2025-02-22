import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/request.css';

// Show a success form to the user, confirming their application has been submitted

const Success = () => {
    const navigate = useNavigate();

    return (
        <div className='request-body'>
            <div className='request-header'>Application Submitted</div>
            <div className='request-subheader'>Thank you for submitting your application! Our team will review your details and get back to you within 24-48 hours. Please check back here for updates.</div>

            <div className='request-continue-button' onClick={() => navigate('/')}>
                <div className='request-continue-button-text'>Continue</div>
            </div>

        </div>
    );
}

export default Success;