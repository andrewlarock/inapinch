import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from "../context/NotificationContext";
import Navbar from '../components/Navbar';
import MyOrder from '../components/MyOrder';
import Loading from '../components/LoadingPage';
import { apiRequest } from '../utils/apiRequest';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import '../css/myorders.css';
import '../css/request.css';

// This is the page that displays all the users orders to them

const MyOrders = () => {
    const { user, loading } = useAuth();
    const { addNotification } = useNotification();
    const [selectedType, setSelectedType] = useState('Pending')
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();
    const db = getFirestore();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const fetchProviderDetails = async (job) => {
        if (!job.provider_id) return; // Make sure provider_id exists

        try {
            const providerRef = doc(db, "users", job.provider_id);
            const providerSnap = await getDoc(providerRef);

            if (providerSnap.exists()) {
                return providerSnap.data().providerDetails;
            } else {
                console.error("No provider found for ID:", job.provider_id);
                return null;
            }
        } catch (error) {
            console.error("Error fetching provider details:", error);
            return null;
        }
    };
    
    const fetchOrders = async () => {
        if (user) {
            try {
                const jobs = await apiRequest(`jobs/get/${user.uid}`);

                const parsedJobs = await Promise.all(jobs.map(async (job) => {
                    const providerDetails = await fetchProviderDetails(job); // Fetch provider details for each job. If the job hasnt been accepted theyll just stay NULL
                    return {
                        ...job,
                        providerDetails: providerDetails, // Add the fetched provider details to the job
                    };
                }));

                setOrders(parsedJobs);
            } catch (error) {
                console.error('Error fetching orders:', error.message);
            }
        }
    };

    // Set up an interval to fetch jobs every second
    useEffect(() => {
        fetchOrders();
        const intervalId = setInterval(fetchOrders, 1000);
        return () => clearInterval(intervalId);
    }, [user]);

    // Function that handles canceling an order when it is in the pending state
    const cancelJob = async (jobId) => {
        try {
            await apiRequest(`jobs/delete/${jobId}`, "DELETE");
            addNotification("Job cancellation confirmed")
            fetchOrders();
        } catch (error) {
            console.error("Failed to cancel job:", error.message);
        }
    };

    // Function to extract the relevant timestamp based on the current status. This is so we can sort
    // the orders by when they became pending, accepted, or completed.
    const getStatusTimestamp = (job) => {
        const relevantStatus = job.job_status.find(status => status.startsWith(selectedType));
        if (relevantStatus) {
            const timestamp = relevantStatus.split(': ')[1];
            return new Date(timestamp).getTime();
        }
    };

    // Filter the orders based on whether the user has selected Pending, accepted, or Completed
    const filteredOrders = orders
        .filter((job) => job.job_status[0]?.includes(selectedType)) // Filter by selected status type
        .sort((a, b) => getStatusTimestamp(b) - getStatusTimestamp(a)); // Sort by most recent tiemstamp

    if (loading) {
        return <Loading />;
    }

    return (
        <div>
            <Navbar />
            <div className='request-body'>
                <div className='request-header'>My Orders</div>

                <div className="toggle-orders-container">
                    <div
                        className={`toggle-orders-button ${selectedType === 'Pending' ? 'active' : ''}`}
                        onClick={() => setSelectedType('Pending')}
                    >
                        Pending
                    </div>
                    <div
                        className={`toggle-orders-button ${selectedType === 'Accepted' ? 'active' : ''}`}
                        onClick={() => setSelectedType('Accepted')}
                    >
                        Accepted
                    </div>
                    <div
                        className={`toggle-orders-button ${selectedType === 'Completed' ? 'active' : ''}`}
                        onClick={() => setSelectedType('Completed')}
                    >
                        Completed
                    </div>
                </div>
                <div className='orders-divider'></div>

                {filteredOrders.length > 0 ? (
                    filteredOrders.map((job) => (
                        <MyOrder key={job.job_id} job={job} cancelJob={cancelJob}/>
                    ))
                ) : (
                    <div className='none-found-text'>No {selectedType.toLowerCase()} orders found.</div>
                )}

            </div>
        </div>
    );
}

export default MyOrders;