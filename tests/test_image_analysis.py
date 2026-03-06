import requests
import os

def test_image_analysis():
    url = "http://localhost:8000/analyze-container-image"
    container_id = "76991507" 
    
    # This script assumes you have a test image named 'container_76991507.jpg' 
    # Or common 'test.jpg' in the directory.
    image_path = 'test.jpg'
    
    if not os.path.exists(image_path):
        print(f"Please place an image at {image_path} to run the test.")
        return

    files = [
        ('files', (image_path, open(image_path, 'rb'), 'image/jpeg'))
    ]
    
    params = {'container_id': container_id}
    # Note: Replace with a valid token from your browser's localStorage if auth is enabled
    headers = {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' 
    }
    
    print(f"Testing analysis for Container: {container_id}...")
    # response = requests.post(url, params=params, files=files, headers=headers)
    # print(response.json())

if __name__ == "__main__":
    print("Verification script created. Requires active server and valid auth token.")
