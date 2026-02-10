navigate('dashboard');
applyTheme();

// Store chart instances
let chartsInstance = {};   

function card(title,content){
    return `
        <div class="card">
            <h2>${title}</h2>
            ${content}
        </div>
    `;
}

function navigate(page){
    if(page==='dashboard') dashboard();
    if(page==='subjects') subjects();
    if(page==='tasks') tasks();
    if(page==='schedule') schedule();
    if(page==='analytics') analytics();
    if(page==='settings') settings();
}

/* DASHBOARD */
function dashboard(){

    const subs = get('subjects');
    const tasks = get('tasks');
    const slots = get('schedule');

    const completed = tasks.filter(t=>t.completed).length;
    const percent = tasks.length
        ? Math.round((completed/tasks.length)*100)
        : 0;

    document.getElementById('app').innerHTML=`

        <h1 style="margin-bottom:25px;">Dashboard</h1>

        <div class="grid">

            <div class="card">
                <h3>Total Subjects</h3>
                <h1>${subs.length}</h1>
            </div>

            <div class="card">
                <h3>Total Tasks</h3>
                <h1>${tasks.length}</h1>
            </div>

            <div class="card">
                <h3>Tasks Due Today</h3>
                <h1>${
                    tasks.filter(t=>{
                        const today=new Date().toISOString().split('T')[0];
                        return t.deadline===today;
                    }).length
                }</h1>
            </div>

            <div class="card">
                <h3>Completion Rate</h3>
                <h1>${percent}%</h1>
            </div>

        </div>


        <div class="grid big-card">

            <div class="card">
                <h3>Upcoming Tasks</h3>

                ${
                    tasks.length
                    ? tasks.slice(0,3).map(t=>`
                        <p style="margin-top:8px;">
                            • ${t.title}
                        </p>
                    `).join('')
                    : "No upcoming tasks"
                }
            </div>

            <div class="card">
                <h3>Today's Schedule</h3>

                ${
                    slots.filter(s=>{
                        const today = new Date()
                            .toLocaleString('en-us',{weekday:'long'});
                        return s.day===today;
                    }).map(s=>`
                        <p style="margin-top:8px;">
                            • ${s.subject} (${s.start})
                        </p>
                    `).join('') || "No schedule for today"
                }

            </div>

        </div>
    `;
}


/* SUBJECT MANAGEMENT */

let editIndex=-1;

function subjects(){
    const subs=get('subjects');

    document.getElementById('app').innerHTML=`
        <h1>Subjects</h1>

        ${card('Add / Edit Subject',`
            <input id="sub" placeholder="Subject name">

            <select id="priority">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
            </select>

            <button class="primary" onclick="saveSubject()">
                ${editIndex===-1?'Add Subject':'Update Subject'}
            </button>
        `)}

        ${card('Your Subjects',
            subs.length ?
            subs.map((s,i)=>`
                <div class="list">
                    <div>
                        <strong>${s.name}</strong><br>
                        <span class="priority ${s.priority.toLowerCase()}">
                            ${s.priority}
                        </span>
                    </div>

                    <div>
                        <button onclick="editSubject(${i})">Edit</button>
                        <button onclick="deleteSubject(${i})">Delete</button>
                    </div>
                </div>
            `).join('')
            : "<p>No subjects yet.</p>"
        )}
    `;
}

function saveSubject(){
    const name=document.getElementById('sub').value;
    const priority=document.getElementById('priority').value;

    if(!name) return alert("Enter subject");

    const subs=get('subjects');

    if(editIndex===-1){
        subs.push({name,priority});
    }else{
        subs[editIndex]={name,priority};
        editIndex=-1;
    }

    set('subjects',subs);
    subjects();
}

function editSubject(i){
    const subs=get('subjects');

    document.getElementById('sub').value=subs[i].name;
    document.getElementById('priority').value=subs[i].priority;

    editIndex=i;
}

function deleteSubject(i){
    const subs=get('subjects');
    subs.splice(i,1);
    set('subjects',subs);
    subjects();
}

/* TASKS */

