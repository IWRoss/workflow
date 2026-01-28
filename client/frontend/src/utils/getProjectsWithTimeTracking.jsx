export const getProjectsWithTimeTracking = (projects) => {
    return projects.map((item) => {
        // Find time tracking column
        const timeTrackingField = item.column_values.find(
            (col) => col.column.title === "Time Tracking"
        );
        
        // Find project code
        const projectCodeField = item.column_values.find(
            (col) => col.column.title === "Project Code"
        );
        
        let duration = 0;
        if (timeTrackingField && timeTrackingField.value) {
            try {
                const timeData = JSON.parse(timeTrackingField.value);
                duration = timeData.duration || 0;
            } catch (error) {
                console.error('Error parsing time tracking:', error);
            }
        }
        
        return {
            id: item.id,
            name: item.name,
            projectCode: projectCodeField?.text || 'N/A',
            duration: duration,
            hours: (duration / 3600).toFixed(2),
            formatted: formatSeconds(duration)
        };
    });
};

// Helper function to format seconds as HH:MM:SS
export const formatSeconds = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};


