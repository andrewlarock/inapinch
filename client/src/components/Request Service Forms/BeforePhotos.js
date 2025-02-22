import React, { useState, useEffect, useRef } from 'react';
import '../../css/request.css';
import upload from '../../css/images/upload.png';

// This is the form that asks the user to provide photos of the areas where they would like to receive service

const BeforePhotos = ({data, updateFormData, onNext, onBack}) => {
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5mb
    const MAX_FILES = 6;

    // Pre-fill the form with existing photos if available
    useEffect(() => {
        if (data.before_photos && data.before_photos.length > 0) {
            setUploadedPhotos(data.before_photos);
        }
    }, [data.before_photos]);

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
            setUploadedPhotos((prevPhotos) => [...prevPhotos, ...validFiles]); // Add valid files as base64 strings
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

        updateFormData("before_photos", uploadedPhotos);
        setError("");
        onNext();
    };

    return (
        <div className='request-body'>
            <div className='request-header'>In a Pinch <span className='subform-subheader'>{data.job_type}</span></div>
            <div className='request-subheader'>Please provide a brief picture of the areas where you'd like to receive service. <br></br><br></br>This is only to help ensure we match you with the right provider for the job and give them an accurate representation of the work to be done. {data.job_type === 'Lawn Care' && (<> For lawn care, include a photo of your front or back lawn, or areas you’d like edged.</>)}{data.job_type === 'Snow Removal' && (<> For snow removal, include a photo of the areas you marked for snow removal.</>)}</div> {/* conditionally render the final sentence based on what job_type the user has selected to give them more specific information */}

            <div className='upload-container' onClick={handleUploadClick}>
                <img src={upload} className="upload-image"/>
                <div className='upload-placeholder-text'>Upload Photos</div>
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
            <div className="uploaded-photos">
                {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="uploaded-photo-item">
                        <img src={URL.createObjectURL(photo)} />
                        <button
                            className="remove-photo-button"
                            onClick={() => handleRemovePhoto(index)}
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>

            {error && <div className="form-error-message" style={{marginTop: '-.4rem'}}>{error}</div>}

            <div className='two-buttons-container'>
                <div className='request-back-button' onClick={onBack}>
                    <div className='request-back-button-text'>Back</div>
                </div>
                <div className='request-forward-button' onClick={handleSubmit}>
                    <div className='request-forward-button-text'>Continue</div>
                </div>
            </div>

        </div>
    );
}

export default BeforePhotos;