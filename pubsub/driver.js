window.addEventListener('message', async function (event) {
  const {
    origin,
    data: { key, params },
  } = event

  // console.debug('%cMessage\n' + JSON.stringify(params, null, 2), 'color: cyan')

  let result
  try {
    result = await window._covessa.function(...params)
  } catch (e) {
    console.error(e)
    result = undefined
  }

  const response = { key }
  if (result !== undefined) {
    response.result = { type: 'string', value: result }
  }

  event.source.postMessage(response, '*')
})
