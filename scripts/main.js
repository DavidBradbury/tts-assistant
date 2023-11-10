import { utils as u } from './utils.js'

const main = (() => {
    const init = () => {
        const app = u.one('body')
        const h1 = u.htmlToElement('<h1>Hello, TTS Assistant!</h1>')
        app.appendChild(h1)
    }

    return {
        init,
    }
})()

main.init()
