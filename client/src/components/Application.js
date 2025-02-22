import React, { useState, useEffect }from 'react';
import '../css/application.css';
import '../css/myorder.css';
import exclamation from '../css/images/exclamation.png';

const Application = ({ application, handleAccept, handleDeny }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div>
            <div className='application-container'>
                <div className='application-body'>
                    <div className='name-container'>
                        <img src={application.providerDetails.providerSelfie[0]} className="selfie"/>
                        <div className='name-text-container'>
                            <div className='name-text'>{application.providerDetails.providerName}</div>
                            <div className='app-details-text'>Applied for: {application.providerDetails.providedServices}</div>
                            <div className='app-details-text'>Resides at: {application.providerDetails.providerAddress}</div>
                        </div>
                    </div>

                    <div className='app-divider'></div>

                    {/* Option to display the attached before photos and additional instructions */}
                    <div className='view-container'>
                        <div 
                            className='view-attachments-container' 
                            onClick={() => {setShowDetails(prevState => !prevState)}}
                            style={{ cursor: 'pointer', marginTop: '.5rem' }}
                        >
                            <img src={exclamation} className="job-attachments-image" />
                            <div className='job-attachments-text'>
                                {showDetails ? "Hide Equipment" : "Show Equipment"}
                            </div>
                        </div>
                    </div>

                    {/* Display equipment photos if toggle is on */}
                    {showDetails && application.providerDetails.equipmentPhotos && (
                        <div>
                            <div className="job-photos" style={{ marginBottom: '.75rem'}}>
                                {application.providerDetails.equipmentPhotos.map((photo, index) => (
                                    <div key={index} className="job-photo-item">
                                        <img src={photo} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className='app-details-text' style={{marginTop: '-.4rem'}}>Service Range: {application.providerDetails.serviceRange} miles</div>

                    <div className='app-buttons-container'>
                        <div className='app-accept-button' onClick={() => handleAccept(application.userId)}>
                            <div className='app-accept-button-text'>Accept</div>
                        </div>
                        <div className='app-deny-button' onClick={() => handleDeny(application.userId)}>
                            <div className='app-deny-button-text'>Deny</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Application;