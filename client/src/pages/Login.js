import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../auth/firebase";
import { getErrorMessage } from '../utils/errorMessages';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NavbarLite from '../components/NavbarLite';
import '../css/signup.css';
import google from '../css/images/google.png';

function Login() {
    const [email, setEmail] = useState("");
    const { user, loading } = useAuth();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [googleError, setGoogleError] = useState("");
    const navigate = useNavigate();

    // Redirect already signed-in users
    useEffect(() => {
        if (user && !loading) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleGoogleLogin = async () => {
        try {
            setError("");
            const result = await signInWithPopup(auth, googleProvider);
            
            navigate('/');
        } catch (err) {
            console.error(err.message);
            setGoogleError(getErrorMessage(err.code));
        }
    };

    const handleEmailLogin = async () => {
        try {
            setError("");
            const result = await signInWithEmailAndPassword(auth, email, password);

            setEmail("");
            setPassword("");

            navigate('/');
        } catch (err) {
            console.error(err.message);
            setError(getErrorMessage(err.code));
        }
    }

    return (
        <div>
            <NavbarLite />
            <div className='signup-body'>
                <div className='signup-header'>Log in</div>
                <div className='signup-subheader'>Hey, Welcome Back!</div>

                <div className='signup-google-container' onClick={handleGoogleLogin}>
                    <img src={google} className="signup-google-logo" />
                    <div className='signup-google-text'>Continue with Google</div>
                </div>

                {googleError && <div className="google-error-message">{googleError}</div>}

                <div className="signup-divider-container">
                    <div className="signup-divider-line"></div>
                    <div className="signup-divider-text">or continue with email</div>
                    <div className="signup-divider-line"></div>
                </div>

                <div className="signup-input-header">Email Address</div>
                <input
                    type="text"
                    placeholder="Enter email address"
                    className="signup-input"
                    value={email}
                    onChange={(e) => {setEmail(e.target.value); setError(""); setGoogleError("")}}
                />

                <div className="signup-input-header">Password</div>
                <input
                    type="password"
                    placeholder="Enter password"
                    className="signup-input"
                    value={password}
                    onChange={(e) => {setPassword(e.target.value); setError(""); setGoogleError("")}}
                />

                {error && <div className="email-error-message">{error}</div>}

                <div className='continue-button' onClick={handleEmailLogin}>
                    <div className='continue-button-text'>Continue</div>
                </div>

            </div>
        </div>
    );
}

export default Login;