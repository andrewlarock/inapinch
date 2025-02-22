import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from "../context/NotificationContext";
import '../css/modal.css';
import '../css/request.css';
import close from '../css/images/close2.png';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const EditProviderInfoModal = ({ isModalOpen, setModalOpen, serviceType, serviceRange, onUpdate }) => {
    const { user, loading } = useAuth();
    const [error, setError] = useState("");
    const [service, setService] = useState("");
    const [range, setRange] = useState("");
    const db = getFirestore();
    const { addNotification } = useNotification();

    useEffect(() => {
        if (isModalOpen) {
            setService(serviceType);
            setRange(serviceRange)
        }
    }, [isModalOpen, serviceType]);

    // Function to validate the range input
    const isValidRange = (value) => {
        return /^[1-9]\d*(\.\d+)?$/.test(value); // Ensures at least 1 and allows one decimal point
    };

    // Function to update provider details in Firestore
    const updateProviderDetails = async () => {
        setError("");

        // Validate the range input
        if (!isValidRange(range)) {
            setError("Please enter a valid number (e.g., 1, 1.5) for your custom range.");
            return;
        }

        if (!loading && !user?.uid) {
            setError("User not authenticated.");
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                setError("User document not found.");
                return;
            }

            // Update firestore document with new service and range
            await updateDoc(userRef, {
                "providerDetails.providedServices": service,
                "providerDetails.serviceRange": range
            });

            onUpdate(service, range);
            addNotification("Your provider details have been updated!")
            setModalOpen(false);
        } catch (error) {
            console.error("Error updating provider details:", error);
            setError("Failed to update provider details. Please try again.");
        }
    }

    return (
        isModalOpen && (
            <div className="full-page-modal">
                <div className="modal-content">

                    <div className="modal-close-button" onClick={() => setModalOpen(false)}>
                        <img src={close} className="modal-close-image" />
                    </div>
                    <div className="modal-body">
                        <div className='modal-header-text' style={{marginBottom: '1.5rem'}}>Update Your Provider Information</div>
                        
                        <div className='profile-change-header-text'>Service Range:&nbsp;</div>
                        <div className='custom-input-container'>
                            <input
                                type="text"
                                className="range-custom-input"
                                value={range}
                                onChange={(e) => setRange(e.target.value)}
                            />
                            <div className='profile-change-text'>&nbsp;miles</div>
                        </div>

                        <div className='profile-change-header-text' style={{marginTop: '2rem'}}>Services Provided:</div>
                        <div className='profile-options-container'>
                            {['Lawn Care', 'Snow Removal', 'Both'].map((option, index) => (
                            <label key={index} className='profile-option-label'>
                                <input type='radio'
                                value={option}
                                checked={service === option}
                                onChange={(e) => setService(e.target.value)}
                                className='profile-radio-input'
                                />
                                <span className='profile-radio-bubble'></span>
                                <span className='profile-option-text'>{option}</span>
                            </label>
                            ))}
                        </div>

                        {error && <div className="form-error-message" style={{marginTop: '-.75rem', marginBottom: '.75rem'}}>{error}</div>}

                        <div className='modal-continue-button' onClick={updateProviderDetails}>
                            <div className='modal-continue-button-text'>Update</div>
                        </div>

                    </div>
                </div>
            </div>
        )
    );
};

export default EditProviderInfoModal;