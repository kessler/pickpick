'use strict'

const loadbalance = require('loadbalance')
const Targeting = require('./Targeting')
const Experiment = require('./Experiment')
const Variation = require('./Variation')

let _targetingFeatures = Symbol('_targetingFeatures')
let _seed = Symbol('_seed')
let _experiments = Symbol('_experiments')

class ExperimentContainer {

	/**
	 *	@param {number} __seed - just for testing / predictable engine results
	 *
	 */
	constructor(__seed) {
		this[_experiments] = []
		this[_seed] = __seed
		this[_targetingFeatures] = new Set()
	}

	add(...experiments) {
		for (let experiment of experiments) {
			if (!(experiment instanceof Variation)) {
				experiment = Variation.create({ object: experiment })
			}

			// collect all the possible targeting keys from all the experiments in the container
			for (let [feature, matcher] of experiment.object.targeting) {
				this[_targetingFeatures].add(feature)
			}

			this[_experiments].push(experiment)
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

	// so destructuting does not allow for empty calls create() will fail
	static create({ experiments = [], _seed }) {
		let container = new ExperimentContainer(_seed)
		for (let exp of experiments) {
			container.add(exp)
		}

		return container
	}
}

module.exports = ExperimentContainer
