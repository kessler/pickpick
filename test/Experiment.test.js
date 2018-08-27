const { expect } = require('chai')
const { Experiment, Variation, Targeting, matchers } = require('../index')
const loadbalance = require('loadbalance')
const Counter = require('./util/Counter')

describe('Experiment picks a variation', () => {
	let traffic, variationCounter, visitorCounter

	it('based on even weights', () => {
		let experiment = Experiment.create({
			id: 'foo-id',
			variations: [
				{ object: 1, weight: 1 },
				{ object: 2, weight: 1 },
				{ object: 3, weight: 1 }
			]
		})

		runExperiment(experiment, 100)

		expect(variationCounter.get(1)).to.equal(34)
		expect(variationCounter.get(2)).to.equal(33)
		expect(variationCounter.get(3)).to.equal(33)
	})

	it('based on uneven weights', () => {
		let experiment = Experiment.create({
			id: 'foo-id',
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

	it('variation can be expressed as an object literal with an object property and an optional weight property', () => {
		let variations = [
			{
				object: 1,
				weight: 2
			},
			{
				object: {
					test: 2
				}
			},
			{
				object: 3,
				weight: 3
			}
		]

		let experiment = Experiment.create({ id: 'foo-id', variations })
		let experimentVariations = Array.from(experiment)
		// the order of the variations is not static
		for (let i = 0; i < experimentVariations.length; i++) {
			let variation = experimentVariations[i]

			expect(variation).to.have.property('object')

			switch (variation.object) {
				case 1:
					expect(variation).to.have.property('weight', 2)
					break
				case 3:
					expect(variation).to.have.property('weight', 3)
					break
				default:
					expect(variation.object).to.deep.equal({ test: 2 })
			}
		}
	})

	it('can be serialized into json', () => {
		let variations = [{ object: 1 }, { object: 2 }, { object: 3 }]

		let targeting = '_.geo === "US"'

		let experiment = Experiment.create({
			id: 'foo-id',
			targeting,
			variations,
			name: 'test'
		})
		let json = experiment.toJSON(experiment)

		expect(json).to.have.deep.property('variations', [
			{ object: 1, weight: 1 },
			{ object: 2, weight: 1 },
			{ object: 3, weight: 1 }
		])

		expect(json).to.have.deep.property('targeting', '_.geo === "US"')
		expect(json).to.have.property('name', 'test')
		expect(JSON.stringify(experiment)).to.equal(JSON.stringify(json))
	})

	it('can be deserialized from json', () => {
		let variations = [{ object: 1 }, { object: 2 }, { object: 3 }]

		let targeting = '_.geo === "US"'

		let experiment = Experiment.create({
			id: 'foo-id',
			targeting,
			variations,
			name: 'test'
		})
		let json = JSON.stringify(experiment)

		let deserializedExperiment = Experiment.create(JSON.parse(json))
		expect(deserializedExperiment).to.have.property('name', 'test')

		let deserializedVariations = Array.from(deserializedExperiment)
		expect(deserializedVariations).to.deep.equal([
			Variation.create({ object: 1, weight: 1 }),
			Variation.create({ object: 2, weight: 1 }),
			Variation.create({ object: 3, weight: 1 })
		])

		expect(deserializedExperiment.targeting.expression).to.equal(
			'_.geo === "US"'
		)
		expect(deserializedExperiment.targeting.match({ geo: 'US' })).to.be.true
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

	function runExperiment(experiment, size) {
		for (let i = 0; i < size; i++) {
			let variation = experiment.pick()
			variationCounter.count(variation)
		}
	}
})
