# Chromium Update Notifications

This extension will periodically check [Woolyss' website](https://chromium.woolyss.com/) and display a "New" icon badge once the version found for the selected platform/tag is different to the one you're currently using. Nothing more, nothing less.

As of version 1.1.0, tracking and 1-click-installing of updates for all installed extensions is also supported (those which support auto-updating). Just be aware that to make this work, a list of your installed extensions will need to be periodically transmitted to the [chromium-extension-service](https://github.com/kkkrist/chromium-extension-service).

<img height="586" src="https://raw.githubusercontent.com/kkkrist/chromium-notifier/master/img/screenshot.webp" width="372" />

## Installation

1. Review source code
2. Clone repository or download a [release](https://github.com/kkkrist/chromium-notifier/releases) and unpack into a local folder
3. Navigate to [chrome://extensions](chrome://extensions)
4. Enable developer mode
4. Drag-and-drop the folder into the browser window or click on "Load unpacked extension" and select folder

## Configuration

Click on the extension's icon, select platform (mac, win32 or win64) and tag – i.e. the Chromium version you're using and enable tracking of extension updates if desired.

## Extension developers

If you want to have your GitHub-hosted Chromium extension tracked via this plugin, follow these steps:

1. Include `github:<user>/<repo>` as `update_url` in your `manifest.json`.
2. Make sure to tag your versions. E.g., if the current `version` specified in your `manifest.json` equals to `1.2.3`, there needs to be a tag named `v1.2.3` in your repo to make the download links work.
