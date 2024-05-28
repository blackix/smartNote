document.addEventListener('DOMContentLoaded', function() {
    const daysOfWeek = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const today = new Date();
    const startOfWeek = new Date(today);

    // Mappa delle date
    const dateMap = {};

    // Set the day headers with dates
    document.querySelectorAll('.day').forEach((day, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        const dayName = daysOfWeek[date.getDay()];
        day.querySelector('h3').innerText = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
        const isoDate = date.toISOString().split('T')[0];
        day.setAttribute('data-date', isoDate); // Add data-date attribute for easier referencing
        dateMap[dayName.toLowerCase()] = isoDate;

        // Highlight today
        if (index === 0) {
            day.classList.add('today');
        }
    });

    // Make the dateMap globally accessible
    window.dateMap = dateMap;
});

document.getElementById('note-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var note = document.getElementById('note').value;
    fetch('/classify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'note': note
        })
    })
    .then(response => response.json())
    .then(data => {
        var resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p>Classificazione: ${data.classification}</p>`;
        
        const cleanedNote = data.cleaned_note;
        
        if (data.classification === 'appointment') {
            addAppointment(cleanedNote, note);
        } else if (data.classification === 'reminder') {
            addReminder(cleanedNote);
        } else if (data.classification === 'post-it') {
            createPostIt(cleanedNote);
        }
    });
});

function addAppointment(note, originalNote) {
    const dayOfWeek = getDayOfWeek(originalNote);
    if (dayOfWeek !== null) {
        var appointment = document.createElement('div');
        appointment.className = 'appointment';
        appointment.innerText = note;
        document.querySelector(`[data-date="${dayOfWeek}"] .box`).appendChild(appointment);
    } else {
        alert('Non è stato possibile determinare il giorno per l\'appuntamento.');
    }
}

function addReminder(note) {
    var reminder = document.createElement('li');
    reminder.innerText = note;
    reminder.addEventListener('click', function() {
        reminder.classList.toggle('completed');
        if (reminder.classList.contains('completed')) {
            document.getElementById('reminder-list').appendChild(reminder);
        }
    });
    document.getElementById('reminder-list').appendChild(reminder);
}

function createPostIt(note) {
    var postIt = document.createElement('div');
    postIt.className = 'postit';
    postIt.innerText = note;

    // Aggiungi pulsante di eliminazione
    var deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = 'X';
    deleteButton.onclick = function() {
        postIt.remove();
    };
    postIt.appendChild(deleteButton);
    
    // Assign a random position within the postit-area
    var area = document.getElementById('postit-area');
    var maxX = area.clientWidth - 150;
    var maxY = area.clientHeight - 150;
    var randomX = Math.floor(Math.random() * maxX);
    var randomY = Math.floor(Math.random() * maxY);
    
    postIt.style.left = randomX + 'px';
    postIt.style.top = randomY + 'px';

    // Assign a random color
    var colors = ['yellow', 'pink', 'green'];
    var randomColor = colors[Math.floor(Math.random() * colors.length)];
    postIt.classList.add(randomColor);

    area.appendChild(postIt);
    $(postIt).draggable({ containment: "#postit-area" }).resizable({
        maxWidth: 150,
        maxHeight: 150
    });
}

function getDayOfWeek(note) {
    const noteLower = note.toLowerCase();
    const today = new Date();
    let targetDate = new Date(today);
    
    const days = {
        'domenica': 0,
        'lunedì': 1,
        'martedì': 2,
        'mercoledì': 3,
        'giovedì': 4,
        'venerdì': 5,
        'sabato': 6,
        'oggi': 0,
        'domani': 1,
        'dopodomani': 2
    };

    for (const [key, value] of Object.entries(days)) {
        if (noteLower.includes(key)) {
            if (key === 'oggi' || key === 'domani' || key === 'dopodomani') {
                targetDate.setDate(today.getDate() + value);
                return targetDate.toISOString().split('T')[0];
            } else if (noteLower.includes('prossimo ')) {
                const dayIndex = Object.keys(days).findIndex(day => noteLower.includes(day) && day !== 'prossimo');
                if (dayIndex !== -1) {
                    targetDate.setDate(today.getDate() + ((dayIndex + 7 - today.getDay()) % 7) + 7);
                    return targetDate.toISOString().split('T')[0];
                }
            } else {
                const targetDay = window.dateMap[key];
                if (targetDay) {
                    return targetDay;
                }
            }
        }
    }

    return null;
}
