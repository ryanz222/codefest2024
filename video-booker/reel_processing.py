from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import requests
import subprocess
import speech_recognition as sr
import os
from pydub import AudioSegment

# Initialize the WebDriver (Safari in this case, you can change to Chrome/Firefox as needed)
driver = webdriver.Safari()

# Step 1: Open the Instagram downloader page
driver.get("https://toolzin.com/tools/instagram-downloader/")

# Wait for the page to load
#time.sleep(1)

# Step 2: Input the Instagram reel URL into the search field
reel_url = "https://www.instagram.com/reel/C-V-x0vSX0N/?igsh=MTd4MzE3eXgydmkyaw=="
input_field = driver.find_element(By.NAME, "search")
input_field.send_keys(reel_url)

# Step 3: Wait until the "Download" button is clickable
download_button = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.ID, "btn_submit"))
)

# Try clicking the button directly, or using JavaScript if it fails
try:
    download_button.click()
except Exception as e:
    driver.execute_script("arguments[0].click();", download_button)

# Wait for the page to process and display the results
time.sleep(5)

# Step 4: Locate and download the **audio file**
audio_file_path = "reel_audio.mp3"
try:
    audio_download_button = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, '//a[contains(text(), "Download Audio")]'))
    )
    audio_link = audio_download_button.get_attribute('href')

    # Download the audio using requests
    audio_response = requests.get(audio_link)
    with open(audio_file_path, "wb") as file:  # Save the audio as .mp3
        file.write(audio_response.content)

    print("Audio downloaded successfully!")
except Exception as e:
    print("Error downloading the audio: ", e)

# Step 5: Scrape the caption text
caption_file = "reel_caption_and_transcription.txt"
try:
    caption_element = driver.find_element(By.ID, 'result')
    caption_text = caption_element.text

    # Save the caption to a text file
    with open(caption_file, "w") as file:
        file.write("### Caption from Reel ###\n")
        file.write(caption_text + "\n\n")
        file.write("### Transcription from Reel ###\n")

    print("Caption downloaded successfully!")
except Exception as e:
    print("Error downloading the caption: ", e)

# Step 6: Close the browser
driver.quit()

# Step 7: Convert MP3 to WAV using ffmpeg
wav_file_path = "reel_audio.wav"
try:
    subprocess.run(['ffmpeg', '-i', audio_file_path, wav_file_path], check=True)
    print(f"Converted {audio_file_path} to {wav_file_path}")
except subprocess.CalledProcessError as e:
    print(f"Error converting MP3 to WAV: {e}")

# Step 8: Transcribe the .wav audio file
try:
    # Load the converted .wav file using speech_recognition
    recognizer = sr.Recognizer()

    # Use the wav file for transcription
    with sr.AudioFile(wav_file_path) as source:
        audio_data = recognizer.record(source)  # Capture the full audio

        # Transcribe the audio using Google Speech Recognition
        transcription = recognizer.recognize_google(audio_data)
        print("Transcription: ", transcription)

        # Append the transcription to the caption file
        with open(caption_file, "a") as file:
            file.write(transcription + "\n")

        print("Transcription saved successfully!")
except sr.UnknownValueError:
    print("Google Speech Recognition could not understand the audio")
except sr.RequestError as e:
    print(f"Could not request results from Google Speech Recognition service; {e}")
except Exception as e:
    print("Error transcribing the audio: ", e)

# Step 9: Optional cleanup: Remove the temporary .wav file
if os.path.exists(wav_file_path):
    os.remove(wav_file_path)
