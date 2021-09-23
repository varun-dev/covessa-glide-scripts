window.__function = async function App(value, delay, retries, options) {
  const log = window._covessa.tools.getLogger(options.columnId)
  retries = retries.value || 5
  delay = delay.value || 2000
  return GlideScriptTest(retries)

  async function GlideScriptTest(r2 = retries) {
    if (options.shouldStop()) {
      log('Stopping thread')
      throw { code: 'EXECUTION_INTERRUPTED' }
    }
    if (r2 > 0) {
      log('Executing thread')
      return await window._covessa.tools.setTimeoutAsync(
        GlideScriptTest.bind(null, r2 - 1),
        delay
      )
    }
    log('Sending back response: ', value.value)
    return value.value
  }
}
