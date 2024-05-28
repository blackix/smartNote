from flask import Flask, request, render_template, jsonify
import requests
import re
from datetime import datetime, timedelta

app = Flask(__name__)

# Funzione per migliorare il posizionamento nel calendario e generare testi più eloquenti
def clean_text_with_openai(note, classification):
    api_key = 'xxxx'
    url = "https://api.openai.com/v1/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    if classification == 'appointment':
        prompt = f"Remove any temporal references from the following appointment note: '{note}'. Only keep the essential task."
    elif classification == 'reminder':
        prompt = f"Remove 'ricordami' and any other unnecessary words from the following reminder note: '{note}'. Only keep the essential task."
    else:
        return note

    data = {
        "model": "text-davinci-003",
        "prompt": prompt,
        "max_tokens": 50
    }
   
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            cleaned_note = result["choices"][0]["text"].strip()
            return cleaned_note
        else:
            return note

    except requests.exceptions.RequestException as e:
        print(f"API Request Error: {e}")
        return note

# Funzione per la classificazione locale
def classify_note_local(note):
    appointment_patterns = [
        r'\b(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica|oggi|domani|prossimo|am|pm|pomeriggio|mattina|sera|notte)\b',  # Giorni della settimana e riferimenti temporali
        r'\b(\d{1,2}:\d{2})\b'  # Ore (es. 14:30)
    ]

    reminder_pattern = r'^ricordami'  # Inizia con "ricordami"

    for pattern in appointment_patterns:
        if re.search(pattern, note, re.IGNORECASE):
            return "appointment"

    if re.search(reminder_pattern, note, re.IGNORECASE):
        return "reminder"

    return "post-it"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/classify', methods=['POST'])
def classify():
    note = request.form['note']
    classification = classify_note_local(note)
    
    cleaned_note = clean_text_with_openai(note, classification)

    response = {
        'classification': classification,
        'cleaned_note': cleaned_note
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)