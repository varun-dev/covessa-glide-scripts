window.__function = function App(columnId, delay, retries, tools) {
  const log = tools.getLogger()
  retries = retries.value || 5
  delay = delay.value || 2000
  let interrupt = false
  const fn = async function GlideScriptTest(r2 = retries) {
    log('Executing')
    if (interrupt) throw { code: 'EXECUTION_INTERRUPTED' }
    if (r2 > 0) {
      return await tools.setTimeoutAsync(
        GlideScriptTest.bind(null, r2 - 1),
        delay
      )
    }
    return true
  }
  const clear = function interruptScript() {
    log('Stopping thread')
    interrupt = true
  }
  return { fn, clear }
}
