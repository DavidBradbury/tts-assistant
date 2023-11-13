import { utils as u } from './utils.js'
import { OPEN_AI_VARS } from './data.js'

const ERRORS = {
  NO_INDEXEDDB:
    "Sorry, this application requires IndexedDB and it's not supported by your browser",
  OPEN_DB_ERROR:
    'Error opening database, try clearing your browser cache and reloading the page',
}

const STATES = {
  LOADING: 'loading',
  SETTINGS: 'settings',
  MAIN: 'main',
}

const DB_KEY = 'tts-assistant'
const DB_VERSION = 1

const STORE_NAME_SETTINGS = 'settings'
const STORE_NAME_FILES = 'files'

const OBJECT_STORE_OPEN_API_KEY = 'openai-api-key'

const main = (() => {
  let state = STATES.LOADING
  let db = null
  let apiKey = null

  const init = async () => {
    try {
      console.log('Thanks for using TTS Assistant!')
      await load()
      await setupInitialState()
    } catch (error) {
      console.error(error)
    }
  }

  const load = async () => {
    const runTasks = [checkIndexDbSupport, setupUi, loadFiles]
    const results = await Promise.allSettled(runTasks.map((task) => task()))

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Task ${index} failed with error:`, result.reason)
        u('.error').one().removeClass('hidden').html(result.reason).el()
      }
    })
  }

  const setupUi = async () => {
    const modelSelect = u('#model').one().el()
    const voiceSelect = u('#voice').one().el()
    const formatSelect = u('#format').one().el()
    const speedSelect = u('#speed').one().el()

    OPEN_AI_VARS.model.forEach((model) => {
      const optionHtml = `<option value="${model}">${model}</option>`
      const optionElement = u().htmlToElement(optionHtml)
      modelSelect.add(optionElement)
    })

    OPEN_AI_VARS.voices.forEach((voice) => {
      const optionHtml = `<option value="${voice}">${voice}</option>`
      const optionElement = u().htmlToElement(optionHtml)
      voiceSelect.add(optionElement)
    })

    OPEN_AI_VARS.response_format.forEach((format) => {
      const optionHtml = `<option value="${format}">${format}</option>`
      const optionElement = u().htmlToElement(optionHtml)
      formatSelect.add(optionElement)
    })

    const speedMin = OPEN_AI_VARS.speed_range[0]
    const speedMax = OPEN_AI_VARS.speed_range[1]
    let speed = speedMin

    // Start the range with 1 as the first option
    const range = [1]
    while (speed <= speedMax) {
      range.push(speed)
      speed += 0.25
    }

    range.forEach((speed) => {
      const fixed = speed.toFixed(2)
      const optionHtml = `<option value="${speed}">${fixed}</option>`
      const optionElement = u().htmlToElement(optionHtml)
      speedSelect.add(optionElement)
    })
  }

  const setupInitialState = async () => {
    db = await openDatabase()
    try {
      const result = await getApiKey()
      apiKey = result.value
    } catch (error) {
      console.log('API key not found, showing settings screen')
      updateState(STATES.SETTINGS)
      return
    }

    console.log('API key found!')
    console.log(apiKey)
    updateState(STATES.MAIN)
  }

  const updateState = (newState) => {
    state = newState
    render()
  }

  const showSettings = () => {
    updateState(STATES.SETTINGS)
  }

  const showMain = () => {
    updateState(STATES.MAIN)
  }

  const render = () => {
    // Hide all pages
    u('.page').attr('data-show', false)

    switch (state) {
      case STATES.SETTINGS:
        if (apiKey) {
          u('#openai-key').one().el().value = '*'.repeat(apiKey.length)
          u('#btn-settings-cancel').one().removeClass('hidden')
        }

        u('#page-settings').one().attr('data-show', true)
        break
      case STATES.MAIN:
        u('#page-main').one().attr('data-show', true)
        break
    }
  }

  const checkIndexDbSupport = () => {
    if (!('indexedDB' in window)) throw new Error(ERRORS.NO_INDEXEDDB)
  }

  const openDatabase = async () => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_KEY, DB_VERSION)

      request.onerror = (event) => {
        reject(new Error(ERRORS.OPEN_DB_ERROR))
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        if (!db.objectStoreNames.contains(STORE_NAME_SETTINGS)) {
          db.createObjectStore(STORE_NAME_SETTINGS, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(STORE_NAME_FILES)) {
          db.createObjectStore(STORE_NAME_FILES, { keyPath: 'id' })
        }

        resolve(db)
      }

      request.onsuccess = (event) => {
        resolve(event.target.result)
      }
    })
  }

  // Get The OpenAI API Key from IndexedDB
  const getApiKey = async () => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME_SETTINGS)
        const store = transaction.objectStore(STORE_NAME_SETTINGS)
        const request = store.get(OBJECT_STORE_OPEN_API_KEY)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      } catch (error) {
        showError(error)
      }
    })
  }

  const saveApiKey = async () => {
    return new Promise((resolve, reject) => {
      try {
        const input = u('#openai-key').one().el()
        const apiKeyValue = input.value

        // Don't save the API key if it's empty
        if (!apiKeyValue) {
          // Show the main screen if the API key is already saved
          // This allows the user to 'escape' the settings screen
          // If they don't want to save the API key
          if (apiKey) {
            showMain()
            resolve()
            return
          }

          throw new Error('API key is required')
          return
        }

        // Don't save the API key if it's the placeholder
        if (apiKeyValue.includes('*')) {
          showMain()
          resolve()
          return
        }

        const transaction = db.transaction(STORE_NAME_SETTINGS, 'readwrite')
        const store = transaction.objectStore(STORE_NAME_SETTINGS)
        const apiKeyObject = {
          id: OBJECT_STORE_OPEN_API_KEY,
          value: apiKeyValue,
        }
        const request = store.put(apiKeyObject)

        request.onsuccess = () => {
          input.value = '' // Clear the input
          showMain()
          resolve()
        }
        request.onerror = () => reject(request.error)
      } catch (error) {
        showError(error)
        reject(error)
      }
    })
  }

  const showError = (message) => {
    console.error(message)
    u('#global-error').one().removeClass('hidden').html(message)

    setTimeout(() => {
      u('#global-error').one().addClass('hidden')
    }, 8000)
  }

  const loadFiles = async () => {
    // todo
  }

  return {
    init,
    saveApiKey,
    showSettings,
    showMain,
  }
})()

await main.init()
window.main = main
