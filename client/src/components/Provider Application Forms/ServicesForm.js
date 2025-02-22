import React, { useState, useEffect } from 'react';
import '../../css/request.css';

// This is the form that asks the user what type of service they intend to provide and their service range

const ServicesForm = ({data, updateFormData, onNext, onBack}) => {
    const [providedServices, setProvidedServices] = useState('');
    const [serviceRange, setServiceRange] = useState('');
    const [customRange, setCustomRange] = useState('');
    const [error, setError] = useState('');

    // Pre-fill the form based on existing servicesProvided and serviceRange if the user has already
    // filled out this form
    useEffect(() => {
        if (data.providedServices) {
            setProvidedServices(data.providedServices);
        }
        if ([5, 10, 15].includes(data.serviceRange)) { // if the user didnt select a custom range, and selected one of the default values of 5, 10, or 15
            setServiceRange(data.serviceRange.toString());
        } else if (data.serviceRange) { // if the user selected a custom range. turn this back into a string so the radio buttons can pick it up
            setServiceRange('Custom')
            setCustomRange(data.serviceRange.toString())
        }
    }, [data.providedServices, data.serviceRange]);

    const handleSubmit = () => {
        // Check if any of the fields are blank
        if ((!providedServices || !serviceRange) || (serviceRange === 'Custom' && !customRange)) {
            setError("Please don't leave any of the fields blank before continuing.")
            return;
        }

        let range; // hold the final range value as an integer

        // Check if the user picked a custom service range
        if (serviceRange === 'Custom') {
            // Allow numbers and one decimal point
            const validNumberRegex = /^[0-9]+(\.[0-9]+)?$/;

            // Validate if the customRange input matches the regex
            if (!validNumberRegex.test(customRange)) {
                setError('Please enter a valid number (e.g., 1, 1.5) for your custom range.');
                return;
            }

            const customRangeValue = parseFloat(customRange);
            if (isNaN(customRangeValue) || customRangeValue < 1) {
                setError('Please enter a valid number of miles (at least 1 mile) for your custom range.');
                return;
            }
            range = customRangeValue
        } else {
            range = parseInt(serviceRange, 10);
        }

        // Proceed
        setError('');
        updateFormData('serviceRange', range); // Update parent data object
        updateFormData('providedServices', providedServices); // Update parent data object
        onNext();
    };

    return (
        <div className='request-body'>
            <div className='request-header'>Apply to Become a Provider</div>
            <div className='request-subheader'>Please mark which services you intend to provide:</div>

            <div className='options-container'>
                {['Lawn Care', 'Snow Removal', 'Both'].map((option, index) => (
                <label key={index} className='option-label'>
                    <input type='radio'
                    value={option}
                    checked={providedServices === option}
                    onChange={(e) => setProvidedServices(e.target.value)}
                    className='radio-input'
                    />
                    <span className='radio-bubble'></span>
                    <span className='option-text'>{option}</span>
                </label>
                ))}
            </div>

            <div className='request-subheader'>Please indicate your service range in miles (how far you are willing to drive to provide services):</div>
            <div className='options-container'>
                {['5', '10', '15', 'Custom'].map((option, index) => (
                <label key={index} className='option-label'>
                    <input type='radio'
                    value={option}
                    checked={serviceRange === option}
                    onChange={(e) => {
                        setServiceRange(e.target.value);
                        if (e.target.value !== 'Custom') {
                            setCustomRange(''); // Clear the custom range if switching back
                        }
                    }}
                    className='radio-input'
                    />
                    <span className='radio-bubble'></span>
                    <span className='option-text'>{option}</span>
                </label>
                ))}
            </div>

            {/* Render custom input field if "Custom" is selected */}
            {serviceRange === 'Custom' && (
                <div className='custom-input-container'>
                    <input
                    type="text"
                    className="custom-input"
                    value={customRange}
                    placeholder={0}
                    onChange={(e) => setCustomRange(e.target.value)}
                    />
                    <div className='custom-input-text'>mi</div>
                </div>
            )}

            {error && <div className="form-error-message">{error}</div>}

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

export default ServicesForm;