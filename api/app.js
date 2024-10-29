const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
const projectsFilePath = path.join(__dirname, 'data', 'projects.json');


// Function to load projects from JSON file
const loadProjects = () => {
    try {
        const data = fs.readFileSync(projectsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return []; // If file doesn't exist or is corrupted, return an empty array
    }
};

// Function to save projects to JSON file
const saveProjects = (projects) => {
    fs.writeFileSync(projectsFilePath, JSON.stringify(projects, null, 2), 'utf-8');
};

// Route for main dashboard
app.get('/', (req, res) => {
    const projects = loadProjects();
    res.render('index', { projects});
});

// Route to handle adding or editing projects
app.post('/add-project', (req, res) => {
    let projects = loadProjects();
    const { id, name, description, status, startDate, endDate, taskName, taskStatus } = req.body;

    // Build tasks array from taskName[] and taskStatus[]
    let tasks = [];
    if (taskName && taskStatus) {
        for (let i = 0; i < taskName.length; i++) {
            tasks.push({
                name: taskName[i],
                status: taskStatus[i]
            });
        }
    }

    if (id) {
        // Edit project logic
        const projectIndex = projects.findIndex(p => p.id === parseInt(id));
        if (projectIndex !== -1) {
            projects[projectIndex] = {
                ...projects[projectIndex],
                name,
                description,
                status,
                startDate,
                endDate,
                tasks // Save the tasks in the project object
            };
        }
    } else {
        // Add new project logic
        const newProject = {
            id: projects.length + 1, // Simple ID logic (you can replace this with something more robust)
            name,
            description,
            status,
            startDate,
            endDate,
            tasks // Add tasks to the new project
        };
        projects.push(newProject);
    }

    saveProjects(projects);
    res.redirect('/');
});

// Route to handle project deletion
app.get('/delete-project/:name', (req, res) => {
    let projects = loadProjects();
    projects = projects.filter(proj => proj.name !== req.params.name);
    saveProjects(projects);
    res.redirect('/');
});

// Route to view project details
app.get('/view-project/:name', (req, res) => {
    const projects = loadProjects();
    const project = projects.find(p => p.name === req.params.name);
    if (project) {
        res.send(`
            <h1>${project.name}</h1>
            <p>Description: ${project.description}</p>
            <p>Start Date: ${project.startDate}</p>
            <p>End Date: ${project.endDate}</p>
            <p>Status: ${project.status}</p>
            <h2>Tasks</h2>
            <ul>
                ${project.tasks.map(task => `<li>${task.name}: ${task.status}</li>`).join('')}
            </ul>
            <a href="/">Back to Dashboard</a>
        `);
    } else {
        res.send("Project not found.");
    }
});

// Route to show edit form for a project
app.get('/edit-project/:name', (req, res) => {
    const projects = loadProjects();
    const project = projects.find(p => p.name === req.params.name);
    if (project) {
        res.send(`
            <h1>Edit Project: ${project.name}</h1>
            <form action="/edit-project/${project.name}" method="POST">
                <label for="description">Description:</label>
                <input type="text" name="description" value="${project.description}" required><br><br>

                <label for="startDate">Start Date:</label>
                <input type="date" name="startDate" value="${project.startDate}" required><br><br>

                <label for="endDate">End Date:</label>
                <input type="date" name="endDate" value="${project.endDate}" required><br><br>

                <label for="status">Status:</label>
                <select name="status" required>
                    <option value="Active" ${project.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Planning" ${project.status === 'Planning' ? 'selected' : ''}>Planning</option>
                    <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                    <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select><br><br>

                <h2>Tasks</h2>
                ${project.tasks.map((task, index) => `
                    <label>Task Name:</label>
                    <input type="text" name="taskName[${index}]" value="${task.name}" required><br>
                    <label>Task Status:</label>
                    <select name="taskStatus[${index}]">
                        <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Approval" ${task.status === 'Approval' ? 'selected' : ''}>Approval</option>
                        <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>Done</option>
                    </select><br><br>
                `).join('')}
                <button type="submit">Update Project</button>
            </form>
        `);
    } else {
        res.send("Project not found.");
    }
});

// Route to handle project edit submission
app.post('/edit-project/:name', (req, res) => {
    let projects = loadProjects();
    const index = projects.findIndex(p => p.name === req.params.name);
    if (index !== -1) {
        // Collect taskName[] and taskStatus[] into a tasks array
        let tasks = [];
        if (req.body.taskName && req.body.taskStatus) {
            for (let i = 0; i < req.body.taskName.length; i++) {
                tasks.push({
                    name: req.body.taskName[i],
                    status: req.body.taskStatus[i]
                });
            }
        }

        projects[index] = {
            name: req.params.name,
            description: req.body.description,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            status: req.body.status,
            tasks // Update tasks
        };
        saveProjects(projects);
    }
    res.redirect('/');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
