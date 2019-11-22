const parser = new DOMParser()

const addIfNew = (arr = [], item) =>
  item === undefined ? arr : [...new Set([...arr]).add(item)]

export const getSelf = () =>
  new Promise(resolve => chrome.management.get(chrome.runtime.id, resolve))

const fetchExtensionInfo = async (updateUrl, ids, prodversion) => {
  const x = ids.map(id => `x=${encodeURIComponent(`id=${id}&uc`)}`)

  const txt = await fetch(
    `${updateUrl}?${x.join('&')}&prodversion=${prodversion}`
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
  const { useProxy } = await getConfig()
  const self = await getSelf()

  if (useProxy || useProxy === undefined) {
    const res = await fetch(
      `https://chrome-extension-service.kkkrist.now.sh/api?pluginVersion=${self &&
        self.version}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prodversion,
          extensions
        })
      }
    )

    return await res.json()
  } else {
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
}

export const getConfig = () =>
  new Promise(resolve =>
    chrome.management.getAll(extensions =>
      chrome.storage.local.get(store => {
        if (!store.arch) {
          store.arch = navigator.userAgent.includes('Macintosh')
            ? 'mac'
            : navigator.userAgent.includes('Win64')
            ? 'win64'
            : navigator.userAgent.includes('Windows')
            ? 'win32'
            : undefined
        }
        getSelf().then(self => resolve({ ...store, self, extensions }))
      })
    )
  )

export const getExtensionsInfo = currentVersion =>
  new Promise(resolve =>
    chrome.management.getAll(exts =>
      resolve(
        exts.map(ext => ({
          id: ext.id,
          updateUrl: ext.updateUrl
        }))
      )
    )
  ).then(extensions => fetchExtensionsInfo(extensions, currentVersion))

export const trackError = async e => {
  console.error(e)
  const message =
    (e.reason && e.reason.toString()) || e.stack || e.message || 'Unknown'

  try {
    const self = await getSelf()
    const { errorTracking } = await getConfig()

    chrome.storage.local.set({
      error: message
    })

    if (errorTracking || errorTracking === undefined) {
      fetch('https://chrome-extension-service.kkkrist.now.sh/api/errorlogs', {
        method: 'POST',
        body: JSON.stringify({
          error: message,
          pluginVersion: self && self.version
        }),
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error(`Error while error tracking, d'oh!`, error)
  }
}
