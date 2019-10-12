import { h, app } from './vendor/hyperapp-2.0.1.js'
import { getExtensionsInfo } from './background.js'

chrome.browserAction.setBadgeText({ text: '' })
chrome.browserAction.setBadgeBackgroundColor({ color: [0, 150, 180, 255] })

const borderStyleDefault = '1px solid #dadce0'
const paddingDefault = '1rem'
const badgeStyle = {
  backgroundColor: 'orangered',
  borderRadius: '4px',
  color: 'white',
  padding: '0 0.25em'
}
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
const extensionsInfo = JSON.parse(localStorage.extensionsInfo || null)
const extensionsTrack = localStorage.extensionsTrack === 'true'
const timestamp = Number(localStorage.timestamp)
const versions = JSON.parse(localStorage.versions || null)

const tag =
  arch && versions[arch].find(({ tag }) => tag === localStorage.tag)
    ? localStorage.tag
    : undefined

const initialState = {
  arch,
  current: arch && tag && versions[arch].find(v => v.tag === tag),
  extensionsInfo,
  extensionsTrack,
  tag
}

const handleExtTracking = (state, e) => [
  state,
  [
    dispatch =>
      getExtensionsInfo().then(extensionsInfo => {
        const extensionsNew =
          extensionsInfo &&
          !extensionsInfo.every(e =>
            state.extensions.find(({ version }) => version === e.version)
          )

        delete localStorage.error
        localStorage.extensionsInfo = JSON.stringify(extensionsInfo || null)
        localStorage.extensionsTrack = e.target.checked

        dispatch({
          ...state,
          extensionsInfo,
          extensionsTrack: e.target.checked
        })

        if (extensionsNew) {
          chrome.browserAction.setBadgeBackgroundColor({
            color: [0, 150, 180, 255]
          })
          chrome.browserAction.setBadgeText({ text: 'New' })
        }
      })
  ]
]

const ChromiumInfo = ({ current }) =>
  current
    ? [
        h(
          'ul',
          {
            style: { listStyleType: 'none', margin: 0, padding: '0.5rem 0 0 0' }
          },
          [
            h('li', { style: { padding: '0.1rem 0' } }, [
              h('span', {}, 'Current: '),
              h(
                'code',
                {
                  style: current.version === currentVersion ? {} : badgeStyle
                },
                `v${current.version} `
              )
            ]),

            h(
              'li',
              { style: { padding: '0.1rem 0' } },
              `Revision: ${current.revision} (${new Date(
                current.timestamp * 1000
              ).toLocaleDateString()})`
            ),

            h('li', { style: { padding: '0.1rem 0' } }, [
              h('span', {}, 'Downloads: '),
              ...current.links.map(({ label, url }, i) =>
                h('span', {}, [
                  h('a', { href: url, target: '_blank' }, label),
                  i + 1 < current.links.length && h('span', {}, ', ')
                ])
              )
            ])
          ]
        )
      ]
    : []

