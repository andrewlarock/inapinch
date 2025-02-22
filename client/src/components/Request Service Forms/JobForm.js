import React, { useState, useEffect } from 'react';
import sanitizeInput from "../../utils/sanitizeInput";
import '../../css/request.css';

// This is the form that asks the user what type of service they would like and at what address. This
// will be two different forms based on whether the user selected Lawn Care or Snow Removal

const JobForm = ({data, updateFormData, onNext, onBack}) => {
    const [trimming, setTrimming] = useState('');
    const [edging, setEdging] = useState('');
    const [edgingInstructions, setEdgingInstructions] = useState('');
    const [snowRemoval, setSnowRemoval] = useState([]);
    const [additionalClearing, setAdditionalClearing] = useState('');
    const [error, setError] = useState('');

    // Pre-fill the form based on existing job_details if the user has already filled out this form
    useEffect(() => {
        // Pre-fill the form if the user has selected lawn care before
        if (data.job_details) {
            if (data.job_type === 'Lawn Care') {
                data.job_details.forEach((item) => {
                    if (item.startsWith("Edging: ")) {
                        setEdging("Yes");
                        setEdgingInstructions(item.split("Edging: ")[1]); // correctly decode the edgingInstructions if they exist
                        if (data.job_details.length === 1) { // This means the user selected "None" for trimming
                            setTrimming("None");
                        }
                    } else {
                        setTrimming(item);
                        setEdging("None")
                    }
                })
            }
            // Pre-fill the form if the user has selected snow removal before
            if (data.job_type === 'Snow Removal') {
                const snowRemovalEntries = [];

                data.job_details.forEach((item) => {
                    if (item.startsWith("Custom Instructions: ")) {
                        setAdditionalClearing(item.split("Custom Instructions: ")[1]);
                    } else {
                        snowRemovalEntries.push(item);
                    }
                })

                setSnowRemoval(snowRemovalEntries);
            }
        }
    }, [data.job_type, data.job_details]);

    const handleSubmitLawnCare = () => {
        // Validate that none of the fields are blank before continuing
        if (!trimming || !edging || (edging === 'Yes' && !edgingInstructions)) {
            setError("Please don't leave any of the fields blank before continuing.")
            return;
        }

        if (trimming === 'None' && edging === 'None') {
            setError("You must select either lawn trimming or edging.")
            return;
        }

        // Error handling for the edgingInstructions being unnecessarily long
        if (edgingInstructions && edgingInstructions.length > 500) {
            setError("The edging instructions cannot be more than 500 characters in length.")
            return;
        }

        // Create a job_details array based on trimming and edging values
        const jobDetails = [];

        if (trimming !== 'None') {
            jobDetails.push(`${trimming}`);
        }

        if (edging && edgingInstructions) {
            jobDetails.push(`Edging: ${sanitizeInput(edgingInstructions)}`);
        }
    
        // Update the parent component with the updated job details
        setError("");
        updateFormData('job_details', jobDetails);
        onNext();
    };

    const handleSubmitSnowRemoval = () => {
        // Validate that none of the fields are blank before continuing
        if (!snowRemoval.length > 0) {
            setError("Please don't leave any of the fields blank before continuing.")
            return;
        }

        // Error handling for the additional instructions being unnecessarily long
        if (additionalClearing && additionalClearing.length > 500) {
            setError("The additional clearing instructions cannot be more than 500 characters in length.")
            return;
        }

        if (additionalClearing) {
            snowRemoval.push(`Custom Instructions: ${sanitizeInput(additionalClearing)}`)
        }
    
        setError("");
        updateFormData('job_details', snowRemoval);
        onNext();
    };

    // Return the form for the Lawn Care job details if the user selected Lawn Care
    if (data.job_type === 'Lawn Care') {
        return (
            <div className='request-body'>
                <div className='request-header'>In a Pinch <span className='subform-subheader'>Lawn Care</span></div>
                <div className='request-subheader'>Please mark the specific lawn care services you'd like, such as lawn trimming or edging.</div>

                <div className='details-header-text'>Lawn Trimming</div>
                <div className='options-container'>
                    {['Front & Back', 'Front Only', 'Back Only', 'None'].map((option, index) => (
                    <label key={index} className='option-label'>
                        <input type='radio'
                        value={option}
                        checked={trimming === option}
                        onChange={(e) => setTrimming(e.target.value)}
                        className='radio-input'
                        />
                        <span className='radio-bubble'></span>
                        <span className='option-text'>{option}</span>
                    </label>
                    ))}
                </div>

                <div className='details-header-text' style={{'marginTop': '1rem'}}>Edging</div>
                <div className='options-container'>
                    {['Yes', 'None'].map((option, index) => (
                    <label key={index} className='option-label'>
                        <input type='radio'
                        value={option}
                        checked={edging === option}
                        onChange={(e) => setEdging(e.target.value)}
                        className='radio-input'
                        />
                        <span className='radio-bubble'></span>
                        <span className='option-text'>{option}</span>
                    </label>
                    ))}
                </div>
                
                {edging === 'Yes' && (
                <>
                    <div className='request-details'>In the field below, please note the areas where you'd like edging done, such as along sidewalks, driveways, flower beds, or fences.</div>
                    <input
                        type="text"
                        placeholder="Please note here"
                        className="request-input-small"
                        value={edgingInstructions}
                        onChange={(e) => setEdgingInstructions(e.target.value)}
                    />
                </>
                )}

                {error && <div className="form-error-message">{error}</div>}

                <div className='two-buttons-container'>
                    <div className='request-back-button' onClick={onBack}>
                        <div className='request-back-button-text'>Back</div>
                    </div>
                    <div className='request-forward-button' onClick={handleSubmitLawnCare}>
                        <div className='request-forward-button-text'>Continue</div>
                    </div>
                </div>

            </div>
        );
    }

    // Return the form for the Snow Removal job details if the user selected Snow Removal
    return (
        <div className='request-body'>
            <div className='request-header'>In a Pinch <span className='subform-subheader'>Snow Removal</span></div>
            <div className='request-subheader'>Please mark the specific snow removal services you'd like, such as driveway or sidewalk clearing.</div>

            <div className='details-header-text'>Snow Removal</div>
            <div className='options-container'>
                {['Driveway', 'Sidewalks', 'Front Porch', 'Back Porch'].map((option, index) => (
                <label key={index} className='option-label'>
                    <input type='checkbox'
                    value={option}
                    checked={snowRemoval.includes(option)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSnowRemoval([...snowRemoval, option]); // Add the selected option to the snow removal array
                        } else {
                            setSnowRemoval(snowRemoval.filter(item => item !== option)); // Remove the option if unchecked
                        }
                    }}
                    className='radio-input'
                    />
                    <span className='radio-bubble'></span>
                    <span className='option-text'>{option}</span>
                </label>
                ))}
            </div>

            <div className='details-header-text' style={{'marginTop': '1rem'}}>Additional Clearing</div>
            <div className='request-details' style={{'marginTop': '-.6rem'}}>Please add any additional requests for snow clearing in the box below, for example driveway deicing or any outdoor stairs.</div>
                <input
                    type="text"
                    placeholder="Please note here"
                    className="request-input-small"
                    value={additionalClearing}
                    onChange={(e) => setAdditionalClearing(e.target.value)}
                />

            {error && <div className="form-error-message">{error}</div>}

            <div className='two-buttons-container'>
                <div className='request-back-button' onClick={onBack}>
                    <div className='request-back-button-text'>Back</div>
                </div>
                <div className='request-forward-button' onClick={handleSubmitSnowRemoval}>
                    <div className='request-forward-button-text'>Continue</div>
                </div>
            </div>

        </div>
    );

}

export default JobForm;