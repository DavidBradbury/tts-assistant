/*\
 * Quick utils for quickly getting things done, because who likes
 * writing document.querySelector('#id') all the time?
 * ---
 * Credits:
 * htmlToElement(s) by Mark Amery: https://stackoverflow.com/a/35385518/689129
\*/

const utils = (() => {
    const one = (selector) => document.querySelector(selector)
    const all = (selector) => document.querySelectorAll(selector)

    // Set or get an attribute from an element
    const attr = (elem, name, value) => {
        if (typeof value === 'undefined') {
            return elem.getAttribute(name)
        }
        elem.setAttribute(name, value)
        return this // To allow chaining
    }

    /**
     * Converts HTML string to a DOM Element
     * @param {String} HTML representing a single element
     * @return {Element}
     */
    const htmlToElement = (html) => {
        const template = document.createElement('template')
        html = html.trim()
        template.innerHTML = html
        return template.content.firstChild
    }

    /**
     * Converts HTML string to DOM Elements (NodeList)
     * @param {String} HTML representing any number of sibling elements
     * @return {NodeList}
     */
    const htmlToElements = (html) => {
        const template = document.createElement('template')
        template.innerHTML = html
        return template.content.childNodes
    }

    return {
        one,
        all,
        attr,
        htmlToElement,
        htmlToElements,
    }
})()

export { utils }
