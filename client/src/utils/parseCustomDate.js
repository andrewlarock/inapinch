// When we ask the user to pick a schedule window for when they want to receive the service, we present
// them with user friendly dates/times like 1/5/25 8 PM. This function takes a timestamp formatted like
// that and converts it back into a timestamp that javascript can recognize and compare with other dates

const parseCustomDate = (dateStr, timeStr) => {
    // Split the input date
    const [month, day, year] = dateStr.split('/');
    const fullYear = `20${year}`;

    // Format the date as YYYY-MM-DD
    const formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const [hourStr, period] = timeStr.split(' ');
    let hourInt = parseInt(hourStr);

    // Convert to 24hour format
    if (period === 'PM' && hourInt !== 12) {
        hourInt += 12;
    } else if (period === 'AM' && hourInt === 12) {
        hourInt = 0;
    }

    // Format the time as HH:00
    const formattedTime = `${hourInt.toString().padStart(2, '0')}:00`;

    // Combine the date and time into a string
    return `${formattedDate}T${formattedTime}:00`;
};

export default parseCustomDate;