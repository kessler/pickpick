const loadbalance = require('loadbalance')
const Targeting = require('./Targeting')
const Experiment = require('./Experiment')
const Variation = require('./Variation')
const debug = require('debug')('pickpick:ExperimentContainer')

let _targetingFeatures = Symbol('_targetingFeatures')
let _seed = Symbol('_seed')
let _experiments = Symbol('_experiments')

/**
 *    Contains one or more experiments and routes traffic evenly to each of them based on their
 *    targeting. The following is an example of using a container to host several experiments, pick
 *    on thats appropriate for a single visitor's targeting and then access a variation from the
 *    selected experiment:
 *
 *    ```js
 *    const { ExperimentContainer, Experiment } = require('pickpick')
 *
 *	const experiments = [
 * 		Experiment.create(...),
 *   		Experiment.create(...),
 *   		Experiment.create(...)
 *	]
 *
 *    const container = ExperimentContainer.create({ experiments })
 *
 *    let experiment = container.pick({ geo: 'US', page: 'index.html '})
 *    if (experiment) {
 *    	let variation = experiment.pick()
 *    	// do something with the variation data
 *    } else {
 *    	console.log('no experiments that match this targeting were found')
 *    }
 *
 *    ```
 */
class ExperimentContainer {
	/**
	 *	create a new container
	 *
	 *  @param {number} __seed - just for testing / predictable engine results
	 *
	 */
	constructor(__seed) {
		this[_experiments] = []
		this[_seed] = __seed
		this[_targetingFeatures] = new Set()
	}

	// TODO: it might be better to provide separate forms of this method
	// to make the API more clear and less prone to errors.
	// In that case we'll still have to have a separate method for deserialization
	/**
	 *	Add an experiment to this container. Inside a container experiments must
	 *	have unique ids. This method can accept different kinds of experiment expressions:
	 *	- an instance of Experiment:
	 *	```js
	 *	container.add(Experiment.create(...))
	 *	```
	 *	- An instance of Variation where it's object is an Experiment:
	 * 	```js
	 *  	container.add(Variation.create(Experiment.create(...)))
	 *   	````
	 *	- An instance of Variation where it's object is an Expriment defined as an object literal:
	 *	```js
	 *	container.add(Variation.create({... experiment data ...}))
	 *	```
	 *	- A variation object literal wrapping an experiment object literal, this is useful in deserialization scenarios:
	 *	```js
	 *	container.add({ object: {... experiment data }, weight: 5 })
	 *	```
	 *
	 *	@param {...Variation|...Experiment|...Object} experiments - can add one or more of the following:
	 *
	 */
	add(...experiments) {
		for (let experiment of experiments) {
			let variation

			if (experiment instanceof Experiment) {
				// item is an experiment, so wrap it inside a variation
				variation = Variation.create({ object: experiment })
			} else if (experiment instanceof Variation) {
				// experiment is a variation, make sure it's object is an experiment
				variation = experiment
				let actualExperiment = variation.object

				if (!(actualExperiment instanceof Experiment)) {
					actualExperiment = Experiment.create(actualExperiment)
					// variation is immutable, so need to create a new one with the
					// experiment instance
					variation = Variation.create({
						object: actualExperiment,
						weight: variation.weight
					})
				}
			} else {
				// the item is an object listeral of a variation or an experiment
				variation = _variationFromObjectLiteral(experiment)
			}

			this._addExperimentVariation(variation)
		}
	}

