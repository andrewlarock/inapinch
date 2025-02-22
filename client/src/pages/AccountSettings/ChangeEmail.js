import React, { useState, useEffect } from 'react';
import { auth } from "../../auth/firebase";
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { getErrorMessage } from '../../utils/errorMessages';
import emailValidator from 'email-validator';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import Loading from '../../components/LoadingPage';

import '../../css/signup.css';

function ChangeEmail() {
    const { user, loading } = useAuth();
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const db = getFirestore();
    const { addNotification } = useNotification();

    // Makes sure users are authenticated before being able to access a page related to their profile
    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (!user.providerData.some((provider) => provider.providerId === 'password')) {
                navigate('/account'); // Redirect if not an email/password user
            }
        }
    }, [user, loading, navigate]);

    const handleEmailChange = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setError("No user is signed in. Please try signing in again.")
                return;
            }

            if (!emailValidator.validate(newEmail)) {
                setError("The email address you entered is not valid. Please enter a valid email.");
                return;
            }

            if (user.email === newEmail) {
                setError("Your new email address cannot be the same as your current one. Please enter a different email.");
                return;
            }

            try {
                const credential = EmailAuthProvider.credential(user.email, password)
                await reauthenticateWithCredential(user, credential);

            } catch (err) {
                setError(getErrorMessage(err.code));
                return;
            }

            await updateEmail(user, newEmail);

            // Update email in firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                email: newEmail,
            });

            addNotification("Email updated successfully!")
            setNewEmail("");
            setPassword("");
            
        } catch (err) {
            console.error(err.message);
            setError(getErrorMessage(err.code));
        }
    }

    // Show loading page while the profile is being retrieved
    if (loading || !user) {
        return <Loading />;
    }

    return (
        <div>
            <Navbar />
            <div className='signup-body'>
                <div className='signup-header'>Email</div>
                <div className='signup-subheader'>Update the email address associated with your account.</div>
                <div className='signup-subheader'>Current Email: <b>{user.email}</b></div>

                <div className="signup-input-header">New Email</div>
                <input
                    type="text"
                    placeholder="Enter your new email"
                    className="signup-input"
                    value={newEmail}
                    onChange={(e) => {setNewEmail(e.target.value); setError("");}}
                />

                <div className="signup-input-header">Current Password</div>
                <input
                    type="password"
                    placeholder="Enter your current password"
                    className="signup-input"
                    value={password}
                    onChange={(e) => {setPassword(e.target.value); setError("");}}
                />

                {error && <div className="email-error-message">{error}</div>}

                <div className='continue-button' onClick={handleEmailChange}>
                    <div className='continue-button-text'>Update</div>
                </div>
            </div>
        </div>
    );
}

export default ChangeEmail;