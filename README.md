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

#### `Monster`

`Monster` objects emit several events. A few are common to all Monsters:

* `transition`, when any transition occurs, with two arguments, the old state
  and the new state. It does not get the arguments of the transiton.
* `final`, when the Monster enters a final state (i.e. there are no valid
  transitions from the new state).

Additionally, Monster emits events for each transition:

    nest.addTransition(new monster.Transition('build', null, built));
    nest.on('build', function() {
        console.log('The nest is built!');
    });

You may also pass arbitrary arguments to a transition:

    nest.on('build', function(where, by) {
        console.log('The nest was built', where, 'by', by);
    });
    nest.build('in the tree', 'a robin');


#### `Transition`

`Transition` objects emit one event:

* `transition`, when the transition occurs, with two arguments, the old state
  and the new state, followed by any arguments to the transition itself.

For example:

    var build = new monster.Transition('build', null, built);
    build.on('transition', function(from, to) {
        console.log('went from', from, 'to', to);
        console.log(arguments);
    });
    nest.addTransition(build);

    nest.build('job\'s done');


#### `State`

`State` objects emit two events:

* `enter`, when entering the state. This gets any arguments passed to the
  transition (the initial state will emit an `enter` event with any additional
  arguments passed to the `Monster` constructor).
* `leave`, when leaving the state.

For example:

    var empty = new monster.State('empty');
    built.on('enter', function(by) {
        console.log('emptied by', by);
    });
    built.on('leave', function() {
        console.log('not empty anymore');
    });
    var basket = new monster.Monster(empty, 'the wind');

    var full = new monster.State('full');
    full.on('enter', function(by) {
        console.log('filled by', by);
    });
    var fill = new monster.Transition('fill', empty, full);
    basket.addTransition(fill);

    basket.fill('Steve the Pirate');
    // Or...
    basket.transition('fill', 'Steve the Pirate');


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


## Advanced Example

> I do not endorse this as a good way to build a game, it's just an instructive
> example.

There are some interesting tricks you can use, such as using the same names for
several transitions, to implement fairly complex machinery. For example, a very
simple game unit might look like this:

    var healthFull = new monster.State('healthFull'),
        health70 = new monster.State('health70'),
        health50 = new monster.State('health50'),
        health30 = new monster.State('health30'),
        dead = new monster.State('dead');
    var unit = new monster.Monster(healthFull);

    unit.addTransition(new monster.Transition('damage', healthFull, health70));
    unit.addTransition(new monster.Transition('damage', health70, health50));
    unit.addTransition(new monster.Transition('damage', health50, health30));
    unit.addTransition(new monster.Transition('damage', health30, dead));

    unit.addTransition(new monster.Transition('heal', health30, health50));
    unit.addTransition(new monster.Transition('heal', health50, health70));
    unit.addTransition(new monster.Transition('heal', health70, healthFull));

    // Heal over time.
    setInterval(function() {
        if (unit.state !== healthFull && unit.state !== dead) {
            unit.heal();
        }
    }, 30000);

    unit.damage();  // unit.state === health70
    unit.damage();  // unit.state === health50
    unit.heal();  // unit.state === health70


You could also be more fine-grainedby expanding a `Monster` object. This also
demonstrates that state names are optional, if you don't like the redundancy.

    // Assume we have a Sprite() class.

    var full_health = new Sprite('unit_full_health.png'),
        bleeding = new Sprite('unit_bleeding.png'),
        dying = new Sprite('unit_dying.png'),
        died = new Sprite('unit_dead.png');

    var alive = new State(),
        dead = new State();

    var unit = new Monster(alive);
    unit.maxHealth = unit.health = 100;
    unit.sprite = full_health;

    unit.addTransition(new Transition('damage', alive, alive));
    unit.addTransition(new Transition('heal', alive, alive));
    unit.addTransition(new Transition('die', alive, dead));

    unit.on('damage', function(amt) {
        this.health -= (amt || 1);
        if (this.health <= 0) {
            this.die();
        }
        else if (this.health < 50) {
            this.sprite = dying;
        }
        else {
            this.sprite = bleeding;
        }
    });

    unit.on('heal', function(amt) {
        if (this.health < this.maxHealth) {
            this.health += (amt || 1);
        }
        else {
            this.health = this.maxHealth;
        }

        if (this.health < 50) {
            this.sprite = dying;
        }
        else if (this.health < this.maxHealth) {
            this.sprite = bleeding;
        }
        else {
            this.sprite = full_health;
        }
    });

    unit.on('die', function() {
        this.sprite = died;
    });

    // During the game:
    unit.damage(10);
    unit.damage(14);
    unit.health;  // 76
    unit.sprite;  // bleeding
    unit.damage(50);
    unit.sprite;  // dying
    unit.heal(70);
    unit.sprite;  // bleeding
    unit.heal(30);
    unit.sprite;  // full_health
    unit.damage(300);
    unit.state;  // dead
    unit.isFinal();  // true


## TODO

* AMD, require.js, or another way to use Monster in a browser would be nice.
* Some sort of test suite.


## License

Monster is distributed under the MIT/X11 license and is free software. See the
`LICENSE` file for more information.
