# Google Sheets Setup

To save audit responses to a Google Sheet:

## 1. Create a Google Sheet
Add these column headers in row 1:
```
Timestamp | First Name | Email | Business Type | Pain Points | Team Size | Status
```

## 2. Create a Google Apps Script
- Open your Sheet
- Go to **Extensions → Apps Script**
- Paste this code:

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp,
    data.firstName,
    data.email,
    data.businessType,
    data.painPoints,
    data.teamSize,
    data.status
  ]);
  return ContentService.createTextOutput("OK");
}
```

## 3. Deploy as Web App
- Click **Deploy → New Deployment**
- Type: **Web App**
- Execute as: **Me**
- Who has access: **Anyone**
- Copy the deployment URL

## 4. Add URL to analysis.js
```js
const SHEETS_URL = "YOUR_DEPLOYMENT_URL_HERE";
```
