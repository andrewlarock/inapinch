import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { apiRequest } from "../utils/apiRequest";
import { useNotification } from "../context/NotificationContext";
import Navbar from '../components/Navbar';
import '../css/request.css';
import StartingForm from '../components/Provider Application Forms/StartingForm';
import AddressForm from '../components/Provider Application Forms/AddressForm';
import SelfieForm from '../components/Provider Application Forms/SelfieForm';
import ServicesForm from '../components/Provider Application Forms/ServicesForm';
import EquipmentForm from '../components/Provider Application Forms/EquipmentForm';
import ConfirmationForm from '../components/Provider Application Forms/ConfirmationForm';
import AlreadyProviderForm from '../components/Provider Application Forms/AlreadyProviderForm';
import DeniedForm from '../components/Provider Application Forms/DeniedForm';

function ProviderApplication() {
    const { user, loading } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();
    const db = getFirestore();
    const { addNotification } = useNotification();

    // Parent function that each child component will call when they want to make updates to the parent
    // formData
    const updateFormData = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const [formData, setFormData] = useState({
        user: user || null,
        providerName: '',
        providerAddress: '',
        providerCoords: {},
        providerSelfie: [],
        providedServices: '',
        serviceRange: '',
        equipmentPhotos: []
    });

    // Makes sure users are authenticated before being able to fill out an application. If they are
    // authenticated, store the user, and check if they are already a provider
    useEffect(() => {
        const checkProviderStatus = async () => {
            if (!loading && !user) {
                navigate('/login');
                return;
            }
            if (!loading && user) {
                updateFormData('user', user);

                // Check the users isProvider status in Firestore
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // If the user has submitted an application but it hasnt been reviewed yet, jump straight to the ConfirmationForm
                    if (userData.isProvider === 'Pending') {
                        setCurrentStep(6);
                    }
                    // If the user is already a provider, show a page telling them this
                    if (userData.isProvider === 'Yes') {
                        setCurrentStep(7);
                    }
                    // If the user has submitted an application and it has been denied, show them the denied form
                    if (userData.isProvider === 'Denied') {
                        setCurrentStep(8);
                    }
                }
            }
        };

        checkProviderStatus();
    }, [user, loading, navigate, db]);

    const handleNext = () => {
        setCurrentStep((prevStep) => prevStep + 1);
        window.scrollTo(0, 0);
    };
    
    const handleBack = () => {
        setCurrentStep((prevStep) => prevStep - 1);
        window.scrollTo(0, 0);
    };

    // Function to submit the application and save the provider details in Firestore. This will also upload
    // the providers equipment photos and selfie to s3. This function is called with uploadedEquipmentPhotos
    // directly because the form that asks the user to provide their equipment photos is the last form in
    // the application process, and we dont want an issue with updateFormData not updating before we call submitApplication
    const submitApplication = async (uploadedEquipmentPhotos) => {
        if (!user) return;
    
        try {
            const userRef = doc(db, 'users', user.uid);
    
            // Flatten the data
            const providerData = {
                user: formData.user.uid,
                providerName: formData.providerName,
                providerAddress: formData.providerAddress,
                providerCoords: formData.providerCoords,
                providedServices: formData.providedServices,
                serviceRange: formData.serviceRange,
                totalRating: 5,
                ratingCount: 1,
                servicesCompleted: 0
            };
    
            // Create an array to store the uploaded S3 URLs for equipment photos and the selfie photo
            const uploadedEquipmentUrls = [];
            const uploadedSelfieUrl = [];

            // Loop through each photo inside equipmentPhotos
            for (let i = 0; i < uploadedEquipmentPhotos.length; i++) {
                const file = uploadedEquipmentPhotos[i];
                const fileNumber = i + 1; // Start file numbering from 1

                // Get the file extension so we can correctly store it in S3
                const fileExtension = file.name.slice(file.name.lastIndexOf('.'));
                const fileKey = `${formData.user.uid}_equipment_${fileNumber}${fileExtension}`; // Define file path for S3 and mark it as an equipment photo
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

                uploadedEquipmentUrls.push(s3Url); // Store the URL after successful upload
            }
    
            // Handle the provider selfie upload
            const selfieFile = formData.providerSelfie[0];
            const selfieFileExtension = selfieFile.name.slice(selfieFile.name.lastIndexOf('.'));
            const selfieFileKey = `${formData.user.uid}_selfie_1${selfieFileExtension}`; // Define file path for S3 and mark it as a selfie photo
            const selfieS3Url = `${process.env.REACT_APP_S3_URL}${selfieFileKey}`;

            // Upload directly to S3
            const response = await fetch(selfieS3Url, {
                method: "PUT",
                body: selfieFile,
                headers: {
                    "Content-Type": selfieFile.type,
                },
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            // Add the selfie URL to the providerSelfie array
            uploadedSelfieUrl.push(selfieS3Url);
    
            // Update the provider data with the S3 URLs of the uploaded equipment photos amd selfie photo
            providerData.equipmentPhotos = uploadedEquipmentUrls;
            providerData.providerSelfie = uploadedSelfieUrl;

            // Save the provider details to Firestore
            await setDoc(userRef, {
                providerDetails: providerData,
                isProvider: 'Pending',
            }, { merge: true });
    
            // Proceed to the next step
            addNotification("Application submitted!")
            handleNext();
        } catch (error) {
            console.error("Error submitting application:", error);
        }
    };

    return (
        <div>
            <Navbar />
            {currentStep === 1 && (
                <StartingForm data={formData} updateFormData={updateFormData} onNext={handleNext} />
            )}
            {currentStep === 2 && (
                <AddressForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 3 && (
                <SelfieForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 4 && (
                <ServicesForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 5 && (
                <EquipmentForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} submitApplication={submitApplication}/>
            )}
            {currentStep === 6 && (
                <ConfirmationForm data={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 7 && (
                <AlreadyProviderForm />
            )}
            {currentStep === 8 && (
                <DeniedForm />
            )}
        </div>
    );
}

export default ProviderApplication;