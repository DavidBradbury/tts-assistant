/*\
 * Quick utils for quickly getting things done, because who likes
 * writing document.querySelector('#id') all the time?
 * ---
 * Credits:
 * htmlToElement(s) by Mark Amery: https://stackoverflow.com/a/35385518/689129
\*/

const utils = (selector) => {
  let elements = document.querySelectorAll(selector)

  const api = {
    // Reduces the NodeList to the first element
    one: () => {
      elements = [elements[0]]
      return api
    },

    // Sets or gets the attribute(s) of the element(s)
    attr: (name, value) => {
      if (typeof value === 'undefined') {
        return elements[0].getAttribute(name)
      }
      elements.forEach((elem) => elem.setAttribute(name, value))
      return api
    },

    // Sets or gets the innerHTML of the element(s)
    html: (value) => {
      if (typeof value === 'undefined') {
        return elements[0].innerHTML
      }
      elements.forEach((elem) => (elem.innerHTML = value))
      return api
    },

    // Sets or gets the value of the element(s)
    val: (value) => {
      if (typeof value === 'undefined') {
        return elements[0].value
      }
      elements.forEach((elem) => (elem.value = value))
      return api
    },

    // Removes the class from the element(s)
    removeClass: (className) => {
      elements.forEach((elem) => elem.classList.remove(className))
      return api
    },

    // Adds the class to the element(s)
    addClass: (className) => {
      elements.forEach((elem) => elem.classList.add(className))
      return api
    },

    // Returns the api to access

    // Converts HTML string to a DOM Element
    htmlToElement: (html) => {
      const template = document.createElement('template')
      template.innerHTML = html.trim()
      return template.content.firstChild
    },

    // Converts HTML string to DOM Elements (NodeList)
    htmlToElements: (html) => {
      const template = document.createElement('template')
      template.innerHTML = html.trim()
      return template.content.firstChild
    },

    // Returns one element
    el: () => {
      return elements[0]
    },

    // Returns all elements
    els: () => {
      return elements
    },
  }

  return api
}

export { utils }
