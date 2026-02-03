export const filterProjectsByDateRange = (projects, startDate, endDate) => {
    if (!startDate || !endDate) return projects;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); 
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); 
    
    return projects.filter(project => {
        if (!project.startDate) return false;
        
        return project.startDate >= start && project.startDate <= end;
    });
};