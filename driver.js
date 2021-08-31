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
  const [columnId, ...otherParams] = params
  const random = otherParams.pop()
  if (!columnId.value)
    throw '[Script Error] First parameter column id is mandatory'

  let isStop = false
  const shouldStop = () => isStop
  const stop = () => (isStop = true)

  const cid = columnId.value
  if (threads[cid]) {
    threads[cid].stop()
    delete threads[cid]
  }
  threads[cid] = { stop }
  // console.debug('Random test ', otherParams, random)
  try {
    result = await window.__function(...otherParams, {
      ...tools,
      shouldStop,
      columnId,
    })
    const response = { key }
    if (result !== undefined) {
      response.result = { type: 'string', value: result }
    }
    delete threads[cid]
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
