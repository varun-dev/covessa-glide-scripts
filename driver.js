window._glidedriver = { threads: {}, tools: {} }
console.debug('Initialising script')

window.addEventListener('message', async function (event) {
  const { threads, tools } = window._glidedriver

  const {
    origin,
    data: { key, params },
  } = event

  console.log('Message', key, params)

  let result
  if (!params.length) throw '[Script Error] No parameters passed'
  if (params[0].value === undefined)
    throw '[Script Error] First parameter column id is mandatory'

  const { clear, fn } = window.__function(...params, tools)

  const columnId = params[0].value
  if (threads[columnId]) {
    threads[columnId].clear()
    delete threads[columnId]
  }
  threads[columnId] = { clear }

  // console.debug(
  //   'Number of current threads: ',
  //   Object.keys(window._glidedriver.threads).length
  // )

  try {
    result = await fn()
    const response = { key }
    if (result !== undefined) {
      response.result = { type: 'boolean', value: result }
    }
    delete threads[columnId]
    event.source.postMessage(response, '*')
  } catch (e) {
    if (e.code !== 'EXECUTION_INTERRUPTED') {
      console.error(e)
    }
  }
})

window._glidedriver.tools.getLogger = function () {
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

window._glidedriver.tools.setTimeoutAsync = function setTimeoutAsync(
  fn,
  delay
) {
  return new Promise((resolve, reject) => {
    setTimeout(
      () =>
        fn()
          .then(r => resolve(r))
          .catch(e => reject(e)),
      delay
    )
  })
}
