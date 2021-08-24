async function App(apikey, id, retries, isCreateTopic, isCreateSub) {
  if (!id.value) {
    log('ID is missing')
    return false
  }

  if (!apikey.value) {
    log('apikey missing')
    return false
  }

  retries = retries.value || 5
  isCreateTopic = isCreateTopic.value || false
  isCreateSub = isCreateSub || false

  const urlToken =
    'https://europe-west3-covessa-sql.cloudfunctions.net/covessa-mq-dev-covessamq'
  // const url = 'http://localhost:8080'
  const urlApi = 'https://pubsub.googleapis.com/v1'

  const project = 'projects/covessa-sql'
  const subName = `${project}/subscriptions/sub-${id.value}`
  const topicName = `${project}/topics/topic-${id.value}`
  const urlSub = `${urlApi}/${subName}`
  const urlTopic = `${urlApi}/${topicName}`

  const NOT_FOUND_RETRY_DELAY = 2000

  let headers

  try {
    const resp = await fetch(urlToken + '?apikey=' + apikey.value)
    headers = await resp.json()
    await initialise()
    const msg = await getMessage(retries)
    log('Response: ', msg)
    await destroy()
    return msg
  } catch (e) {
    log(e)
    return false
  }

  async function getMessage(retry) {
    log('Pulling message for', id.value)
    const url = urlSub + ':pull'
    const body = JSON.stringify({
      returnImmediately: false,
      maxMessages: 10,
    })

    const resp = await fetch(url, { headers, body, method: 'POST' })
    if (resp.status === 200) {
      const { receivedMessages } = await resp.json()
      log('receivedMessages', receivedMessages)
      if (!receivedMessages || !receivedMessages.length) {
        if (retry > 0) {
          return await getMessage(retry - 1)
        } else {
          log('No Booking')
          return false
        }
      } else {
        const msg = receivedMessages[0].message
        const id = msg.attributes.id
        await ackMessage(msg)
        return id === id.value
      }
    } else if (resp.status === 404 && retry > 0) {
      return await setTimeoutAsync(
        getMessage.bind(null, retry - 1),
        NOT_FOUND_RETRY_DELAY
      )
    } else {
      log('Error ' + resp.status)
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
    log('Destroying topic and subscription')
    try {
      isCreateTopic && (await fetch(urlSub, { headers, method: 'DELETE' }))
      isCreateSub && (await fetch(urlTopic, { headers, method: 'DELETE' }))
    } catch (e) {
      log(e)
    }
  }

  async function initialise() {
    if (isCreateTopic) {
      log('Creating topic')
      const respTopic = await fetch(urlTopic, { headers, method: 'PUT' })
      if (respTopic.status === 409)
        log('Topic already exist. This should not happen')
    }
    if (isCreateSub) {
      log('Creating subscription')
      const body = JSON.stringify({ topic: topicName })
      const respSub = await fetch(urlSub, { headers, method: 'PUT', body })
      if (respSub.status === 409)
        log('Subscription already exist. This should not happen')
    }
  }

  function setTimeoutAsync(fn, delay) {
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
}

function log(...arg) {
  console.debug(...arg)
}

window.__function = App
