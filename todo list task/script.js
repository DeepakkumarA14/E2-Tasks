document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTaskButton');
    const taskList = document.getElementById('taskList');
    const allTasksButton = document.getElementById('allTasks');
    const inProgressTasksButton = document.getElementById('inProgressTasks');
    const completedTasksButton = document.getElementById('completedTasks');
    const toast = document.getElementById('toast');
    const errorMessage = document.getElementById('error-message');
    const tableheadings = document.getElementById('tableheadings');

    let tasks = [];
    let editIndex = null;

    if (localStorage.getItem('tasks')) {
        tasks = JSON.parse(localStorage.getItem('tasks'));
    }

    function renderAllTasks() {
        taskList.innerHTML = '';
        tasks.forEach(function(task, index) {
            createTaskElement(task, index);
        });

        if (tasks.length === 0) {
            tableheadings.style.display = 'none';
            const noTasksMessage = document.createElement('p');
            noTasksMessage.textContent = "No Available Task.";
            noTasksMessage.className = 'noTaskMessage';
            taskList.appendChild(noTasksMessage);
        } else {
            tableheadings.style.display = 'flex';
        }   
        updateTaskCounts();
    }

    function renderInProgressTasks() {
        taskList.innerHTML = '';
        let inProgressTasks = false;
        tasks.forEach(function(task, index) {
            if (task.status === 'inProgress') {
                createTaskElement(task, index);
                inProgressTasks = true;     
            }
        });

        if (inProgressTasks) {
            tableheadings.style.display = 'flex';
        } else {
            tableheadings.style.display = 'none';
            const noInProgressMessage = document.createElement('p');
            noInProgressMessage.textContent = "No Task in In-Progress.";
            noInProgressMessage.className = 'noTaskMessage';
            taskList.appendChild(noInProgressMessage);
        }   
        updateTaskCounts(); 
    }

    function renderCompletedTasks() {
        taskList.innerHTML = '';
        let completedTasks = false;
        tasks.forEach(function(task, index) {
            if (task.status === 'completed') {
                createTaskElement(task, index);
                completedTasks = true;
            }
        });

        if (completedTasks) {
            tableheadings.style.display = 'flex';
        } else {
            tableheadings.style.display = 'none';
            const noCompletedMessage = document.createElement('p');
            noCompletedMessage.textContent = "No Task is Completed.";
            noCompletedMessage.className = 'noTaskMessage';
            taskList.appendChild(noCompletedMessage);
        } 

        updateTaskCounts();   
    }

    function updateTaskCounts() {
        const allTasksCount = tasks.length;
        const inProgressTasksCount = tasks.filter(task => task.status === 'inProgress').length;
        const completedTasksCount = tasks.filter(task => task.status === 'completed').length;

        allTasksButton.textContent=`All (${allTasksCount})`;
        inProgressTasksButton.textContent= `In Progress (${inProgressTasksCount})`;
        completedTasksButton.textContent=`Completed (${completedTasksCount})`;
    }

    function createTaskElement(task, index) {
        let li = document.createElement('li');

        let taskText = document.createElement('span');
        taskText.textContent = task.text;
        taskText.style.flexGrow = '1';
        taskText.style.wordBreak = 'break-word';
        if (task.status === 'completed') {
            taskText.style.textDecoration = 'line-through';
        }

        let actions = document.createElement('div');
        actions.className = 'actions';

        let editButton = document.createElement('button');
        editButton.innerHTML = '🖊️';
        editButton.onclick = function() { 
            showToast("Edit the Task, Then Switch Tabs!",'green');
            editTask(index); };

        let deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑️';
        deleteButton.onclick = function() { confirmDelete(index); };

        let statusCheckbox = document.createElement('input');
        statusCheckbox.type = 'checkbox';
        statusCheckbox.style.cursor='pointer'
        statusCheckbox.checked = task.status === 'completed';
        statusCheckbox.onclick = function() { confirmToggleStatus(index, statusCheckbox); };

        actions.append(editButton, deleteButton);
        li.append(taskText, actions);
        li.prepend(statusCheckbox);
        taskList.append(li);
    }
    renderAllTasks();

    function addTask() {
        let taskValue = taskInput.value.trim().replace(/\s+/g, ' ');
    
        if (taskValue === '') {
            handleErrorMessage('Task cannot be empty!');
            return;
        }
 
        if (editIndex !== null) {
            disableTabButtons();
            if (taskValue === tasks[editIndex].text) {
                showToast("No Changes Made.",'green');
                taskInput.value = '';
                editIndex = null;
                addTaskButton.textContent = 'Add';
                enableTabButtons(); 
                return;
            }
    
            let taskExists = tasks.some(function (task, index) {
                return task.text.toLowerCase()=== taskValue.toLowerCase() && index !== editIndex;
            });
            if (taskExists) {
                showToast("Task Already Exists!",'red');
                enableTabButtons(); 
                return;
            }

            tasks[editIndex].text = taskValue;
            let editedTask = tasks[editIndex];
            tasks.splice(editIndex, 1);
            editedTask.text = taskValue.trim();
            tasks.unshift(editedTask);
            taskList.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            showToast('Task Edited Successfully!','green');
        } else {
            if (tasks.some(function (task) { return task.text.toLowerCase()=== taskValue.toLowerCase();})) {
                showToast('Task Already Exists!','red');
                enableTabButtons(); 
                return;
            }
    
            tasks.unshift({ text: taskValue, status: 'inProgress' });
            taskList.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            showToast('Task Added Successfully!','green');
            renderAllTasks();
            highlightActiveTab(allTasksButton);
        }
    
        addTaskButton.textContent = 'Add';
        editIndex = null;
        taskInput.value = '';
        tableheadings.style.display = 'flex';
        saveTasksToLocalStorage();
        updateTaskCounts();

        if (allTasksButton.classList.contains('active')) {
            renderAllTasks();
            highlightActiveTab(allTasksButton);
        } else if (inProgressTasksButton.classList.contains('active')) {
            renderInProgressTasks();
            highlightActiveTab(inProgressTasksButton);
        } else if (completedTasksButton.classList.contains('active')) {
            renderCompletedTasks();
            highlightActiveTab(completedTasksButton);
        }
    
        enableTabButtons(); 
    } 
    

    function confirmToggleStatus(index, checkbox) {
        const modal = document.createElement('div');
        modal.className = 'modal';

        const taskIndexValue = tasks[index].text;
        const isCompleting = checkbox.checked;
        const action = isCompleting ? 'complete' : 're-add';

        modal.innerHTML = `
            <div class="modal-content">
            <div class="confirmQuestion">
                <p>Are you sure you want to  ${action} the task?</p>
            </div>
            <div class="taskContent">
                <p><strong>Task:</strong> ${taskIndexValue}</p>
            </div>
            <div class="modal-buttons">
                <button id="confirmToggleButton">Yes</button>
                <button id="cancelToggleButton">No</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        const confirmToggleButton = document.getElementById('confirmToggleButton');
        const cancelToggleButton = document.getElementById('cancelToggleButton');

        confirmToggleButton.addEventListener('click', function() {
            toggleStatus(index);
            closeModal(modal);
        });

        cancelToggleButton.addEventListener('click', function() {
            checkbox.checked = !isCompleting;
            closeModal(modal);
        });
    }

    function editTask(index) {
        disableTabButtons();
        editIndex = index;
        taskInput.value = tasks[index].text;
        addTaskButton.textContent = 'Save';
        taskInput.focus();
    }

    function disableTabButtons() {
        allTasksButton.disabled = true;
        inProgressTasksButton.disabled = true;
        completedTasksButton.disabled = true;
    }
    
    function enableTabButtons() {
        allTasksButton.disabled = false;
        inProgressTasksButton.disabled = false;
        completedTasksButton.disabled = false;
    }

    function confirmDelete(index) {
        const modal = document.createElement('div');
        modal.className = 'modal';

        const taskIndexValue = tasks[index].text;

        modal.innerHTML = `
            <div class="modal-content">
            <div class="confirmQuestion">
                <p>Are you sure you want to delete the task?</p>
            </div>
            <div class="taskContent">
                <p><strong>Task:</strong> ${taskIndexValue}</p>
            </div>
            <div class="modal-buttons">
                <button id="confirmDeleteButton">Yes</button>
                <button id="cancelDeleteButton">No</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        const confirmDeleteButton = document.getElementById('confirmDeleteButton');
        const cancelDeleteButton = document.getElementById('cancelDeleteButton');

        confirmDeleteButton.addEventListener('click', function() {
            deleteTask(index);
            showToast('Task Deleted Successfully!','red');
            closeModal(modal);
        });

        cancelDeleteButton.addEventListener('click', function() {
            closeModal(modal);
        });
    }

    function closeModal(modal) {
        document.body.removeChild(modal);
    }

    function deleteTask(index) {
            if (index === editIndex) {
                editIndex = null;
                addTaskButton.textContent = 'Add';
                taskInput.value = '';
            }

        tasks.splice(index, 1);
    
        if (allTasksButton.classList.contains('active')) {
            renderAllTasks();
        } else if (inProgressTasksButton.classList.contains('active')) {
            renderInProgressTasks();
        } else if (completedTasksButton.classList.contains('active')) {
            renderCompletedTasks();
        } else{
            renderAllTasks();
            renderActiveTab('all');
        }
        saveTasksToLocalStorage();
        updateTaskCounts();
    }

    function toggleStatus(index) {
        const task = tasks[index];
        
        if (allTasksButton.classList.contains('active')) {
            if (task.status === 'inProgress') {
                tasks.splice(index, 1);
                task.status = 'completed';
                tasks.unshift(task); 
                taskList.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                renderActiveTab('all');    
                showToast('Task Completed Successfully!!!','green');  
            } else if (task.status === 'completed') {
                tasks.splice(index, 1);
                task.status = 'inProgress';
                tasks.unshift(task); 
                taskList.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                renderActiveTab('all');    
                showToast('Task re-added Successfully!!!','green');  
            } 
        } else if (inProgressTasksButton.classList.contains('active')) {
            if (task.status === 'inProgress') {
                tasks.splice(index, 1);
                task.status = 'completed';
                tasks.unshift(task); 
                taskList.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                renderActiveTab('completed'); 
                showToast('Task Completed Successfully!!!','green');
               
            }
        } else if (completedTasksButton.classList.contains('active')) {
            if (task.status === 'completed') {
                tasks.splice(index, 1);
                task.status = 'inProgress';
                tasks.unshift(task); 
                taskList.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                renderActiveTab('inProgress');    
                showToast('Task re-added Successfully!!!','green');
               
            }
        } else{
            renderAllTasks();
            renderActiveTab('all');
        }
        saveTasksToLocalStorage();
        updateTaskCounts();
    }
    
    function renderActiveTab(activeTab) {
        if (activeTab === 'all') {
            renderAllTasks();
            highlightActiveTab(allTasksButton);
          
        } else if (activeTab === 'inProgress') {
            renderInProgressTasks();
            highlightActiveTab(inProgressTasksButton); 
           
        } else if (activeTab === 'completed') {
            renderCompletedTasks();
            highlightActiveTab(completedTasksButton);       
        }
    }

    function highlightActiveTab(activeTab) {
        const allTabs = document.querySelectorAll('.tab');
        allTabs.forEach(function(tab){
        tab.classList.remove('active')});    
        activeTab.classList.add('active');
    }

    function showToast(message, type) {
        toast.textContent = message;
        toast.className = `show show${type}`;
        toast.style.visibility = 'visible';
        setTimeout(function() {
            toast.style.visibility = 'hidden';
        }, 3000);
    }

    function handleErrorMessage(message = '') {
        if (message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(function() {
                errorMessage.style.display = 'none';
            }, 3000);
        } else {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
    }

    function saveTasksToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    taskInput.addEventListener('input', function() {
        const taskValue = taskInput.value; 

        if (taskValue === '') {
            handleErrorMessage();
            return;
        }

        if (taskInput.value.charAt(0) === ' ') {
            handleErrorMessage('whitespace is not allowed!');
            taskInput.value = taskInput.value.trimStart();
            return;
        }
        
        if (!taskValue.match(/^[a-zA-Z0-9\s]+$/)) {
            handleErrorMessage('Special characters are not allowed!');
            taskInput.value = taskValue.replace(/[^a-zA-Z0-9\s]/g,'');
        } else{
            handleErrorMessage();
        }
    });
    
    addTaskButton.onclick = addTask;
    taskInput.addEventListener('keydown', function(d) {
        if (d.key === 'Enter') addTask();
    });
    
    allTasksButton.onclick = function() {
        renderActiveTab('all');
    };
    inProgressTasksButton.onclick = function() {
        renderActiveTab('inProgress'); 
    };
    completedTasksButton.onclick = function() {
        renderActiveTab('completed');
    };
    renderAllTasks();
    renderActiveTab('all');
});