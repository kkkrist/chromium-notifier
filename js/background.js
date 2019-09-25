const currentVersion = window.navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]

const getMetaInfo = (div, arch, tag) => {
  const id = `#${arch}-${tag}`
  let textContent = div.querySelector(id).querySelector('details summary')
    .textContent

  if (!textContent.match(/\([0-9]+\)/)) {
    textContent = textContent.replace(/ • /, ' () • ')
  }

  const info = textContent
    .split(' (')
    .map(a => a.split(/\) . /))
    .flat()
    .map(a => a.split(' • '))
    .flat()

  return {
    build: info[1],
    date: new Date(info[2]).getTime(),
    link: div.querySelector(id).querySelector('b a, strong a').href,
    tag,
    version: info[0].trimStart().trimEnd()
  }
}

const getVersions = div =>
  Array.from(div.querySelectorAll('.chromium'))
    .filter(a => a.id.match(/^(mac|win)/))
    .reduce((acc, el) => {
      const arr = el.id.split('-')
      const arch = arr.shift()
      const item = getMetaInfo(div, arch, arr.join('-'))
      if (acc[arch]) {
        acc[arch].push(item)
      } else {
        acc[arch] = [item]
      }
      return acc
    }, {})

const getWrapper = () =>
  fetch('https://chromium.woolyss.com/')
    .then(res => res.text())
    .then(text => {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = text
        .replace(/^.*<body>/, '')
        .replace(/<\/body>.*$/, '')
        .replace(/<script.*<\/script>/g, '')
      return wrapper
    })
    .catch(handleError)

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
    !extensionsInfo ||
    !versions ||
    timestamp + 3 * 60 * 60 * 1000 < new Date().getTime()
  ) {
    const p = [getWrapper()]
    let extensions = []

    if (extensionsTrack) {
      p.push(
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
      )
    }

    Promise.all(p).then(([div, extensionsInfo]) => {
      const extensionsNew = !extensionsInfo.every(e =>
        extensions.find(({ version }) => version === e.version)
      )
      delete localStorage.error
      localStorage.extensionsInfo = JSON.stringify(extensionsInfo)
      localStorage.extensionsNew = extensionsNew
      localStorage.timestamp = new Date().getTime()
      localStorage.versions = JSON.stringify(getVersions(div))

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