function tasks(){

    const taskList = get('tasks');

    document.getElementById('app').innerHTML = `
        <h1>Task Manager</h1>

        ${card('Add New Task',`

            <input id="title" placeholder="Task title">

            <select id="type">
                <option>Assignment</option>
                <option>Exam</option>
                <option>Study</option>
            </select>

            <input type="date" id="deadline">

            <button class="primary" onclick="addTask()">
                Add Task
            </button>
        `)}

        ${card('Your Tasks',
            taskList.length
            ? taskList.map((task,i)=>{

                const overdue =
                    new Date(task.deadline) < new Date() &&
                    !task.completed;

                return `
                    <div class="list"
                         style="color:${overdue?'red':'inherit'}">

                        <div>
                            <strong>${task.title}</strong>
                            <br>

                            <small>
                                ${task.type} |
                                Due: ${task.deadline}
                            </small>
                        </div>

                        <div>
                            <button onclick="toggleTask(${i})">
                                ${task.completed?'Completed':'Pending'}
                            </button>

                            <button onclick="deleteTask(${i})">
                                Delete
                            </button>
                        </div>

                    </div>
                `;
            }).join('')
            : "<p>No tasks added yet.</p>"
        )}
    `;
}


/* ADD TASK */

function addTask(){

    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const deadline = document.getElementById('deadline').value;

    if(!title || !deadline){
        return alert("Fill all fields!");
    }

    const taskList = get('tasks');

    taskList.push({
        title,
        type,
        deadline,
        completed:false
    });

    set('tasks', taskList);

    tasks();
}


/* TOGGLE STATUS */

function toggleTask(i){

    const taskList = get('tasks');

    taskList[i].completed =
        !taskList[i].completed;

    set('tasks', taskList);

    tasks();
}


/* DELETE */

function deleteTask(i){

    const taskList = get('tasks');

    taskList.splice(i,1);

    set('tasks', taskList);

    tasks();
}

/* SCHEDULE */

/* ================= SCHEDULE PLANNER ================= */

function schedule(){

    const slots = get('schedule');
    const subjects = get('subjects');

    document.getElementById('app').innerHTML = `
        <h1>Schedule Planner</h1>

        ${card('Add Study Slot',`

            <select id="subject">
                <option value="">Select Subject</option>
                ${subjects.map(s=>`<option>${s.name}</option>`).join('')}
            </select>

            <select id="day">
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
            </select>

            <input type="time" id="start">
            <input type="time" id="end">

            <button class="primary" onclick="addSlot()">
                Add Slot
            </button>
        `)}

        ${card('Weekly Timetable', buildScheduleTable(slots))}
    `;
}

/* BUILD TABLE */

function buildScheduleTable(slots){

    if(!slots.length){
        return "<p>No schedule added yet.</p>";
    }

    const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

    return `
        <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#6366f1;color:white;">
                <th style="padding:10px;">Day</th>
                <th>Subject</th>
                <th>Time</th>
                <th>Action</th>
            </tr>

            ${days.map(day=>{

                const daySlots = slots.filter(s=>s.day===day);

                if(!daySlots.length){
                    return `
                        <tr>
                            <td style="padding:10px;">${day}</td>
                            <td colspan="3">—</td>
                        </tr>
                    `;
                }

                return daySlots.map((slot,i)=>`

                    <tr style="text-align:center;border-bottom:1px solid #eee;">
                        <td style="padding:10px;">${day}</td>
                        <td>${slot.subject}</td>
                        <td>${slot.start} - ${slot.end}</td>
                        <td>
                            <button onclick="deleteSlot(${slots.indexOf(slot)})">
                                Delete
                            </button>
                        </td>
                    </tr>

                `).join('');

            }).join('')}

        </table>
    `;
}

/* ADD SLOT WITH CONFLICT DETECTION */

function addSlot(){

    const subject = document.getElementById('subject').value;
    const day = document.getElementById('day').value;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if(!subject || !start || !end){
        return alert("Please fill all fields");
    }

    if(start >= end){
        return alert("End time must be after start time!");
    }

    const slots = get('schedule');

    /* ⭐ CONFLICT DETECTION */
    const conflict = slots.some(slot =>
        slot.day === day &&
        !(end <= slot.start || start >= slot.end)
    );

    if(conflict){
        return alert(" Time conflict detected!");
    }

    slots.push({subject, day, start, end});
    set('schedule', slots);

    schedule();
}

/* DELETE SLOT */

function deleteSlot(index){

    const slots = get('schedule');
    slots.splice(index,1);

    set('schedule', slots);

    schedule();
}

/* ANALYTICS */

/* ================= ANALYTICS ================= */

