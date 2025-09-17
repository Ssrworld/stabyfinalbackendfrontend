// backend/src/services/sanitizer.service.js

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// jsdom का उपयोग करके एक वर्चुअल ब्राउज़र विंडो बनाएं
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * किसी भी HTML स्ट्रिंग को साफ करता है ताकि उसमें कोई खतरनाक स्क्रिप्ट न रहे।
 * यह <p>, <strong>, <em>, <ul>, <li> जैसे सुरक्षित टैग्स को रहने देता है।
 * @param {string} dirtyHtml - यूजर द्वारा भेजा गया असुरक्षित टेक्स्ट या HTML
 * @returns {string} - साफ और सुरक्षित HTML
 */
const sanitize = (dirtyHtml) => {
    if (!dirtyHtml) {
        return '';
    }
    // FORBID_ATTR विकल्प सुनिश्चित करता है कि style, onclick जैसे खतरनाक एट्रिब्यूट्स हटा दिए जाएं
    return DOMPurify.sanitize(dirtyHtml, { FORBID_ATTR: ['style', 'onerror', 'onload'] });
};

module.exports = { sanitize };