import speech_recognition as sr
from moviepy.editor import VideoFileClip

video_path = "/Users/I212229/Downloads/Video-794.mp4"
video_clip = VideoFileClip(video_path)

audio_path = "extracted_audio.wav"
video_clip.audio.write_audiofile(audio_path)

recognizer = sr.Recognizer()

with sr.AudioFile(audio_path) as source:
    audio_data = recognizer.record(source)
    transcription = recognizer.recognize_google(audio_data)


