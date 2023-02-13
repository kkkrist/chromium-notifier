const parser = new DOMParser()

const addIfNew = (arr = [], item) =>
  item === undefined ? arr : [...new Set([...arr]).add(item)]

export const clearError = () =>
  new Promise(resolve =>
    chrome.browserAction.setBadgeText({ text: '' }, () =>
      chrome.browserAction.setBadgeBackgroundColor(
        { color: [0, 150, 180, 255] },
        () => chrome.storage.local.set({ error: null }, () => resolve())
      )
    )
  )

export const getSelf = () =>
  new Promise(resolve => chrome.management.get(chrome.runtime.id, resolve))

const fetchExtensionInfo = async (updateUrl, ids, prodversion) => {
  const x = ids.map(id => `x=${encodeURIComponent(`id=${id}&uc`)}`).join('&')

  const txt = await fetch(
    `${updateUrl}?acceptformat=crx2,crx3&prodversion=${prodversion}&${x}`
  ).then(req => req.text())

  const xml = parser.parseFromString(txt, 'text/xml')

  return Array.from(xml.querySelectorAll('app')).map(el => {
    const updatecheck = el.querySelector('updatecheck')

    const info = {
      id: el.getAttribute('appid'),
      prodversion,
      timestamp: new Date().getTime(),
      updateUrl
    }

    return updatecheck
      ? {
          ...info,
          ...updatecheck.getAttributeNames().reduce(
            (acc, attr) => ({
              ...acc,
              [attr]: updatecheck.getAttribute(attr)
            }),
            {}
          )
        }
      : info
  })
}

const fetchExtensionsInfo = async (extensions, prodversion) => {
  const jobs = extensions.reduce((acc, { id, updateUrl }) => {
    if (updateUrl) {
      acc[updateUrl] = addIfNew(acc[updateUrl], id)
    }
    return acc
  }, {})

  const results = await Promise.allSettled(
    Object.keys(jobs).map(
      updateUrl =>
      updateUrl &&
      fetchExtensionInfo(updateUrl, jobs[updateUrl], prodversion)
    )
  )

  return results
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value }) => value)
    .flat()
}

export const getUserAgentData = async () => {
  if (navigator.userAgentData) {
    const data = await navigator.userAgentData.getHighEntropyValues([
      'platform',
      'uaFullVersion'
    ])
    return data
  }

  const uaFullVersion = navigator.userAgent.match(
    /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
  )[1]

  const platform = navigator.userAgent.includes('Macintosh')
    ? 'macOS'
    : navigator.userAgent.includes('Win64')
    ? 'Windows'
    : navigator.userAgent.includes('Windows')
    ? 'Windows'
    : undefined

  return { platform, uaFullVersion }
}

export const getConfig = () =>
  new Promise(resolve =>
    getUserAgentData().then(({ platform, uaFullVersion }) => {
      chrome.management.getAll(extensions =>
        chrome.storage.local.get(store => {
          if (!store.arch) {
            store.arch = platform.includes('Macintosh')
              ? 'mac'
              : platform.includes('Win64')
              ? 'win64'
              : undefined
          }
          getSelf().then(self =>
            resolve({
              ...store,
              currentVersion: uaFullVersion,
              extensions,
              self
            })
          )
        })
      )
    })
  )

export const getExtensionsInfo = async currentVersion => {
  await clearError()
  const extensions = await new Promise(resolve =>
    chrome.management.getAll(exts =>
      resolve(
        exts.map(ext => ({
          id: ext.id,
          updateUrl: ext.updateUrl
        }))
      )
    )
  )

  return await fetchExtensionsInfo(extensions, currentVersion)
}

export const matchExtension = ext => ({ id, updateUrl, version }) => {
  if (!version) {
    return false
  }

  if (id === ext.id) {
    return true
  }

  if (
    updateUrl !== 'https://clients2.google.com/service/update2/crx' &&
    updateUrl === ext.updateUrl
  ) {
    return true
  }
}
