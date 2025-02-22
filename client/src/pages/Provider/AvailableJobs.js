import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { apiRequest } from '../../utils/apiRequest';
import getDistanceInMiles from '../../utils/distanceHelper';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import Loading from '../../components/LoadingPage';
import AvailableJob from '../../components/AvailableJob';
import '../../css/myorders.css';
import '../../css/request.css';

// This is the provider dashboard that shows all the available jobs that they can accept within their
// service range

const AvailableJobs = () => {
    const { user, isProvider, providerDetails, loading } = useAuth();
    const [selectedType, setSelectedType] = useState('Lawn Care')
    const [lawnCareJobs, setLawnCareJobs] = useState([]);
    const [snowRemovalJobs, setSnowRemovalJobs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        } else if (!loading && user && !isProvider) {
            navigate('/')
        } else if (!loading && isProvider && providerDetails.providedServices === 'Snow Removal') {
            // This is because the default value for selectedType is Lawn Care. If the user only provides
            // snow removal, change the default selectedType to Snow Removal.
            setSelectedType('Snow Removal');
        }
    }, [user, isProvider, providerDetails, loading, navigate]);

    // Fetch the available jobs, split them into Lawn Care/Snow Removal, and filter out the jobs not inside
    // the providers service range
    useEffect(() => {
        const fetchJobs = async () => {
            if (user) {
                try {
                    const jobs = await apiRequest(`jobs/get-by-provider/${user.uid}`);
    
                    const lawnCare = [];
                    const snowRemoval = [];
    
                    for (const job of jobs) {
                        const distanceInMiles = getDistanceInMiles(job.delivery_coords, providerDetails.providerCoords);
                        if (job.job_status[0].includes("Pending")) {
                            const parsedJob = {
                                ...job,
                                distance: distanceInMiles,
                                providerDetails: providerDetails
                            };
    
                            if (job.job_type === 'Lawn Care' && !isNaN(parsedJob.distance) && parsedJob.distance <= providerDetails.serviceRange) {
                                lawnCare.push(parsedJob);
                            } else if (job.job_type === 'Snow Removal' && !isNaN(parsedJob.distance) && parsedJob.distance <= providerDetails.serviceRange) {
                                snowRemoval.push(parsedJob);
                            }
                        }
                    }
    
                    setLawnCareJobs(sortJobsByPendingTimestamp(lawnCare));
                    setSnowRemovalJobs(sortJobsByPendingTimestamp(snowRemoval));
                } catch (error) {
                    console.error('Error fetching jobs:', error.message);
                }
            }
        };

        fetchJobs();
    
        const intervalId = setInterval(fetchJobs, 1000);
        return () => clearInterval(intervalId);
    }, [user, providerDetails]);

    // Function to extract the Pending timestamp from job status and sort the jobs
    const sortJobsByPendingTimestamp = (jobs) => {
        return jobs.sort((a, b) => {
            const aTimestamp = getStatusTimestamp(a, 'Pending');
            const bTimestamp = getStatusTimestamp(b, 'Pending');
            return bTimestamp - aTimestamp;
        });
    };

    // Function to extract the timestamp of when the job became available so we can sort them by most recent
    const getStatusTimestamp = (job, statusType) => {
        const relevantStatus = job.job_status.find(status => status.startsWith(statusType));
        if (relevantStatus) {
            const timestamp = relevantStatus.split(': ')[1];
            return new Date(timestamp).getTime();
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
                    <div className='request-header'>Available Jobs</div>
                    <div className='range-text'>Within {providerDetails.serviceRange} miles<span className="service-dots"><span>.</span><span>.</span><span>.</span></span></div>
                </div>
                <div className="toggle-orders-container">
                    {providerDetails && (providerDetails.providedServices === 'Lawn Care' || providerDetails.providedServices === 'Both') && (
                      <>
                        <div
                            className={`toggle-orders-button ${selectedType === 'Lawn Care' ? 'active' : ''}`}
                            onClick={() => setSelectedType('Lawn Care')}
                        >
                            Lawn Care
                        </div>
                      </>
                    )}

                    {providerDetails && (providerDetails.providedServices === 'Snow Removal' || providerDetails.providedServices === 'Both') && (
                      <>
                        <div
                            className={`toggle-orders-button ${selectedType === 'Snow Removal' ? 'active' : ''}`}
                            onClick={() => setSelectedType('Snow Removal')}
                        >
                            Snow Removal
                        </div>
                      </>
                    )}
                </div>
                <div className='orders-divider'></div>

                {selectedType === 'Lawn Care' ? (
                    lawnCareJobs.length > 0 ? (
                        lawnCareJobs.map((job) => (
                            <AvailableJob key={job.job_id} job={job} provider={user} providerDetails={providerDetails} />
                        ))
                    ) : (
                        <div className='none-found-text'>No lawn care orders found.</div>
                    )
                ) : selectedType === 'Snow Removal' ? (
                    snowRemovalJobs.length > 0 ? (
                        snowRemovalJobs.map((job) => (
                            <AvailableJob key={job.job_id} job={job} provider={user} providerDetails={providerDetails} />
                        ))
                    ) : (
                        <div className='none-found-text'>No snow removal orders found.</div>
                    )
                ) : null}

            </div>
        </div>
    );
}

export default AvailableJobs;