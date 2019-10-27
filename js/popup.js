import { Component, h, render } from './vendor/preact-10.0.1.js'
import htm from './vendor/htm-2.2.1.js'
import { getConfig, getExtensionsInfo } from './background.js'

const currentVersion = window.navigator.userAgent.match(
  /Chrome\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/
)[1]
const html = htm.bind(h)

/*
 * Event handlers
 */

const changeExtTracking = e =>
  getExtensionsInfo().then(extensionsInfo => {
    chrome.storage.local.set({
      extensionsInfo,
      extensionsTrack: e.target.checked
    })
  })

const changePlatform = e =>
  chrome.storage.local.set({
    arch: e.target.value,
    tag: null
  })

const changeTag = e => chrome.storage.local.set({ tag: e.target.value })

const removeExt = e => chrome.management.uninstall(e.target.id)

/*
 * Components
 */

const ChromiumInfo = ({ arch, current = {}, tag }) => html`
  <details open="${current.version !== currentVersion}">
    <summary>Chromium <code>v${currentVersion}</code></summary>
    <ul>
      <li>
        <span>Current: </span>
        <code class="${current.version !== currentVersion && 'badge'}"
          >v${current.version}</code
        >
      </li>
      <li>
        <span>Revision: ${current.revision} </span>
        (${new Date(current.timestamp * 1000).toLocaleString()})
      </li>
      ${current.links &&
        html`
          <li>
            <span>Downloads: </span>
            ${current.links.map(
              ({ label, url }, i) => html`
                <a href="${url}" target="_blank">${label}</a>
                ${i + 1 < current.links.length && ', '}
              `
            )}
          </li>
        `}
    </ul>
    <div style="font-size: smaller; margin-top: 1em">
      <span>Tracking </span>
      <a href="https://chromium.woolyss.com/#${arch}-${tag}" target="_blank"
        >${arch}-${tag}</a
      >
    </div>
  </details>
`

