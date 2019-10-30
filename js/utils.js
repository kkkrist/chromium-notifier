export const getConfig = () =>
  new Promise(resolve =>
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
      resolve(store)
    })
  )

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

