import React, { useState, useEffect, useRef } from 'react';
import '../../css/request.css';
import upload from '../../css/images/upload.png';

// This is the form that asks the user to provide photos of their equipment so we can verify they are
// equipped to handle the services they intend to provide.

const EquipmentForm = ({data, updateFormData, onBack, submitApplication}) => {
    const [uploadedEquipmentPhotos, setUploadedEquipmentPhotos] = useState([]);
    const [isApplicationSubmitted, setIsApplicationSubmitted] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5mb
    const MAX_FILES = 10;

    // Pre-fill the form with existing photos if available
    useEffect(() => {
        if (data.equipmentPhotos && data.equipmentPhotos > 0) {
            setUploadedEquipmentPhotos(data.equipmentPhotos);
        }
    }, [data.equipmentPhotos]);

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
        if (validFiles.length + uploadedEquipmentPhotos.length > MAX_FILES) {
            setError(`You can only upload up to ${MAX_FILES} photos.`);
            return;
        }

        // If there are invalid files show an error message
        if (invalidFiles.length > 0) {
            setError(invalidFiles.join("\n"));
        } else {
            setError("");
            setUploadedEquipmentPhotos((prevPhotos) => [...prevPhotos, ...validFiles]);
        }
    };

    // Handle click on the upload button
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    // Handle click on the remove photo button
    const handleRemovePhoto = (index) => {
        setUploadedEquipmentPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
    };

    // Handle when continue button is clicked. This is the final form, so we will call the submitApplication
    // function in the parent component
    const handleSubmit = async () => {
        if (uploadedEquipmentPhotos.length === 0) {
            setError("Please upload at least one photo before continuing.");
            return;
        }

        if (!confirm) {
            setError("You must confirm the disclaimer before submitting your application.");
            return;
        }
        setIsApplicationSubmitted(true); // Used to immediately grey out the "Submit Application" button to let the user know their application is being submitted
        updateFormData("equipmentPhotos", uploadedEquipmentPhotos);
        // Call submitApplication with uploadedEquipmentPhotos directly so we dont have a problem with the
        // asynchronous call to updateFormData with the uploadedEquipmentPhotos
        submitApplication(uploadedEquipmentPhotos);
    };

    return (
        <div className='request-body'>
            <div className='request-header'>Apply to Become a Provider</div>
            <div className='request-subheader'>
                To help us verify the services you’ll be providing, please upload clear pictures of the equipment you’ll be using. For example:
                <ul>
                    <li><b>Lawn Care:</b> A photo of your lawn mower, trimmers, or edging tools.</li>
                    <li><b>Snow Removal:</b> A photo of your snowblower or truck-mounted snowplow.</li>
                </ul>
            </div>

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
            <div className="uploaded-photos" style={{ marginBottom: uploadedEquipmentPhotos.length > 0 ? '.8rem' : '0' }}>
                {uploadedEquipmentPhotos.map((photo, index) => (
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

            <div className="provider-disclaimer-section">
                <label className="provider-disclaimer-label">
                    <input
                        type="checkbox"
                        checked={confirm}
                        onChange={() => setConfirm(!confirm)}
                        className="provider-disclaimer-checkbox"
                    />
                    <span className="provider-disclaimer-text">By checking this box, you confirm that you have the necessary permits, documents, and are in compliance with all local laws and regulations applicable to the services you will provide. You acknowledge that local laws may vary, and it is your responsibility to ensure full compliance.</span>
                </label>
            </div>

            {error && <div className="form-error-message">{error}</div>}

            {isApplicationSubmitted ? (
                <div className='two-buttons-container'>
                    <div className='request-back-button' style={{ backgroundColor: "#888888", cursor: "auto" }}>
                        <div className='request-back-button-text'>Back</div>
                    </div>
                    <div className='request-forward-button' style={{ backgroundColor: "#888888", cursor: "auto" }}>
                        <div className='request-forward-button-text'>Submit Application</div>
                    </div>
                </div>
            ) : (
                <div className='two-buttons-container'>
                    <div className='request-back-button' onClick={onBack}>
                        <div className='request-back-button-text'>Back</div>
                    </div>
                    <div className='request-forward-button' onClick={handleSubmit}>
                        <div className='request-forward-button-text'>Submit Application</div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default EquipmentForm;