# Chromium Update Notifications

This extension will periodically check [Woolyss' website](https://chromium.woolyss.com/) and display a "New" icon badge once the version found for the selected platform/tag is different to the one you're currently using.

As of version 1.1.0, version tracking and managing of all installed extensions is also supported (those which support it). Just be aware that to make this work, a list of your installed extensions will need to be periodically transmitted to the [chromium-extension-service](https://github.com/kkkrist/chromium-extension-service) (this will soon be optional).

<img height="639" src="https://raw.githubusercontent.com/kkkrist/chromium-notifier/master/img/screenshot.webp" width="375" />

## Installation

1. Review source code
2. Clone repository or download a [release](https://github.com/kkkrist/chromium-notifier/releases) and unpack into a local folder
3. Navigate to [chrome://extensions](chrome://extensions)
4. Enable developer mode
5. Drag-and-drop the folder into the browser window or click on "Load unpacked extension" and select folder

## Configuration

Click on the extension's icon, select platform (mac, win32 or win64) and tag – i.e. the Chromium version you're using and enable tracking of extension updates if desired.

If your Chromium build contains [this patch](https://github.com/Eloston/ungoogled-chromium/blob/master/patches/extra/ungoogled-chromium/add-flag-to-configure-extension-downloading.patch), you may set the flag `chrome://flags/#extension-mime-request-handling` to "Always prompt for install" to enable 1-click installation of extension updates.
