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
  if (!columnId.value) {
    const msg = '[Script Error] First parameter column id is mandatory'
    console.debug(msg)
    throw msg
  }

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
