const parser = new DOMParser()

const addIfNew = (arr = [], item) =>
  item === undefined ? arr : [...new Set([...arr]).add(item)]

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

  if (useProxy || useProxy === undefined) {
    const res = await fetch(
      'https://chrome-extension-service.kkkrist.now.sh/api',
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

    const data = await Promise.all(
      Object.keys(jobs).map(
        updateUrl =>
          updateUrl &&
          fetchExtensionInfo(updateUrl, jobs[updateUrl], prodversion)
      )
    )

    return data.flat()
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
        resolve({ ...store, extensions })
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
