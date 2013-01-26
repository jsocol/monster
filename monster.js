// vim: tw=79 cc=+1
var EventEmitter = require('events').EventEmitter,
    util = require('util');

function InvalidTransition (msg) {
    this.message = msg;
}

InvalidTransition.prototype.toString = function () {
    return this.message;
};

function State (name) {
    this.name = name;
}

util.inherits(State, EventEmitter);

State.prototype.leave = function leave() {
    this.emit('leave');
};

State.prototype.enter = function enter() {
    this.emit('enter');
};

State.prototype.toString = function () {
    return 'State: ' + this.name;
};

var Uninitialized = new State('uninitialized');

function Transition (name, from, to) {
    this.name = name;
    if (from) {
        if (from instanceof Array) {
            this.from = from;
        } else {
            this.from = [from];
        }
    } else {
        this.from = [Uninitialized];
    }
    this.to = to;
}

util.inherits(Transition, EventEmitter);

Transition.prototype.transition = function transition(from, to) {
    from.leave();
    this.emit('transition', from, to);
    to.enter();
};

Transition.prototype.toString = function () {
    return 'Transition: ' + this.name;
};

function Monster (initial) {
    this.state = initial || Uninitialized;
    this._states = {};
}

util.inherits(Monster, EventEmitter);

Monster.prototype.isFinal = function isFinal() {
    return !(this.state.name in this._states);
};

Monster.prototype.transition = function mTransition(name) {
    var cur = this.state;
    if (!this.isFinal() && name in this._states[cur.name]) {
        this.state = this._states[cur.name][name];
    } else {
        throw new InvalidTransition('Transition not valid from current state.');
    }
    this.emit('transition', cur, this.state);
    this.emit(name);
    if (this.isFinal()) {
        this.emit('final');
    }
    return this;
};

Monster.prototype.addTransition = function addTransition(trans) {
    var self = this;
    for (var i = 0; i < trans.from.length; i++ ) {
        var from = trans.from[i].name;
        this._states[from] = this._states[from] || [];
        this._states[from][trans.name] = trans.to;
    }
    this[trans.name] = function() {
        return self.transition(trans.name);
    };
    return this;
};

exports.State = State;
exports.Transition = Transition;
exports.Monster = Monster;
exports.Uninitialized = Uninitialized;
exports.InvalidTransition = InvalidTransition;
