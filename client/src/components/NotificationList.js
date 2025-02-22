import React from "react";
import "../css/notifications.css";
import close from "../css/images/close.png";

const NotificationList = ({ notifications, removeNotification }) => {
    return (
        <div className="notification-container">
            {notifications.map((notification) => (
                <NotificationItem 
                    key={notification.id} 
                    message={notification.message} 
                    id={notification.id} 
                    removeNotification={removeNotification}
                />
            ))}
        </div>
    );
};

const NotificationItem = ({ message, id, removeNotification }) => {
    return (
        <div className="notification">
            <p>{message}</p>
            <div className="notification-timer"></div>
            <button 
                className="notification-close-btn" 
                onClick={() => removeNotification(id)}
            >
                <img src={close} className="close-image" />
            </button>
        </div>
    );
};

export default NotificationList;