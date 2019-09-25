import { h, app } from './vendor/hyperapp-2.0.1.js'

chrome.browserAction.setBadgeText({ text: '' })
chrome.browserAction.setBadgeBackgroundColor({ color: [0, 150, 180, 255] })

const borderStyleDefault = '1px solid #dadce0'
const paddingDefault = '1rem'
const selectStyle = {
  backgroundColor: 'white',
  border: borderStyleDefault,
  color: '#3367d6',
  display: 'block',
  fontWeight: 'bold',
  height: '2em',
  height: 'calc(1.5em + .75rem + 2px)',
  marginBottom: '',
  padding: '.375rem 1.75rem .375rem .75rem',
  width: '100%'
}

const arch = localStorage.getItem('arch')
const currentVersion = window.navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]
const error = localStorage.getItem('error')
const tag = localStorage.getItem('tag')
const timestamp = Number(localStorage.getItem('timestamp'))
const versions = JSON.parse(localStorage.getItem('versions'))

const getMeta = state => {
  const current =
    state.arch && versions[state.arch].find(({ tag }) => tag === state.tag)
  return current
    ? [
        h(
          'ul',
          { style: { listStyleType: 'none', margin: 0, paddingLeft: 0 } },
          [
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
          ]
        )
      ]
    : []
}

app({
  init: { arch, tag },
  view: state =>
    h('div', {}, [
      h(
        'div',
        {
          style: { borderBottom: borderStyleDefault, padding: paddingDefault }
        },
        [
          h(
            'p',
            { style: { color: '#202124', fontWeight: 'bold', margin: 0 } },
            'Chromium Update Notifications'
          ),

          h('span', {}, 'based on '),
          h(
            'a',
            { href: 'https://chromium.woolyss.com/', target: '_blank' },
            'Woolyss'
          )
        ]
      ),

      h(
        'div',
        {
          style: { borderBottom: borderStyleDefault, padding: paddingDefault }
        },
        getMeta(state)
      ),

      h(
        'details',
        {
          style: { borderBottom: borderStyleDefault, padding: paddingDefault }
        },
        [
          h('summary', { style: { cursor: 'pointer' } }, 'Settings'),
          h('div', { style: { paddingTop: '0.5rem' } }, [
            h('label', {}, [
              h('p', { style: { margin: '0.25rem 0' } }, 'Platform'),
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
                    h('option', { selected: arch === state.arch }, arch)
                  )
                ]
              )
            ]),

            h('label', {}, [
              h('p', { style: { margin: '0.25rem 0' } }, 'Tag'),
              h(
                'select',
                {
                  disabled: !state.arch,
                  onChange: (state, e) => {
                    localStorage.setItem('tag', e.target.value)
                    const current =
                      state.arch &&
                      versions[state.arch].find(
                        ({ tag }) => tag === e.target.value
                      )

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
                  h(
                    'option',
                    { disabled: state.tag, value: '' },
                    'Choose tag…'
                  ),
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
            ])
          ])
        ]
      ),

      h(
        'div',
        {
          style: { borderBottom: borderStyleDefault, padding: paddingDefault }
        },
        [
          h(
            'small',
            { style: { display: 'block', margin: 0 } },
            timestamp
              ? `Last Update: ${new Date(timestamp).toLocaleString()}`
              : 'Waiting for data…'
          ),
          error &&
            h(
              'small',
              { style: { color: 'red', display: 'block', marginTop: '0.5em' } },
              error
            )
        ]
      )
    ]),
  node: document.getElementById('app')
})
