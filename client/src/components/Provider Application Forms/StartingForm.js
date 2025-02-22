import React, { useState, useEffect } from 'react';
import { updateProfile } from "firebase/auth";
import validateDisplayName from "../../utils/validateDisplayName";
import '../../css/signup.css';

// These are the forms the user are presented with when applying to become a provider. This is the
// starting form, and then the subsequent data is passed throught the child components to the parent
// so an administrator can approve or deny an application

function Starting({data, updateFormData, onNext}) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState("");

    // Pre-fill the form with the users first and last name
    useEffect(() => {
        if (data.user?.displayName) {
            // Split the displayName into first and last names
            const [first, last] = data.user.displayName.split(" ");
            setFirstName(first || "");
            setLastName(last || "");
        }
    }, [data.user]);

    // Validate and reset the users display name, this will be the name they will provide services under
    const setDisplayName = async () => {
        const validationError = validateDisplayName(firstName, lastName);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            await updateProfile(data.user, {
                displayName: `${firstName} ${lastName}`,
            });
            updateFormData('providerName', `${firstName} ${lastName}`);
            onNext();

        } catch (err) {
            console.error(err.message);
            setError("Failed to set display name. Please try again.")
        }
    };

    return (
        <div className='signup-body'>
            <div className='signup-header'>Apply to Become a Provider</div>
            <div className='signup-subheader'>We’ll need some personal information to verify your application and get you started as a provider. First, please verify your name is correct.</div>

            <div className="signup-input-header">First Name</div>
            <input
                type="text"
                placeholder="Enter your first name"
                className="signup-input"
                value={firstName}
                onChange={(e) => {setFirstName(e.target.value); setError("")}}
            />

            <div className="signup-input-header">Last Name</div>
            <input
                type="text"
                placeholder="Enter your last name"
                className="signup-input"
                value={lastName}
                onChange={(e) => {setLastName(e.target.value); setError("")}}
            />

            {error && <div className="email-error-message">{error}</div>}

            <div className='continue-button' onClick={setDisplayName}>
                <div className='continue-button-text'>Get Started</div>
            </div>
        </div>
    );
}

export default Starting;