	/**
	 *    The pick method accepts a targeting object and randomly selects an experiment
	 *    from a set of experiments that match the targeting specification.
	 *
	 *    By default, selection is random and even, however, bias can be applied by specifying a weight
	 *    when adding an experiment to the container (see ExperimentContainer.add())
	 *
	 *    Weights are considered at the moment of selection from the current set of
	 *    matching experiments, therefor, careful planning of targeting is required to achieve
	 *    accurate traffic distribution betwee experiments.
	 *
	 *    For example, consider two experiments, `E1`, that targets `{ geo: 'US', page: '*' }` and `E2` that targets
	 *    `{ geo: 'US', page: 'index.html' }`. If both had the weight `1`, given the following stream
	 *    of visitors:
	 *    ```
	 *    { geo: 'US', page: 'sale.html' }
	 *    { geo: 'US', page: 'index.html' }
	 *    { geo: 'US', page: 'sale.html' }
	 *    { geo: 'US', page: 'index.html' }
	 *    ````
	 *
	 *    Then it is more likely that `E1` will receive more traffic than `E2` since `E1` competes with `E2` evenly on `index.html`
	 *    page but not on `sale.html`
	 *
	 *    @param  {Targeting} targeting
	 *    @return {Experiment} an experiment that matches this targeting or null if none is found.
	 */
	pick(targeting) {
		let candidates = []

		for (let experiment of this[_experiments]) {
			if (experiment.object.match(targeting)) {
				candidates.push(experiment)
			}
		}

		if (candidates.length === 0) {
			return null
		}

		// TODO optimization point, maybe not create a new engine every pick()
		// even though it's not the most expansive operation, so for now its good enough

		// seed is for testing purposes
		let engine = loadbalance.random(candidates, this[_seed])

		return engine.pick()
	}

	/**
	 *    An iterator over all the targeting features from all the experiments
	 *    added to this container
	 *
	 *    @return {Iterator}
	 */
	get targetingFeatures() {
		return this[_targetingFeatures].values()
	}

	/**
	 *    iterate over all the experiments in this container:
	 *    ```
	 *    let container = ExperimentContainer.create(...)
	 *
	 *    for (let experiment of container) {
	 *    	console.log(experiment.id)
	 * 	}
	 *    ```
	 *
	 *    @return {ObjectIterator}
	 */
	[Symbol.iterator]() {
		return Variation.objectIterator(this[_experiments])
	}

	/**
	 *    check if this container contains the specified experiment
	 *    @param  {Expriment}  experiment
	 *    @return {Boolean}
	 */
	has(experiment) {
		if (!(experiment instanceof Experiment))
			throw new Error(
				'ExperimentContainer.has() accepts only Experiment instances'
			)
		return this.hasId(experiment.id)
	}

	/**
	 *    check if this container contains an experiment using an id
	 *    @param  {String}  experimentId
	 *    @return {Boolean}
	 */
	hasId(experimentId) {
		if (!experimentId) return false
		for (let containerExperiment of this) {
			if (experimentId === containerExperiment.id) return true
		}
		return false
	}

	/**
	 *    serialize this container with all it's experiments
	 *
	 *    @return {Object}
	 */
	toJSON() {
		let experiments = []
		for (let experiment of this[_experiments]) {
			experiments.push(experiment.toJSON())
		}

		return { experiments, _seed: this[_seed] }
	}

	_addExperimentVariation(variation) {
		let experiment = variation.object

		if (this.has(experiment)) {
			throw new Error(
				`experiment with id "${
					experiment.id
				}" was already added to this container`
			)
		}

		// collect all the possible targeting keys from all the experiments in the container
		for (let feature of experiment.targeting) {
			this[_targetingFeatures].add(feature)
		}

		this[_experiments].push(variation)
	}

	static create({ experiments = [], _seed } = {}) {
		let container = new ExperimentContainer(_seed)

		container.add(...experiments)

		return container
	}
}

function _variationFromObjectLiteral(rawJson) {
	let json = rawJson

	if (!json.object && !json.weight) {
		let err = new Error('invalid variation literal')
		err.data = rawJson
		throw err
	}

	let rawExperiment = json.object
	let weight = json.weight

	let experiment = Experiment.create(rawExperiment)

	return Variation.create({ object: experiment, weight })
}

module.exports = ExperimentContainer
