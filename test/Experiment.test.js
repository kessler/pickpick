'use strict'

const { expect } = require('chai')
const { Experiment, Variation, Targeting } = require('../index')
const loadbalance = require('loadbalance')
const Counter = require('./util/Counter')

describe('Experiment picks a variation', () => {
	let traffic, variationCounter, visitorCounter

	it('based on even weights', () => {

		let experiment = Experiment.create({
			variations: [
				Variation.create({ object: 1, weight: 1 }),
				Variation.create({ object: 2, weight: 1 }),
				Variation.create({ object: 3, weight: 1 })
			]
		})

		runExperiment(experiment, 100)

		expect(variationCounter.get(1)).to.equal(34)
		expect(variationCounter.get(2)).to.equal(33)
		expect(variationCounter.get(3)).to.equal(33)
	})

	it('based on uneven weights', () => {
		let experiment = Experiment.create({
			variations: [
				Variation.create({ object: 1, weight: 50 }),
				Variation.create({ object: 2, weight: 25 }),
				Variation.create({ object: 3, weight: 25 })
			]
		})

		runExperiment(experiment, 100)

		expect(variationCounter.get(1)).to.equal(50)
		expect(variationCounter.get(2)).to.equal(25)
		expect(variationCounter.get(3)).to.equal(25)
	})

	it('variation input can be written in a short form, if weights are even', () => {
		let variations = [1, 2, 3]
		let experiment = Experiment.create({ variations })
		let experimentVariations = Array.from(experiment)

		expect(experimentVariations[0]).to.have.property('weight', 1)
		expect(experimentVariations[0]).to.have.property('object', 1)

		expect(experimentVariations[1]).to.have.property('weight', 1)
		expect(experimentVariations[1]).to.have.property('object', 2)

		expect(experimentVariations[2]).to.have.property('weight', 1)
		expect(experimentVariations[2]).to.have.property('object', 3)
	})

	it('targeting input can be written in short form using javascript object', () => {
		let variations = [1, 2, 3]
		let targeting = { geo: 'US' }
		let experiment = Experiment.create({ targeting, variations })

		expect(experiment.targeting).to.be.instanceOf(Targeting)
		expect(experiment.targeting.has('geo', 'US')).to.be.true
	})

	beforeEach(() => {
		traffic = loadbalance.roundRobin([
			{ geo: 'US', page: 'buy' },
			{ geo: 'MX', page: 'buy' },
			{ geo: 'IL', page: 'about' },
			{ page: 'index' }
		])

		variationCounter = new Counter()
		visitorCounter = new Counter()
	})

	class Counter {
		constructor() {
			this._data = new Map()
		}

		count(something) {
			let count = this._data.get(something)

			if (!count) {
				count = 0
			}

			this._data.set(something, ++count)
		}

		get(something) {
			return this._data.get(something)
		}
	}

	function runExperiment(experiment, size) {
		for (let i = 0; i < size; i++) {
			let variation = experiment.pick()
			variationCounter.count(variation)
		}
	}
})
