/**
 * Formats a date string from YYYY-MM-DD (or ISO) to DD.MM.YYYY
 * @param {string} dateStr 
 * @returns {string}
 */
export const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    
    // If it's already in DD.MM.YYYY format, return it
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
        return dateStr;
    }

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            // If date is invalid but looks like YYYY-MM-DD (e.g. from backend)
            if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                const [y, m, d] = dateStr.split('T')[0].split('-');
                return `${d}.${m}.${y}`;
            }
            return dateStr;
        }
        
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    } catch (e) {
        return dateStr;
    }
};

/**
 * Formats a date string from DD.MM.YYYY back to YYYY-MM-DD for storage
 * @param {string} dateStr 
 * @returns {string}
 */
export const formatDateForStorage = (dateStr) => {
    if (!dateStr) return null; // Backend expects null or ISO string for time.Time

    // If it's already in YYYY-MM-DD format, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // If it's in DD.MM.YYYY format, convert it
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split('.');
        return `${y}-${m}-${d}`;
    }

    // Try to parse with standard Date and return ISO date part
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {}

    return dateStr;
};
