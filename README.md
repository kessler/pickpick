# Experiments Engine

A/B testing engine (aka experiments)

## Quick and dirty example

Let's say we have a website with two pages `buy` and `index` and we want to run 3 experiments:
- on the `buy` page test `color button`
- on the `buy` page test `price`
- on the `index` page test `text`

### simple example:
```js
const { Experiment, ExperimentContainer, Targeting, matchers, Variation } = require('./index')

// first create the experiments:

let e1 = Experiment.create({
    name: 'buy page button color experiment',
    id:'953d6fe0',
    variations: ['#ff0000', '#00ff00'], // shorthand for [ Variation.create({ object: '#ff0000', weight: 1 }), Variation.create({ object: '#00ff00', weight: 1 } ]
    targeting: { page: 'buy' } // shorthand for Targeting.create({ page: matchers.isExactly('buy') })
})

let e2 = Experiment.create({
    name: 'buy page price experiment',
    id:'a40f09ac',
    variations: [25, 35, 45],
    targeting: { page: 'buy' }
})

let e3 = Experiment.create({
    name: 'index text experiment',
    id:'ac49ef42',
    variations: ['hi', 'hello', 'welcome'],
    targeting: { page: 'index' }
})

// now create a container:
let experiments = [e1, e2, e3]
let container = ExperimentContainer.create({ experiments })

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

### summary of tests
```
      Experiment picks a variation
        ✓ based on even weights
        ✓ based on uneven weights
        ✓ variation input can be written in a short form, if weights are even
        ✓ targeting input can be written in short form using javascript object
        ✓ can be serialized into json
        ✓ can be deserialized from json

      ExperimentContainer is a container for experiments
        ✓ when constructing a container, experiments can be defined using short json form
        ✓ which can be added to the container using add()
        ✓ that collects all the targeting features from each experiment added to it
        ✓ so one can check if experiment is a part of it by id
        ✓ and have a unique id
        that lets a user pick an experiment that matches a targeting experssion
          ✓ using the pick(targeting) method
          ✓ and will return nothing if an experiment matching the targeting is not found
          when more then one experiment matches the targeting expression
            ✓ the container will select the result randomly (59ms)
            ✓ the container will select the result randomly, but with predefined bias (44ms)
        serialization/deserialization to json
          ✓ serializes to json
          - deserializes from json

      Targeting represents a mapping between features and stateful operators (Matchers)
        ✓ to create a targeting, specify an expression of features and matchers in the constructor
        ✓ that experssion can use all the short forms used in expressing matchers (matchers.valueOf(...))
        ✓ exposes features and matchers via an iterator
        ✓ can be queried for features/matchers combinations using has()
        the match() method accepts an input and test it
          ✓ throws an error if input is null or undefined
          ✓ the default targeting matches everything
          ✓ against each feature specified in the targeting expression provided in the constructor
          ✓ features in the input that containing unmatched values will fail the whole match()
          ✓ only features in the targeting are tested, other features are ignored
          ✓ all the features in the targeting must exist in the input
          ✓ unrelated inputs fail the match()

      Variation is a combination of a value (name object sadly) and a weight
        ✓ assigns an automatic weight of 1 if none is specified
        ✓ does not allow setting a weight that is not a number
        ✓ does not allow setting a weight that is not an integer
        ✓ does not allow setting a weight lower than one

      expressMiddleware can be used to run an experminets container inside an express application
        ✓ collects feature data from the request object, picks and experiment and a variation and places them back in the request object under the pickpick property

      Matchers are a bunch of stateful operators
        ✓ isExactly() returns true if the tested value matches the initial value exactly (===)
        ✓ isNot() returns true if the tested value does not match the initial value exactly (===)
        ✓ isAny() returns true for any tested value
        ✓ isIn returns true if the tested value is included in the array of initial values
        ✓ and returns true if tested value matches all conditions (expressed as matchers) in the initial value
        valueOf() takes a string and returns an appropriate matcher for it
          ✓ returns an isAny matcher for '*'
          ✓ throws an error for anything else
          returns an isIn matcher
            ✓ for any array
            ✓ that only matches the values inside the array argument
          returns an isExactly matcher
            ✓ for any string that is not '*'
            ✓ that only matches the string value argument
            ✓ for any number
            ✓ that only matches the numeric value argument
            ✓ for any boolean
            ✓ that only matches the boolean value argument
```

## matching / targeting short forms
todo: document

## serializing / deserializing
todo: toJSON for Targeting

