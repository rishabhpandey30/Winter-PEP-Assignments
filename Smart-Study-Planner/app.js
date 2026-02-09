navigate('dashboard');
applyTheme();   

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
                        <button onclick="editSubject(${i})">✏️</button>
                        <button onclick="deleteSubject(${i})">❌</button>
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
                                ${task.completed?'✅':'✔'}
                            </button>

                            <button onclick="deleteTask(${i})">
                                ❌
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
                                ❌
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
        return alert("⚠️ Time conflict detected!");
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

        ${card('Completion Rate',`

            <div class="progress">
                <div class="bar"
                     style="width:${percent}%">
                     ${percent}%
                </div>
            </div>

        `)}

        ${card('Task Breakdown',`

            <p>Assignments: ${assignments}</p>
            <div class="progress">
                <div class="bar"
                     style="width:${assignments/tasks.length*100}%">
                </div>
            </div>

            <p>Exams: ${exams}</p>
            <div class="progress">
                <div class="bar"
                     style="width:${exams/tasks.length*100}%">
                </div>
            </div>

            <p>Study: ${study}</p>
            <div class="progress">
                <div class="bar"
                     style="width:${study/tasks.length*100}%">
                </div>
            </div>

        `)}

        ${card('Insight',`

            <h3>
                ${
                    percent > 75
                    ? "Excellent productivity!"
                    : percent > 40
                    ? " Good — keep improving."
                    : " You need better planning."
                }
            </h3>

        `)}
    `;
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

