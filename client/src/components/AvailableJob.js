import React, { useState, useEffect }from 'react';
import { apiRequest } from '../utils/apiRequest';
import { useNavigate, useLocation } from 'react-router-dom';
import { useJobStatusFormatter } from '../utils/dateFormatter';
import { useNotification } from "../context/NotificationContext";
import AfterPhotosModal from '../components/AfterPhotosModal';
import Map from "../components/Map";
import '../css/available_job.css';
import '../css/modal.css';
import clock from '../css/images/clock.png';
import address from '../css/images/address.png';
import job_img from '../css/images/job.png';
import shovel from '../css/images/shovel.png';
import exclamation from '../css/images/exclamation.png';

const AvailableJob = ({ job, completeJob, cancelJob }) => {
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
    const [showDetails, setShowDetails] = useState(false);
    const [ifCanCancel, setIfCanCancel] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const { addNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    // Helper function to decode our job.job_status array. This job_status array contains all the information
    // we need to know about when a job was placed, accepted, or completed. We also get an official timestamp
    // of when the order was placed with the Pending entry in the array. setStatus always is the most recent status
    useJobStatusFormatter(job, setStatus, setStatusDetails, setTimestamp);

    // Decode the scheduled_time string only if it's available
    useEffect(() => {
        if (job.scheduled_time) {
            const scheduledTimes = job.scheduled_time.split('|');
            if (scheduledTimes.length === 2) {
                const [fullDate1, ...newTime1Arr] = scheduledTimes[0].split(' ');
                const [fullDate2, ...newTime2Arr] = scheduledTimes[1].split(' ');
    
                // Remove the year from the date so it looks nicer (MM/DD/YY -> MM/DD)
                const newDate1 = fullDate1.split('/').slice(0, 2).join('/');
                const newDate2 = fullDate2.split('/').slice(0, 2).join('/');
    
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

    // Function that handles a provider accepting an order
    const acceptJob = async () => {
        const body = {
            job_id: job.job_id,
            provider_id: job.providerDetails.user,
        }

        try {
            // Run both api requests concurrently
            await Promise.all([
                apiRequest(`jobs/accept`, 'PUT', body),
                apiRequest(`jobs/update/${job.job_id}`, 'PUT')
            ]);

            addNotification("Order accepted successfully!")
            navigate('/provider/my-jobs');
        } catch (err) {
            console.log(`Error accepting job ${job.job_id}:`, err.message);
        }
    };

    // This checks if the user is on the "my jobs" page, so instead of showing an accept button we show a cancel
    // and mark as completed button
    useEffect(() => {
        if (location.pathname === "/provider/my-jobs") {
            setIfCanCancel(true);
        } else {
            setIfCanCancel(false);
        }
    }, [location.pathname]);

    const handleMarkCompleted = () => {
        setModalOpen(true); // Open the modal to collect after photos
    };

    return (
      <div>
        <div className="my-order-container">
          <Map center={{ lat: parseFloat(job.delivery_coords.lat), lng: parseFloat(job.delivery_coords.lon) }} zoom={14} isScrollable={false} className={'job-map'} />
          <div className='my-order-body-container'>
            <div className='my-order-body'>

              <div className='provider-information-container'>
                  <img src={address} className="provider-information-image"/>
                  <div className='provider-information-text-dark'>
                      {job.job_type} <span className='provider-information-text-light'>at</span> {job.delivery_address}
                  </div>
              </div>

              {job.job_type === 'Lawn Care' && (
                  <div className='provider-information-container'>
                      <img src={job_img} className="provider-information-image"/>
                      <div className='provider-information-text-dark'>
                          {job.size} {trimmingDetails} Lawn Trimming{edgingInstructions && (<>, Edging</>)} Job{/* if the user selected edging, show them */}
                      </div>
                  </div>
              )}

              {job.job_type === 'Snow Removal' && (
                  <div className='provider-information-container'>
                      <img src={shovel} className="provider-information-image"/>
                      <div className='provider-information-text-dark'>
                          {job.size} {snowRemovalDetails} Job
                      </div>
                  </div>
              )}

              <div className='provider-information-container'>
                  <img src={clock} className="provider-information-image"/>
                  <div className='provider-information-text-dark'>
                      {job.scheduled_type === 'ASAP' ? (
                          <>
                              {job.scheduled_type}
                          </>
                      ) : (
                          <>
                              <span className='provider-information-text-light'>Scheduled for: </span>{fromDate} {fromTime}<span className='provider-information-text-light'> through </span>{toDate} {toTime}
                          </>
                      )}
                  </div>
              </div>

              {/* Option to display the attached before photos and additional instructions */}
              <div className='provider-distance-container'>
                <div className='provider-distance-text'> {/* This is a link in google maps to the job */}
                  {job.distance} mi
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${job.providerDetails.providerCoords.lat},${job.providerDetails.providerCoords.lon}&destination=${job.delivery_coords.lat},${job.delivery_coords.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="provider-directions-text"
                  >
                    Get Directions
                  </a>
                </div>
                <div 
                  className='view-attachments-container' 
                  onClick={() => {
                    setShowDetails(prevState => !prevState);
                  }} 
                  style={{ cursor: 'pointer', marginTop: '.5rem' }}
                >
                  <img src={exclamation} className="provider-attachments-image" />
                  <div className='job-attachments-text'>
                    {showDetails ? "Hide Details" : "View Details"}
                  </div>
                </div>
              </div>

              {/* Display uploaded photos and custom instructions if toggle is on */}
              {showDetails && job.before_photos && (
                <div>
                  {status !== 'Pending' && (
                    <div className='provider-information-text-fulfilled' style={{ marginBottom: '.25rem' }}>
                      ACCEPTED: <span className='provider-information-text-dark'>{statusDetails.slice(0, -3)}</span>
                    </div>
                  )}
                  <div className='provider-information-text-placed' style={{marginBottom: '.25rem'}}>PLACED: <span className='provider-information-text-dark'>at {timestamp}</span></div>
                  <div className='provider-information-text-dark' style={{marginBottom: '.75rem', fontWeight: '600'}}>Job ID: {job.job_id}</div>
                  <div className='job-attachments-text' style={{marginTop: '-.5rem'}}>Before Photos:</div>
                  <div className="job-photos" style={{ marginBottom: job.before_photos.length > 0 ? '.7rem' : '0', marginTop: job.before_photos.length > 0 ? '.5rem' : '0' }}>
                      {job.before_photos.map((photo, index) => (
                          <div key={index} className="job-photo-item">
                              <img src={photo} />
                          </div>
                      ))}
                  </div>
                </div>
              )}

              {showDetails && (
                <>
                  {edgingInstructions && (
                    <div className='job-details'>Edging Instructions: {edgingInstructions}</div>
                  )}
                  {snowRemovalInstructions && (
                    <div className='job-details'>Custom Clearing Instructions: {snowRemovalInstructions}</div>
                  )}
                  {job.custom_instructions && (
                    <div className='job-details'>Additional Instructions: {job.custom_instructions}</div>
                  )}
                </>
              )}

              {!ifCanCancel ? (
                  <div className='job-cancel-button' onClick={() => acceptJob()}>
                      <div className='job-cancel-button-text'>Accept</div>
                  </div>
              ) : (
                  <div className='fulfilled-container'>
                      <div className='completed-button' onClick={handleMarkCompleted}>
                          <div className='fulfilled-button-text'>Mark Completed</div>
                      </div>
                      <div className='cancel-button' onClick={() => cancelJob(job.job_id)}>
                          <div className='fulfilled-button-text'>Cancel</div>
                      </div>
                  </div>
              )}

              {/* Full Page Modal */}
              {isModalOpen && (
                <AfterPhotosModal
                    isModalOpen={isModalOpen}
                    setModalOpen={setModalOpen}
                    completeJob={completeJob}
                    job={job}
                />
              )}

            </div>
          </div>
        </div>
      </div>
    );
};

export default AvailableJob;