const ExtensionsInfo = ({ extensions, extensionsInfo, onDisableExtension }) => {
  const supported = extensions
    .filter(
      ext => extensionsInfo && extensionsInfo.find(({ id }) => id === ext.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const unsupported = extensions
    .filter(ext => !supported.find(({ id }) => id === ext.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  return html`
    <details
      open="${!extensionsInfo.every(e =>
        extensions.find(({ version }) => version === e.version)
      )}"
    >
      <summary>${extensions.length} Extensions</summary>
      <ul class="extensions">
        ${supported.map(ext => {
          const info =
            extensionsInfo && extensionsInfo.find(({ id }) => id === ext.id)
          return html`
            <li>
              <div class="${ext.enabled ? '' : ' disabled'}">
                <input
                  checked="${ext.enabled}"
                  id="${ext.id}"
                  onChange="${onDisableExtension}"
                  style="margin-right: 0.75em"
                  title="${ext.enabled ? 'Disable' : 'Enable'}"
                  type="checkbox"
                />
                ${ext.homepageUrl
                  ? html`
                      <a href="${ext.homepageUrl}" target="_blank"
                        ><span>${ext.name} </span>
                      </a>
                    `
                  : `${ext.name} `}
                <code
                  ><span>v${ext.version} </span> ${info.status !== 'noupdate' &&
                    info.version !== ext.version &&
                    html`
                      <a
                        class="badge"
                        href="${info.codebase.includes(
                          'clients2.googleusercontent.com'
                        )
                          ? `${
                              info.updateUrl
                            }?response=redirect&acceptformat=crx2,crx3&prodversion=${currentVersion}&x=id%3D${
                              info.id
                            }%26installsource%3Dondemand%26uc`
                          : info.codebase}"
                        target="_blank"
                        >v${info.version}</a
                      >
                    `}</code
                >
              </div>
              <div>
                <button class="remove" id="${ext.id}" onClick="${removeExt}">
                  🗑
                </button>
              </div>
            </li>
          `
        })}
      </ul>
      ${unsupported.length > 0 &&
        html`
          <p style="margin-bottom: 0;">No update info available:</p>
          <ul style="list-style: initial; padding: 0.5rem 0px 0px 1.25rem;">
            ${unsupported.map(
              ext => html`
                <li>
                  ${ext.homepageUrl
                    ? html`
                        <a href="${ext.homepageUrl}" target="_blank"
                          ><span>${ext.name} </span>
                        </a>
                      `
                    : `${ext.name} `}
                  <code>v${ext.version}</code>
                </li>
              `
            )}
          </ul>
        `}
    </details>
  `
}

const Header = ({ version }) => html`
  <div>
    <div>
      <p style="color: #202124; margin: 0">
        <strong>Chromium Update Notifications </strong>
        <code>${version && `v${version}`}</code>
      </p>
      <span>based on </span>
      <a href="https://chromium.woolyss.com/" target="_blank">Woolyss</a>
    </div>
    <div class="header-cell">
      <a href="https://github.com/kkkrist/chromium-notifier" target="_blank">
        <img src="../img/github.svg" style="height: 1rem; width: auto;" />
      </a>
    </div>
  </div>
`

const Settings = ({ arch, extensionsTrack, tag, versions }) => html`
  <details open="${!arch || !tag}">
    <summary>Settings</summary>
    <div>
      <label>
        <p>Platform</p>
        <select
          disabled="${!Object.keys(versions).length}"
          onChange="${changePlatform}"
        >
          <option disabled="${arch && versions[arch]}" value=""
            >Choose platform…</option
          >
          ${Object.keys(versions).map(
            archOpt => html`
              <option selected="${archOpt === arch}" value="${archOpt}"
                >${archOpt}</option
              >
            `
          )}
        </select>
      </label>
      <label>
        <p>Tag</p>
        <select disabled="${!arch || !versions[arch]}" onChange="${changeTag}">
          <option disabled="${tag}" value="">Choose tag…</option>
          ${arch &&
            versions[arch] &&
            versions[arch].map(
              tagOpts => html`
                <option selected="${tagOpts.tag === tag}" value="${tagOpts.tag}"
                  >${tagOpts.tag}</option
                >
              `
            )}
        </select>
      </label>
      <label>
        <p style="margin: 1rem 0 0;">
          <input
            checked="${extensionsTrack}"
            onChange="${changeExtTracking}"
            style="margin: 0 0.75rem 0 0"
            type="checkbox"
          />
          Track Extensions
        </p>
      </label>
    </div>
  </details>
`

/*
 * Main app
 */

class App extends Component {
  state = {
    extensions: [],
    extensionsInfo: [],
    versions: {}
  }

  onDisableExtension = ({ target: { checked, id } }) => {
    chrome.management.setEnabled(id, checked)

    const newState = [...this.state.extensions]
    const i = newState.findIndex(e => e.id === id)
    newState[i].enabled = checked
    this.setState({ extensions: newState })
  }

  onStorageChanges = changes => {
    this.setState(
      Object.keys(changes).reduce(
        (acc, key) => ({ ...acc, [key]: changes[key].newValue }),
        {}
      )
    )
  }

  componentDidMount () {
    getConfig().then(config => {
      chrome.management.getAll(extensions => {
        this.setState({ ...config, extensions })
        chrome.browserAction.setBadgeText({ text: '' })
      })
    })
    chrome.storage.onChanged.addListener(this.onStorageChanges)
  }

  componentWillUnmount () {
    chrome.storage.onChanged.removeListener(this.onStorageChanges)
  }

  render () {
    const {
      arch,
      error,
      extensions,
      extensionsInfo,
      extensionsTrack,
      tag,
      timestamp,
      versions
    } = this.state

    const current =
      arch && versions[arch] && versions[arch].find(v => v.tag === tag)

    const self =
      extensionsTrack &&
      extensionsInfo.find(({ id }) => id === chrome.runtime.id)

    return html`
      <section><${Header} version="${self && self.version}" /></section>
      ${arch &&
        tag &&
        html`
          <section>
            <${ChromiumInfo} arch="${arch}" current="${current}" tag="${tag}" />
          </section>
        `}
      ${extensionsTrack &&
        html`
          <section>
            <${ExtensionsInfo}
              extensions="${extensions}"
              extensionsInfo="${extensionsInfo}"
              onDisableExtension="${this.onDisableExtension}"
            />
          </section>
        `}
      <section>
        <${Settings}
          arch="${arch}"
          extensionsTrack="${extensionsTrack}"
          tag="${tag}"
          versions="${versions}"
        />
      </section>
      <section>
        <small>
          ${timestamp
            ? `Last update: ${new Date(timestamp).toLocaleString()}`
            : `Waiting for data…`}
        </small>
        ${error &&
          html`
            <small style="color: red; margin-top: 0.5rem;">
              Last error: ${error}
            </small>
          `}
      </section>
    `
  }
}

render(
  html`
    <${App} />
  `,
  document.getElementById('app')
)
