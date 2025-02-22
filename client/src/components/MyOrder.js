import React, { useState, useEffect }from 'react';
import { geocodeAddress } from "../utils/geocodeAddress";
import { apiRequest } from '../utils/apiRequest';
import { useNavigate } from 'react-router-dom';
import { useJobStatusFormatter } from '../utils/dateFormatter';
import { extractCityState } from "../utils/geocodeAddress";
import { getFirestore, getDoc, doc, updateDoc } from 'firebase/firestore';
import Map from "../components/Map";
import LeaveFeedbackModal from '../components/LeaveFeedbackModal';
import '../css/myorder.css';
import clock from '../css/images/clock.png';
import address from '../css/images/address.png';
import job_img from '../css/images/job.png';
import shovel from '../css/images/shovel.png';
import exclamation from '../css/images/exclamation.png';
import status_img from '../css/images/status.png';
import open from '../css/images/open.png';
import star from '../css/images/star.png';

const MyOrder = ({ job, cancelJob }) => {
    const [jobCoordinates, setJobCoordinates] = useState({ lat: 40.7128, lng: -74.0060 });
    const [fromDate, setFromDate] = useState("");
    const [fromTime, setFromTime] = useState("");
    const [toDate, setToDate] = useState("");
    const [toTime, setToTime] = useState("");
    const [trimmingDetails, setTrimmingDetails] = useState("");
    const [edgingInstructions, setEdgingInstructions] = useState("");
    const [snowRemovalDetails, setSnowRemovalDetails] = useState("")
    const [snowRemovalInstructions, setSnowRemovalInstructions] = useState("")
    const [status, setStatus] = useState("");
    const [statusDetails, setStatusDetails] = useState("")
    const [timestamp, setTimestamp] = useState("");
    const [showJob, setShowJob] = useState(false);
    const [showPhotos, setShowPhotos] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const db = getFirestore();
    const navigate = useNavigate();

    // Use the isFeedback variable to immediately mark when the user leaves feedback, so just in case the API call takes a split second the user cant leave feedback again
    const [isFeedback, setIsFeedback] = useState(false);

    // Helper function to decode our job.job_status array. This job_status array contains all the information
    // we need to know about when a job was placed, accepted, or completed. We also get an official timestamp
    // of when the order was placed with the Pending entry in the array. setStatus always is the most recent status
    useJobStatusFormatter(job, setStatus, setStatusDetails, setTimestamp);
    
    // Fetch users delivery address coordinates to present to them on a map
    useEffect(() => {
        const fetchCoordinates = async () => {
            try {
                const coordinates = await geocodeAddress(job.delivery_address);
                setJobCoordinates(coordinates); // Get the job coordinates so we can present a map to the user
            } catch (error) {
                console.error("Error fetching geocode data:", error);
            }
        };
    
        fetchCoordinates();
        }, [job.delivery_address]);

    // Decode the scheduled_time string only if it's available
    useEffect(() => {
        if (job.scheduled_time) {
            const scheduledTimes = job.scheduled_time.split('|');
            if (scheduledTimes.length === 2) {
                const [newDate1, ...newTime1Arr] = scheduledTimes[0].split(' ');
                const [newDate2, ...newTime2Arr] = scheduledTimes[1].split(' ');
    
                const newTime1 = newTime1Arr.join(' ');
                const newTime2 = newTime2Arr.join(' ');
    
                setFromDate(newDate1);
                setFromTime(newTime1);
                setToDate(newDate2);
                setToTime(newTime2);
            }
        }
    }, [job.scheduled_time]);

    // Determine the users job details and format them in a better way back the user
    useEffect(() => {
        const generateJobDetails = () => {

            if (job.job_type === 'Lawn Care') {
                job.job_details.forEach((item) => {
                    if (item.startsWith("Edging: ")) {
                        setEdgingInstructions(item.split("Edging: ")[1]);
                    } else {
                        // Set trimmingDetails to a string containing all the job instructions separated by a comma
                        const filteredDetails = job.job_details.filter(detail => !detail.startsWith("Edging: "));
                        setTrimmingDetails(filteredDetails.join(", "));
                    }
                });
            }

            if (job.job_type === 'Snow Removal') {
                job.job_details.forEach((item) => {
                    if (item.startsWith("Custom Instructions: ")) {
                        setSnowRemovalInstructions(item.split("Custom Instructions: ")[1]);
                    } else {
                        // Set snowRemovalDetails to a string containing all the job instructions separated by a comma
                        const filteredDetails = job.job_details.filter(detail => !detail.startsWith("Custom Instructions: "));
                        setSnowRemovalDetails(filteredDetails.join(", "));
                    }
                });
            }
        };

        generateJobDetails();
    }, [job.job_type, job.job_details]);

    // Function that handles leaving feedback on a completed order. Updates the providers totalRating score
    // in firebase, updates the feedback column on the job in our sql database, and updates the feedback array
    // attached to the provider in firebase
    const leaveFeedback = async (rating, feedback) => {
        setIsFeedback(true);
    
        try {
            const providerRef = doc(db, "users", job.provider_id);
            const providerSnap = await getDoc(providerRef);
    
            if (providerSnap.exists()) {
                const providerData = providerSnap.data();
                const providerDetails = providerData.providerDetails || {};

                // We are now going to update 3 fields attached to the provider in firestore. totalRating,
                // ratingCount, and feedback. totalRating is the number of ratings receieved, ratingCount
                // is the total cumulative rating score they've recevied (so we can get the average with these
                // two values) and a feedback arrayw which stores formatted strings of each review left so
                // we can show them on each provider profile. These strings will contain the rating, comment,
                // type of job they did, and when they completed it
    
                // Determine details based on job type and conditions. Takes the job details and formats them
                // in an easier way to read to the user
                let details = '';

                if (job.job_type === "Lawn Care") {
                    if (trimmingDetails && edgingInstructions) {
                        details = `${trimmingDetails} Lawn Trimming, Edging`;
                    } else if (!trimmingDetails && edgingInstructions) {
                        details = "Edging";
                    } else if (trimmingDetails && !edgingInstructions) {
                        details = `${trimmingDetails} Lawn Trimming`;
                    }
                } else if (job.job_type === "Snow Removal") {
                    details = snowRemovalDetails;
                }
    
                // Extract just the date from statusDetails (formatted as "at {time} on {date} by")
                const dateMatch = statusDetails.match(/on (\d{1,2}\/\d{1,2})/);
                const timeCompleted = dateMatch ? dateMatch[1] : ""; // extract the date part

                // Format feedback string based on whether the optional feedback was filled out
                const formattedFeedback = feedback 
                    ? `${rating}|${feedback}|${details}|${timeCompleted}` 
                    : `${rating}|${details}|${timeCompleted}`;
    
                // Initialize or append to providerDetails.feedback array
                const updatedFeedback = Array.isArray(providerDetails.feedback) 
                    ? [...providerDetails.feedback, formattedFeedback] 
                    : [formattedFeedback];
    
                // Prepare updated provider details
                const updatedProviderDetails = {
                    ...providerDetails,
                    totalRating: providerDetails.totalRating + rating,
                    ratingCount: providerDetails.ratingCount + 1,
                    feedback: updatedFeedback,
                };
    
                // Update Firestore with new providerDetails
                await updateDoc(providerRef, { providerDetails: updatedProviderDetails });
    
                // Format the feedback string for the SQL database
                const sqlFormattedFeedback = feedback 
                    ? `${rating}|${feedback}` 
                    : `${rating}`;
    
                await apiRequest("jobs/feedback", "PUT", {
                    job_id: job.job_id,
                    feedback: sqlFormattedFeedback
                });
    
                console.log("Feedback submitted successfully!");
            } else {
                console.error("No provider found for ID:", job.provider_id);
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
        }
    };

    return (
        <div>
        <div className="my-order-container">
            <Map center={jobCoordinates} zoom={16} isScrollable={false} className={'job-map'}/>
            <div className='my-order-body-container'>
            <div className='my-order-body'>

                <div className='job-id-text'>Job ID: {job.job_id}</div>
                <div className='job-body-header-container'>
                <div className='job-timestamp-text'>Placed at {timestamp}</div>
                <div className='job-open-text' onClick={() => {setShowJob(prevState => !prevState);}} style={{ cursor: 'pointer' }}> <img src={open} className={`job-open-image ${showJob ? "rotated" : ""}`}/>{showJob ? "Close Job" : "View Job"}</div>
                </div>

                <div className='job-divider'></div>

                {showJob && (
                <>
                    <div className='my-job-confirmation-container'>
                        <img src={address} className="my-job-confirmation-image"/>
                        <div className='my-job-confirmation-text-dark'>
                            {job.job_type} <span className='my-job-confirmation-text-light'>at</span> {job.delivery_address}
                        </div>
                    </div>

                    {job.job_type === 'Lawn Care' && (
                        <div className='my-job-confirmation-container'>
                            <img src={job_img} className="my-job-confirmation-image"/>
                            <div className='my-job-confirmation-text-dark'>
                                {job.size} {trimmingDetails} Lawn Trimming{edgingInstructions && (<>, Edging</>)} Job{/* if the user selected edging, show them */}
                            </div>
                        </div>
                    )}

                    {job.job_type === 'Snow Removal' && (
                        <div className='my-job-confirmation-container'>
                            <img src={shovel} className="my-job-confirmation-image"/>
                            <div className='my-job-confirmation-text-dark'>
                                {job.size} {snowRemovalDetails} Job
                            </div>
                        </div>
                    )}

                    <div className='my-job-confirmation-container'>
                        <img src={clock} className="my-job-confirmation-image"/>
                        <div className='my-job-confirmation-text-dark'>
                            {job.scheduled_type === 'ASAP' ? (
                                <>
                                    {job.scheduled_type}
                                </>
                            ) : (
                                <>
                                    <span className='my-job-confirmation-text-light'>Scheduled for: </span>{fromDate} {fromTime}<span className='my-job-confirmation-text-light'> through </span>{toDate} {toTime}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Option to display the attached photos and additional instructions */}
                    <div className='provider-distance-container' style={{marginTop: '.5rem'}}>
                        {/* Only show the View Details div if any of the instructions have a value */}
                        {(edgingInstructions || snowRemovalInstructions || job.custom_instructions) && (
                            <div 
                                className='view-attachments-container' 
                                onClick={() => {
                                    setShowDetails(prevState => !prevState);
                                }} 
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={exclamation} className="provider-attachments-image" />
                                <div className='job-attachments-text'>
                                    {showDetails ? "Hide Details" : "View Details"}
                                </div>
                            </div>
                        )}

                        <div 
                            className='view-attachments-container' 
                            onClick={() => {
                                setShowPhotos(prevState => !prevState);
                            }} 
                            style={{ cursor: 'pointer'}}
                        >
                            <img src={exclamation} className="provider-attachments-image" />
                            <div className='job-attachments-text'>
                                {showPhotos ? "Hide Photos" : "View Photos"}
                            </div>
                        </div>
                    </div>

                    {/* Display uploaded photos and custom instructions if toggle is on */}
                    {showPhotos && (
                    <div>
                        {/* Show Before Photos if available */}
                        {job.before_photos && job.before_photos.length > 0 && (
                        <>
                            <div className='job-attachments-text'>Before Photos:</div>
                            <div className="job-photos" style={{ marginBottom: '.7rem', marginTop: '.5rem' }}>
                            {job.before_photos.map((photo, index) => (
                                <div key={index} className="job-photo-item">
                                <img src={photo}/>
                                </div>
                            ))}
                            </div>
                        </>
                        )}

                        {/* Show After Photos if available */}
                        {job.after_photos && job.after_photos.length > 0 && (
                        <>
                            <div className='job-attachments-text'>After Photos:</div>
                            <div className="job-photos" style={{ marginBottom: '.7rem', marginTop: '.5rem' }}>
                            {job.after_photos.map((photo, index) => (
                                <div key={index} className="job-photo-item">
                                <img src={photo}/>
                                </div>
                            ))}
                            </div>
                        </>
                        )}
                    </div>
                    )}

                    {showDetails && (
                    <>
                        {edgingInstructions && (
                        <div className='job-details' style={{paddingBottom: '.25rem'}}>Edging Instructions: {edgingInstructions}</div>
                        )}
                        {snowRemovalInstructions && (
                        <div className='job-details' style={{paddingBottom: '.25rem'}}>Custom Clearing Instructions: {snowRemovalInstructions}</div>
                        )}
                        {job.custom_instructions && (
                        <div className='job-details' style={{paddingBottom: '.25rem'}}>Additional Instructions: {job.custom_instructions}</div>
                        )}
                    </>
                    )}
                    <div className='job-divider' style={{marginTop: '.35rem'}}></div>
                </>
                )}

                {/* dynamically set the status details text color based on the status, also if the status is Pending
                then show a loading dots animation to show the user their order is trying to be fulfilled */}
                <div className='my-job-status-container'>
                    <img src={status_img} className="my-job-status-image" />
                    <div className={`my-job-status-text ${status.toLowerCase()}-status`}>
                        STATUS: <span>{status.toUpperCase()}</span><br />
                        <span className='my-job-status-description'>
                            {statusDetails}
                            {status === "Pending" && <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>}
                        </span>
                    </div>
                </div>

                {status === 'Pending' && (
                <div className='job-cancel-button' onClick={() => cancelJob(job.job_id)}>
                    <div className='job-cancel-button-text'>Cancel</div>
                </div>
                )}

                {status === 'Accepted' && (
                    <div className='name-container' style={{ marginBottom: '-.25rem'}}>
                        <img src={job.providerDetails.providerSelfie[0]} className="selfie"/>
                        <div className='name-text-container'>
                            <div className='updated-provider-name-text'>{job.providerDetails.providerName} <span style={{ fontWeight: 'normal' }}>from</span> {extractCityState(job.providerDetails.providerAddress)}</div>
                            <div className='rating-container' style={{ marginTop: '.25rem'}}>
                                <img src={star} className="rating-image"/>
                                <div className='updated-provider-name-text'>{(job.providerDetails.totalRating / job.providerDetails.ratingCount).toFixed(1)}</div>
                                <div className='see-provider-text' onClick={() => window.open(`/provider/profile/${job.providerDetails.user}`, '_blank')}>See provider profile</div>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'Completed' && (
                <div>
                    <div className='name-container'>
                        <img src={job.providerDetails.providerSelfie[0]} className="selfie"/>
                        <div className='name-text-container'>
                            <div className='updated-provider-name-text'>{job.providerDetails.providerName} <span style={{ fontWeight: 'normal' }}>from</span> {extractCityState(job.providerDetails.providerAddress)}</div>
                            <div className='rating-container' style={{ marginTop: '.25rem'}}>
                                <img src={star} className="rating-image"/>
                                <div className='updated-provider-name-text'>{(job.providerDetails.totalRating / job.providerDetails.ratingCount).toFixed(1)}</div>
                                <div className='see-provider-text' onClick={() => window.open(`/provider/profile/${job.providerDetails.user}`, '_blank')}>See provider profile</div>
                            </div>
                        </div>
                    </div>

                    {job.feedback || isFeedback ? (
                        <div className='job-cancel-button' style={{ backgroundColor: "#888888", cursor: "auto" }}>
                            <div className='job-cancel-button-text'>Feedback Left</div>
                        </div>
                    ) : (
                        <div className='job-cancel-button' onClick={() => setModalOpen(true)}>
                            <div className='job-cancel-button-text'>Leave Feedback</div>
                        </div>
                    )}
                </div>
                )}

                {/* Full Page Modal */}
                {isModalOpen && (
                <LeaveFeedbackModal
                    isModalOpen={isModalOpen}
                    setModalOpen={setModalOpen}
                    leaveFeedback={leaveFeedback}
                    job={job}
                />
                )}

            </div>
            </div>
        </div>
        </div>
    );
};

export default MyOrder;