import React, { createContext, useState, useContext } from "react";
import NotificationList from '../components/NotificationList';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message) => {
        const id = Date.now(); // Gives it a unique ID so we can have multiple notifications running at once
        setNotifications((prev) => [...prev, { id, message }]);

        // Remove notification after 5 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    };

    // Function to remove notification manually
    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <NotificationList notifications={notifications}  removeNotification={removeNotification} />
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);