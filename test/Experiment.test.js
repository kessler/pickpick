'use strict'

const { expect } = require('chai')
const { Experiment, Variation, Targeting } = require('../index')
const loadbalance = require('loadbalance')

describe('Experiment picks a variation', () => {
	let traffic, variationCounter, visitorCounter

	it('based on even weights', () => {

		let experiment = Experiment.create({
			variations: [1, 2, 3]
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

	it('based on targeting', () => {
		let experiment = Experiment.create({
			variations: [1, 2],
			targeting: Targeting.create({ geo: 'US' })
		})

		runExperiment(experiment, 100)

		expect(variationCounter.get(1)).to.equal(25)
		expect(variationCounter.get(2)).to.equal(25)
		expect(variationCounter.get(3)).to.be.undefined
		expect(variationCounter.get(4)).to.be.undefined
	})

	it.only('mutually exclusing sub experiments', () => {
		traffic = loadbalance.roundRobin([
			{ geo: 'US' },
			{ geo: 'MX' }
		])

		let e1 = Experiment.create({
			variations: [1, 2],
			targeting: Targeting.create({ geo: 'US' })
		})

		let e2 = Experiment.create({
			variations: [3, 4],
			targeting: Targeting.create({ geo: 'MX' })
		})

		let e3 = Experiment.create({
			variations: [5, 6]
		})

		let experiment = Experiment.create({
			variations: [e1, e2, e3]
		})

		runExperiment(experiment, 10)
		console.log(variationCounter)
		expect(variationCounter.get(1)).to.equal(15)
		expect(variationCounter.get(2)).to.equal(15)
		expect(variationCounter.get(3)).to.equal(15)
		expect(variationCounter.get(4)).to.equal(15)
		expect(variationCounter.get(5)).to.equal(15)
		expect(variationCounter.get(6)).to.equal(15)
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
			let visitor = traffic.pick()
			console.log('-------------------------visit-----------------------\n')
			let variation = experiment.pick(visitor)
			if (!variation) {
				console.log('no variation', visitor)
			}
			variationCounter.count(variation)
			visitorCounter.count(visitor)
		}
	}
})
