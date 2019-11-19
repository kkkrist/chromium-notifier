import { getConfig, getExtensionsInfo, getSelf } from './utils.js'

const trackError = async e => {
  console.error(e.error || e.reason)

  try {
    const self = await getSelf()
    const { errorTracking } = await getConfig()

    chrome.storage.local.set({
      error: (e.error && e.error.message) || e.reason
    })

    if (errorTracking || errorTracking === undefined) {
      fetch('https://chrome-extension-service.kkkrist.now.sh/api/errorlogs', {
        method: 'POST',
        body: JSON.stringify({
          error: JSON.stringify(
            e.error || e.reason,
            Object.getOwnPropertyNames(e.error || e.reason)
          ),
          pluginVersion: self && self.version
        }),
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error(`Error while error tracking, d'oh!`, error)
  }
}

window.onerror = e => {
  trackError(e)
  return false
}

window.onunhandledrejection = e => {
  trackError(e)
  return false
}

const currentVersion = navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]

const main = async (...args) => {
  const config = await getConfig()
  const now = new Date()

  console.debug(now.toISOString(), args)

  if (!navigator.onLine) {
    return console.debug(`We're not online, aborting.`, config)
  } else {
    console.debug('updating', config)
  }

  const {
    arch,
    extensionsInfo,
    extensionsTrack,
    tag,
    timestamp,
    versions
  } = config

  chrome.browserAction.setBadgeText({ text: '' })

  const p = [
    fetch('https://chromium.woolyss.com/api/v4/?app=MTkxMDA5', {
      method: 'POST'
    }).then(res => res.json())
  ]

  if (extensionsTrack) {
    p.push(getExtensionsInfo(currentVersion))
  }

  Promise.all(p).then(([versions, extensionsInfo]) => {
    chrome.storage.local.set({
      error: versions.error || null,
      extensionsInfo,
      timestamp: now.getTime(),
      versions: !versions.error ? versions : {}
    })
  })
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
    tag,
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
