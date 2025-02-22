import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/request.css';

// Show a success form to the user, confirming their application has been submitted

const AlreadyProviderForm = () => {
    const navigate = useNavigate();

    return (
        <div className='request-body'>
            <div className='request-header'>You are already a Provider!</div>
            <div className='request-subheader'>Thank you for submitting your application! You have been approved to become a provider.</div>

            <div className='request-continue-button' onClick={() => navigate('/')}>
                <div className='request-continue-button-text'>Continue</div>
            </div>

        </div>
    );
}

export default AlreadyProviderForm;