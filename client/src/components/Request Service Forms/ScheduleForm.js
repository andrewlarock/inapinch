import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import parseCustomDate from '../../utils/parseCustomDate';
import 'react-calendar/dist/Calendar.css';
import '../../css/request.css';
import '../../css/calendar.css';
import date from '../../css/images/date.png';
import time from '../../css/images/time.png';
import open from '../../css/images/open.png';

// This is the form that asks the user when they would like to receive their service

const ScheduleForm = ({data, updateFormData, onNext, onBack}) => {
    const [scheduleType, setScheduleType] = useState("ASAP");
    const [fromDateObject, setFromDateObject] = useState(new Date());
    const [fromDate, setFromDate] = useState("Today");
    const [fromTime, setFromTime] = useState("Now");
    const [toDateObject, setToDateObject] = useState(new Date());
    const [toDate, setToDate] = useState("Tomorrow");
    const [toTime, setToTime] = useState("Noon");
    const [fromCalendarVisible, setFromCalendarVisible] = useState(false);
    const [toCalendarVisible, setToCalendarVisible] = useState(false);
    const [fromTimeVisible, setFromTimeVisible] = useState(false);
    const [toTimeVisible, setToTimeVisible] = useState(false);
    const [error, setError] = useState("");

    // Pre-fill the form based on existing scheduled type and time if the user has already filled out this form
    useEffect(() => {
        // Pre-fill the schedule type: ASAP or Scheduled
        if (data.scheduled_type === 'ASAP') {
            setScheduleType('ASAP');
        } else if (data.scheduled_type === 'Scheduled') {
            setScheduleType('Scheduled');

            // Decode the scheduled_time string
            if (data.scheduled_time) {
                const [start, end] = data.scheduled_time.split('|');
                
                if (start && end) {
                    // Extract the date and time for the start
                    const [startDate, startTime] = start.split(' ');
                    setFromDate(startDate);
                    setFromTime(startTime + ' ' + start.split(' ')[2]);

                    // Extract the date and time for the end
                    const [endDate, endTime] = end.split(' ');
                    setToDate(endDate);
                    setToTime(endTime + ' ' + end.split(' ')[2]);
                }
            }
        }

    }, [data.scheduled_type, data.scheduled_time]);

    // Function to generate time slots in increments of 1 hour and format them according to current time
    const generateTimeSlots = () => {
        const timeSlots = [];
        const now = new Date();
        const nextFullHour = new Date(now);
        nextFullHour.setMinutes(0, 0, 0);
        if (now.getMinutes() > 0) {
            nextFullHour.setHours(nextFullHour.getHours() + 1);
        }

        for (let i = 0; i < 24; i++) {
            const time = new Date(nextFullHour);
            time.setHours(nextFullHour.getHours() + i);
            const formattedTime = time.toLocaleTimeString([], { hour: 'numeric' });
            timeSlots.push(formattedTime);
        }
        return timeSlots;
    };

    const timeSlots = generateTimeSlots();

    // Handle user selecting a "From Date"
    const handleFromDateChange = (date) => {
        const selectedDate = new Date(date);
        setFromDateObject(date);
        setFromDate(`${selectedDate.getMonth() + 1}/${selectedDate.getDate()}/${selectedDate.getFullYear().toString().slice(-2)}`);
        setFromCalendarVisible(false);
    };

    // Handle user selecting a "To Date"
    const handleToDateChange = (date) => {
        const selectedDate = new Date(date);
        setToDateObject(date);
        setToDate(`${selectedDate.getMonth() + 1}/${selectedDate.getDate()}/${selectedDate.getFullYear().toString().slice(-2)}`);
        setToCalendarVisible(false);
    };

    // Handle user selecting a "From Time"
    const handleFromTimeSelect = (time) => {
        setFromTime(time);
        setFromTimeVisible(false);
    };

    // Handle user selecting a "To Time"
    const handleToTimeSelect = (time) => {
        setToTime(time);
        setToTimeVisible(false);
    };

    // Handle user pressing continue
    const handleSubmit = () => {
        // Validate that none of the fields are blank before continuing
        if (scheduleType === 'Scheduled') {
            if (fromDate === 'Today' || toDate === 'Tomorrow' || !fromTime || !toTime) {
                setError("Please don't leave any of the fields blank before continuing.");
                return;
            }
    
            // Use the parseCustomDate helper function to format the from and to date/time strings into
            // readable javascript date objects
            const fromDateTimeStr = parseCustomDate(fromDate, fromTime);
            const toDateTimeStr = parseCustomDate(toDate, toTime);
    
            // Parse the newly formatted strings into date objects
            const fromDateTime = new Date(fromDateTimeStr);
            const toDateTime = new Date(toDateTimeStr);
    
            // Ensure both dates are valid
            if (isNaN(fromDateTime) || isNaN(toDateTime)) {
                setError("Invalid date or time format.");
                return;
            }
    
            const currentDateTime = new Date();
    
            // Check if the fromDateTime or toDateTime is in the past
            if (fromDateTime < currentDateTime || toDateTime < currentDateTime) {
                setError("Neither of the selected times can be in the past.");
                return;
            }
    
            // Check if fromDateTime and toDateTime are the same
            const fromString = fromDateTime.toISOString();
            const toString = toDateTime.toISOString();
    
            if (fromString === toString) {
                setError("The opening window and preferred completion time cannot be the same.");
                return;
            }
    
            // Check if the toDateTime is earlier than fromDateTime
            if (toDateTime < fromDateTime) {
                setError("The preferred completion time cannot be earlier than the opening window.");
                return;
            }
        }
    
        // Format the string to place in the scheduled_time value in our data object
        const scheduledString = `${fromDate} ${fromTime}|${toDate} ${toTime}`;
    
        // Update the parent component with the updated schedule type
        if (scheduleType === 'ASAP') {
            updateFormData('scheduled_type', scheduleType);
            setError("");
            onNext();
        }
    
        // Update the parent component with the updated schedule time
        if (scheduleType === 'Scheduled') {
            updateFormData('scheduled_type', scheduleType);
            updateFormData('scheduled_time', scheduledString);
            setError("");
            onNext();
        }
    };

    return (
        <div className='request-body'>
            <div className='request-header'>In a Pinch <span className='subform-subheader'>{data.job_type}</span></div>
            <div className='request-subheader'>Please provide the date and time that works best for you to receive the service. We’ll do our best to accommodate your request.</div>

            <div className='options-container'>
                {['ASAP', 'Scheduled'].map((option, index) => (
                <label key={index} className='option-label'>
                    <input type='radio'
                    value={option}
                    checked={scheduleType === option}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className='radio-input'
                    />
                    <span className='radio-bubble'></span>
                    <span className='option-text' style={{ fontWeight: '550'}}>{option}</span>
                </label>
                ))}
            </div>
            
            {scheduleType === 'Scheduled' && (
              <>
                <div className='request-details' style={{marginTop: '-.35rem'}}>Please select the date and time when the service can be started and the latest date and time by which you'd like the service completed. Providers can accept this job immediately, but will only be able to complete the job within the scheduled timeframe.</div>
    
                <div className='date-header-text'>Job Open Window</div>
                <div className='date-wrapper'>
                    <div className='date-container' onClick={() => {setFromCalendarVisible(prevState => !prevState); setToCalendarVisible(false); setToTimeVisible(false); setFromTimeVisible(false); }}>
                        <img src={date} className="date-image"/>
                        <div className={`date-placeholder-text ${fromDate === "Today" ? "gray" : ""}`}>{fromDate ? fromDate.split('/').slice(0, 2).join('/') : ""}</div> {/* If the fromDate has not been set, gray out the text. We use "Today" as a placeholder. Also, trim the year when displaying to the user so it looks better */}

                        <img src={open} className="date-open-image"/>
                    </div>

                    <div className='date-container' onClick={() => { setFromTimeVisible(prevState => !prevState); setToCalendarVisible(false); setFromCalendarVisible(false); setToTimeVisible(false); }}>
                        <img src={time} className="date-image"/>
                        <div className={`date-placeholder-text ${fromTime === "Now" ? "gray" : ""}`}>{fromTime}</div> {/* If the toDate has not been set, gray out the text. We use "Tomorrow" as a placeholder. Also, trim the year when displaying to the user so it looks better */}
                        <img src={open} className="date-open-image"/>
                    </div>

                    {fromTimeVisible && (
                        <div className='time-dropdown-container'>
                            {timeSlots.map((time, index) => (
                                <div key={index} className='time-dropdown-item' onClick={() => handleFromTimeSelect(time)}>
                                    {time}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {fromCalendarVisible && (
                    <div className='calendar-container'>
                        <Calendar
                            onChange={handleFromDateChange}
                            value={fromDateObject}
                            next2Label={null}
                            prev2Label={null}
                            showNeighboringMonth={false}
                            view="month"
                            tileDisabled={({ date, view }) => {
                                if (view !== 'month') return false;
                
                                // Get todays date without the time
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                
                                // Get the tiles date without the time
                                const tileDate = new Date(date);
                                tileDate.setHours(0, 0, 0, 0);
                
                                // Disable only past dates
                                return tileDate < today;
                            }}
                        />
                    </div>
                )}

                <div className='date-header-text'>Preferred Completion Time</div>
                <div className='date-wrapper'>
                    <div className='date-container' onClick={() => {setToCalendarVisible(prevState => !prevState); setFromCalendarVisible(false); setFromTimeVisible(false); setToTimeVisible(false)}}>
                        <img src={date} className="date-image"/>
                        <div className={`date-placeholder-text ${toDate === "Tomorrow" ? "gray" : ""}`}>{toDate ? toDate.split('/').slice(0, 2).join('/') : ""}</div>
                        <img src={open} className="date-open-image"/>
                    </div>
                    <div className='date-container' onClick={() => {setToTimeVisible(prevState => !prevState); setFromCalendarVisible(false); setToCalendarVisible(false); setFromTimeVisible(false)}}>
                        <img src={time} className="date-image"/>
                        <div className={`date-placeholder-text ${toTime === "Noon" ? "gray" : ""}`}>{toTime}</div>
                        <img src={open} className="date-open-image"/>
                    </div>

                    {toTimeVisible && (
                        <div className='time-dropdown-container'>
                            {timeSlots.map((time, index) => (
                                <div key={index} className='time-dropdown-item' onClick={() => handleToTimeSelect(time)}>
                                    {time}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {toCalendarVisible && (
                    <div className='calendar-container'>
                        <Calendar
                            onChange={handleToDateChange}
                            value={toDateObject}
                            next2Label={null}
                            prev2Label={null}
                            showNeighboringMonth={false}
                            view="month"
                            tileDisabled={({ date, view }) => {
                                if (view !== 'month') return false;
                
                                // Get todays date without the time
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                
                                // Get the tiles date without the time
                                const tileDate = new Date(date);
                                tileDate.setHours(0, 0, 0, 0);
                
                                // Disable only past dates (not today)
                                return tileDate < today;
                            }}
                        />
                    </div>
                )}

                {/* Display the users time frame back to them in an easy to read way */}
                {fromDate !== 'Today' && toDate !== 'Tomorrow' && fromTime !== 'Now' && toTime !== 'Noon' && (
                    <div className='request-details' style={{ fontWeight: '550', marginBottom: '.25rem'}}>From {fromDate ? fromDate.split('/').slice(0, 2).join('/') : ""} {fromTime.replace(' ', '')} to {toDate ? toDate.split('/').slice(0, 2).join('/') : ""} {toTime.replace(' ', '')}</div>
                )}
                <div className='request-details' style={{ marginBottom: '.5rem'}}>This is the timeframe during which the job can be completed by providers.</div>
              </>
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

export default ScheduleForm;