import React, { useState, useEffect } from 'react';
import Map from "../../components/Map";
import { geocodeAddress } from "../../utils/geocodeAddress";
import { apiRequest } from "../../utils/apiRequest";
import { generateJobId } from "../../utils/generateJobId";
import { useNotification } from "../../context/NotificationContext";
import '../../css/request.css';
import clock from '../../css/images/clock.png';
import address from '../../css/images/address.png';
import job from '../../css/images/job.png';
import shovel from '../../css/images/shovel.png';
import exclamation from '../../css/images/exclamation.png';

// This is the form that presents the user with their entire order so they can confirm its correct

const ConfirmationForm = ({data, onNext, onBack}) => {
    const [lockedMapCenter, setLockedMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
    const [fromDate, setFromDate] = useState("");
    const [fromTime, setFromTime] = useState("");
    const [toDate, setToDate] = useState("");
    const [toTime, setToTime] = useState("");
    const [trimmingDetails, setTrimmingDetails] = useState("");
    const [edgingInstructions, setEdgingInstructions] = useState("");
    const [snowRemovalDetails, setSnowRemovalDetails] = useState("")
    const [snowRemovalInstructions, setSnowRemovalInstructions] = useState("")
    const [showAttachments, setShowAttachments] = useState(false);
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const deliveryAddress = data.delivery_address;
    const { addNotification } = useNotification();

    // Decode the scheduled_time string only if it's available
    useEffect(() => {
        if (data.scheduled_time) {
            const scheduledTimes = data.scheduled_time.split('|');
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
    }, [data.scheduled_time]);

    // Fetch users delivery address coordinates to present to them on a map
    useEffect(() => {
        const fetchCoordinates = async () => {
          try {
            const coordinates = await geocodeAddress(deliveryAddress);
            setLockedMapCenter(coordinates); // Update the map center with fetched coordinates
          } catch (error) {
            console.error("Error fetching geocode data:", error);
          }
        };
    
        if (deliveryAddress) {
          fetchCoordinates();
        }
      }, [deliveryAddress]);

    // Determine the users job details and format them in a better way back the user
    useEffect(() => {
        const generateJobDetails = () => {
            if (data.job_type === 'Lawn Care') {

                data.job_details.forEach((item) => {
                    if (item.startsWith("Edging: ")) {
                        setEdgingInstructions(item.split("Edging: ")[1]);
                    } else {
                        // Set trimmingDetails to a string containing all the job instructions separated by a comma
                        const filteredDetails = data.job_details.filter(detail => !detail.startsWith("Edging: ")); // Dont include the edging instructions
                        setTrimmingDetails(filteredDetails.join(", "));
                    }
                })
            }

            if (data.job_type === 'Snow Removal') {

                data.job_details.forEach((item) => {
                    if (item.startsWith("Custom Instructions: ")) {
                        setSnowRemovalInstructions(item.split("Custom Instructions: ")[1]);
                    } else {
                        // Set snowRemovalDetails to a string containing all the job instructions separated by a comma
                        const filteredDetails = data.job_details.filter(detail => !detail.startsWith("Custom Instructions: ")); // Dont include the custom instructions
                        setSnowRemovalDetails(filteredDetails.join(", "));
                    }
                })
            }
        };

        generateJobDetails();
    }, [data.job_type, data.job_details]);

    // Because we dont need any error handling for this form we can just go ahead and confirm the order
    const handleSubmit = async () => {
        setIsOrderPlaced(true); // Used to immediately grey out the "Confirm Order" button to let the user know their order is being placed
        try {
            const jobId = generateJobId();
   
            const payload = {
                job_id: jobId,
                customer_id: data.customer_id,
                job_type: data.job_type,
                job_details: data.job_details,
                custom_instructions: data.custom_instructions,
                delivery_address: data.delivery_address,
                delivery_coords: data.delivery_coords,
                scheduled_type: data.scheduled_type,
                scheduled_time: data.scheduled_time,
                size: data.size,
            };
   
            let uploadedUrls = [];
   
            if (data.before_photos && data.before_photos.length > 0) {
                for (let i = 0; i < data.before_photos.length; i++) {
                    const file = data.before_photos[i];
                    const fileNumber = i + 1; // Start file numbering from 1
   
                    // Get the file extension so we can correctly store it in S3
                    const fileExtension = file.name.slice(file.name.lastIndexOf('.'));
                    const fileKey = `${jobId}_before_${fileNumber}${fileExtension}`; // Define file path for S3

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
            }

            payload.before_photos = uploadedUrls;

            // Submit the job with the uploaded photo URLs
            const response = await apiRequest("jobs/add", "POST", payload);
            addNotification("Your order has been confirmed!");
            onNext();
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("Failed to submit job:", error.message);
        }
    };

    return (
        <div className='request-body'>
            <div className='request-header'>In a Pinch <span className='subform-subheader'>{data.job_type}</span></div>
            <div className='request-subheader'>Review the information you’ve provided to ensure everything is correct before confirming your order:</div>

            <Map center={lockedMapCenter} zoom={17} isScrollable={false} className={'map-container'}/>

            <div className='confirmation-container' style={{marginTop: '-1.5rem'}}>
                <div className='confirmation-text-dark'>
                    <img src={address} className="confirmation-image"/>
                    {data.job_type} <span className='confirmation-text-light'>at</span> {data.delivery_address}
                </div>
            </div>

            {data.job_type === 'Lawn Care' && (
                <div className='confirmation-container'>
                    <div className='confirmation-text-dark'>
                        <img src={job} className="confirmation-image"/>
                        {data.size} {trimmingDetails} Lawn Trimming{edgingInstructions && (<>, Edging</>)} Job{/* if the user selected edging, show them */}
                    </div>
                </div>
            )}

            {data.job_type === 'Snow Removal' && (
                <div className='confirmation-container'>
                    <div className='confirmation-text-dark'>
                        <img src={shovel} className="confirmation-image"/>
                        {data.size} {snowRemovalDetails} Job
                    </div>
                </div>
            )}

            <div className='confirmation-container'>
                <div className='confirmation-text-dark'>
                    <img src={clock} className="confirmation-image"/>
                    {data.scheduled_type === 'ASAP' ? (
                        <>
                            {data.scheduled_type}
                        </>
                    ) : (
                        <>
                            <span className='confirmation-text-light'>Scheduled for: </span>{fromDate} {fromTime}<span className='confirmation-text-light'> through </span>{toDate} {toTime}
                        </>
                    )}
                </div>
            </div>

            {edgingInstructions && (
                <>
                    <div className='request-details' style={{marginBottom: '.75rem', textAlign: 'center'}}>Edging Instructions: {edgingInstructions}</div>
                </>
            )}

            {snowRemovalInstructions && (
                <>
                    <div className='request-details' style={{marginBottom: '.75rem', textAlign: 'center'}}>Custom Clearing Instructions: {snowRemovalInstructions}</div>
                </>
            )}

            {data.custom_instructions && (
                <>
                    <div className='request-details' style={{marginBottom: '.75rem', textAlign: 'center'}}>Additional Instructions: {data.custom_instructions}</div>
                </>
            )}

            <div className='view-attachments-container' onClick={() => setShowAttachments(prevState => !prevState)} style={{cursor: 'pointer', justifyContent: 'center'}}>
                <img src={exclamation} className="view-attachments-image" />
                <div className='view-attachments-text'>{showAttachments ? "Hide Attachments" : "View Attachments"}</div>
            </div>

            {/* Display uploaded photos if toggle is on */}
            {showAttachments && data.before_photos && (
                <div className="uploaded-photos" style={{ marginBottom: data.before_photos.length > 0 ? '.8rem' : '0', justifyContent: 'center'}}>
                    {data.before_photos.map((photo, index) => (
                        <div key={index} className="uploaded-photo-item">
                            <img src={URL.createObjectURL(photo)} />
                        </div>
                    ))}
                </div>
            )}

            {/* Use the isOrderPlaced variable to see if the user has pressed "Confirm Order", and if they have, grey
            the button out until the order is done being confirmed */}
            {isOrderPlaced ? (
                <div className='two-buttons-container'>
                    <div className='request-back-button' style={{ backgroundColor: "#888888", cursor: "auto" }}>
                        <div className='request-back-button-text'>Back</div>
                    </div>
                    <div className='request-forward-button' style={{ backgroundColor: "#888888", cursor: "auto" }}>
                        <div className='request-forward-button-text'>Confirm Order</div>
                    </div>
                </div>
            ) : (
                <div className='two-buttons-container'>
                    <div className='request-back-button' onClick={onBack}>
                        <div className='request-back-button-text'>Back</div>
                    </div>
                    <div className='request-forward-button' onClick={handleSubmit}>
                        <div className='request-forward-button-text'>Confirm Order</div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ConfirmationForm;