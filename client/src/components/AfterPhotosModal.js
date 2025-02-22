import React, { useState, useEffect, useRef } from 'react';
import '../css/modal.css';
import '../css/request.css';
import upload from '../css/images/upload.png';
import close from '../css/images/close2.png';

const AfterPhotosModal = ({ isModalOpen, setModalOpen, completeJob, job}) => {
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    const [error, setError] = useState("");
    const [isButtonPressed, setIsButtonPressed] = useState(false);
    const fileInputRef = useRef(null);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5mb
    const MAX_FILES = 6; 

    // Handle file selection
    const handleFileChange = async (event) => {
        const files = Array.from(event.target.files);

        const validFiles = [];
        const invalidFiles = [];

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                invalidFiles.push(`${file.name} is too large. Maximum size is 5MB.`);
            } else if (!file.type.startsWith('image/')) {
                invalidFiles.push(`${file.name} is not a valid image file.`);
            } else {
                validFiles.push(file);
            }
        }

        // If the user uploads too many files
        if (validFiles.length + uploadedPhotos.length > MAX_FILES) {
            setError(`You can only upload up to ${MAX_FILES} photos.`);
            return;
        }

        // If there are invalid files show an error message
        if (invalidFiles.length > 0) {
            setError(invalidFiles.join("\n"));
        } else {
            setError("");
            setUploadedPhotos((prevPhotos) => [...prevPhotos, ...validFiles]);
        }
    };

    // Handle click on the upload button
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    // Handle click on the remove photo button
    const handleRemovePhoto = (index) => {
        setUploadedPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
    };

    // Handle when continue button is clicked
    const handleSubmit = () => {
        if (uploadedPhotos.length === 0) {
            setError("Please upload at least one photo before continuing.");
            return;
        }
        setIsButtonPressed(true);
        completeJob(job.job_id, uploadedPhotos);
        setError("");
    };

    return (
        isModalOpen && (
            <div className="full-page-modal">
                <div className="modal-content">

                    <div className="modal-close-button" onClick={() => setModalOpen(false)}>
                        <img src={close} className="modal-close-image" />
                    </div>
                    <div className="modal-body">
                        <div className='modal-header-text'>Upload After Photos</div>
                        <div className='modal-subheader-text'>To mark this job as completed, please upload photos showing the work you've done. These images will be shared with the customer as proof of completion.</div>
                        <div className='modal-subheader-text'><b>Address:</b> {job.delivery_address}</div>
                        <div className='modal-subheader-text'><b>Job ID:</b> {job.job_id}</div>

                        <div className='modal-upload-container' onClick={handleUploadClick}>
                            <img src={upload} className="modal-upload-image"/>
                            <div className='modal-upload-placeholder-text'>Upload Photos</div>
                        </div>

                        {/* File input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                        />

                        {/* Display uploaded photos */}
                        <div className="modal-uploaded-photos" style={{ marginBottom: uploadedPhotos.length > 0 ? "1.25rem" : "0" }}>
                            {uploadedPhotos.map((photo, index) => (
                                <div key={index} className="modal-uploaded-photo-item">
                                    <img src={URL.createObjectURL(photo)} />
                                    <button
                                        className="modal-remove-photo-button"
                                        onClick={() => handleRemovePhoto(index)}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>

                        {error && <div className="form-error-message" style={{marginTop: '-.75rem', marginBottom: '.75rem'}}>{error}</div>}

                        {/* Use the isOrderPlaced variable to see if the user has pressed "Confirm Order", and if they have, grey
                        the button out until the order is done being confirmed */}
                        {isButtonPressed ? (
                            <div className='modal-continue-button' style={{ backgroundColor: "#888888", cursor: "auto" }}>
                                <div className='modal-continue-button-text'>Complete</div>
                            </div>
                        ) : (
                            <div className='modal-continue-button' onClick={handleSubmit}>
                                <div className='modal-continue-button-text'>Complete</div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        )
    );
};

export default AfterPhotosModal;