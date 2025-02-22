import React, { useState, useEffect } from 'react';
import sanitizeInput from "../../utils/sanitizeInput";
import '../../css/request.css';

// This is the form that asks the user what the size of the job is and for additional instructions

const SizeForm = ({data, updateFormData, onNext, onBack}) => {
    const [size, setSize] = useState("");
    const [confirm, setConfirm] = useState(false);
    const [customInstructions, setCustomInstructions] = useState("");
    const [error, setError] = useState("");

    // Pre-fill the form based on existing size and instructions if the user has already filled out this form
    useEffect(() => {
        if (data.size) {
            setSize(data.size);
        }

        if (data.custom_instructions) {
            setCustomInstructions(data.custom_instructions);
        }
    }, [data.size, data.custom_instructions]);

    const handleSubmit = () => {
        if (!size) {
            setError("Please fill out the size field before continuing.");
            return;
        }

        if (!confirm) {
            setError("Please check the confirmation box before continuing.");
            return;
        }

        if (customInstructions.length > 500) {
            setError("Your custom instructions cannot exceed 500 characters.");
            return;
        }

        updateFormData('size', size)
        updateFormData('custom_instructions', sanitizeInput(customInstructions))
        setError("");
        onNext();
    };

    return (
        <div className='request-body'>
            <div className='request-header'>In a Pinch <span className='subform-subheader'>{data.job_type}</span></div>
            <div className='request-subheader'>Please select the general size of the job (small, medium, or large) to help us match you with the right provider and the appropriate tools for the job.</div>

            <div className='options-container' style={{ flexDirection: 'unset' }}>
                {['Small', 'Medium', 'Large'].map((option, index) => (
                <label key={index} className='option-label'>
                    <input type='radio'
                    value={option}
                    checked={size === option}
                    onChange={(e) => setSize(e.target.value)}
                    className='radio-input'
                    />
                    <span className='radio-bubble'></span>
                    <span className='option-text'>{option}</span>
                </label>
                ))}
            </div>

            <div className='request-subheader' style={{ marginBottom: '-.5rem', marginTop: '.75rem' }}>Please confirm the following:</div>
            <div className="disclaimer-section">
                <label className="disclaimer-label">
                    <input
                        type="checkbox"
                        checked={confirm}
                        onChange={() => setConfirm(!confirm)}
                        className="disclaimer-checkbox"
                    />
                    <span className="disclaimer-text">
                        By checking this box, you acknowledge that the areas where service will be performed are free of any obstructions and that there is sufficient space for the provider to complete the job.
                    </span>
                </label>
            </div>

            <div className='request-details' style={{ marginTop: '.5rem' }}> If you have any additional information or special instructions, please provide them in the field below.</div>
            <input
                type="text"
                placeholder="Please note here"
                className="request-input-small"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
            />

            {error && <div className="form-error-message" style={{marginTop: '-.2rem'}}>{error}</div>}

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

export default SizeForm;