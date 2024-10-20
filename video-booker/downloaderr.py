from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import requests

driver = webdriver.Safari()

driver.get("https://fastvideosave.net/")

#time.sleep(3)

reel_url = "https://www.instagram.com/reel/C-V-x0vSX0N/?igsh=MTd4MzE3eXgydmkyaw=="

input_field = driver.find_element(By.NAME, 'url')
input_field.send_keys(reel_url)

#time.sleep(1)

download_button = driver.find_element(By.XPATH, '//button[@type="submit"]')

driver.execute_script("arguments[0].scrollIntoView(true);", download_button)
#time.sleep(1) 
download_button.click()

time.sleep(2)

video_link = driver.find_element(By.XPATH, '//a[@rel="noreferrer nofollow"]').get_attribute('href')

video_response = requests.get(video_link)

with open("reel.mp4", "wb") as file:
    file.write(video_response.content)

print("Reel downloaded successfully!")

driver.quit()
