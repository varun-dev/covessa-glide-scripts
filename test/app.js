window._covessa = { threads: {} }
console.debug('Initialising script')

window.addEventListener('message', async function (event) {
  const { threads } = window._covessa

  const {
    origin,
    data: { key, params },
  } = event

  threads[key] = params

  console.debug('Message', key, params)
  console.debug(
    'Number of current threads: ',
    Object.keys(window._covessa.threads).length
  )

  let [delay] = params
  if (!delay || !delay.value) delay = { value: 5000 }
  setTimeout(() => respond(true), delay.value)

  function respond(result) {
    const response = { key }
    if (result !== undefined) {
      response.result = { type: 'boolean', value: result }
    }
    delete threads[key]
    event.source.postMessage(response, '*')
  }
})

window._covessa.getLogger = function () {
  // const randomColor = Math.floor(Math.random() * 16777215).toString(16)
  const randomColor =
    'hsl(' +
    360 * Math.random() +
    ',' +
    (25 + 70 * Math.random()) +
    '%,' +
    (50 + 10 * Math.random()) +
    '%)'

  return function log(...args) {
    const format = v => (typeof v === 'object' ? JSON.stringify(v, null, 2) : v)
    const str = args.reduce((r, m) => r + '\n' + format(m), '')
    console.debug('%c' + str, 'color:' + randomColor)
  }
}
