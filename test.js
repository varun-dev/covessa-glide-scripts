window.onload = function () {
  window.addEventListener('message', async function (event) {
    document.getElementById('response').value = event.data.result.value
  })

  document.getElementById('testName').onchange = execute

  function init(cb) {
    const testName = document.getElementById('testName').value
    const iframeSrc = '/' + testName + '/index'
    // console.log('Setting iframe src ', iframeSrc)
    const ifr = document.getElementById('iframe')
    ifr.src = iframeSrc
    ifr.onload = cb
  }

  function test() {
    const key = 'key'
    const params = []
    const els = document.querySelectorAll('.param')
    els.forEach(({ value, type }) =>
      params.push(type === 'number' ? { value: parseInt(value) } : { value })
    )
    // console.log('Posting test message', { key, params })
    window.frames[0].postMessage({ key, params })
  }

  function execute() {
    init(test)
  }

  document.getElementById('buttontest').onclick = execute
}
