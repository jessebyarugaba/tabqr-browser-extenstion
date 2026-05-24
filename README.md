# TabQR — Instant Tab Sharing via QR

TabQR is a lightweight browser extension that instantly generates a QR code for the current browser tab.

Open the extension, scan the QR code with your phone, and continue browsing immediately.

No accounts. No syncing. No setup.

---

## Features

* Instant QR generation for the active tab
* Embedded website favicon inside QR codes
* WhatsApp sharing
* Copy link to clipboard
* Download QR as PNG
* Dark mode support
* Works in Chrome and Firefox
* Fully local — no backend or tracking

---

## Screenshots

<img src="./screenshots/tabqr screenshot.PNG" alt="TabQR Preview" />

---

## Installation (Development)

### Chrome / Edge (Chromium)

1. Clone the repository

```bash
git clone https://github.com/jessebyarugaba/tabqr-browser-extenstion.git
```

2. Open Chrome and go to:

```text
chrome://extensions
```

3. Enable **Developer Mode**

4. Click **Load unpacked**

5. Select the project folder

6. Pin the extension and click the icon to use TabQR

---

### Firefox

1. Clone the repository

```bash
git clone https://github.com/jessebyarugaba/tabqr-browser-extenstion.git
```

2. Open Firefox and go to:

```text
about:debugging#/runtime/this-firefox
```

3. Click **Load Temporary Add-on**

4. Select:

```text
manifest.json
```

5. The extension will now appear in Firefox

> Note: Temporary Firefox extensions are removed when Firefox closes.

---

## Project Structure

```text
tabqr/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── libs/
│   └── qrcode.min.js
├── icons/
└── screenshots/
```

---

## Permissions

TabQR uses minimal permissions:

* `activeTab`
* `tabs`
* `clipboardWrite`

No browsing data is collected or transmitted.

---

## Privacy

All QR generation happens locally inside the browser.

TabQR:

* does not track users
* does not use analytics
* does not send data to external servers

---

## Tech Stack

* Vanilla JavaScript
* Manifest V3
* QRCode.js
* Chrome Extensions API
* Firefox WebExtensions API

---

## Roadmap

Planned ideas:

* Multi-tab QR sharing
* Short URL generation
* Copy QR image
* Share tab groups
* Keyboard shortcuts
* Better mobile handoff workflows

---

## Contributing

Contributions, ideas, and feedback are welcome.

Feel free to open an issue or submit a pull request.

---

## Author

Created by Byarugaba Jesse

LinkedIn:
https://www.linkedin.com/in/byarugabajesse/

GitHub:
https://github.com/jessebyarugaba
