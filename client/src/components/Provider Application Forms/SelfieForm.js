import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from "../../utils/apiRequest";
import '../../css/request.css';
import upload from '../../css/images/upload.png';

// This is the form that asks the user to a selfie of themselves for verification

const SelfieForm = ({data, updateFormData, onBack, onNext}) => {
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5mb
    const MAX_FILES = 1;

    // Pre-fill the form with existing photos if available
    useEffect(() => {
        if (data.providerSelfie && data.providerSelfie.length > 0) {
            setUploadedPhotos(data.providerSelfie);
        }
    }, [data.providerSelfie]);

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

        // If there are invalid files, show an error message
        if (invalidFiles.length > 0) {
            setError(invalidFiles.join("\n"));
        } else {
            setError("");
            setUploadedPhotos((prevPhotos) => [...prevPhotos, ...validFiles]);
        }
    };

    // Handle click on the upload button
    const handleUploadClick = () => {
        fileInputRef.current.click(); // Trigger the file input
    };

    // Handle click on the remove photo button
    const handleRemovePhoto = (index) => {
        setUploadedPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
    };

    // Handle when continue button is clicked
    const handleSubmit = async () => {
        if (uploadedPhotos.length === 0) {
            setError("Please upload at least one photo before continuing.");
            return;
        }

        updateFormData("providerSelfie", uploadedPhotos);
        onNext();
    };

    return (
        <div className='request-body'>
            <div className='request-header'>Apply to Become a Provider</div>
            <div className='request-subheader'>Please submit a clear selfie of yourself to help us verify your identity and ensure a trusted experience for all users.</div>

            <div className='upload-container' onClick={handleUploadClick}>
                <img src={upload} className="upload-image"/>
                <div className='upload-placeholder-text'>Upload Photo</div>
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
            <div className="uploaded-photos" style={{ marginBottom: uploadedPhotos.length > 0 ? '.8rem' : '0' }}>
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

export default SelfieForm;