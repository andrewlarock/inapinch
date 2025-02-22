import React, { useState, useEffect } from 'react';
import { auth } from "../../auth/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNotification } from "../../context/NotificationContext";
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/LoadingPage';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { getErrorMessage } from '../../utils/errorMessages';
import '../../css/signup.css';

function ChangePassword() {
    const { user, loading } = useAuth();
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
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

    const handlePasswordChange = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setError("No user is signed in. Please try signing in again.")
                return;
            }

            if (newPassword !== confirmNewPassword) {
                setError("The new password and confirmation password do not match. Please ensure both fields are identical.");
                return;
            }

            try {
                const credential = EmailAuthProvider.credential(user.email, password)
                await reauthenticateWithCredential(user, credential);

            } catch (err) {
                setError(getErrorMessage(err.code));
                return;
            }

            await updatePassword(user, newPassword);
            addNotification("Password updated successfully!")
            setNewPassword("");
            setConfirmNewPassword("");
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
                <div className='signup-header'>Password</div>
                <div className='signup-subheader'>Update the password associated with your account.</div>

                <div className="signup-input-header">New Password</div>
                <input
                    type="password"
                    placeholder="Enter your new password"
                    className="signup-input"
                    value={newPassword}
                    onChange={(e) => {setNewPassword(e.target.value); setError("");}}
                />

                <div className="signup-input-header">Confirm New Password</div>
                <input
                    type="password"
                    placeholder="Confirm your new password"
                    className="signup-input"
                    value={confirmNewPassword}
                    onChange={(e) => {setConfirmNewPassword(e.target.value); setError("");}}
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

                <div className='continue-button' onClick={handlePasswordChange}>
                    <div className='continue-button-text'>Update</div>
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;