const fs = require('fs');
const path = require('path');

// Define the path to your projects.json file
const projectsFilePath = path.join(__dirname, './data/projects.json'); // Replace with the actual path

// Function to load projects from the JSON file
const loadProjects = () => {
    try {
        const data = fs.readFileSync(projectsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading projects.json:", error);
        return [];
    }
};

// Function to save projects back to the JSON file
const saveProjects = (projects) => {
    try {
        fs.writeFileSync(projectsFilePath, JSON.stringify(projects, null, 2), 'utf-8');
        console.log("Projects saved successfully.");
    } catch (error) {
        console.error("Error writing to projects.json:", error);
    }
};

// Function to update project IDs
const updateProjectIds = () => {
    const projects = loadProjects();
    projects.forEach((project, index) => {
        project.id = `SHJ-${String(index + 1).padStart(4, '0')}`;
    });
    saveProjects(projects);
};

// Run the update function
updateProjectIds();
