const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Function to load projects from JSON file
const loadProjects = () => {
    try {
        const data = fs.readFileSync('./data/projects.json', 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return []; // If file doesn't exist or is corrupted, return an empty array
    }
};

// Function to save projects to JSON file
const saveProjects = (projects) => {
    fs.writeFileSync('./data/projects.json', JSON.stringify(projects, null, 2), 'utf-8');
};

// Route for main dashboard
app.get('/', (req, res) => {
    const projects = loadProjects();
    res.render('index', { projects});
});

app.post('/add-project', (req, res) => {
    let projects = loadProjects();
    const { id, name, description, status, startDate, endDate, taskName, taskStatus, poNumber, vendorName, statusPayment, dueDate } = req.body;

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
        // Edit existing project
        const projectIndex = projects.findIndex(p => p.id === parseInt(id));
        if (projectIndex !== -1) {
            projects[projectIndex] = {
                ...projects[projectIndex],
                name,
                description,
                status,
                startDate,
                endDate,
                poNumber: poNumber || "",
                vendorName: vendorName || "",         // Save Vendor Name
                statusPayment: statusPayment || "Not Paid", // Save Status Payment
                dueDate: dueDate || "",               // Save Due Date
                tasks
            };
        }
    } else {
        // Add new project
        let newId = 1;
        while (projects.some(project => project.id === newId)) {
            newId++;
        }

        const newProject = {
            id: newId,
            name,
            description,
            status,
            startDate,
            endDate,
            poNumber: poNumber || "",
            vendorName: vendorName || "",         // Save Vendor Name
            statusPayment: statusPayment || "Not Paid", // Save Status Payment
            dueDate: dueDate || "",               // Save Due Date
            tasks
        };

        projects.push(newProject);
    }

    projects = projects.map((project, index) => ({
        ...project,
        id: index + 1
    }));

    saveProjects(projects);
    res.redirect('/');
});




app.get('/view-project/:id', (req, res) => {
    const projects = loadProjects();
    const project = projects.find(p => p.id === parseInt(req.params.id));
    if (project) {
        res.json(project); // Return JSON data
    } else {
        res.status(404).send('Project not found');
    }
});


app.get('/delete-project/:id', (req, res) => {
    let projects = loadProjects();
    
    // Filter out the project to be deleted by ID
    projects = projects.filter(proj => proj.id !== parseInt(req.params.id));
    
    // Reassign IDs to keep them sequential
    projects.forEach((project, index) => {
        project.id = index + 1;
    });
    
    saveProjects(projects);
    res.redirect('/');
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
                    <option value="Planning" ${project.status === 'Sailing' ? 'selected' : ''}>Sailing</option>
                    <option value="Planning" ${project.status === 'Planning' ? 'selected' : ''}>Planning</option>
                    <option value="Planning" ${project.status === 'Sailing' ? 'selected' : ''}>Sailing</option>
                    <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                    <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select><br><br>

                <label for="poNumber">PO Number:</label>
                <input type="text" name="poNumber" value="${project.poNumber || ''}"><br><br>

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


app.post('/edit-project/:name', (req, res) => {
    let projects = loadProjects();
    const index = projects.findIndex(p => p.name === req.params.name);
    if (index !== -1) {
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
            ...projects[index],
            description: req.body.description,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            status: req.body.status,
            poNumber: req.body.poNumber || "", // Ensure PO number is saved here
            tasks
        };
        
        saveProjects(projects);
    }
    res.redirect('/');
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
