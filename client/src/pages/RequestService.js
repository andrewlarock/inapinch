import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../css/request.css';
import StartingForm from '../components/Request Service Forms/StartingForm';
import JobForm from '../components/Request Service Forms/JobForm';
import ScheduleForm from '../components/Request Service Forms/ScheduleForm';
import BeforePhotos from '../components/Request Service Forms/BeforePhotos';
import SizeForm from '../components/Request Service Forms/SizeForm';
import ConfirmationForm from '../components/Request Service Forms/ConfirmationForm';
import SuccessForm from '../components/Request Service Forms/SuccessForm';

function Request() {
    const { user, loading } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();
    const location = useLocation();

    // If the user made a service request from the home page, this gets the address and service type
    // the user entered from location state. If they didnt make the request from home the values are set to defaults
    const { address = '', selectedType = 'Lawn Care' } = location.state || {};

    const [formData, setFormData] = useState({
        customer_id: '',
        job_type: selectedType,
        job_details: [],
        custom_instructions: '',
        delivery_address: address,
        delivery_coords: {},
        scheduled_type: '',
        scheduled_time: '',
        size: '',
        before_photos: [],
    });

    // Makes sure users are authenticated before being able to request a service. If they are authenticated,
    // starts by grabbing the users uid
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
        if (!loading && user) {
            updateFormData('customer_id', user.uid);
        }
    }, [user, loading, navigate]);

    const handleNext = () => {
        setCurrentStep((prevStep) => prevStep + 1);
        window.scrollTo(0, 0);
    };
    
    const handleBack = () => {
        setCurrentStep((prevStep) => prevStep - 1);
        window.scrollTo(0, 0);
    };
    
    // Parent function that each child component will call when they want to make updates to the parent
    // formData
    const updateFormData = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div>
            <Navbar />
            {currentStep === 1 && (
                <StartingForm data={formData} updateFormData={updateFormData} onNext={handleNext} />
            )}
            {currentStep === 2 && (
                <JobForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 3 && (
                <ScheduleForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 4 && (
                <BeforePhotos data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 5 && (
                <SizeForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 6 && (
                <ConfirmationForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 7 && (
                <SuccessForm/>
            )}

        </div>
    );
}

export default Request;