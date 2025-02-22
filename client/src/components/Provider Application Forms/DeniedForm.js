import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/request.css';

// Show a form to the user telling them that their application has been denied

const DeniedForm = () => {
    const navigate = useNavigate();

    return (
        <div className='request-body'>
            <div className='request-header'>Your application has been denied</div>
            <div className='request-subheader'>Please wait 30 days and email inapinch@gmail.com for a chance to apply again.</div>

            <div className='request-continue-button' onClick={() => navigate('/')}>
                <div className='request-continue-button-text'>Continue</div>
            </div>

        </div>
    );
}

export default DeniedForm;