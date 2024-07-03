import json
import pandas as pd
import random
import streamlit as st
from datetime import datetime, timedelta

# Load data
df = pd.read_csv("hololive_members_clean.csv")
df2 = df.drop("Name", axis=1)
with open('hololive_members.json', 'r') as file:
    data = json.load(file)

# Prepare data
key_pool = list(data.keys())
items_pool = list(df2.columns)
all_members_name = list(df["Name"].unique())

# Initialize session state
if 'random_member' not in st.session_state:
    st.session_state.random_member = random.choice(key_pool)

if 'end_condition' not in st.session_state:
    st.session_state.end_condition = False

if 'guesses' not in st.session_state:
    st.session_state.guesses = []

# CSS for styling the table and adding the fade-in animation
table_style = """
<style>
.table-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    width: 110%; /* Adjusted width */
    max-width: 1200px; /* Maximum width */
    overflow-x: auto; /* Horizontal scroll if necessary */
}

table {
    border-collapse: collapse;
    width: 100%; /* Adjusted width */
    text-align: center;
}

th, td {
    border: 1px solid white;
    padding: 8px;
    color: white;
    white-space: nowrap; /* Ensures text stays on one line */
    overflow: hidden; /* Hides any overflow */
    text-overflow: ellipsis; /* Shows ellipsis (...) if text overflows */
}

th.name-column {
    background-color: #333;  /* Background color for Name column */
}

th {
    background-color: #333;
}

.fade-in {
    opacity: 0; /* Initially hidden */
    animation: fadeIn 1s ease forwards; /* Animation for fading in */
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.image-cell {
    background-color: white;
    width: 140px;  /* Adjust width of image cell */
    height: 140px; /* Adjust height of image cell */
    text-align: center;
    vertical-align: middle;
    display: flex;
    justify-content: center;
    align-items: center;
}

.arrow-up::before {
    content: "↑";
    color: white;
    font-size: 30px;
    margin-left: 10px;
}

.arrow-down::before {
    content: "↓";
    color: white;
    font-size: 30px;
    margin-left: 10px;
}

</style>
"""

custom_button_style = """
<style>
/* Button styles */
.row-widget.stButton button {
    background-color: transparent !important;
    color: transparent !important;
    border: none !important;
    padding: 0;
    width: 150px;
    height: 50px;
    background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Hololive_triangles_logo.svg/1626px-Hololive_triangles_logo.svg.png');
    background-size: 30% 100%;
    background-repeat: no-repeat;
    background-position: center;
    position: absolute;
    top: -90px; /* Adjust top position */
    right: -250px; /* Adjust right position */
    width: 200px; /* Adjust width */
    height: 70px; /* Adjust height */
}

/* Select box styles */
.st-ae.st-af.st-ag.st-bb.st-ai.st-aj.st-bc.st-bd.st-b7 {
    background-color: white !important; /* Set background color */
    color: white !important; /* Set text color */
    border: none !important;
    border-radius: 100px !important;
    padding: 10px 10px !important;
    font-size: 10px !important;
    width: 800px !important; /* Adjust width */
}

.st-av.st-aw.st-ax.st-ay.st-bc.st-be.st-b7.st-b4.st-b5.st-bf.st-bg.st-bh.st-bi.st-bj.st-bk.st-bl.st-bm.st-bn.st-bo.st-b2.st-bp.st-bq.st-br.st-bs.st-bt.st-bu.st-bv {
    background-color: #5edbed !important; /* Set background color */
    color: white !important; /* Set text color */
    border: none !important;
    border-radius: 100px !important;
    padding: 10px 20px !important;
    font-size: 16px !important;
}

.st-bc.st-bd.st-bw.st-bx.st-by.st-b4.st-bz.st-c0.st-be.st-c1.st-c2.st-c3.st-c4 {
    background-color: #5edbed !important; /* Set background color */
    color: white !important; /* Set text color */
    border: none !important;
    border-radius: 100px !important;
    padding: 10px 20px !important;
    font-size: 16px !important;
}

/* Adjust text color and size for specific element */
.css-87mhkc.e1wqxbhn2 {
    color: black !important; /* Set text color */
    font-size: 20px !important; /* Adjust font size */
}

/* Adjust dropdown arrow color */
.st-cc.st-d2.st-bq.st-d3.st-d4.st-d5 path {
    fill: #4f9eed; /* Adjust arrow color */
}
</style>
"""

# Inject the CSS into the Streamlit app
st.markdown(table_style, unsafe_allow_html=True)
st.markdown(custom_button_style, unsafe_allow_html=True)

def is_birthday_close(actual_birthday, guessed_birthday):
    if not actual_birthday or not guessed_birthday:
        return False
    
    # Add the current year to the birthday strings
    current_year = datetime.now().year
    actual_birthday = f"{current_year}/{actual_birthday}"
    guessed_birthday = f"{current_year}/{guessed_birthday}"
    
    # Adjust format to match MM/DD/YYYY
    actual_date = datetime.strptime(actual_birthday, '%Y/%m/%d')
    guessed_date = datetime.strptime(guessed_birthday, '%Y/%m/%d')
    
    # Define threshold for "close"
    threshold_days = 7
    difference = abs(actual_date - guessed_date)
    
    return difference <= timedelta(days=threshold_days)

