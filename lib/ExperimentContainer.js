'use strict'

const loadbalance = require('loadbalance')
const Targeting = require('./Targeting')
const Experiment = require('./Experiment')

class ExperimentContainer {
	constructor(_seed) {
		this._experiments = []
		this._seed = _seed
		this._targetingFeatures = new Set()
	}

	add(experiment) {
		// collect all the possible targeting keys from all the experiments in the container
		for (let key of experiment.targeting.features) {
			this._targetingFeatures.add(key)
		}

		this._experiments.push(experiment)
	}

	get targetingFeatures() {
		return this._targetingFeatures.values()
	}

	pick(targeting) {
		let candidates = []

		for (let experiment of this._experiments) {
			if (experiment.match(targeting)) {
				candidates.push(experiment)
			}
		}

		if (candidates.length === 0) {
			return null
		}

		// seed is for testing purposes
		let engine = loadbalance.random(candidates, this._seed)

		return engine.pick()	
	}

	static create(experiments, _seed) {
		let container = new ExperimentContainer(_seed)
		for (let exp of experiments) {
			container.add(exp)
		}

		return container
	}
}

module.exports = ExperimentContainer