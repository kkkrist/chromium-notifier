//<div role="button" class="dd-Va g-c-wb g-eg-ua-Uc-c-za g-c-Oc-td-jb-oa g-c" aria-label="Hinzufügen" tabindex="0" style="user-select: none;">
//<div class="g-c-Hf">
//<div class="g-c-x">
//<div class="g-c-R  webstore-test-button-label">
//Hinzufügen
//</div>
//</div>
//</div>
//</div>

const insertButton = wrapper => {
  console.log(wrapper)
  const div1 = document.createElement('div')
  const div2 = document.createElement('div')
  const div3 = document.createElement('div')
  const div4 = document.createElement('div')

  div1.classList.add(
    'dd-Va',
    'g-c-wb',
    'g-eg-ua-Uc-c-za',
    'g-c-Oc-td-jb-oa',
    'g-c'
  )
  div2.classList.add('g-c-Hf')
  div3.classList.add('g-c-x')
  div4.classList.add('g-c-R')

  div1.setAttribute('aria-label', 'Add to Chromium')
  div1.setAttribute('role', 'button')
  div1.setAttribute('tabindex', '0')
  div1.style.userSelect = 'none'

  div4.innerText = 'Add to Chromium'

  div3.append(div4)
  div2.append(div3)
  div1.append(div2)

  wrapper.append(div1)
}

window.addEventListener(
  'DOMContentLoaded',
  () => {
    //const wrapper = document.querySelector('.h-e-f-Ra-c.e-f-oh-Md-zb-k')
    const script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.innerHTML = `console.log('hey', document.querySelector('.h-e-f-Ra-c.e-f-oh-Md-zb-k'))`
    script.async = false
    document.head.appendChild(script)
}, false)

//if (document.readyState !== 'complete') {
//window.addEventListener('load', insertButton)
//} else {
//insertButton()
//}
