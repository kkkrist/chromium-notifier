const currentVersion = window.navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]

let extensions = []

export const getExtensionsInfo = () =>
  new Promise(resolve =>
    chrome.management.getAll(exts =>
      resolve(
        (extensions = exts).map(ext => ({
          id: ext.id,
          updateUrl: ext.updateUrl
        }))
      )
    )
  ).then(extensions =>
    fetch('https://chrome-extension-service.kkkrist.now.sh/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prodversion: currentVersion,
        extensions
      })
    }).then(res => res.json())
  )

const handleError = e => {
  console.error(e)
  localStorage.error = e.message
  chrome.browserAction.setBadgeBackgroundColor({ color: [180, 0, 20, 255] })
  chrome.browserAction.setBadgeText({ text: 'Error!' })
}

const main = () => {
  const arch = localStorage.arch
  const extensionsInfo = JSON.parse(localStorage.extensionsInfo || null)
  const extensionsTrack = localStorage.extensionsTrack === 'true'
  const tag = localStorage.tag
  const timestamp = Number(localStorage.timestamp)
  const versions = JSON.parse(localStorage.versions || null)

  const current = versions && arch && versions[arch].find(v => v.tag === tag)

  if (
    (extensionsTrack && !extensionsInfo) ||
    !versions ||
    timestamp + 3 * 60 * 60 * 1000 < new Date().getTime()
  ) {
    const p = [
      fetch('https://chromium.woolyss.com/api/v4/?app=MTkxMDA5').then(res =>
        res.json()
      )
    ]

    if (extensionsTrack) {
      p.push(getExtensionsInfo())
    }

    Promise.all(p).then(([versions, extensionsInfo]) => {
      const extensionsNew =
        extensionsInfo &&
        !extensionsInfo.every(e =>
          extensions.find(({ version }) => version === e.version)
        )
      delete localStorage.error
      localStorage.extensionsInfo = JSON.stringify(extensionsInfo || null)
      localStorage.timestamp = new Date().getTime()
      localStorage.versions = JSON.stringify(versions)

      if ((current && currentVersion !== current.version) || extensionsNew) {
        chrome.browserAction.setBadgeBackgroundColor({
          color: [0, 150, 180, 255]
        })
        chrome.browserAction.setBadgeText({ text: 'New' })
      }
    }, handleError)
  }
}

main()
setInterval(main, 30 * 60 * 1000)
chrome.windows.onFocusChanged.addListener(win => win > -1 && main())
