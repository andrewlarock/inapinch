import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "../auth/firebase";
import { getErrorMessage } from '../utils/errorMessages';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFirestore, setDoc, doc, updateDoc } from 'firebase/firestore';
import validateDisplayName from "../utils/validateDisplayName";
import NavbarLite from '../components/NavbarLite';
import '../css/signup.css';
import google from '../css/images/google.png';
import Loading from '../components/LoadingPage';

function Signup() {
    const { user, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState("");
    const [googleError, setGoogleError] = useState("");
    const [isSignedUp, setIsSignedUp] = useState(false);
    const db = getFirestore();
    const navigate = useNavigate();

    // Redirect already signed-in users, checks if they need to set their display name
    useEffect(() => {
        if (user && !loading) {
            user.displayName ? navigate('/') : setIsSignedUp(true);
        }
    }, [user, loading, navigate]);

    // Create a document for every new user in the users collection of firestore. This is so we can
    // query each users information when needed
    const createUserDocument = async (user) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                displayName: user.displayName,
                email: user.email,
                homeAddress: ""
            });
        } catch (err) {
            setError("Failed to create user document. Please try again.");
        }
    };

    const handleGoogleSignup = async () => {
        try {
            setError("");
            const result = await signInWithPopup(auth, googleProvider);
            await createUserDocument(result.user);

            navigate('/');
        } catch (err) {
            console.error(err.message);
            setGoogleError(getErrorMessage(err.code));
        }
    };

    const handleEmailSignup = async () => {
        try {
            setError("");
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await createUserDocument(result.user);

            setEmail("");
            setPassword("");

            setIsSignedUp(true);
        } catch (err) {
            console.error(err.message);
            setError(getErrorMessage(err.code));
        }
    };

    const setDisplayName = async () => {
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

            navigate('/');
        } catch (err) {
            console.error(err.message);
            setError("Failed to set display name. Please try again.")
        }
    };

    return (
        <div>
            <NavbarLite isSignedUp={isSignedUp} />
            <div className='signup-body'>
                {!isSignedUp ? (
                  <>
                    <div className='signup-header'>Create an account</div>
                    <div className='signup-subheader'>Welcome!</div>

                    <div className='signup-google-container' onClick={handleGoogleSignup}>
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

                    <div className='continue-button' onClick={handleEmailSignup}>
                        <div className='continue-button-text'>Continue</div>
                    </div>

                  </>
                ) : (
                  <>
                    <div className='signup-header'>Let’s start with your name!</div>
                    <div className='signup-subheader'>Provide the name you want others to use when connecting with you.</div>

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
                        <div className='continue-button-text'>Continue</div>
                    </div>
                  </>
                )}
            </div>
        </div>
    );
}

export default Signup;