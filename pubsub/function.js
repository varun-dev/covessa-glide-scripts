window.__function = async function App(
  apikey,
  id,
  filterAttr,
  retries,
  isCreateTopic,
  isCreateSub,
  isDeleteTopic,
  isDeleteSub,
  random,
  options
) {
  apikey = apikey.value
  id = id.value
  filterAttr = filterAttr.value || 'id'
  isCreateTopic =
    isCreateTopic.value !== undefined ? isCreateTopic.value : false
  isCreateSub = isCreateSub.value !== undefined ? isCreateSub.value : false
  isDeleteTopic =
    isDeleteTopic.value !== undefined ? isDeleteTopic.value : isCreateTopic
  isDeleteSub =
    isDeleteSub.value !== undefined ? isDeleteSub.value : isCreateSub
  retries = retries.value
    ? retries.value === -1
      ? Infinity
      : retries.value
    : Infinity

  const log = window._covessa.tools.getLogger(options.columnId)

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
    headers = await getToken()
    await initialise()
    log(
      'Awaiting message for',
      'id: ' + id,
      'attribute: ' + filterAttr,
      'retries: ' + retries
    )
    const msg = await getMessage(retries)
    log('Response - ' + filterAttr + ' : ' + msg)
    await destroy()
    return msg
  } catch (e) {
    if (e.code === 'EXECUTION_INTERRUPTED') throw e
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
    const data = await resp.json()
    if (resp.status === 403) throw 'Likely wrong API Key'
    if (resp.status !== 200) throw `HTTP Error ${resp.status} in getting token`
    return data
  }

  async function getMessage(retry) {
    if (options.shouldStop()) {
      log('Stopping thread')
      throw { code: 'EXECUTION_INTERRUPTED' }
    }
    log('Executing pull')
    const url = urlSub + ':pull'
    const body = JSON.stringify({
      returnImmediately: false,
      maxMessages: 10,
    })

    const resp = await fetch(url, { headers, body, method: 'POST' })
    const json = await resp.json()
    if (resp.status === 200) {
      const { receivedMessages } = json
      const filteredMsgs = filterMsgs(receivedMessages)
      // log('filteredMsgs', filteredMsgs)
      if (!filteredMsgs || !filteredMsgs.length) {
        if (retry > 0) {
          return await getMessage(retry - 1)
        } else {
          return false
        }
      } else {
        const { ackId, message } = filteredMsgs[0]
        await ackMessage(ackId)
        return message.attributes[filterAttr]
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

  async function ackMessage(ackId) {
    if (isDeleteSub || !ackId) return
    log('Acknowledging message')
    const url = urlSub + ':acknowledge'
    const body = JSON.stringify({ ackIds: [ackId] })
    const resp = await fetch(url, { headers, body, method: 'POST' })
    const json = await resp.json()
    if (resp.status != 200) throw json.error
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

  function filterMsgs(msgs) {
    return msgs.filter(
      ({ message }) => message.attributes[filterAttr] !== undefined
    )
  }
}
