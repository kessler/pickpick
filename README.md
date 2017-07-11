# Experiments Engine

A/B testing engine (aka experiments)

- An experiement is composed of variations
- Each variation can have an arbitraty integer weight
- An experiment may return nothing from pick(), meaning that the provided targeting did not match any variation or sub experiments variations

## Quick and dirty example

Let's say we have a website with two pages `buy` and `index` and we want to run 3 experiments:
- on the `buy` page test `color button`
- on the `buy` page test `price`
- on the `index` page test `text`

### simple example:
```
const { Experiment, ExperimentContainer, Targeting, matchers, Variation } = require('./index')

// first create the experiments:

let e1 = Experiment.create({
    name: 'buy page button color experiment',
    variations: ['#ff0000', '#00ff00'], // shorthand for [ Variation.create({ object: '#ff0000', weight: 1 }), Variation.create({ object: '#00ff00', weight: 1 } ]
    targeting: { page: 'buy' } // shorthand for Targeting.create({ page: matchers.isExactly('buy') })
})

let e2 = Experiment.create({
    name: 'buy page price experiment',
    variations: [25, 35, 45],
    targeting: { page: 'buy' }
})

let e3 = Experiment.create({
    name: 'index text experiment',
    variations: ['hi', 'hello', 'welcome'],
    targeting: { page: 'index' }
})

// now create a container:
let container = ExperimentContainer.create([ e1, e2, e3 ])

// simulate a visitor that needs a determination about which variation of which experiment he gets:
let visitor = { page: 'buy' }
let experiment = container.pick(visitor)

if (!experiment) {
    // no experiment that targets this user
    // handle this with defaults
} else {
    console.log(`selected experiment ${experiment.toString()} for ${JSON.stringify(visitor)}`)
    let variation = experiment.pick()
    console.log(`selected variation is ${variation}`)
}
```


