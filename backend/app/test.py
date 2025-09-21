# import requests

# # Your FastAPI server URL
# url = "http://127.0.0.1:8000/upload"  # change if your server runs elsewhere

# # File(s) to upload
# files = {
#     "files": ("../data/Akhil_resume.pdf", open("../data/Akhil_resume.pdf", "rb"), "application/pdf")
#     # If you want to test with a text file instead, uncomment below:
#     # "files": ("sample.txt", open("sample.txt", "rb"), "text/plain")
# }

# # Send POST request
# response = requests.post(url, files=files)

# # Print response
# print("Status Code:", response.status_code)
# try:
#     print("Response JSON:", response.json())
# except Exception:
#     print("Response Text:", response.text)


import fastapi