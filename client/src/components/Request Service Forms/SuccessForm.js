import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/request.css';

// Show a success form to the user, confirming their order has been placed and a button to navigate
// to the status of their order

const Success = () => {
    const navigate = useNavigate();

    return (
        <div className='request-body'>
            <div className='request-header'>Your Order is Confirmed!</div>
            <div className='request-subheader'>We are now trying to match you with providers in your area. To check the status of your order, please visit the "My Orders" tab in the menu.</div>

            <div className='request-continue-button' onClick={() => navigate('/orders')}>
                <div className='request-continue-button-text'>View Order</div>
            </div>

        </div>
    );
}

export default Success;