def render_ui():
    
    # Background image using CSS
    page_bg_img = """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Audiowide&display=swap');
    [data-testid="stAppViewContainer"] {
        background-image: url('https://wallpapercave.com/wp/wp11073401.jpg');
        background-size: cover;
    }
    
    [data-testid="stHeader"] {
        background-color: rgba(0,0,0,0);
    }
    
    [data-testid="stMarkdownContainer"] {
        text-align: center;  /* Center align text */
    }
    
    .big-title {
        font-size: 80px;  /* Adjust the font size as needed */
        color: #5edbed;  /* Change text color to white (#ffffff) */
        font-family: 'Audiowide', cursive; /* Use Audiowide font */
    }
    
    .css-1n76uvr.e1tzin5v0 {
    margin-top: -100px; /* Remove top margin */
    }
    </style>
    """
    
    st.markdown(page_bg_img, unsafe_allow_html=True)
    
    # Apply a CSS class to make the title bigger
    st.markdown('<h1 class="big-title">HoloGuesser</h1>', unsafe_allow_html=True)
    
    available_members = ["Select member"] + [name for name in all_members_name if name not in st.session_state.guesses]
    guess = st.selectbox("", available_members)

    button_placeholder = st.empty()  # Create an empty placeholder for the button

    if not st.session_state.end_condition:
        if button_placeholder.button("Submit", key="submit_button", help="Submit button"):
            if guess != "Select member":
                st.session_state.guesses.append(guess)
                if guess == st.session_state.random_member:
                    st.session_state.end_condition = True
                    button_placeholder.empty()  # Replace the button with an empty placeholder
                else:
                    st.experimental_rerun()  # Force re-run to update the selectbox options

    render_table()
    
def render_table():
    table_html = """
    <div class="table-container">
    <table>
        <tr>
            <th class="name-column">Member</th>
            <th>Debut Date</th>
            <th>Group</th>
            <th>Generation</th>
            <th>Branch</th>
            <th>Birthday</th>
            <th>Height</th>
        </tr>
    """

    random_member_data = data[st.session_state.random_member] if st.session_state.random_member else {}

    for guess_index, guess in enumerate(reversed(st.session_state.guesses)):
        member_data = data[guess] if guess in data else {}

        table_html += "<tr>"
        table_html += f'<td class="name-column image-cell fade-in" style="animation-delay: {guess_index * 0.2}s;"><img src="{member_data.get("ImageURL", "")}" style="max-width: 100%; max-height: 100%; object-fit: cover;"></td>'

        for attr in ['Debut_Date', 'Group', 'Generation', 'Branch', 'Birthday', 'Height']:
            guessed_value = member_data.get(attr, "")
            actual_value = random_member_data.get(attr, "")
            correct = guessed_value == actual_value

            class_name = "correct" if correct else "incorrect"
            background_color = "green" if correct else "red"

            # Check if attribute is Birthday and if it's close but incorrect
            if attr == 'Birthday' and is_birthday_close(actual_value, guessed_value) and not correct:
                background_color = "orange"

            # Check if attribute is Height and handle close heights
            elif attr == 'Height' and not correct:
                guessed_height = guessed_value.strip()
                actual_height = actual_value.strip()

                # Parse the guessed and actual heights
                guessed_height_cm = int(guessed_height.split('/')[0].strip()[:-2])
                actual_height_cm = int(actual_height.split('/')[0].strip()[:-2])

                # Calculate the height difference
                height_difference = guessed_height_cm - actual_height_cm

                # Determine arrow direction based on height difference
                if height_difference > 0:
                    arrow_html = '↓'  # Upward arrow
                elif height_difference < 0:
                    arrow_html = '↑'  # Downward arrow
                else:
                    arrow_html = ''  # No arrow if heights are equal

                # Format the displayed height with the arrow
                formatted_height = f"{guessed_height} <span style='font-size: 1.5em;'>{arrow_html}</span>"

                table_html += f'<td class="{class_name} fade-in" style="animation-delay: {guess_index * 0.2}s; background-color: {background_color};">{formatted_height}</td>'

            # Check if attribute is Debut_Date and handle arrow display
            elif attr == 'Debut_Date' and not correct:
                guessed_year = guessed_value  # Guessed year is already an integer
                actual_year = actual_value

                # Determine arrow direction based on debut year difference
                if guessed_year > actual_year:
                    arrow_html = '↓'  # Upward arrow
                elif guessed_year < actual_year:
                    arrow_html = '↑'  # Downward arrow
                else:
                    arrow_html = ''  # No arrow if debut years are equal

                # Format the displayed debut year with the arrow
                formatted_debut = f"{guessed_value} <span style='font-size: 1.5em;'>{arrow_html}</span>"

                table_html += f'<td class="{class_name} fade-in" style="animation-delay: {guess_index * 0.2}s; background-color: {background_color};">{formatted_debut}</td>'

            else:
                table_html += f'<td class="{class_name} fade-in" style="animation-delay: {guess_index * 0.2}s; background-color: {background_color};">{guessed_value}</td>'

        table_html += "</tr>"

    table_html += """
    </table>
    </div>
    """

    st.markdown(table_html, unsafe_allow_html=True)


# Main function
def main():
    render_ui()

    if st.session_state.end_condition:
        st.session_state.random_member = random.choice(key_pool)
        st.session_state.end_condition = False
        st.session_state.guesses = []

if __name__ == "__main__":
    main()

