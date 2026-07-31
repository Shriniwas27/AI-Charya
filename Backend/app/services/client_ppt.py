from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def create_presentation(title):
    SCOPES = [
        'https://www.googleapis.com/auth/presentations',
        'https://www.googleapis.com/auth/drive'  # Needed for permissions
    ]

    flow = InstalledAppFlow.from_client_secrets_file(
        '/home/shriniwas/hackathon/client_secret.json'
, SCOPES
    )

    creds = flow.run_local_server(port=0)

    slides_service = build('slides', 'v1', credentials=creds)

    body = {'title': title}

    presentation = slides_service.presentations().create(body=body).execute()

    presentation_id = presentation.get('presentationId')

    print(f"✅ Created presentation with ID: {presentation_id}")
    print(f"🔗 https://docs.google.com/presentation/d/{presentation_id}/edit")

    return presentation_id, creds

def make_publicly_viewable(presentation_id, creds):
    try:
        drive_service = build('drive', 'v3', credentials=creds)

        # Set permissions to "anyone with the link can view"
        body = {
            'role': 'writer',
            'type': 'anyone'
        }

        drive_service.permissions().create(
            fileId=presentation_id,
            body=body
        ).execute()

        print(f"🔓 Presentation {presentation_id} is now publicly editable")

    except HttpError as error:
        print(f"❌ An error occurred: {error}")

if __name__ == "__main__":
    title = "Shriniwas's OAuth Slides"
    presentation_id, creds = create_presentation(title)
    make_publicly_viewable(presentation_id, creds)