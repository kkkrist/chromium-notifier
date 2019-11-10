# Chromium Update Notifications

This extension will periodically check [Woolyss](https://chromium.woolyss.com/) and display a "New" icon badge once the version found for the selected platform/tag is different to the one you're currently using.

Additionally it can track updates for and manage all installed extensions (those supporting it). Just be aware that to make this work, a list of your installed extensions will periodically be transmitted to the [chromium-extension-service](https://github.com/kkkrist/chromium-extension-service) (this is soon going to be optional, see [#16](https://github.com/kkkrist/chromium-notifier/issues/16)).

<img height="639" src="https://raw.githubusercontent.com/kkkrist/chromium-notifier/master/img/screenshot.webp" width="375" />

## Installation

1. Review source code
2. Download [the .crx file from latest release](https://github.com/kkkrist/chromium-notifier/releases/latest/download/chromium-notifier.crx)
3. Navigate to `chrome://extensions`
4. Drag-and-drop the .crx file into the browser window

### Installing via "Load unpacked extension"

If it's not possible to enable the extension and a warning tells you "This extension is not listed in the Chrome Web Store and may have been added without your knowledge", try the following:

1. Download and unpack the source code from [the latest release](https://github.com/kkkrist/chromium-notifier/releases/latest) or git-clone the master branch of the repository into a local folder
2. Navigate to `chrome://extensions`
3. Enable developer mode
4. Click on "Load unpacked extension" and select folder

Please note that it's not possible to update via "Load unpacked extension". If you try, the new version will be installed as a separate and new extension. If you've cloned the repository however, you can just pull the new release tag and click on the reload button under `chrome://extensions` to update seemlessly.

I plan to list this extension in the Chrome Web Store soon to get around this issue (see [#16](https://github.com/kkkrist/chromium-notifier/issues/16)))

## Configuration

Click on the extension's icon, select platform (mac, win32 or win64) and tag – i.e. the Chromium version you're using and enable tracking of extension updates if desired.

If your Chromium build contains [this patch](https://github.com/Eloston/ungoogled-chromium/blob/master/patches/extra/ungoogled-chromium/add-flag-to-configure-extension-downloading.patch), you may set the flag `chrome://flags/#extension-mime-request-handling` to "Always prompt for install" to enable 1-click installation of extension updates.
