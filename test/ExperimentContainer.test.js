'use strict'

const { expect } = require('chai')
const { ExperimentContainer, Experiment, Variation } = require('../index')
const Counter = require('./util/Counter')

describe('ExperimentContainer is a container for experiments', () => {
	let container, variations

	it('when constructing a container, experiments can be defined using short json form', () => {
		let container = ExperimentContainer.create({})

		container.add({ variations: [1, 2, 3], targeting: { geo: 'US' }, name: 'e1' })

		let experiments = Array.from(container)

		expect(experiments).to.have.length(1)
		expect(experiments[0]).to.deep.equal(Experiment.create({ variations: [1, 2, 3], targeting: { geo: 'US' }, name: 'e1' }))
	})

	it('which can be added to the container using add()', () => {
		let e1 = Experiment.create({ variations })
		container.add(e1)
		let experiments = Array.from(container)
		expect(experiments).to.have.length(1)
		expect(experiments[0]).to.equal(e1)
	})

	it('that collects all the targeting features from each experiment added to it', () => {
		let e1 = Experiment.create({ variations, targeting: { page: 'buy' } })
		let e2 = Experiment.create({ variations, targeting: { geo: 'MX' } })

		container.add(e1, e2)
		let targetingFeatures = Array.from(container.targetingFeatures)
		expect(targetingFeatures).to.have.length(2)
		expect(targetingFeatures).to.include('page')
		expect(targetingFeatures).to.include('geo')
	})

	describe('that lets a user pick an experiment that matches a targeting experssion', () => {
		it('using the pick(targeting) method', () => {

			let e1 = Experiment.create({ variations, targeting: { geo: 'US' } })
			let e2 = Experiment.create({ variations, targeting: { geo: 'MX' } })

			container.add(e1, e2)

			let usPick = container.pick({ geo: 'US' })
			expect(usPick).to.equal(e1)

			let mxPick = container.pick({ geo: 'MX' })
			expect(mxPick).to.equal(e2)
		})

		it('and will return nothing if an experiment matching the targeting is not found', () => {
			expect(container.pick({ geo: 'MX' })).to.be.null
		})

		describe('when more then one experiment matches the targeting expression', () => {
			it('the container will select the result randomly', () => {

				let e1 = Experiment.create({ name: 'e1', variations, targeting: { geo: 'MX' } })
				let e2 = Experiment.create({ name: 'e2', variations, targeting: { geo: 'MX' } })

				container.add(e1, e2)

				let counter = new Counter()
				let visitor = { geo: 'MX' }
				const SIZE = 1000

				for (let i = 0; i < SIZE; i++) {
					counter.count(container.pick(visitor))
				}

				expect(counter.get(e1) / SIZE).to.be.gt(0.4)
				expect(counter.get(e1) / SIZE).to.be.lt(0.6)

				expect(counter.get(e2) / SIZE).to.be.gt(0.4)
				expect(counter.get(e2) / SIZE).to.be.lt(0.6)
			})

			it('the container will select the result randomly, but with predefined bias', () => {

				let e1 = Experiment.create({ name: 'e1', variations, targeting: { geo: 'MX' } })
				let e2 = Experiment.create({ name: 'e2', variations, targeting: { geo: 'MX' } })

				container.add(Variation.create({ object: e1, weight: 20 }), Variation.create({ object: e2, weight: 80 }))

				let counter = new Counter()
				let visitor = { geo: 'MX' }
				const SIZE = 1000

				for (let i = 0; i < SIZE; i++) {
					counter.count(container.pick(visitor))
				}

				expect(counter.get(e1) / SIZE).to.be.gt(0.1)
				expect(counter.get(e1) / SIZE).to.be.lt(0.3)

				expect(counter.get(e2) / SIZE).to.be.gt(0.7)
				expect(counter.get(e2) / SIZE).to.be.lt(0.9)
			})
		})
	})

	describe('serialization/deserialization to json', () => {
		it('serializes to json', () => {
			let experiments = [{
				name: 'e1',
				variations: [1, 2, 3],
				targeting: { geo: 'US' }
			}, {
				name: 'e2',
				variations: [1, 2, 3],
				targeting: { geo: 'US' }
			}]

			let container = ExperimentContainer.create({ experiments })

			let json = container.toJSON()
			
			expect(json).to.have.deep.property('experiments', [{
				object: {
					name: 'e1',
					variations: [
						{ object: 1, weight: 1 },
						{ object: 2, weight: 1 },
						{ object: 3, weight: 1 }
					],
					targeting: { geo: 'US' }
				},
				weight: 1
			}, {
				object: {
					name: 'e2',
					variations: [
						{ object: 1, weight: 1 },
						{ object: 2, weight: 1 },
						{ object: 3, weight: 1 }
					],
					targeting: { geo: 'US' }
				},
				weight: 1
			}])

			expect(JSON.stringify(json)).to.deep.equal(JSON.stringify(container))
		})

		it.skip('deserializes from json', () => {
			let experiments = [{
				name: 'e1',
				variations: [1, 2, 3],
				targeting: { geo: 'US' }
			}, {
				name: 'e2',
				variations: [1, 2, 3],
				targeting: { geo: 'US' }
			}]

			let container = ExperimentContainer.create({ experiments })
			let json = JSON.parse(JSON.stringify(container))
			//console.log(JSON.stringify(json))
			let deserializedContainer = ExperimentContainer.create(json)
		})
	})

	beforeEach(() => {
		container = ExperimentContainer.create({}) // seed is used for testing purposes only
		variations = [1, 2, 3]
	})
})
