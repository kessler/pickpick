const loadbalance = require('loadbalance')
const Targeting = require('./Targeting')
const Experiment = require('./Experiment')
const Variation = require('./Variation')

let _targetingFeatures = Symbol('_targetingFeatures')
let _seed = Symbol('_seed')
let _experiments = Symbol('_experiments')

class ExperimentContainer {

	/**
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
	 *	have unique ids. This method can accept any kind of legal experiment definition
	 *	as described below
	 *
	 *	@param {...*} experiments - can add one or more of the following:
	 *						- an instance of Experiment, e.g `Experiment.create(...)`
	 *						- an instance of Variation where it's object is either:
	 *							- instance of Experiment, e.g `Variation.create(Experiment.create(...))`
	 *							- pure json definition of an Experiment, e.g `Variation.create({... experiment data})`
	 *						- literal of an Experiment, e.g `{... experiment json }`
	 *						- literal object of a Variation with an experiment as
	 *						it's object, e.g `{ object: {...experiment data}, weight: 2 } `
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
					let actualExperiment = Experiment.create(actualExperiment)
					variation = Variation.create({ object: actualExperiment, weight: variation.weight })
				}
			} else {
				// the item is an object listeral of a variation or an experiment
				variation = this._variationFromObjectLiteral(experiment)
			}

			this._addExperimentVariation(variation)
		}
	}

	get targetingFeatures() {
		return this[_targetingFeatures].values()
	}

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

	[Symbol.iterator]() {
		return Variation.objectIterator(this[_experiments])
	}

	has(experiment) {
		if (!(experiment instanceof Experiment)) throw new Error('ExperimentContainer.has() accepts only Experiment instances')
		return this.hasId(experiment.id)
	}

	hasId(experimentId) {
		if (!experimentId) return false
		for (let containerExperiment of this) {
			if (experimentId === containerExperiment.id) return true
		}
		return false
	}

	toJSON() {
		let experiments = []
		for (let experiment of this[_experiments]) {
			experiments.push(experiment.toJSON())
		}

		return { experiments, _seed: this[_seed] }
	}

	_addExperimentVariation(variation) {
		let experiment = variation.object

		// collect all the possible targeting keys from all the experiments in the container
		for (let [feature, matcher] of experiment.targeting) {
			this[_targetingFeatures].add(feature)
		}

		if (this.has(experiment)) {
			throw new Error(`experiment with id "${experiment.id}" was already added to this container`)
		}

		this[_experiments].push(variation)
	}

	/**
	 *	attempt to create a variation with an experiment object
	 *	from a json object. This method is not static to allow
	 *	subclasses to override it.
	 *
	 */
	_variationFromObjectLiteral(rawJson) {
		let json = rawJson

		if (typeof(rawJson) === 'string') {
			json = JSON.parse(rawJson)
		}

		let rawExperiment = json.object
		let weight = json.weight

		if (!json.object) {
			rawExperiment = json
		}

		let experiment = Experiment.create(rawExperiment)

		return Variation.create({ object: experiment, weight })
	}

	// so destructuting does not allow for empty calls create() will fail
	static create({ experiments = [], _seed }) {
		let container = new ExperimentContainer(_seed)

		container.add(...experiments)

		return container
	}
}

module.exports = ExperimentContainer