function analytics(){

    const tasks = get('tasks');

    if(!tasks.length){
        document.getElementById('app').innerHTML =
            "<h1>Analytics</h1><p>No data yet.</p>";
        return;
    }

    const completed =
        tasks.filter(t=>t.completed).length;

    const percent =
        Math.round((completed/tasks.length)*100);

    const assignments =
        tasks.filter(t=>t.type==="Assignment").length;

    const exams =
        tasks.filter(t=>t.type==="Exam").length;

    const study =
        tasks.filter(t=>t.type==="Study").length;


    document.getElementById('app').innerHTML = `
        <h1>Progress Analytics</h1>

        <div class="grid">
            <div class="card">
                <h2>Completion Rate</h2>
                <div style="position:relative;height:300px;">
                    <canvas id="completionChart"></canvas>
                </div>
            </div>

            <div class="card">
                <h2>Task Distribution</h2>
                <div style="position:relative;height:300px;">
                    <canvas id="typesChart"></canvas>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>Task Completion Status</h2>
                <div style="position:relative;height:300px;">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>

            <div class="card">
                <h2>Quick Stats</h2>
                <div style="padding:20px 0;">
                    <div style="margin:16px 0;display:flex;justify-content:space-between;align-items:center;padding:14px;background:#f8fafc;border-radius:10px;">
                        <span style="color:#475569;font-weight:700;">Total Tasks</span>
                        <span style="color:#6366f1;font-weight:800;font-size:24px;">${tasks.length}</span>
                    </div>
                    <div style="margin:16px 0;display:flex;justify-content:space-between;align-items:center;padding:14px;background:#f0fdf4;border-radius:10px;">
                        <span style="color:#475569;font-weight:700;">Completed</span>
                        <span style="color:#059669;font-weight:800;font-size:24px;">${completed}</span>
                    </div>
                    <div style="margin:16px 0;display:flex;justify-content:space-between;align-items:center;padding:14px;background:#fef2f2;border-radius:10px;">
                        <span style="color:#475569;font-weight:700;">Pending</span>
                        <span style="color:#dc2626;font-weight:800;font-size:24px;">${tasks.length - completed}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Statistics Summary</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px;margin-top:20px;">
                <div style="text-align:center;padding:20px;background:#eef2ff;border-radius:12px;">
                    <p style="color:#6b7280;font-size:14px;margin-bottom:8px;">Assignments</p>
                    <p style="color:#6366f1;font-size:28px;font-weight:800;">${assignments}</p>
                </div>
                <div style="text-align:center;padding:20px;background:#fef3c7;border-radius:12px;opacity:0.9;">
                    <p style="color:#6b7280;font-size:14px;margin-bottom:8px;">Exams</p>
                    <p style="color:#d97706;font-size:28px;font-weight:800;">${exams}</p>
                </div>
                <div style="text-align:center;padding:20px;background:#d1fae5;border-radius:12px;opacity:0.9;">
                    <p style="color:#6b7280;font-size:14px;margin-bottom:8px;">Study</p>
                    <p style="color:#059669;font-size:28px;font-weight:800;">${study}</p>
                </div>
            </div>
        </div>
    `;

    // Destroy previous charts if they exist
    if(chartsInstance.completion) chartsInstance.completion.destroy();
    if(chartsInstance.types) chartsInstance.types.destroy();
    if(chartsInstance.status) chartsInstance.status.destroy();

    // Create Completion Rate Doughnut Chart
    setTimeout(() => {
        const completionCtx = document.getElementById('completionChart');
        if(completionCtx){
            chartsInstance.completion = new Chart(completionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Pending'],
                    datasets: [{
                        data: [completed, tasks.length - completed],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderColor: ['#059669', '#dc2626'],
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { weight: '700', size: 14 },
                                padding: 16,
                                color: '#475569'
                            }
                        }
                    }
                }
            });
        }
    }, 0);

    // Create Task Types Bar Chart
    setTimeout(() => {
        const typesCtx = document.getElementById('typesChart');
        if(typesCtx){
            chartsInstance.types = new Chart(typesCtx, {
                type: 'bar',
                data: {
                    labels: ['Assignments', 'Exams', 'Study'],
                    datasets: [{
                        label: 'Task Count',
                        data: [assignments, exams, study],
                        backgroundColor: [
                            '#6366f1',
                            '#f59e0b',
                            '#10b981'
                        ],
                        borderColor: [
                            '#4f46e5',
                            '#d97706',
                            '#059669'
                        ],
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                font: { weight: '700', size: 14 },
                                color: '#475569'
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { weight: '600' }
                            }
                        },
                        y: {
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { weight: '600' }
                            }
                        }
                    }
                }
            });
        }
    }, 0);

    // Create Task Status Bar Chart
    setTimeout(() => {
        const statusCtx = document.getElementById('statusChart');
        if(statusCtx){
            const completedByType = {
                assignments: tasks.filter(t => t.type === 'Assignment' && t.completed).length,
                exams: tasks.filter(t => t.type === 'Exam' && t.completed).length,
                study: tasks.filter(t => t.type === 'Study' && t.completed).length
            };

            chartsInstance.status = new Chart(statusCtx, {
                type: 'bar',
                data: {
                    labels: ['Assignments', 'Exams', 'Study'],
                    datasets: [
                        {
                            label: 'Completed',
                            data: [completedByType.assignments, completedByType.exams, completedByType.study],
                            backgroundColor: '#10b981',
                            borderColor: '#059669',
                            borderWidth: 2,
                            borderRadius: 8
                        },
                        {
                            label: 'Pending',
                            data: [
                                assignments - completedByType.assignments,
                                exams - completedByType.exams,
                                study - completedByType.study
                            ],
                            backgroundColor: '#ef4444',
                            borderColor: '#dc2626',
                            borderWidth: 2,
                            borderRadius: 8
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { weight: '700', size: 14 },
                                padding: 16,
                                color: '#475569'
                            }
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { weight: '600' }
                            }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { weight: '600' }
                            }
                        }
                    }
                }
            });
        }
    }, 0);
}

