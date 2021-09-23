window._covessa = window._covessa || {}
const tools = (window._covessa.tools = window._covessa.tools || {})

tools.getLogger = function (cid) {
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
    const str = args.reduce(
      (r, m, i) => r + (i !== 0 ? '\n' : '') + format(m),
      ''
    )
    console.debug('%c' + `[${cid}] ${str}`, 'color:' + randomColor)
  }
}

tools.setTimeoutAsync = function setTimeoutAsync(fn, delay) {
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

tools.getToken = async function getToken(url, apikey) {
  let resp

  try {
    resp = await fetch(url + '?apikey=' + apikey)
  } catch (e) {
    throw 'Unexpected Error while fetching Token'
  }
  const data = await resp.json()
  if (resp.status === 403) throw 'Likely wrong API Key'
  if (resp.status !== 200) throw `HTTP Error ${resp.status} in getting token`
  return data
}
