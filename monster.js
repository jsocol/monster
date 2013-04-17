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
    var args = Array.prototype.slice.call(arguments);
    args.unshift('leave');
    this.emit.apply(this, args);
};

State.prototype.enter = function enter() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('enter');
    this.emit.apply(this, args);
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

Transition.prototype.transition = function transition() {
    var args = Array.prototype.slice.call(arguments);
    var from = args.shift();
    var to = args.shift();

    from.leave.apply(from, args);
    args.unshift('transition');
    this.emit.apply(this, args);
    args.shift();
    to.enter.apply(to, args);
};

Transition.prototype.toString = function () {
    return 'Transition: ' + this.name;
};

function Monster () {
    var args = Array.prototype.slice.call(arguments);
    var initial = args.shift();
    this.state = initial || Uninitialized;
    this._states = {};
    this.state.enter.apply(this.state, args);
}

util.inherits(Monster, EventEmitter);

Monster.prototype.isFinal = function isFinal() {
    return !(this.state.name in this._states);
};

Monster.prototype.transition = function mTransition() {
    var args = Array.prototype.slice.call(arguments);
    var name = args[0];
    var cur = this.state;
    if (!this.isFinal() && name in this._states[cur.name]) {
        this.state = this._states[cur.name][name];
    } else {
        throw new InvalidTransition('Transition not valid from current state.');
    }
    this.emit('transition', cur, this.state);
    this.emit.apply(this, args);
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
        var args = Array.prototype.slice.call(arguments);
        args.unshift(trans.name);
        return self.transition.apply(self, args);
    };
    return this;
};

exports.State = State;
exports.Transition = Transition;
exports.Monster = Monster;
exports.Uninitialized = Uninitialized;
exports.InvalidTransition = InvalidTransition;
