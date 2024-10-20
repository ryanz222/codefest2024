import speech_recognition as sr
from moviepy.editor import VideoFileClip
import tempfile
import os

# Path to the video file
video_path = "reel.mp4"

# Load the video and extract the audio
video_clip = VideoFileClip(video_path)
audio = video_clip.audio

# Create a temporary file to save the audio
with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio_file:
    temp_audio_path = temp_audio_file.name
    audio.write_audiofile(temp_audio_path, codec='pcm_s16le', fps=16000)

# Initialize the recognizer
recognizer = sr.Recognizer()

# Transcribe the audio from the temporary file
with sr.AudioFile(temp_audio_path) as source:
    audio_data = recognizer.record(source)

# Transcribe the audio using Google Speech Recognition
try:
    transcription = recognizer.recognize_google(audio_data)
    print("Transcription of the reel: ")
    print(transcription)
except sr.UnknownValueError:
    print("Google Speech Recognition could not understand the audio")
except sr.RequestError as e:
    print(f"Could not request results from Google Speech Recognition service; {e}")

# Clean up the temporary file
os.remove(temp_audio_path)
