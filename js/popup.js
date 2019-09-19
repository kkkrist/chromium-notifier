import { h, app } from './vendor/hyperapp-2.0.1.js'

chrome.browserAction.setBadgeText({ text: '' })
chrome.browserAction.setBadgeBackgroundColor({ color: [0, 150, 180, 255] })

const arch = localStorage.getItem('arch')
const currentVersion = window.navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]
const error = localStorage.getItem('error')
const selectStyle = {
  display: 'block',
  height: '2em',
  marginBottom: '0.5rem',
  width: '100%'
}
const tag = localStorage.getItem('tag')
const timestamp = Number(localStorage.getItem('timestamp'))
const versions = JSON.parse(localStorage.getItem('versions'))

const getMeta = state => {
  const current =
    state.arch && versions[state.arch].find(({ tag }) => tag === state.tag)
  return current
    ? [
        h('ul', { style: { listStyleType: 'none', paddingLeft: 0 } }, [
          h('li', {}, [
            h('span', {}, 'Latest: '),
            h('a', { href: current.link, target: '_blank' }, current.version)
          ]),

          h(
            'li',
            {},
            `Build: ${current.build} (${new Date(
              current.date
            ).toLocaleDateString()})`
          ),

          h(
            'li',
            {
              style: {
                color: currentVersion !== current.version ? 'red' : undefined,
                marginTop: '0.5em'
              }
            },
            [
              h('span', {}, `Yours: ${currentVersion} `),
              h('span', {}, currentVersion !== current.version ? '⚠️' : '✅')
            ]
          )
        ])
      ]
    : []
}

app({
  init: { arch, tag },
  view: state =>
    h('div', {}, [
      h(
        'h1',
        { style: { fontSize: '1.2em', margin: 0 } },
        'Chromium Update Notifications'
      ),

      h('p', { style: { marginTop: 0 } }, [
        h('span', {}, 'based on '),
        h(
          'a',
          { href: 'https://chromium.woolyss.com/', target: '_blank' },
          'Woolyss'
        )
      ]),

      h('label', {}, [
        h('span', {}, 'Platform'),
        h(
          'select',
          {
            disabled: !versions,
            onChange: (state, e) => {
              localStorage.setItem('arch', e.target.value)
              localStorage.removeItem('tag')
              chrome.browserAction.setBadgeText({ text: '' })
              return {
                ...state,
                arch: e.target.value,
                tag: undefined
              }
            },
            style: selectStyle
          },
          [
            h(
              'option',
              { disabled: state.arch, value: '' },
              'Choose platform…'
            ),
            ...Object.keys(versions || {}).map(arch =>
              h(
                'option',
                { selected: arch === state.arch },
                arch
              )
            )
          ]
        )
      ]),

      h('label', {}, [
        h('span', {}, 'Tag'),
        h(
          'select',
          {
            disabled: !state.arch,
            onChange: (state, e) => {
              localStorage.setItem('tag', e.target.value)
              const current =
                state.arch &&
                versions[state.arch].find(({ tag }) => tag === e.target.value)

              if (current && current.version !== currentVersion) {
                chrome.browserAction.setBadgeText({ text: 'New' })
              } else {
                chrome.browserAction.setBadgeText({ text: '' })
              }

              return {
                ...state,
                tag: e.target.value
              }
            },
            style: selectStyle
          },
          [
            h('option', { disabled: state.tag, value: '' }, 'Choose tag…'),
            ...(state.arch
              ? versions[state.arch].map(item =>
                  h(
                    'option',
                    { selected: item.tag === state.tag },
                    item.tag
                  )
                )
              : [])
          ]
        )
      ]),

      getMeta(state),

      h(
        'p',
        { style: { color: 'gray' } },
        timestamp
          ? `Last Update: ${new Date(timestamp).toLocaleString()}`
          : 'Waiting for data…'
      ),

      error && h('p', { style: { color: 'red' } }, error)
    ]),
  node: document.getElementById('app')
})
