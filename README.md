# Study Phrase Advisor - Google Chrome Plugin

## Screenshot mode (simulated data, no API)

The extension now supports a built-in mock mode for documentation screenshots.

- Mock mode is controlled by USE_MOCK_DATA in js/common.js.
- Default value is true, so no backend/API connection is required.

### Run in mock mode

1. Open Google Chrome and go to:
	chrome://extensions/
2. Enable Developer mode.
3. Click Load unpacked and select this project folder.
4. Open the extension popup.
5. If the extension was already loaded, click the Reload button on the extension card and open the popup again.

What you will see:
- Registration list is populated from simulated study groups.
- Connect/Create flows work with mock registration codes.
- Suggestions, Activity, Resources, and Notifications are filled with realistic simulated results.
- No network requests are made to the API endpoints.

### Switch back to real API

1. Open js/common.js.
2. Change USE_MOCK_DATA from true to false.
3. Reload the extension from chrome://extensions/.

### Run popup in a normal browser tab (via web server)

This is useful for documentation screenshots. It runs the popup UI only (not the full extension background behavior).

1. From the project folder, start a simple static server:
	python3 -m http.server 8000
2. Open this URL in your browser:
	http://localhost:8000/popup.html

Notes:
- This mode works with mock data (USE_MOCK_DATA=true).
- Extension-only features (for example background page tracking hooks) are not active in this mode.

## How to install

1. Clone repository using 
```
git https://github.com/ozammitieee/study_phrase_advisor.git
```

2. In Google Chrome type
```
chrome://extensions/
```

3. Ensure that ***Developer mode*** located on top right of your Google Chrome is switched on.
4. Click on ***Load unpacked*** and navigate to the clone folder.
5. A new extension should be visible in your browser.
6. Once you open the extension, select a study group and click ***Create***
7. The system will generate a unique identifier. Click ***Connect*** to get started.

Note: It is recommended that after installing the application the browser is restarted and s couple of 
Google searches are done before opening the extension again.