// ==UserScript==
// @name         higher lower helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  highlights the correct choice
// @author       moterrry
// @match        *://*.higherlowergame.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    const answers = new Map();
    let lastleft = "";
    let lastright = "";

    const originalopen = XMLHttpRequest.prototype.open;
    const originalsend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        this.myurl = url;
        return originalopen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
        this.addEventListener("load", function() {
            if (this.myurl && this.myurl.includes("questions/get/")) {
                try {
                    const data = JSON.parse(this.responseText);
                    processgamedata(data);
                } catch (e) {
                }
            }
        });
        return originalsend.apply(this, arguments);
    };

    const originalfetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalfetch(...args);
        const url = args[0];
        if (typeof url === "string" && url.includes("questions/get/")) {
            try {
                const clone = response.clone();
                clone.json().then(data => {
                    processgamedata(data);
                }).catch(e => {
                });
            } catch (e) {
            }
        }
        return response;
    };

    function processgamedata(data) {
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item && item.keyword && item.searchVolume !== undefined) {
                    answers.set(item.keyword.trim().toUpperCase(), item.searchVolume);
                }
            });
        }
    }

    fetch("https://www.higherlowergame.com/questions/get/general")
        .then(res => res.json())
        .then(data => {
            processgamedata(data);
        })
        .catch(err => {
        });

    function cleankeyword(text) {
        if (!text) return "";
        let cleaned = text.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        } else if (cleaned.startsWith("“") && cleaned.endsWith("”")) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        return cleaned.trim().toUpperCase();
    }

    function findvalue(keyword) {
        if (!keyword) return undefined;
        if (answers.has(keyword)) {
            return answers.get(keyword);
        }
        const normalize = (s) => s.replace(/[^A-Z0-9]/g, "");
        const normalizedtarget = normalize(keyword);
        for (const [key, value] of answers.entries()) {
            if (normalize(key) === normalizedtarget) {
                return value;
            }
        }
        for (const [key, value] of answers.entries()) {
            if (key.includes(keyword) || keyword.includes(key)) {
                return value;
            }
        }
        return undefined;
    }

    function clearhighlights() {
        document.querySelectorAll(".highlight").forEach(el => {
            el.classList.remove("highlight");
        });
    }

    function checkandhighlight() {
        const terms = document.querySelectorAll(".term-keyword__keyword");
        const higherbtn = document.querySelector(".term-actions__button--higher");
        const lowerbtn = document.querySelector(".term-actions__button--lower");

        if (terms.length < 2 || !higherbtn || !lowerbtn) {
            clearhighlights();
            return;
        }

        const leftterm = cleankeyword(terms[0].innerText);
        const rightterm = cleankeyword(terms[1].innerText);

        if (leftterm === lastleft && rightterm === lastright) {
            return;
        }

        lastleft = leftterm;
        lastright = rightterm;

        clearhighlights();

        const leftval = findvalue(leftterm);
        const rightval = findvalue(rightterm);

        if (leftval !== undefined && rightval !== undefined) {
            if (rightval >= leftval) {
                higherbtn.classList.add("highlight");
            } else {
                lowerbtn.classList.add("highlight");
            }
        }
    }

    function injectstyles() {
        if (document.getElementById("solverstyles")) return;
        const style = document.createElement("style");
        style.id = "solverstyles";
        style.innerHTML = `
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 10px rgba(76,175,80,0.6);
                    outline: 5px solid rgba(76,175,80,0.8) !important;
                }
                50% {
                    box-shadow: 0 0 25px rgba(76,175,80,1);
                    outline: 5px solid rgba(76,175,80,1) !important;
                }
                100% {
                    box-shadow: 0 0 10px rgba(76,175,80,0.6);
                    outline: 5px solid rgba(76,175,80,0.8) !important;
                }
            }
            .highlight {
                outline: 5px solid #4caf50 !important;
                outline-offset: 4px !important;
                border-radius: 8px !important;
                animation: pulse 1.5s infinite !important;
                transition: all 0.3s ease-in-out !important;
                position: relative !important;
                z-index: 9999 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function init() {
        injectstyles();
        setInterval(checkandhighlight, 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
