import React, { createContext, useContext, useEffect, useState } from 'react';
import { validateToken } from '../utils/apiRequest';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth } from '../auth/firebase';
import { useNavigate } from 'react-router-dom';

// Create the Auth Context
const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // User object when authenticated, null otherwise
    const [loading, setLoading] = useState(true); // Tracks loading state
    const [redirected, setRedirected] = useState(false); // Flag to track if the user was already redirected back to the signup page if they never set their displayName
    const [isProvider, setIsProvider] = useState(false); // State to track if the user is a provider
    const [userDetails, setUserDetails] = useState({}); // State to track the users details, most importantly their homeAddress
    const [providerDetails, setProviderDetails] = useState({}); // State to track the users provider details if they are a provider
    const [isAdmin, setIsAdmin] = useState(false); // State to track if the user is an admin
    const db = getFirestore(); // Initialize firestore
    const navigate = useNavigate();

    // Check users initial authentication status
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true); // Start loading
            if (currentUser) {
                try {
                    await validateToken(); // Validate the token with the backend
                    setUser(currentUser); // Update the user state if token is valid

                    // Fetch the users firestore document to check if theyre a provider
                    const userRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setIsProvider(userData.isProvider === 'Yes' ? true : false); // Set the provider status based on firestore data
                        setIsAdmin(userData.isAdmin === true ? true : false) // Set the admin status based on firestore data
                        setUserDetails(userData); // Set the userDetails, most importantly their .homeAddress

                        if (userData.isProvider === 'Yes' && userData.providerDetails) { // If the user is a provider, store their provider details
                            setProviderDetails(userData.providerDetails);
                        }
                    }

                    if (!currentUser.displayName && !redirected) { // If user doesnt have a display name and hasn't been redirected
                        setRedirected(true);
                        navigate('/signup');
                    }
                } catch (err) {
                    console.error("Token validation failed:", err.message);
                    setUser(null);
                }
            } else {
                setUser(null); // No user signed in
                setIsProvider(false);
            }
            setLoading(false); // Stop loading
        });

        return () => unsubscribe(); // Clean up the listener on component unmount
    }, [navigate, redirected, db]);

    // Listener for userDetails in Firestore
    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);

            // Listen for real-time updates to the user's data
            const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    setUserDetails(userData); // Update userDetails whenever changes occur in firestore
                }
            });

            // Clean up the listener when the component unmounts or user changes
            return () => unsubscribe();
        }
    }, [user, db]);

    // Now set an interval to recheck the users authentication status every 5 minutes as a safe guard
    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (user) {
                const token = await user.getIdTokenResult(true);
                if (!token) {
                    signOut(auth);
                    setUser(null);
                    setIsProvider(false);
                    setProviderDetails({})
                    setUserDetails(null)
                    setIsAdmin(false);
                    navigate('/');
                }
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [user, navigate]);

    return (
        <AuthContext.Provider value={{ user, loading, isProvider, providerDetails, userDetails, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};