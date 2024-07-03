import pandas as pd
# Create a DataFrame from the collected data
df = pd.read_csv("hololive_members_clean.csv")

# Convert the DataFrame to a dictionary
result_dict = {}
for index, row in df.iterrows():
    # Use the 'Name' as the key and the rest of the columns as the nested dictionary
    key = row['Name']
    value = row.drop('Name').to_dict()
    result_dict[key] = value

# Print the resulting dictionary
print(result_dict)

# Save the dictionary to a JSON file for easy inspection
import json
with open('hololive_members.json', 'w') as f:
    json.dump(result_dict, f, indent=4)

print('Data saved to hololive_members.csv and hololive_members.json')


