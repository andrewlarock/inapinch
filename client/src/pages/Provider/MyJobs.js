import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { getFirestore, getDoc, doc, updateDoc } from 'firebase/firestore';
import { apiRequest } from '../../utils/apiRequest';
import { useNotification } from "../../context/NotificationContext";
import Loading from '../../components/LoadingPage';
import getDistanceInMiles from '../../utils/distanceHelper';
import AvailableJob from '../../components/AvailableJob';
import CompletedJob from '../../components/CompletedJob';
import '../../css/myorders.css';
import '../../css/request.css';
import '../../css/application.css';

// This is the provider dashboard that shows the provider all the jobs they have accepted or completed

const MyJobs = () => {
    const { user, isProvider, providerDetails, loading } = useAuth();
    const [selectedType, setSelectedType] = useState('Accepted')
    const [acceptedJobs, setAcceptedJobs] = useState([]);
    const [completedJobs, setCompletedJobs] = useState([]);
    const { addNotification } = useNotification();
    const navigate = useNavigate();
    const db = getFirestore();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        } else if (!loading && user && !isProvider) {
            navigate('/')
        }
    }, [user, isProvider, loading, navigate]);

    // Fetch the jobs the provider has accepted and completed and separate them
    const fetchJobs = async () => {
        if (user) {
            try {
                const jobs = await apiRequest(`jobs/get-by-provider/${user.uid}`);

                if (providerDetails && providerDetails.providerAddress) {

                    // Separate jobs into completed and accepted
                    const completed = [];
                    const accepted = [];

                    for (const job of jobs) {
                        // Get the distance in miles between the delivery address and provider address
                        const distanceInMiles = getDistanceInMiles(job.delivery_coords, providerDetails.providerCoords);
                        // Retrieves all the completed jobs to show to the provider
                        if (job.job_status[0].includes("Completed")) {
                            // Add the distance between the two addresses and coordinates of the job
                            const parsedJob = {
                                ...job,
                                distance: distanceInMiles,
                                providerDetails: providerDetails
                            };

                            completed.push(parsedJob);
                        }
                        // Retrieves all the accepted jobs to show to the provider
                        if (job.job_status[0].includes("Accepted")) {
                            // Add the distance between the two addresses and coordinates of the job
                            const parsedJob = {
                                ...job,
                                distance: distanceInMiles,
                                providerDetails: providerDetails
                            };

                            accepted.push(parsedJob);
                        }
                    }

                    // Update the state variables with the separated job lists
                    setCompletedJobs(sortJobsByTimestamp(completed, 'Completed'));
                    // Keep the accepted jobs sorted by their Pending status so they can keep track of how long an orders been pending for easily
                    setAcceptedJobs(sortJobsByTimestamp(accepted, 'Pending'));
                }
            } catch (error) {
                console.error('Error fetching orders:', error.message);
            }
        }
    };

    // Set up an interval to fetch jobs every second
    useEffect(() => {
        fetchJobs();
        const intervalId = setInterval(fetchJobs, 1000);
        return () => clearInterval(intervalId);
    }, [user, providerDetails]);
    
    // Function to extract the timestamp from job status and sort the jobs by how recently their status was updated
    const sortJobsByTimestamp = (jobs, statusType) => {
        return jobs.sort((a, b) => {
            const aTimestamp = getStatusTimestamp(a, statusType);
            const bTimestamp = getStatusTimestamp(b, statusType);
            return bTimestamp - aTimestamp;
        });
    };

    // Function to extract the timestamp of when the job became most recently updated so we can sort them
    const getStatusTimestamp = (job, statusType) => {
        const relevantStatus = job.job_status.find(status => status.startsWith(statusType));
        if (relevantStatus) {
            const timestamp = relevantStatus.split(': ')[1];
            return new Date(timestamp).getTime();
        }
    };

    // Parent function for marking a job as completed. This udpates the status to Completed and updates
    // the after_photos value in the specific job row
    const completeJob = async (jobId, photos) => {
        try {
            // Generate pre-signed URLs for each photo
            const uploadedUrls = [];

            for (let i = 0; i < photos.length; i++) {
                const file = photos[i];
                const fileNumber = i + 1; // Start file numbering from 1
                
                // Get the file extension so we can correctly store it in S3
                const fileExtension = file.name.slice(file.name.lastIndexOf('.'));
                const fileKey = `${jobId}_after_${fileNumber}${fileExtension}`; // Define file path for S3 and mark it as an after photo

                const s3Url = `${process.env.REACT_APP_S3_URL}${fileKey}`;

                // Upload directly to S3
                const response = await fetch(s3Url, {
                    method: "PUT",
                    body: file,
                    headers: {
                        "Content-Type": file.type,
                    },
                });

                if (!response.ok) {
                    throw new Error("Upload failed");
                }

                uploadedUrls.push(s3Url); // Store the URL after successful upload
            }

            // First, complete the job and update the after_photos
            await Promise.all([
                apiRequest(`jobs/update/${jobId}`, "PUT", { job_id: jobId }),
                apiRequest("jobs/complete", "PUT", { job_id: jobId, after_photos: uploadedUrls })
            ]);
    
            // If both API requests succeed, update the providerss servicesCompleted count
            const providerRef = doc(db, "users", user.uid); // Find the provider document by user.uid
            const providerSnap = await getDoc(providerRef);
    
            if (providerSnap.exists()) {
                const providerData = providerSnap.data();
                const providerDetails = providerData.providerDetails || {};
    
                // Initialize servicesCompleted if not already initialized
                const servicesCompleted = providerDetails.servicesCompleted || 0;
    
                // Update servicesCompleted by incrementing it by 1
                const updatedProviderDetails = {
                    ...providerDetails,
                    servicesCompleted: servicesCompleted + 1
                };
    
                // Update the provider document in Firestore with the new servicesCompleted value
                await updateDoc(providerRef, { providerDetails: updatedProviderDetails });
            } else {
                console.error("Provider not found for user:", user.uid);
            }
    
            setSelectedType('Completed');
            addNotification("Order completed successfully!")
        } catch (err) {
            console.log(`Error completing job ${jobId}:`, err.message);
        }
    };

    // Function that handles a provider cancelling an order theyve accepted
    const cancelJob = async (jobId) => {
        try {
            await apiRequest(`jobs/cancel/${jobId}`, 'PUT');
            addNotification("Job cancellation confirmed")
            fetchJobs();
        } catch (err) {
            console.log(`Error cancelling job ${jobId}:`, err.message);
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div>
            <Navbar />
            <div className='request-body'>
                <div className='jobs-header-container'>
                    <div className='request-header'>My Jobs</div>
                    <div className='range-text'>Within {providerDetails.serviceRange} miles<span className="service-dots"><span>.</span><span>.</span><span>.</span></span></div>
                </div>
                <div className="toggle-orders-container">
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

                {selectedType === 'Accepted' ? (
                    acceptedJobs.length > 0 ? (
                        acceptedJobs.map((job) => (
                            <AvailableJob key={job.job_id} job={job} completeJob={completeJob} cancelJob={cancelJob} />
                        ))
                    ) : (
                        <div className='none-found-text'>You have no accepted orders.</div>
                    )
                ) : selectedType === 'Completed' ? (
                    completedJobs.length > 0 ? (
                        completedJobs.map((job) => (
                            <CompletedJob key={job.job_id} job={job} completeJob={completeJob} cancelJob={cancelJob} />
                        ))
                    ) : (
                        <div className='none-found-text'>You have no completed orders.</div>
                    )
                ) : null}

            </div>
        </div>
    );
}

export default MyJobs;