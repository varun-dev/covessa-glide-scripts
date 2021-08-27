window.onload = async function () {
  window.addEventListener('message', async function (event) {
    document.getElementById('response').value =
      event.data.result && event.data.result.value
  })

  document.getElementById('testName').onchange = changeTestName
  document.getElementById('buttontest').onclick = test

  let testName
  await changeTestName()
  await init()

  async function changeTestName() {
    testName = document.getElementById('testName').value
    getFields(`/${testName}/glide.json`).then(
      html => (document.getElementById('containerParams').innerHTML = html)
    )
  }

  function init(cb) {
    return new Promise(resolve => {
      const iframeSrc = '/' + testName + '/index'
      // console.log('Setting iframe src ', iframeSrc)
      const ifr = document.getElementById('iframe')
      ifr.src = iframeSrc
      ifr.onload = resolve
    })
  }

  function test() {
    const key = 'key-' + Math.floor(Math.random() * 10000)
    const params = []
    const els = document.querySelectorAll('.param')
    els.forEach(el => params.push(formatValue(el)))
    // console.log('Posting test message', { key, params })
    window.frames[0].postMessage({ key, params }, '*')
  }

  async function getFields(url) {
    const r = await fetch(url)
    const gson = await r.json()
    return gson.params.reduce(
      (html, { name, displayName, type }) =>
        html +
        '</br>' +
        `<label for="${name}">${displayName}</label><input class="param" id="${name}" type="${getType(
          type
        )}" />`,
      ''
    )
  }
  function formatValue(el) {
    let value = el.value
    switch (el.type) {
      case 'number':
        value = parseInt(el.value)
      case 'checkbox':
        value = el.checked
    }
    return { value }
  }

  function getType(type) {
    return {
      number: 'number',
      string: 'text',
      boolean: 'checkbox',
    }[type]
  }
}
