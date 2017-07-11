'use strict'

const loadbalance = require('loadbalance')
const Targeting = require('./Targeting')
const Variation = require('./Variation')
const Trie = require('digital-tree')
const Experiment = require('./Experiment')

class ExperimentContainer {
	constructor(_seed) {
		this._experiments = []
		this._seed = _seed
	}

	add(experiment) {
		this._experiments.push(experiment)
	}

	pick(targeting) {
		let candidates = []

		for (let experiment of this._experiments) {
			//console.log(experiment.targeting.toString(), targeting, experiment.match(targeting))
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