window._covessa = window._covessa || {}
window._covessa.threads = {}

console.debug('Initialising script')

window.addEventListener('message', async function (event) {
  const { threads } = window._covessa

  const {
    origin,
    data: { key, params },
  } = event

  console.log('Message', key, params)

  let result
  if (!params.length) throw '[Script Error] No parameters passed'
  const [columnId, ...otherParams] = params
  const cid = columnId.value
  if (!cid) {
    const msg = '[Script Error] First parameter column id is mandatory'
    console.debug(msg)
    throw msg
  }

  let isStop = false
  const shouldStop = () => isStop
  const stop = () => (isStop = true)

  if (threads[cid]) {
    threads[cid].stop()
    delete threads[cid]
  }
  threads[cid] = { stop }
  // console.debug('Random test ', otherParams, random)
  try {
    result = await window.__function(...otherParams, {
      shouldStop,
      columnId: cid,
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
