import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build  
from google.auth.transport.requests import Request
from django.conf import settings 

def send_gmail(to_email, subject, body):
    # 1. Get keys
    refresh_token = settings.GOOGLE_REFRESH_TOKEN
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET

    # 2. Authenticate
    creds = Credentials(
        None, 
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret
    )

    try:
        creds.refresh(Request())
        service = build('gmail', 'v1', credentials=creds)
        
        message = MIMEText(body)
        message['to'] = to_email
        message['subject'] = subject
        
        raw_msg = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        service.users().messages().send(
            userId='me', 
            body={'raw': raw_msg}
        ).execute()
        
        print(f"Email sent to {to_email}")
        
    except Exception as e:
        print(f"Gmail API Error: {e}")