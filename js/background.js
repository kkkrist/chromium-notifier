import {
  clearError,
  getConfig,
  getExtensionsInfo,
  trackError
} from './utils.js'

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

  await clearError()

  const p = [
    fetch('https://chromium.woolyss.com/api/v4/?app=MTkxMDA5', {
      method: 'POST'
    }).then(res => res.json())
  ]

  if (extensionsTrack) {
    p.push(getExtensionsInfo(currentVersion))
  }

  Promise.all(p).then(([versions, extensionsInfo]) => {
    const newState = {
      timestamp: now.getTime()
    }

    if (extensionsInfo) {
      newState.extensionsInfo = extensionsInfo || []
    }

    if (versions) {
      newState.error = versions.error || null
      newState.versions = !versions.error ? versions : {}
    }

    chrome.storage.local.set(newState)
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

  const current =
    versions &&
    arch &&
    versions[arch] &&
    versions[arch].find(v => v.tag === tag)

  const extensionsNew =
    extensions.length > 0 &&
    extensionsInfo &&
    !extensionsInfo.every(e =>
      extensions.find(({ version }) => version === e.version)
    )

  chrome.browserAction.setBadgeText({
    text:
      (current && currentVersion !== current.version) || extensionsNew
        ? 'New'
        : ''
  })

  if (error) {
    console.error(error)
    chrome.browserAction.setBadgeBackgroundColor({ color: [180, 0, 20, 255] })
    chrome.browserAction.setBadgeText({ text: 'Error!' })
  }
})

chrome.alarms.onAlarm.addListener(main)
chrome.alarms.create('main', { periodInMinutes: 180 })

chrome.runtime.onStartup.addListener(main)
