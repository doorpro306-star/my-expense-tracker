# Gmail + Google Drive — one-time setup
1. Create a Google Cloud project.
2. Enable Gmail API, Google Drive API, and Google Picker API.
3. Configure Google Auth Platform / OAuth consent for your own account.
4. Create OAuth 2.0 Client ID → Web application.
5. Add Authorized JavaScript origin: https://YOUR-GITHUB-USERNAME.github.io
6. Create an API key; restrict it to your GitHub Pages website and these APIs.
7. Copy the Google Cloud project number.
8. Edit config.js and replace the Client ID, API key, and project number placeholders.
9. Upload/commit all files to GitHub Pages.

Gmail requests gmail.readonly to find/read receipt attachments.
Drive requests drive.file and uses Google Picker so you explicitly select files.
Do not add a Google client secret. Do not upload receipts/backups to GitHub.
