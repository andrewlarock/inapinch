import React, { useState, useEffect, useRef } from 'react';
import { Filter } from 'bad-words';
import sanitizeInput from "../utils/sanitizeInput";
import '../css/modal.css';
import '../css/request.css';
import close from '../css/images/close2.png';
import star from '../css/images/star.png';
import starGray from '../css/images/starGray.png';

const LeaveFeedbackModal = ({ isModalOpen, setModalOpen, leaveFeedback, job }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const filter = new Filter(); // Create an instance of the profanity filter

    // Handle star click
    const handleStarClick = (selectedRating) => {
        setRating(selectedRating);
    };

    // Handle when leave feedback button is clicked
    const handleSubmit = () => {
        if (rating === 0) {
            setError("Please select a star rating before submitting.");
            return;
        }

        if (filter.isProfane(feedback)) {
            setError("Please remove inappropriate language from your feedback.");
            return;
        }

        leaveFeedback(rating, sanitizeInput(feedback));
        setError("");
        setModalOpen(false);
    };

    return (
        isModalOpen && (
            <div className="full-page-modal">
                <div className="modal-content">

                    <div className="modal-close-button" onClick={() => setModalOpen(false)}>
                        <img src={close} className="modal-close-image" />
                    </div>
                    <div className="modal-body">
                        <div className='modal-header-text'>Leave Feedback</div>
                        <div className='modal-subheader-text'>Rate your experience with your provider by selecting 1-5 stars and leaving optional feedback. Consider the quality of the job completed and how timely their service was.</div>
                        <div className='modal-subheader-text'><b>Your Provider:</b> {job.providerDetails.providerName}</div>

                        {/* Star Rating System */}
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <img 
                                    key={num} 
                                    src={num <= rating ? star : starGray} 
                                    className="star-icon" 
                                    onClick={() => handleStarClick(num)} 
                                />
                            ))}
                        </div>

                        {/* Feedback Input */}
                        <textarea
                            className="feedback-input"
                            placeholder="Leave a comment (optional)"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />

                        {error && <div className="form-error-message" style={{marginTop: '-.75rem', marginBottom: '.75rem'}}>{error}</div>}

                        <div className='modal-continue-button' onClick={handleSubmit}>
                            <div className='modal-continue-button-text'>Complete</div>
                        </div>

                    </div>
                </div>
            </div>
        )
    );
};

export default LeaveFeedbackModal;