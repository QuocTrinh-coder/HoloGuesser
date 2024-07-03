from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import time

# Function to filter out non-ASCII characters
def filter_non_ascii(text):
    return ''.join([char if ord(char) < 128 else '' for char in text])

# Set up the Selenium WebDriver
driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()))

# Define the URL of the website
url = 'https://hololive.wiki/Main_Page'  # Replace with the actual URL

# Open the website
driver.get(url)

# Give the page some time to load
time.sleep(5)  # Adjust the sleep time as needed

# Find all tables with class 'wikitable'
wikitables = driver.find_elements(By.CLASS_NAME, 'wikitable')

# List to store href links and image sources
href_links = []
image_sources = []

# Loop through each wikitable
for wikitable in wikitables:
    # Find all span tags within the table with the attribute typeof="mw:File"
    span_tags = wikitable.find_elements(By.XPATH, './/span[@typeof="mw:File"]')
    
    # Extract the href attribute from each a tag within the span tags
    for span in span_tags:
        a_tag = span.find_element(By.TAG_NAME, 'a')
        href_link = a_tag.get_attribute('href')
        if href_link:
            href_links.append(href_link)
        
        # Extract the src attribute from the img tag within the a tag
        img_tag = a_tag.find_element(By.TAG_NAME, 'img')
        img_src = img_tag.get_attribute('src')
        if img_src:
            image_sources.append(img_src)

# List to store member information for the DataFrame
members_info = []

# Process each link and extract information
for link, img_src in zip(href_links, image_sources):
    print(f'Accessing link: {link}')
    driver.get(link)
    
    # Wait for the infobox to be present
    try:
        infobox = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, 'infobox')))
        
        # Find all tr tags within the infobox
        tr_tags = infobox.find_elements(By.TAG_NAME, 'tr')
        
        # Dictionary to store specific information
        member_info = {'URL': link, 'Image URL': img_src}
        
        # Extract relevant information
        for tr in tr_tags:
            th = tr.find_elements(By.TAG_NAME, 'th')
            td = tr.find_elements(By.TAG_NAME, 'td')
            
            for header, data in zip(th, td):
                header_text = filter_non_ascii(header.text.strip())
                data_text = filter_non_ascii(data.text.strip())
                
                # Check for specific headers of interest
                if header_text == 'English Name':
                    member_info['Name'] = data_text
                elif header_text == 'Debut Date':
                    member_info['Debut Date'] = data_text
                elif header_text == 'Member of':
                    member_info['Member of'] = data_text
                elif header_text == 'Fan Name':
                    member_info['Fan Name'] = data_text
                elif header_text == 'Birthday':
                    member_info['Birthday'] = data_text
                elif header_text == 'Height':
                    member_info['Height'] = data_text
                elif header_text == 'English':
                    member_info['English'] = data_text
        
        # Append member information to the list
        members_info.append(member_info)
        
        # Print current member information
        print(f'Current member info: {member_info}')
        
    except Exception as e:
        print(f'No infobox found or an error occurred: {e}')
    
    # Go back to the main page
    driver.back()
    time.sleep(2)  # Adjust the sleep time as needed

# Close the WebDriver
driver.quit()

# Create a DataFrame from the collected data
df = pd.DataFrame(members_info)

# Save the DataFrame to a CSV file
df.to_csv('hololive_members.csv', index=False)

print('Data saved to hololive_members.csv')



