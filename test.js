window.onload = async function () {
  let testName
  let startTime
  await setTestName()
  initHandlers()
  return

  async function setTestName() {
    testName = document.getElementById('testName').value
    const html = await getFields(`${testName}/glide.json`)
    document.getElementById('containerParams').innerHTML = html
    populateFields()
    await initFrame()
  }

  function initHandlers() {
    window.addEventListener('message', async function (event) {
      document.getElementById('response').value =
        event.data.result && event.data.result.value
      document.getElementById('testTime').value =
        ((new Date().getTime() - startTime) / 1000).toFixed(2) + ' seconds'
    })
    document.getElementById('testName').onchange = setTestName
    document.getElementById('buttontest').onclick = test
    document.getElementById('buttonPublish').onclick = publishMessage
  }

  function initFrame() {
    return new Promise(resolve => {
      const iframeSrc = '/' + testName + '/index'
      // console.log('Setting iframe src ', iframeSrc)
      const ifr = document.getElementById('iframe')
      ifr.src = iframeSrc
      ifr.onload = resolve
    })
  }

  function test() {
    startTime = new Date().getTime()
    const key = 'key-' + Math.floor(Math.random() * 10000)
    const params = []
    document.getElementById('response').value = 'Waiting'
    const elParams = document.querySelectorAll('.param')
    elParams.forEach(el => params.push(getElValue(el)))
    // console.log('Posting test message', { key, params })
    window.localStorage.setItem(testName, JSON.stringify(params))
    window.frames[0].postMessage({ key, params }, '*')
  }

  function populateFields() {
    const prevParams = window.localStorage.getItem(testName)
    // console.log('prevParams', prevParams)
    if (prevParams) {
      JSON.parse(prevParams).forEach(setElValue)
    }
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
  function getElValue(el) {
    let value = el.value
    let type = 'string'
    switch (el.type) {
      case 'number':
        value = parseInt(el.value)
        type = 'number'
        break
      case 'checkbox':
        value = el.checked
        type = 'boolean'
    }
    return { value, type, key: el.id }
  }

  function setElValue({ type, value, key }) {
    const el = document.getElementById(key)
    if (!el) return
    switch (type) {
      case 'boolean':
        el.checked = value
        return
      default:
        el.value = value
    }
  }

  function getType(type) {
    return {
      number: 'number',
      string: 'text',
      boolean: 'checkbox',
    }[type]
  }

  async function publishMessage() {
    startTime = new Date().getTime()
    const id = document.getElementById('id').value
    const apikey = document.getElementById('apikey').value
    const attr = document.getElementById('filterAttr').value || 'id'
    const urlToken =
      'https://europe-west3-covessa-sql.cloudfunctions.net/covessa-mq-dev-covessamq'
    const urlApi = 'https://pubsub.googleapis.com/v1'
    const project = 'projects/covessa-sql'
    const topicName = `${project}/topics/topic-${id}`
    const urlTopic = `${urlApi}/${topicName}`

    const headers = await window._covessa.tools.getToken(urlToken, apikey)
    const body = JSON.stringify({ messages: [{ attributes: { [attr]: id } }] })
    console.debug('Publishing message - ', attr + ':' + id)
    const resp = await fetch(urlTopic + ':publish', {
      headers,
      body,
      method: 'POST',
    })
    const json = await resp.json()
    if (resp.status != 200) throw json.error
    // console.debug('publishMessage', json)
  }
}
