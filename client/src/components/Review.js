import React, { useState, useEffect } from 'react';
import '../css/review.css';
import star from '../css/images/star.png';
import starGray from '../css/images/starGray.png';

const Review = ({ rating, feedback, details, timeCompleted }) => {

    return (
        <div className='review-container'>
            {/* Display stars based on the rating */}
            {[...Array(5)].map((_, index) => (
                <img 
                    key={index} 
                    src={index < rating ? star : starGray} 
                    className="review-star-image"
                />
            ))}
            {feedback && <div className='review'>{feedback}</div>}
            <div className='review-details'>- {details} Job on {timeCompleted}</div>
        </div>
    );
};

export default Review;