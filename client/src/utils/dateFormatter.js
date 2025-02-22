import { useEffect } from 'react';

// Function to adjust a timestamp to EST
export function convertToEST(dateString) {
    const date = new Date(dateString);
    const estOffset = -5 * 60; // EST is UTC-5
    date.setMinutes(date.getMinutes() + estOffset); // Apply the EST offset
    return date;
}
  
export function useJobStatusFormatter(job, setStatus, setStatusDetails, setTimestamp) {
    // Determine the most recent job status from the job_status array and show it back to the user
    useEffect(() => {
        if (job.job_status && job.job_status.length > 0) {
            const fullStatus = job.job_status[0];
            
            if (fullStatus) {
                const parts = fullStatus.split(" ", 3); // Split only if fullStatus exists
                const date = parts[1];
                const time = parts[2];
                const timestamp = `${date} ${time}`; // Combine date and time to form a full timestamp
                const estDate = convertToEST(timestamp); // Convert to EST
                const formattedDate = estDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                const formattedTime = estDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); // Format as 12-hour

                if (fullStatus.includes("Completed: ")) {
                    setStatus('Completed');
                    setStatusDetails(`at ${formattedTime} on ${formattedDate} by`);
                } else if (fullStatus.includes("Accepted: ")) {
                    setStatus('Accepted');
                    setStatusDetails(`at ${formattedTime} on ${formattedDate} by`);
                } else if (fullStatus.includes("Pending: ")) {
                    setStatus('Pending');
                    setStatusDetails('Currently trying to match with provider');
                }
            }
        }
    }, [job.job_status, setStatus, setStatusDetails]);

    // Function that retrieves the timestamp to show the user exactly when they placed their order.
    useEffect(() => {
        if (job.job_status && job.job_status.length > 0) {
            const fullStatus = job.job_status.find(status => status.includes("Pending:")); // Find the entry with Pending, because this includes the timestamp of when the user placed their order

            if (fullStatus) {
                const parts = fullStatus.split(" ", 3); // Split only if fullStatus exists
                const date = parts[1];
                const time = parts[2];
                const timestamp = `${date} ${time}`; // Combine date and time to get a full timestamp

                const estDate = convertToEST(timestamp); // Convert to EST
                const formattedDate = estDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                const formattedTime = estDate.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
                setTimestamp(`${formattedTime} on ${formattedDate}`);
            }
        }
    }, [job.job_status, setTimestamp]);
}