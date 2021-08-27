async function App(
  apikey,
  id,
  retries,
  isCreateTopic,
  isCreateSub,
  isDeleteTopic,
  isDeleteSub
) {
  apikey = apikey.value
  id = id.value
  isCreateTopic = isCreateTopic.value || false
  isCreateSub = isCreateSub.value || false
  isDeleteTopic = isDeleteTopic.value || isCreateTopic
  isDeleteSub = isDeleteSub.value || isCreateSub
  retries = retries.value
    ? retries.value === -1
      ? Infinity
      : retries.value
    : 5

  const log = getLogger()

  if (!apikey) {
    log('apikey missing')
    return false
  }

  if (!id) {
    log('ID is missing')
    return false
  }

  const urlToken =
    'https://europe-west3-covessa-sql.cloudfunctions.net/covessa-mq-dev-covessamq'
  // const url = 'http://localhost:8080'
  const urlApi = 'https://pubsub.googleapis.com/v1'

  const project = 'projects/covessa-sql'
  const subName = `${project}/subscriptions/sub-${id}`
  const topicName = `${project}/topics/topic-${id}`
  const urlSub = `${urlApi}/${subName}`
  const urlTopic = `${urlApi}/${topicName}`

  const NOT_FOUND_RETRY_DELAY = 2000

  let headers

  try {
    const headers = await getToken()
    await initialise()
    log('Awaiting message for ' + id)
    const msg = await getMessage(retries)
    log('Response: ' + msg)
    await destroy()
    return msg
  } catch (e) {
    log('Unhandled Error\n' + JSON.stringify(e, null, 2))
    return false
  }

  async function getToken() {
    let resp
    try {
      resp = await fetch(urlToken + '?apikey=' + apikey)
    } catch (e) {
      throw 'Unexpected Error while fetching Token'
    }
    headers = await resp.json()
    if (resp.status === 403) throw 'Likely wrong API Key'
    if (resp.status !== 200) throw `HTTP Error ${resp.status} in getting token`
    return headers
  }

  async function getMessage(retry) {
    const url = urlSub + ':pull'
    const body = JSON.stringify({
      returnImmediately: false,
      maxMessages: 10,
    })

    const resp = await fetch(url, { headers, body, method: 'POST' })
    const json = await resp.json()
    if (resp.status === 200) {
      const { receivedMessages } = json
      // log('receivedMessages', receivedMessages)
      if (!receivedMessages || !receivedMessages.length) {
        if (retry > 0) {
          return await getMessage(retry - 1)
        } else {
          return false
        }
      } else {
        const msg = receivedMessages[0].message
        await ackMessage(msg)
        return msg.attributes.id
      }
    } /* else if (resp.status === 404 && retry > 0) {
      return await setTimeoutAsync(
        getMessage.bind(null, retry - 1),
        NOT_FOUND_RETRY_DELAY
      )
    }*/ else {
      log('Error\n' + JSON.stringify(json.error, null, 2))
      return false
    }
  }

  async function ackMessage(msg) {
    if (!isCreateSub) return
    const url = urlSub + ':acknowledge'
    const body = JSON.stringify({
      ackIds: [msg.ackId],
    })
    await fetch(url, { headers, body, method: 'POST' })
  }

  async function destroy() {
    if (isDeleteSub) {
      log('Deleting subscription for ' + id)
      await fetch(urlSub, { headers, method: 'DELETE' })
    }
    if (isDeleteTopic) {
      log('Deleting topic for ' + id)
      await fetch(urlTopic, { headers, method: 'DELETE' })
    }
  }

  async function initialise() {
    if (isCreateTopic) {
      log('Creating topic for ' + id)
      const resp = await fetch(urlTopic, { headers, method: 'PUT' })
      const json = await resp.json()
      if (resp.status === 409)
        log('Topic already exist. This should not happen')
      else if (resp.status !== 200) {
        throw json.error
      }
    }
    if (isCreateSub) {
      log('Creating subscription for ' + id)
      const body = JSON.stringify({ topic: topicName })
      const resp = await fetch(urlSub, { headers, method: 'PUT', body })
      const json = await resp.json()
      if (resp.status === 409)
        log('Subscription already exist. This should not happen')
      else if (resp.status !== 200) {
        throw json.error
      }
    }
  }

  // function setTimeoutAsync(fn, delay) {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(
  //       () =>
  //         fn()
  //           .then(r => resolve(r))
  //           .catch(e => reject(e)),
  //       delay
  //     )
  //   })
  // }

  function getLogger() {
    // const randomColor = Math.floor(Math.random() * 16777215).toString(16)
    const randomColor =
      'hsl(' +
      360 * Math.random() +
      ',' +
      (25 + 70 * Math.random()) +
      '%,' +
      (50 + 10 * Math.random()) +
      '%)'
    return function log(msg) {
      // console.debug(msg)
      console.debug('%c' + msg, 'color:' + randomColor)
    }
  }
}

window.__function = App
