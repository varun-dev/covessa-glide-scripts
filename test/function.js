window.__function = async function App(delay, retries, options) {
  const log = options.getLogger()
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
      return await options.setTimeoutAsync(
        GlideScriptTest.bind(null, r2 - 1),
        delay
      )
    }
    log('Executing thread')
    return true
  }
}