const ExtensionsInfo = ({ extensions, extensionsInfo }) => {
  const supported = extensions
    .filter(
      ext => extensionsInfo && extensionsInfo.find(({ id }) => id === ext.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
  const unsupported = extensions
    .filter(ext => !supported.find(({ id }) => id === ext.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  return [
    h(
      'ul',
      {
        style: { listStyleType: 'none', margin: 0, padding: '0.5rem 0 0 0' }
      },
      supported.map(ext => {
        const info =
          extensionsInfo && extensionsInfo.find(({ id }) => id === ext.id)
        return h(
          'li',
          {
            style: {
              opacity: ext.enabled ? '1.0' : '0.66',
              padding: '0.1rem 0'
            }
          },
          [
            h('input', {
              checked: ext.enabled,
              onChange: (state, e) => {
                chrome.management.setEnabled(ext.id, !ext.enabled)
                const newState = { ...state }
                const i = newState.extensions.findIndex(
                  ({ id }) => id === ext.id
                )
                newState.extensions[i].enabled = !ext.enabled
                return newState
              },
              style: { margin: '0 0.75em 0 0' },
              title: ext.enabled ? 'Disable' : 'Enable',
              type: 'checkbox'
            }),
            ext.homepageUrl
              ? h('a', { href: ext.homepageUrl, target: '_blank' }, ext.name)
              : h('span', {}, ext.name),
            h('code', {}, [
              h('span', {}, ` v${ext.version} `),
              info.version !== ext.version &&
                h(
                  'a',
                  {
                    href: info.codebase.endsWith('crx')
                      ? `${
                          info.updateUrl
                        }?response=redirect&acceptformat=crx2,crx3&prodversion=${currentVersion}&x=id%3D${
                          info.id
                        }%26installsource%3Dondemand%26uc`
                      : info.codebase,
                    style: badgeStyle,
                    target: '_blank'
                  },
                  `v${info.version}`
                )
            ])
          ]
        )
      })
    ),
    unsupported.length > 0 &&
      h('div', {}, [
        h('p', { style: { marginBottom: 0 } }, 'No update info available:'),
        h(
          'ul',
          {
            style: { margin: 0, padding: '0.5rem 0px 0px 1.25rem' }
          },
          unsupported.map(ext =>
            h('li', {}, [
              ext.homepageUrl
                ? h('a', { href: ext.homepageUrl, target: '_blank' }, ext.name)
                : h('span', {}, ext.name),
              h('code', {}, [h('span', {}, ` v${ext.version} `)])
            ])
          )
        )
      ])
  ]
}

const Row = children =>
  h(
    'div',
    {
      style: { borderBottom: borderStyleDefault, padding: paddingDefault }
    },
    children
  )

app({
  init: [
    initialState,
    [
      dispatch =>
        chrome.management.getAll(extensions => {
          dispatch({
            ...initialState,
            extensions
          })
        })
    ]
  ],
  view: state =>
    h('div', {}, [
      Row([
        h(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              margin: '0 -0.25rem'
            }
          },
          [
            h('div', { style: { margin: '0 0.25rem' } }, [
              h('p', { style: { color: '#202124', margin: 0 } }, [
                h(
                  'span',
                  { style: { fontWeight: 'bold' } },
                  'Chromium Update Notifications'
                ),
                h(
                  'code',
                  {},
                  ` v${
                    state.extensions.find(({ id }) => id === chrome.runtime.id)
                      .version
                  }`
                )
              ]),
              h('span', {}, 'based on '),
              h(
                'a',
                { href: 'https://chromium.woolyss.com/', target: '_blank' },
                'Woolyss'
              )
            ]),
            h('div', { style: { margin: '0 0.25rem' } }, [
              h(
                'a',
                {
                  href: 'https://github.com/kkkrist/chromium-notifier',
                  target: '_blank'
                },
                [
                  h('img', {
                    src: '../img/github.svg',
                    style: {
                      height: '1rem',
                      width: 'auto'
                    }
                  })
                ]
              )
            ])
          ]
        )
      ]),

      state.arch &&
        state.tag &&
        Row([
          h(
            'details',
            { open: state.current && state.current.version !== currentVersion },
            [
              h('summary', { style: { cursor: 'pointer' } }, [
                h('span', {}, `Chromium `),
                h('code', {}, `v${currentVersion}`)
              ]),

              ChromiumInfo(state),

              h(
                'div',
                { style: { fontSize: 'smaller', marginTop: '1em' } },
                state.arch && state.tag
                  ? [
                      h('span', {}, 'Tracking '),
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
                    ]
                  : [
                      h(
                        'span',
                        {},
                        'Please go to settings and set platform & tag!'
                      )
                    ]
              )
            ]
          )
        ]),

      state.extensionsTrack &&
        state.extensions &&
        Row([
          h(
            'details',
            {
              open:
                state.extensions &&
                extensionsInfo &&
                !extensionsInfo.every(e =>
                  state.extensions.find(({ version }) => version === e.version)
                )
            },
            [
              h('summary', { style: { cursor: 'pointer' } }, [
                h('span', {}, `${state.extensions.length} Extensions`)
              ]),
              h('table', {}, ExtensionsInfo(state))
            ]
          )
        ]),

      Row([
        h('details', { open: !state.arch || !state.tag }, [
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
              h('p', { style: { margin: '1rem 0 0' } }, [
                h('span', {}, 'Track Extensions '),
                h('input', {
                  checked: state.extensionsTrack,
                  onClick: handleExtTracking,
                  type: 'checkbox'
                })
              ])
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
