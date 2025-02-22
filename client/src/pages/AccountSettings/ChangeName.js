import React, { useState, useEffect } from 'react';
import { auth } from "../../auth/firebase";
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useNotification } from "../../context/NotificationContext";
import Loading from '../../components/LoadingPage';
import { useAuth } from '../../context/AuthContext';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import validateDisplayName from "../../utils/validateDisplayName";
import Navbar from '../../components/Navbar';
import '../../css/signup.css';

function ChangeName() {
    const { user, loading } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const db = getFirestore();
    const { addNotification } = useNotification();
    
    // Makes sure users are authenticated before being able to access a page related to their profile
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    // Load current users first and last name so they can see what their current setting is
    useEffect(() => {
        if (user && user.displayName && !loading) {
            setFirstName(user.displayName.split(" ")[0]);
            setLastName(user.displayName.split(" ")[1]);
        }
    }, [user]);

    const handleNameChange = async () => {
        const validationError = validateDisplayName(firstName, lastName);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                setError("No user is signed in. Please try signing in again.")
                return;
            }

            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`,
            });

            // Update displayName in firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: `${firstName} ${lastName}`,
            });

            addNotification("Your name has updated successfully!");
        } catch (err) {
            console.error(err.message);
            setError("Failed to set display name. Please try again.")
        }
    };

    // Show loading page while the profile is being retrieved
    if (loading || !user) {
        return <Loading />;
    }

    return (
        <div>
            <Navbar />
            <div className='signup-body'>
                <div className='signup-header'>Name</div>
                <div className='signup-subheader'>Provide the name you want others to use when connecting with you.</div>

                <div className="signup-input-header">First Name</div>
                <input
                    type="text"
                    placeholder="Enter your new first name"
                    className="signup-input"
                    value={firstName}
                    onChange={(e) => {setFirstName(e.target.value); setError("");}}
                />

                <div className="signup-input-header">Last Name</div>
                <input
                    type="text"
                    placeholder="Enter your new last name"
                    className="signup-input"
                    value={lastName}
                    onChange={(e) => {setLastName(e.target.value); setError("");}}
                />

                {error && <div className="email-error-message">{error}</div>}

                <div className='continue-button' onClick={handleNameChange}>
                    <div className='continue-button-text'>Update</div>
                </div>
            </div>
        </div>
    );
}

export default ChangeName;