/* SETTINGS */

/* ================= SETTINGS ================= */

function settings(){

    const prefs = JSON.parse(localStorage.getItem('prefs')) || {
        theme:'light',
        studyDuration:60
    };

    document.getElementById('app').innerHTML = `
        <h1>Settings</h1>

        ${card('Theme',`

            <button class="primary"
                onclick="toggleTheme()">
                Toggle Dark / Light Mode
            </button>

        `)}

        ${card('Preferences',`

            <label>Default Study Duration (minutes)</label>

            <input id="duration"
                   type="number"
                   value="${prefs.studyDuration}">

            <button class="primary"
                onclick="savePrefs()">
                Save Preferences
            </button>

        `)}

        ${card('Data Management',`

            <button class="primary"
                onclick="exportData()">
                Export Data
            </button>

            <input type="file"
                   id="importFile"
                   style="margin-top:10px;"
                   onchange="importData(event)">

            <button class="primary"
                style="background:#ef4444;"
                onclick="resetAll()">
                Reset All Data
            </button>

        `)}
    `;

    applyTheme();
}

/* THEME TOGGLE */

function toggleTheme(){

    const prefs = JSON.parse(localStorage.getItem('prefs')) || {};

    prefs.theme =
        prefs.theme === 'dark'
        ? 'light'
        : 'dark';

    localStorage.setItem(
        'prefs',
        JSON.stringify(prefs)
    );

    applyTheme();
}

/* APPLY THEME */

function applyTheme(){

    const prefs = JSON.parse(localStorage.getItem('prefs'));

    if(prefs?.theme === 'dark'){
        document.body.classList.add('dark');
    }else{
        document.body.classList.remove('dark');
    }
}

/* SAVE PREFERENCES */

function savePrefs(){

    const duration =
        document.getElementById('duration').value;

    const prefs =
        JSON.parse(localStorage.getItem('prefs')) || {};

    prefs.studyDuration = duration;

    localStorage.setItem(
        'prefs',
        JSON.stringify(prefs)
    );

    alert("Preferences Saved!");
}

/* EXPORT DATA */

function exportData(){

    const data = {
        subjects:get('subjects'),
        tasks:get('tasks'),
        schedule:get('schedule'),
        prefs:JSON.parse(localStorage.getItem('prefs'))
    };

    const blob = new Blob(
        [JSON.stringify(data,null,2)],
        {type:"application/json"}
    );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement('a');

    a.href = url;
    a.download = "study-planner-backup.json";
    a.click();
}

/* IMPORT DATA ⭐ VERY IMPRESSIVE */

function importData(event){

    const file = event.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(e){

        const data =
            JSON.parse(e.target.result);

        if(data.subjects)
            set('subjects',data.subjects);

        if(data.tasks)
            set('tasks',data.tasks);

        if(data.schedule)
            set('schedule',data.schedule);

        if(data.prefs)
            localStorage.setItem(
                'prefs',
                JSON.stringify(data.prefs)
            );

        alert("Backup Restored!");

        location.reload();
    };

    reader.readAsText(file);
}

