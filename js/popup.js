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
  padding: '.375rem 1.75rem .375rem .75rem',
  width: '100%'
}

const arch = localStorage.arch
const currentVersion = window.navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]
const error = localStorage.error
const extensions = localStorage.extensions || 'true'
const tag = localStorage.tag
const timestamp = Number(localStorage.timestamp)
const versions = JSON.parse(localStorage.versions)

const ChromiumInfo = ({ current }) =>
  current
    ? [
        h(
          'ul',
          {
            style: { listStyleType: 'none', margin: 0, padding: '0.5rem 0 0 0' }
          },
          [
            h('li', {}, [
              h('span', {}, 'Current: '),
              h('a', { href: current.link, target: '_blank' }, current.version)
            ]),

            h(
              'li',
              {},
              `Revision: ${current.build} (${new Date(
                current.date
              ).toLocaleDateString()})`
            )
          ]
        )
      ]
    : []

const Row = children =>
  h(
    'div',
    {
      style: { borderBottom: borderStyleDefault, padding: paddingDefault }
    },
    children
  )

app({
  init: {
    arch,
    current: versions[arch].find(v => v.tag === tag),
    extensions,
    tag
  },
  view: state =>
    h('div', {}, [
      Row([
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
      ]),

      Row([
        h('details', { open: state.current.version !== currentVersion }, [
          h('summary', { style: { cursor: 'pointer' } }, [
            h('span', {}, `Chromium: ${currentVersion} `),
            state.current &&
              h(
                'span',
                {},
                state.current.version === currentVersion ? '✅' : '🚨'
              )
          ]),

          ChromiumInfo(state),

          h('div', { style: { fontSize: 'smaller', marginTop: '1em' } }, [
            h('span', {}, 'Tracking: '),
            h(
              'a',
              {
                href: `https://chromium.woolyss.com/#${state.arch}-${
                  state.tag
                }`,
                target: '_black'
              },
              `${state.arch}-${state.tag}`
            )
          ])
        ])
      ]),

      Row([
        h('details', {}, [
          h('summary', { style: { cursor: 'pointer' } }, 'Settings'),
          h('div', { style: { paddingTop: '0.5rem' } }, [
            h('label', {}, [
              h('p', { style: { margin: '0.25rem 0' } }, 'Platform'),
              h(
                'select',
                {
                  disabled: !versions,
                  onChange: (state, e) => {
                    localStorage.arch = e.target.value
                    delete localStorage.tag
                    chrome.browserAction.setBadgeText({ text: '' })
                    return {
                      ...state,
                      arch: e.target.value,
                      current: undefined,
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
                    localStorage.tag = e.target.value
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
                      current,
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
            ]),

            h('label', {}, [
              h('p', { style: { margin: '0.25rem 0 0' } }, 'Track Extensions'),
              h('input', {
                checked: state.extensions === 'true',
                onClick: (state, e) => {
                  localStorage.extensions = e.target.checked
                  return {
                    ...state,
                    extensions: `${e.target.checked}`
                  }
                },
                style: {
                  display: 'block',
                  height: '2em',
                  margin: 0,
                  width: '2em'
                },
                type: 'checkbox'
              })
            ])
          ])
        ])
      ]),

      Row([
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
      ])
    ]),
  node: document.getElementById('app')
})
