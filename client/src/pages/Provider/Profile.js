import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import { extractCityState } from "../../utils/geocodeAddress";
import EditProviderInfoModal from '../../components/EditProviderInfoModal';
import Loading from '../../components/LoadingPage';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Review from '../../components/Review';
import '../../css/profile.css';
import star from '../../css/images/star-white.png';
import globe from '../../css/images/globe.png';
import exclamation from '../../css/images/exclamation.png';
import edit from '../../css/images/edit.png';

function Profile() {
    const { user, loading } = useAuth();
    const { providerId } = useParams();
    const [providerDetails, setProviderDetails] = useState(null)
    const [recentReviews, setRecentReviews] = useState([]);
    const [ownProfile, setOwnProfile] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const db = getFirestore();

    // Check if the logged in user is the provider so we can show additional information
    useEffect(() => {
        if (user && providerId && user.uid === providerId) {
            setOwnProfile(true);
        }
    }, [user, providerId]);

    // Get the provider details from the providerId stored in the URL. From this we will retrieve all the
    // data about the specific provider, and retrieve 3 of the most recent reviews to display on the profilee
    useEffect(() => {
        const providerRef = doc(db, "users", providerId);
        getDoc(providerRef)
            .then((providerSnap) => {
                if (providerSnap.exists()) {
                    const providerData = providerSnap.data().providerDetails;
                    setProviderDetails(providerData);

                    // Extract feedback, parse, and sort by most recent
                    const feedbackArray = providerData.feedback || [];
                    const parsedFeedback = feedbackArray
                        .map((feedback, index) => {
                            const parts = feedback.split('|');
                            const rating = parts[0];
                            const feedbackText = parts[1] || ''; // If feedback exists
                            const details = parts[2];
                            const timeCompleted = parts[3];

                            // Get the year, month, and day from timeCompleted string
                            const currentYear = new Date().getFullYear();
                            const [month, day] = timeCompleted.split('/');

                            // Create a date object using the values extracted from the timeCompleted string
                            const dateCompleted = new Date(currentYear, month - 1, day);

                            return { rating, feedback: feedbackText, details, timeCompleted, dateCompleted, index };
                        })
                        .filter(feedback => feedback.timeCompleted) // Filter out invalid feedback without timeCompleted
                        .sort((a, b) => {
                            // First compare by dateCompleted (sorting by most recent)
                            if (b.dateCompleted.getTime() !== a.dateCompleted.getTime()) {
                                return b.dateCompleted - a.dateCompleted;
                            }

                            // If the dates are the same, compare by index (retrieval order)
                            return b.index - a.index; // If b is newer, it comes first
                        });

                    // Get the 3 most recent reviews
                    setRecentReviews(parsedFeedback.slice(0, 3));
                }
            })
            .catch((error) => {
                console.error("Error fetching provider details:", error);
            });

    }, [db, providerId]);

    // Function to update provider details state after modal update without a refresh
    const handleProviderDetailsUpdate = (newService, newRange) => {
        setProviderDetails((prevDetails) => ({
            ...prevDetails,
            providedServices: newService,
            serviceRange: newRange
        }));
    };

    // Show loading page while provider profile is being retrieved
    if (loading || !providerDetails) {
        return <Loading />;
    }

    return (
        <div>
            <Navbar />
            <div className='profile-header-container'>
                <div className='profile-header'>{providerDetails.providerName}</div>
                <div className='profile-subheader'>Provider</div>
                <img src={providerDetails.providerSelfie[0]} className="profile-image" />

                <div className='profile-details-container'>
                    <div className='profile-rating-container'>
                        <div className='profile-details-header'>
                            <img src={star} className="profile-star-image" />
                            {(providerDetails.totalRating / providerDetails.ratingCount).toFixed(1)}
                        </div>
                        <div className='profile-details-subheader'>Satisfaction Rating</div>

                    </div>

                    <div className='profile-services-container'>
                        <div className='profile-details-header'>{providerDetails.servicesCompleted}</div>
                        <div className='profile-details-subheader'>Services Completed</div>
                    </div>
                </div>
                <div className='profile-location-text'>
                    <img src={globe} className="profile-location-image" />
                    From <span className='profile-bold-text'>&nbsp;{extractCityState(providerDetails.providerAddress)}</span>
                </div>
            </div>

            <div className='profile-body-container'>

                <div className='profile-body-header'>Feedback</div>
                <div className='profile-review-subheader'>Most recent reviews</div>

                <div className='profile-reviews-container'>
                    {recentReviews.length > 0 ? (
                        recentReviews.map((review, index) => (
                            <Review 
                                key={index}
                                rating={parseInt(review.rating, 10)}
                                feedback={review.feedback}
                                details={review.details}
                                timeCompleted={review.timeCompleted}
                            />
                        ))
                    ) : (
                        <div className="profile-body-subheader" style={{marginBottom: '-.25rem'}}>No feedback yet</div>
                    )}
                </div>

                <div className='profile-divider'></div>
                
                <div className='profile-body-header'>Provider Information {ownProfile && (<img src={edit} className="profile-edit-image" onClick={() => setModalOpen(true)}/>)}</div>
                <div className='profile-body-subheader'>Service Range: <span className='profile-body-details'>{providerDetails.serviceRange} miles</span></div>
                <div className='profile-body-subheader'>Services Provided: <span className='profile-body-details'>{providerDetails.providedServices === 'Both' ? 'Lawn Care, Snow Removal' : providerDetails.providedServices}</span></div>
                
                {ownProfile && (
                    <>
                        <div className='profile-divider'></div>

                        <div className='profile-body-header'>Personal Information</div>
                        <div className='profile-body-subheader'>Provider Address: <span className='profile-body-details'>{providerDetails.providerAddress}</span></div>
                        <div className='profile-body-subheader'>Provider Name: <span className='profile-body-details'>{providerDetails.providerName}</span></div>

                        <div className='profile-divider'></div>

                        <div className='profile-body-header'>My Equipment</div>
                        <div
                            className='view-attachments-container' 
                            style={{ cursor: 'pointer', marginTop: '.5rem' }}
                            onClick={() => {setShowDetails(prevState => !prevState)}}
                        >
                            <img src={exclamation} className="provider-attachments-image" />
                            <div className='job-attachments-text'>View Attachments</div>
                        </div>

                        {/* Display equipment photos if toggle is on */}
                        {showDetails &&(
                            <div>
                                <div className="job-photos" style={{ marginBottom: '.75rem'}}>
                                    {providerDetails.equipmentPhotos.map((photo, index) => (
                                        <div key={index} className="job-photo-item">
                                            <img src={photo} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='profile-body-subheader' style={{marginTop: '1.75rem', fontSize: '.9rem'}} onClick={() => { setOwnProfile(false); window.scrollTo({ top: 0, behavior: "smooth"}) }}>See Customer View</div>

                        <div className='profile-body-subheader' style={{marginTop: '1.75rem', fontSize: '.8rem'}}>To update your provider accounts' personal information or equipment photos please contact inapinch@gmail.com</div>
                    </>
                )}

                {/* Full Page Modal */}
                {isModalOpen && (
                    <EditProviderInfoModal
                        isModalOpen={isModalOpen}
                        setModalOpen={setModalOpen}
                        serviceType={providerDetails.providedServices}
                        serviceRange={providerDetails.serviceRange}
                        onUpdate={handleProviderDetailsUpdate}
                    />
                )}

            </div>
            <Footer />
        </div>
        
    );
}

export default Profile;