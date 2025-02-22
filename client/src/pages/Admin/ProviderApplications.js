import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Loading from '../../components/LoadingPage';
import Application from '../../components/Application';
import { useNotification } from "../../context/NotificationContext";
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import '../../css/myorders.css';
import '../../css/request.css';

// This is the admin dashboard that allows admins to accept or deny provider applications

const ProviderApplications = () => {
    const { user, isAdmin, loading } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const db = getFirestore();
    const auth = getAuth();
    const { addNotification } = useNotification();

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            navigate('/');
        }
    }, [user, isAdmin, loading, navigate]);


    useEffect(() => {
        const fetchApplications = async () => {
            if (user && isAdmin) {
                try {
                    // Query Firestore for users with isProvider value of Pending
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('isProvider', '==', 'Pending'));
    
                    const querySnapshot = await getDocs(q);
                    const fetchedApplications = [];
    
                    // Loop through the querySnapshot for each document
                    querySnapshot.forEach(async (docSnapshot) => {
                        const userData = docSnapshot.data();
                        const userId = docSnapshot.id; // Get the user ID from the document snapshot
    
                        // Get the providerDetails of each user with a Pending status
                        if (userData.providerDetails) {
                            fetchedApplications.push({
                                providerDetails: userData.providerDetails,
                                userId: userId
                            });
                        }
                    });
    
                    setApplications(fetchedApplications);
                } catch (error) {
                    console.error('Error fetching applications:', error);
                }
            }
        };
    
        fetchApplications();
        // Run once every second so we can pick up new applications almost immediately so we aren't putting too much strain on the back-end by having no interval
        const intervalId = setInterval(fetchApplications, 1000);
        return () => clearInterval(intervalId);
    }, [user, isAdmin, db, auth]);

    const handleAccept = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(
                userRef,
                { isProvider: 'Yes' }, // Update the isProvider field to Yes (accepted)
                { merge: true }
            );
            // Remove the application from the UI after accepting
            setApplications((prevApplications) =>
                prevApplications.filter((app) => app.userId !== userId)
            );
            addNotification("Application accepted")
        } catch (error) {
        }
    };

    const handleDeny = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(
                userRef,
                { isProvider: 'Denied' }, // Update the isProvider field to Denied
                { merge: true }
            );
            // Remove the application from the UI after denying
            setApplications((prevApplications) =>
                prevApplications.filter((app) => app.userId !== userId)
            );
            addNotification("Application denied")
        } catch (error) {
        }
    };

    if (loading) {
        return <Loading />;
    }
    
    return (
        <div>
            <Navbar />
            <div className='request-body'>
                <div className='request-header'>Current Applications</div>

                <div className='orders-divider'></div>

                {applications.length > 0 ? (
                    applications.map((application, index) => (
                        <Application key={index} application={application} handleAccept={handleAccept} handleDeny={handleDeny} />
                    ))
                ) : (
                    <div className='none-found-text'>No pending applications.</div>
                )}

            </div>
        </div>
    );
}

export default ProviderApplications;