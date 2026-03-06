import json
import os

path = 'd:/Hackemined/Prototype-Zero-v2/output/dashboard_data.json'
container_id = '76991507'

if os.path.exists(path):
    with open(path, 'r') as f:
        data = json.load(f)
    
    found = False
    for p in data.get('predictions', []):
        if str(p.get('container_id')) == container_id:
            p['Image_Analysis'] = {
                'condition': 'Faulty',
                'image_count': 1,
                'timestamp': '2026-03-07T03:16:00'
            }
            found = True
            break
            
    if found:
        with open(path, 'w') as f:
            json.dump(data, f, indent=4)
        print("Successfully updated container 76991507")
    else:
        print(f"Container {container_id} not found in data")
else:
    print(f"File {path} not found")
