# Monster

*Monster* helps you build and manipulate Finite State Machines (and/or [Flying
Spaghetti Monsters](http://www.venganza.org/)). It tries to offer a simple,
Node-like API based on EventEmitters, with just enough automagic to make things
easy.


## Example: A connection

To define a connection that can be new, open, or closed, you might define a
small FSM:

    var monster = require('monster');
    var opened = new monster.State('opened');
    var closed = new monster.State('closed');
    var conn = new monster.Monster();
    conn.addTransition(new monster.Transition('open', null, opened));
    conn.addTransition(new monster.Transition('close', opened, closed));

    conn.state;
    // monster.Uninitialized
    conn.on('open', function() {
        // Open a connection here.
    });
    conn.close(); // Not opened yet:
    // throw monster.InvalidTransition
    conn.open();
    conn.state;
    // opened
    conn.close();
    conn.isFinal();
    // true


## States

A `State` object is a simple named object that represents one state of the FSM.
An FSM may only be in one State at a time. States emit two events: `enter` and
`leave`, with no arguments.

Monster defines a default state, `monster.Uninitialized`, which is the starting
state of any FSM, unless otherwise specified.

    var myState = new monster.State('myState');
    myState.on('enter', function() { console.log('entered myState'); });
    myState.on('leave', function() { console.log('left myState'); });


## Transitions

`Transition`s define how the FSM is allowed to change states. Transitions also
provide verbs to the FSM. They emit a single `transition` event with two
arguments, `from` and `to`, which are both `State` objects.

The constructor arguments are `(name, from, to)`:

    var start = new monster.Transition('start', null, started);
    var stop = new monster.Transition('stop', started, stopped);

The `from` argument must be one of:

* `null`, which is a shortcut for the `monster.Uninitialized` state.
* A `State`.
* An array of `State`s.

The `to` argument must be a `State`. The `name` argument must be a string and
should be a reasonable verb, for example, "start" or "stop", "open" or "close".


## Monsters

`Monster` objects represent the actual Finite State Machines. They infer their
possible `State`s from `Transition`s. The API and events are dynamic, and based
on the possible transitions.

By default, all `Monster`s start in the `monster.Uninitialized` state, but this
can be overridden by passing another initial state to the constructor:

    var basket = new monster.Monster(new State('empty'));


### Methods

There are only a few methods common to all `Monster`s:

    // Create an Uninitialized Monster:
    var nest = new monster.Monster();

    // Add a new Transition with addTransition:
    nest.addTransition(new monster.Transition('build', null, built));

    // Is the Monster in a final state (i.e. are there any transitions away
    // from the current state)?
    nest.isFinal();  // false

    // Monster.transition is a consistent way to invoke any Transition:
    nest.transition('build');

Monster also automatically adds a method for each transition, so you can write
more readable code:

    nest.build();  // Equivalent to nest.transition('build');

Transitions are only allowed from certain states. If you try to transition from
any other state, Monster raises `monster.InvalidTransition`:

    nest.state === monster.Uninitialized;  // true
    nest.build();
    nest.state === built;  // true
    nest.build();  // throw new monster.InvalidTransition()


### Events

`Monster` objects emit several events. A few are common to all Monsters:

* `transition`, when any transition occurs, with two arguments, the old state
  and the new state.
* `final`, when the Monster enters a final state (i.e. there are no valid
  transitions from the new state).

Additionally, Monster emits events for each transition:

    nest.addTransition(new monster.Transition('build', null, built));
    nest.on('build', function() {
        console.log('The nest is built!');
    });


### Exceptions

`monster.InvalidTransition` is thrown when an FSM is not in a valid starting
state for a given transition. For example, if a connection must be `opened`
before it can be `closed`, calling `close` on an un-opened connection might
throw an error:

    var conn = new Monster();
    conn.addTransition(new Transition('open', null, opened));
    conn.addTransition(new Transition('close', opened, closed));

    conn.close();  // throw InvalidTransition

Similarly, opening an already open connection:

    conn.open();
    conn.open();  // throw InvalidTransition


## TODO

* AMD, require.js, or another way to use Monster in a browser would be nice.
* Some sort of test suite.
* Make it possible to emit custom data with transitions.


## License

Monster is distributed under the MIT/X11 license and is free software. See the
`LICENSE` file for more information.
