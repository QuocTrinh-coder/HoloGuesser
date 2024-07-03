import streamlit as st

# List of Hololive members with their image URLs
hololive_members = [
    {"name": "Tokino Sora", "image_url": "https://static.miraheze.org/hololivewiki/thumb/7/74/Tokino_Sora_-_Main_Page_Icon.png/96px-Tokino_Sora_-_Main_Page_Icon.png"},
    {"name": "Roboco", "image_url": "https://static.miraheze.org/hololivewiki/thumb/6/60/Roboco_-_Main_Page_Icon.png/96px-Roboco_-_Main_Page_Icon.png"},
    {"name": "Sakura Miko", "image_url": "https://static.miraheze.org/hololivewiki/thumb/5/5e/AZKi_-_Main_Page_Icon.png/96px-AZKi_-_Main_Page_Icon.png"},
    # Add more members as needed
]

# Display options using beta_columns
columns = st.beta_columns(len(hololive_members))
for i, member in enumerate(hololive_members):
    columns[i].image(member["image_url"], width=50)
    columns[i].write(member["name"])

# Selectbox to choose a member
selected_member = st.selectbox("Select a Hololive Member", options=[member["name"] for member in hololive_members])

# Display the selected member's image
for member in hololive_members:
    if member["name"] == selected_member:
        st.image(member["image_url"], width=100)
