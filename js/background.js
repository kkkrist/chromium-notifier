import { getConfig, getExtensionsInfo } from './utils.js'

const currentVersion = window.navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]

const main = async (...args) => {
  const now = new Date()
  console.debug(now.toISOString(), args)

  if (!navigator.onLine) return

  const config = await getConfig()

  const {
    arch,
    extensionsInfo,
    extensionsTrack,
    tag,
    timestamp,
    versions
  } = config

  console.debug('updating', config)

  chrome.browserAction.setBadgeText({ text: '' })

  const p = [
    fetch('https://chromium.woolyss.com/api/v4/?app=MTkxMDA5', {
      method: 'POST'
    }).then(res => res.json())
  ]

  if (extensionsTrack) {
    p.push(getExtensionsInfo(currentVersion))
  }

  Promise.all(p).then(
    ([versions, extensionsInfo]) => {
      chrome.storage.local.set({
        error: versions.error || null,
        extensionsInfo,
        timestamp: now.getTime(),
        versions: !versions.error ? versions : {}
      })
    },
    error => chrome.storage.local.set({ error: error.message })
  )
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    main()
  }

  if (reason === 'update' && localStorage.length > 0) {
    chrome.storage.local.set(
      {
        arch: localStorage.arch,
        extensionsInfo: JSON.parse(localStorage.extensionsInfo || null),
        extensionsTrack: localStorage.extensionsTrack === 'true',
        tag: localStorage.tag,
        timestamp: Number(localStorage.timestamp),
        versions: JSON.parse(localStorage.versions || null)
      },
      () => localStorage.clear()
    )
  }
})

chrome.storage.onChanged.addListener(async () => {
  const {
    arch,
    error,
    extensions,
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

chrome.alarms.onAlarm.addListener(main)
chrome.alarms.create('main', { periodInMinutes: 180 })

chrome.runtime.onStartup.addListener(main)
