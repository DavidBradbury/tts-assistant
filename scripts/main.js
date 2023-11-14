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
  let activeFileId = null

  const init = async () => {
    try {
      console.log('Thanks for using TTS Assistant!')
      await load()
      await setupInitialState()
      await refreshFileList()
      await selectFirstFile()
    } catch (error) {
      console.error(error)
    }
  }

  const load = async () => {
    const runTasks = [checkIndexDbSupport, setupUi]
    const results = await Promise.allSettled(runTasks.map((task) => task()))

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Task ${index} failed with error:`, result.reason)
        u('.error').one().removeClass('hidden').html(result.reason).el()
      }
    })
  }

  const saveFile = async () => {
    const textAreaValue = u('#input-text').one().val()
    const inputFilename = u('#filename-input').one().val().trim()

    // If the filename is empty, use the first 4 words of the text (Max 20 characters)
    const filename =
      inputFilename ||
      textAreaValue // "Suggest" a filename based on the text.
        .replace(/[^\w\s]|_/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .toLowerCase()
        .split(' ')
        .slice(0, 4)
        .join('-')
        .substring(0, 20)

    const fileData = {
      filename: filename,
      text: textAreaValue,
      audio: null, // Placeholder for audio file
    }

    const transaction = db.transaction(STORE_NAME_FILES, 'readwrite')
    const store = transaction.objectStore(STORE_NAME_FILES)
    const request = store.add(fileData)

    request.onsuccess = (event) => {
      const id = event.target.result
      console.log(`File with ID ${id} saved successfully.`)
      showSaveSuccess('File saved successfully!')
      refreshFileList()
    }

    request.onerror = (event) => {
      console.error('Error saving the file to the database', event.target.error)
      showError('Error saving the file to the database')
    }
  }

  const refreshFileList = async () => {
    const transaction = db.transaction(STORE_NAME_FILES, 'readonly')
    const store = transaction.objectStore(STORE_NAME_FILES)
    const request = store.openCursor()

    // Clear the current list
    const fileListElement = u('.sidebar ul').el()
    // Store this incase we need to revert back to it
    const revertHTML = fileListElement.innerHTML
    fileListElement.innerHTML = ''

    request.onsuccess = (event) => {
      const cursor = event.target.result

      if (cursor) {
        const file = cursor.value
        const key = cursor.key
        const listItemHtml = `
          <li class="flex justify-between items-center" style="width: calc(100% - var(--size-1x))">
            <button class="btn-sidebar" data-id="${key}">${file.filename}</button>
            <button class="btn-default btn-remove p-2 cursor-pointer" data-id="${key}">
              ❌
            </button>
          </li>
        `
        const listItemElement = u().htmlToElement(listItemHtml)
        fileListElement.appendChild(listItemElement)

        cursor.continue() // Move to the next object in the store
      } else {
        // Add event listeners for file buttons
        u('.btn-sidebar')
          .els()
          .forEach((button) => {
            button.addEventListener('click', (e) => {
              const fileId = e.target.getAttribute('data-id')
              selectFile(fileId)
            })
          })

        // Add event listeners for delete buttons
        u('.btn-remove')
          .els()
          .forEach((button) => {
            button.addEventListener('click', (e) => {
              const idToDelete = e.target.getAttribute('data-id')
              deleteFile(idToDelete)
            })
          })

        updateUiSelectedFile()
      }
    }

    request.onerror = (event) => {
      // Revert the list back to the original HTML
      fileListElement.innerHTML = revertHTML

      console.error(
        'Error fetching the files from the database',
        event.target.error
      )
      showError('Error fetching the files from the database')
    }
  }

  const deleteFile = (id) => {
    const transaction = db.transaction(STORE_NAME_FILES, 'readwrite')
    const store = transaction.objectStore(STORE_NAME_FILES)

    const request = store.delete(Number(id))

    request.onsuccess = () => {
      console.log(`File with ID ${id} deleted successfully.`)
      showSaveSuccess('File deleted successfully!')
      refreshFileList()
    }

    request.onerror = (event) => {
      console.error(
        'Error deleting the file from the database',
        event.target.error
      )
      showError('Error deleting the file from the database')
    }
  }

  const selectFile = async (id) => {
    const transaction = db.transaction(STORE_NAME_FILES, 'readonly')
    const store = transaction.objectStore(STORE_NAME_FILES)
    const request = store.get(Number(id))

    request.onsuccess = (event) => {
      const file = event.target.result
      if (file) {
        activeFileId = id
        u('#input-text').one().val(file.text)
        updateUiSelectedFile()
        console.log(`File with ID ${id} is selected.`)
      }
    }

    request.onerror = (event) => {
      console.error(`Error retrieving file with ID ${id}:`, event.target.error)
      showError(`Error retrieving file with ID ${id}`)
    }
  }

  const updateUiSelectedFile = () => {
    u('.btn-sidebar').attr('data-selected', false)
    u(`.btn-sidebar[data-id="${activeFileId}"]`).attr('data-selected', true)
  }

  const selectFirstFile = async () => {
    const transaction = db.transaction(STORE_NAME_FILES, 'readonly')
    const store = transaction.objectStore(STORE_NAME_FILES)
    const request = store.openCursor()

    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        selectFile(cursor.key)
      } else {
        console.log('No files to select.')
      }
    }

    request.onerror = (event) => {
      console.error('Error fetching the first file:', event.target.error)
      showError('Error fetching the first file')
    }
  }

  const setupUi = async () => {
    const modelSelect = u('#model').el()
    const voiceSelect = u('#voice').el()
    const formatSelect = u('#format').el()
    const speedSelect = u('#speed').el()

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
          u('#openai-key').el().value = '*'.repeat(apiKey.length)
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
          db.createObjectStore(STORE_NAME_FILES, { autoIncrement: true })
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
        const input = u('#openai-key').el()
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

  const showSaveSuccess = (message) => {
    u('#global-save').one().removeClass('hidden').html(message)

    setTimeout(() => {
      u('#global-save').one().addClass('hidden')
    }, 4000)
  }

  return {
    init,
    saveApiKey,
    refreshFileList,
    deleteFile,
    showSettings,
    showMain,
    saveFile,
  }
})()

await main.init()
window.main = main
