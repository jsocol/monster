// vim: tw=79 cc=+1
var EventEmitter = require('events').EventEmitter,
    util = require('util');

function State (name) {
}

util.inherits(State, EventEmitter);

function Transition () {
}

util.inherits(Transition, EventEmitter);

function Monster () {
}

util.inherits(Monster, EventEmitter);

exports = {
    'State': State,
    'Transition': Transition,
    'Monster': Monster
}
