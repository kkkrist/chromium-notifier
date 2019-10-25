const currentVersion = window.navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]

let extensions = []

export const getConfig = () =>
  new Promise(resolve => chrome.storage.local.get(resolve))

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

const main = async () => {
  const {
    arch,
    extensionsInfo,
    extensionsTrack,
    tag,
    timestamp,
    versions
  } = await getConfig()

  if (
    (extensionsTrack && !extensionsInfo) ||
    !versions ||
    timestamp + 3 * 60 * 60 * 1000 < new Date().getTime()
  ) {
    chrome.browserAction.setBadgeText({ text: '' })

    const p = [
      fetch('https://chromium.woolyss.com/api/v4/?app=MTkxMDA5', {
        method: 'POST'
      }).then(res => res.json())
    ]

    if (extensionsTrack) {
      p.push(getExtensionsInfo())
    }

    Promise.all(p).then(
      ([versions, extensionsInfo]) => {
        chrome.storage.local.set({
          error: versions.error || null,
          extensionsInfo,
          timestamp: new Date().getTime(),
          versions: !versions.error ? versions : {}
        })
      },
      error => chrome.storage.local.set({ error: error.message })
    )
  }
}

const runMigrations = () =>
  new Promise(resolve => {
    if (localStorage.length > 0) {
      chrome.storage.local.set(
        {
          arch: localStorage.arch,
          extensionsInfo: JSON.parse(localStorage.extensionsInfo || null),
          extensionsTrack: localStorage.extensionsTrack === 'true',
          tag: localStorage.tag,
          timestamp: Number(localStorage.timestamp),
          versions: JSON.parse(localStorage.versions || null)
        },
        () => {
          localStorage.clear()
          resolve()
        }
      )
    } else {
      resolve()
    }
  })

runMigrations().then(main)
setInterval(main, 30 * 60 * 1000)

chrome.storage.onChanged.addListener(async () => {
  const {
    arch,
    error,
    extensionsInfo = [],
    extensionsTrack,
    tag,
    timestamp,
    versions
  } = await getConfig()

  const current = versions && arch && versions[arch].find(v => v.tag === tag)

  const extensionsNew =
    extensions.length > 0 &&
    !extensionsInfo.every(e =>
      extensions.find(({ version }) => version === e.version)
    )

  chrome.browserAction.setBadgeBackgroundColor({
    color: [0, 150, 180, 255]
  })

  if ((current && currentVersion !== current.version) || extensionsNew) {
    chrome.browserAction.setBadgeText({ text: 'New' })
  } else {
    chrome.browserAction.setBadgeText({ text: '' })
  }

  if (error) {
    console.error(error)
    chrome.browserAction.setBadgeBackgroundColor({ color: [180, 0, 20, 255] })
    chrome.browserAction.setBadgeText({ text: 'Error!' })
  }
})

chrome.windows.onFocusChanged.addListener(win => win > -1 && main())
