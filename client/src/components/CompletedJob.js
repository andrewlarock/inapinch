import React, { useState, useEffect }from 'react';
import { useJobStatusFormatter } from '../utils/dateFormatter';
import Map from "../components/Map";
import '../css/available_job.css';
import '../css/modal.css';
import clock from '../css/images/clock.png';
import address from '../css/images/address.png';
import job_img from '../css/images/job.png';
import shovel from '../css/images/shovel.png';
import exclamation from '../css/images/exclamation.png';
import star from '../css/images/star.png';
import starGray from '../css/images/starGray.png';

const CompletedJob = ({ job }) => {
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
    const [showPhotos, setShowPhotos] = useState(false);
    const [rating, setRating] = useState();
    const [feedback, setFeedback] = useState();

    // Helper function to decode our job.job_status array. This job_status array contains all the information
    // we need to know about when a job was placed, accepted, or completed. We also get an official timestamp
    // of when the order was placed with the Pending entry in the array. setStatus always is the most recent status
    useJobStatusFormatter(job, setStatus, setStatusDetails, setTimestamp);

    // If the provider was left feeback on this job, format it and show it back to the provider
    useEffect(() => {
        if (job.feedback) {
            const [rating, feedback] = job.feedback.split('|');
            setRating(parseInt(rating));
            if (feedback) {
                setFeedback(feedback);
            }
        }
    }, [job.feedback]);

    // Decode the scheduled_time string only if its available
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

                {/* Option to display the attached photos and additional instructions */}
                <div className='provider-distance-container'>
                    {/* Only show the View Details div if any of the instructions have a value */}
                    {(edgingInstructions || snowRemovalInstructions || job.custom_instructions) && (
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
                    )}

                    <div 
                        className='view-attachments-container' 
                        onClick={() => {
                            setShowPhotos(prevState => !prevState);
                        }} 
                        style={{ cursor: 'pointer', marginTop: '.5rem' }}
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
                              <img src={photo} alt={`Before ${index + 1}`} />
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
                              <img src={photo} alt={`After ${index + 1}`} />
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

                <div className='job-divider' style={{marginTop: '.25rem'}}></div>

                <div className='provider-information-text-dark' style={{marginBottom: '.25rem', fontWeight: '500'}}><b>Job ID:</b> {job.job_id}</div>
                <div className='provider-information-text-dark' style={{marginBottom: '.25rem', fontWeight: '500'}}><b>{status}:</b> {statusDetails.slice(3, -3)}</div>
                <div className='feedback-container'>
                    <div className='provider-information-text-dark' style={{marginBottom: '-.4rem', display: 'flex', alignItems: 'center'}}>
                        <b>Feedback Received:&nbsp;</b>
                        {rating ? (
                            <>
                                {/* Display stars based on the rating */}
                                {[...Array(5)].map((_, index) => (
                                    <img 
                                        key={index} 
                                        src={index < rating ? star : starGray} 
                                        alt={`star-${index + 1}`} 
                                        className="star-image"
                                    />
                                ))}
                            </>
                        ) : (
                            <div style={{fontWeight: '500'}}>None</div>
                        )}
                    </div>
                </div>
                
                {/* Display the feedback text if it exists */}
                {feedback && <div className="job-attachments-text" style={{marginTop: '.65rem', marginBottom: '-.5rem'}}>{feedback}</div>}
            </div>
          </div>
        </div>
      </div>
    );
};

export default CompletedJob;