"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
function createBotPeddler() {
    var svg = document.getElementById("canvas");
    var peddler = document.createElementNS(svg.namespaceURI, 'bot');
    Object.entries({
        x: 0, y: 240,
        width: 15, height: 120,
        fill: '#FFFFFF'
    }).forEach(function (_a) {
        var key = _a[0], val = _a[1];
        return peddler.setAttribute(key, String(val));
    });
    svg.appendChild(peddler);
}

function createUser() {
    // get the svg canvas element
    var svg = document.getElementById("canvas");
    var peddler = document.createElementNS(svg.namespaceURI, 'user');
    Object.entries({
        x: 600, y: 240,
        width: 15, height: 120,
        fill: '#FFFFFF'
    }).forEach(function (_a) {
        var key = _a[0], val = _a[1];
        return peddler.setAttribute(key, String(val));
    });
    svg.appendChild(peddler);
    var commands = [
        { char: 'ArrowUp', x: 0, y: 10 },
        { char: 'ArrowDown', x: 0, y: -10 },
    ];
    var commandlist = commands.map(function (command) { return rxjs_1.fromEvent(document, "keydown").pipe(operators_1.filter(function (event) { return event.key === command.char; }), operators_1.map(function (_) { return command; })); });
    var move = function (command) {
        var bounding = svg.getBoundingClientRect();
        peddler.setAttribute('x', String(Math.max(0, Math.min(parseFloat(peddler.getAttribute('x')) + command.x, bounding.width - peddler.getBoundingClientRect().width))));
        peddler.setAttribute('y', String(Math.max(0, Math.min(parseFloat(peddler.getAttribute('y')) + command.y, bounding.height - peddler.getBoundingClientRect().height))));
    };
    //eewe
    commandlist[0].pipe(operators_1.merge(commandlist[1])).subscribe(function (command) { return move(command); });
}
function pong() {
    createUser();
    createBotPeddler();
    document.addEventListener("DOMContentLoaded", function (event) {
        createUser();
        createBotPeddler();
    });
    // Inside this function you will use the classes and functions 
    // from rx.js
    // to add visuals to the svg element in pong.html, animate them, and make them interactive.
    // Study and complete the tasks in observable exampels first to get ideas.
    // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/ 
    // You will be marked on your functional programming style
    // as well as the functionality that you implement.
    // Document your code!  
}
// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
    window.onload = function () {
        pong();
    };
