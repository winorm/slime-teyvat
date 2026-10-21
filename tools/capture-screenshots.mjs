import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const devtoolsUrl = 'http://127.0.0.1:9222/json/list'
const baseUrl =
  process.env.CAPTURE_BASE_URL ?? 'https://winorm.github.io/slime-teyvat/'
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

const targets = await fetch(devtoolsUrl).then((response) => response.json())
const target = targets.find((item) => item.type === 'page')

if (!target) {
  throw new Error('No Edge page target found')
}

const socket = new WebSocket(target.webSocketDebuggerUrl)
const pending = new Map()
let nextId = 1

socket.onmessage = (event) => {
  const message = JSON.parse(event.data)

  if (!message.id) {
    return
  }

  const operation = pending.get(message.id)

  if (!operation) {
    return
  }

  pending.delete(message.id)

  if (message.error) {
    operation.reject(new Error(message.error.message))
  } else {
    operation.resolve(message.result)
  }
}

await new Promise((resolveOpen, rejectOpen) => {
  socket.onopen = resolveOpen
  socket.onerror = rejectOpen
})

function command(method, params = {}) {
  const id = nextId++

  socket.send(JSON.stringify({ id, method, params }))

  return new Promise((resolveCommand, rejectCommand) => {
    const timeout = setTimeout(() => {
      pending.delete(id)
      rejectCommand(new Error(`DevTools command timed out: ${method}`))
    }, 12000)

    pending.set(id, { resolve: resolveCommand, reject: rejectCommand })

    const originalResolve = resolveCommand
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timeout)
        originalResolve(value)
      },
      reject: (error) => {
        clearTimeout(timeout)
        rejectCommand(error)
      },
    })
  })
}

async function navigate(url, waitMs) {
  const result = await command('Page.navigate', { url })

  if (result.errorText) {
    throw new Error(`Navigation failed: ${result.errorText}`)
  }

  await sleep(waitMs)
}

async function key(code, keyValue, virtualKeyCode) {
  await command('Input.dispatchKeyEvent', {
    type: 'keyDown',
    code,
    key: keyValue,
    windowsVirtualKeyCode: virtualKeyCode,
    nativeVirtualKeyCode: virtualKeyCode,
  })
  await sleep(40)
  await command('Input.dispatchKeyEvent', {
    type: 'keyUp',
    code,
    key: keyValue,
    windowsVirtualKeyCode: virtualKeyCode,
    nativeVirtualKeyCode: virtualKeyCode,
  })
  await sleep(120)
}

async function screenshot(path) {
  const result = await command('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })

  writeFileSync(resolve(path), Buffer.from(result.data, 'base64'))
}

await command('Page.enable')
await command('Runtime.enable')
await command('Page.bringToFront')
await command('Emulation.setDeviceMetricsOverride', {
  width: 960,
  height: 540,
  deviceScaleFactor: 1,
  mobile: false,
})

await navigate(`${baseUrl}?domain=1&trial=2&fresh=1`, 3500)
const state = await command('Runtime.evaluate', {
  expression: `({
    href: location.href,
    hasCanvas: !!document.querySelector('canvas'),
    fatal: document.getElementById('fatal-box')?.textContent ?? ''
  })`,
  returnByValue: true,
})
console.log(state.result.value)
await screenshot('docs/screenshot-domain.png')

await navigate(`${baseUrl}?level=11&fresh=1&at=1700`, 2200)
await key('Space', ' ', 32)
await sleep(700)

for (let index = 0; index < 8; index++) {
  await key('KeyF', 'f', 70)
}

await sleep(2200)
await screenshot('docs/screenshot-childe.png')

socket.close()
console.log('Captured docs/screenshot-domain.png and docs/screenshot-childe.png')
