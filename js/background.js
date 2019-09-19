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
  localStorage.setItem('error', e.message)
  chrome.browserAction.setBadgeBackgroundColor({ color: [180, 0, 20, 255] });
  chrome.browserAction.setBadgeText({ text: 'Error!' })
}

const main = () => {
  const arch = localStorage.getItem('arch')
  const tag = localStorage.getItem('tag')
  const timestamp = Number(localStorage.getItem('timestamp'))
  const versions = JSON.parse(localStorage.getItem('versions'))
  const current = versions && arch && versions[arch].find(v => v.tag === tag)

  if (!versions || timestamp + 3 * 60 * 60 * 1000 < new Date().getTime()) {
    getWrapper().then(div => {
      const newVersions = getVersions(div)
      const currentVersion = window.navigator.userAgent.match(
        /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
      )[1]

      localStorage.removeItem('error')
      localStorage.setItem('timestamp', new Date().getTime())
      localStorage.setItem('versions', JSON.stringify(newVersions))


      if (current && currentVersion !== current.version) {
        chrome.browserAction.setBadgeBackgroundColor({ color: [0, 150, 180, 255] })
        chrome.browserAction.setBadgeText({ text: 'New' })
      }
    }, handleError)
  }
}

main()
setInterval(main, 30 * 60 * 1000)
