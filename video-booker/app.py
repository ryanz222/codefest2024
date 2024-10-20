from flask import Flask, render_template, request, jsonify, send_file
import os
import requests
import subprocess
import speech_recognition as sr
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

app = Flask(__name__)

# Processing logic (same as before but placed inside a function for reusability)
def process_reel(reel_url):
    # Step 1: Set up Selenium and download reel audio and caption
    driver = webdriver.Safari()
    driver.get("https://toolzin.com/tools/instagram-downloader/")
    time.sleep(3)

    input_field = driver.find_element(By.NAME, "search")
    input_field.send_keys(reel_url)

    download_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "btn_submit"))
    )

    try:
        download_button.click()
    except Exception as e:
        driver.execute_script("arguments[0].click();", download_button)

    time.sleep(5)

    # Step 4: Download audio file
    audio_file_path = "reel_audio.mp3"
    try:
        audio_download_button = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, '//a[contains(text(), "Download Audio")]'))
        )
        audio_link = audio_download_button.get_attribute('href')
        audio_response = requests.get(audio_link)
        with open(audio_file_path, "wb") as file:
            file.write(audio_response.content)
        print("Audio downloaded successfully!")
    except Exception as e:
        print("Error downloading the audio: ", e)

    # Step 5: Scrape the caption
    caption_text = ""
    try:
        caption_element = driver.find_element(By.ID, 'result')
        caption_text = caption_element.text
    except Exception as e:
        print("Error downloading the caption: ", e)

    driver.quit()

    # Step 6: Convert MP3 to WAV using ffmpeg
    wav_file_path = "reel_audio.wav"
    try:
        subprocess.run(['ffmpeg', '-i', audio_file_path, wav_file_path], check=True)
        print(f"Converted {audio_file_path} to {wav_file_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error converting MP3 to WAV: {e}")

    # Step 7: Transcribe the .wav audio file
    transcription = ""
    try:
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_file_path) as source:
            audio_data = recognizer.record(source)
            transcription = recognizer.recognize_google(audio_data)
            print("Transcription: ", transcription)
    except sr.UnknownValueError:
        transcription = "Google Speech Recognition could not understand the audio"
    except sr.RequestError as e:
        transcription = f"Could not request results from Google Speech Recognition service; {e}"
    except Exception as e:
        transcription = f"Error transcribing the audio: {e}"

    # Clean up the audio files
    os.remove(wav_file_path)

    return caption_text, transcription

# Flask route for home page
@app.route('/')
def index():
    return render_template('index.html')

# Flask route to handle form submission and process the reel
@app.route('/process', methods=['POST'])
def process():
    reel_url = request.form.get('reel_url')
    if not reel_url:
        return jsonify({'error': 'No URL provided'}), 400

    # Process the reel (download, caption extraction, transcription)
    caption, transcription = process_reel(reel_url)

    # Save the caption and transcription to a file
    result_file = "reel_caption_and_transcription.txt"
    with open(result_file, "w") as file:
        file.write("### Caption from Reel ###\n")
        file.write(caption + "\n\n")
        file.write("### Transcription from Reel ###\n")
        file.write(transcription)

    # Return JSON response
    return jsonify({
        'caption': caption,
        'transcription': transcription
    })

# Flask route to download the results file
@app.route('/download', methods=['GET'])
def download():
    return send_file("reel_caption_and_transcription.txt", as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
