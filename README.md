# Personal Expense Tracker — Low-Cost iPhone PWA

This version is designed for one person and avoids Apple Developer fees and monthly backend subscriptions.

## What it does
- Add a receipt with the iPhone camera or photo library
- Add PDF receipts/invoices
- Store expenses locally on the iPhone using IndexedDB
- Extract text from receipt images with Tesseract.js in the browser
- Extract basic fields such as supplier, date, subtotal, tax, and total
- Automatically categorize using local supplier/category rules
- Review and edit every expense
- Search/filter expenses
- Monthly/category totals
- Export CSV and JSON backups
- Works as a Home Screen web app (PWA)

## Cost
The app itself is free to run. It does not require Apple Developer membership or a monthly database subscription.

Important: because this is local-first, your receipt data lives in the browser on the device. Use the JSON backup regularly. A future version can add optional cloud backup.

## How to run
A web app must be served over HTTPS (or localhost) for camera/PWA features.

### Easiest local test
1. Install Python 3.
2. Open a terminal in this folder.
3. Run:
   `python -m http.server 8000`
4. On the same computer open `http://localhost:8000`.

For iPhone use, the app needs to be hosted on an HTTPS address. A simple free static host such as GitHub Pages can host these files. No Apple Developer account is required.

## iPhone
Open the HTTPS site in Safari, use Share -> Add to Home Screen, then launch it like an app.

## AI
This version intentionally does NOT put an OpenAI API key into the browser. That would expose the key.

The first version uses local OCR + local rules, keeping the recurring cost at $0. An optional secure AI backend can be added later if you want more accurate extraction/categorization.

## Backup
Use Export -> JSON Backup regularly. JSON contains the expense data and receipt image data.
