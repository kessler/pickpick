'use strict'

const { expect } = require('chai')
const { ExperimentContainer, Experiment, Variation } = require('../index')
const Counter = require('./util/Counter')

describe('ExperimentContainer is a container for experiments', () => {
	let container, variations

	it('when constructing a container, experiments can be defined using short json form', () => {
		let container = ExperimentContainer.create({})

		container.add({ id: 'foo-id', variations: [1, 2, 3], targeting: { geo: 'US' }, name: 'e1' })

		let experiments = Array.from(container)

		expect(experiments).to.have.length(1)
		expect(experiments[0]).to.deep.equal(Experiment.create({
			id: 'foo-id',
			variations: [1, 2, 3],
			targeting: { geo: 'US' },
			name: 'e1'
		}))
	})

	it('which can be added to the container using add()', () => {
		let e1 = Experiment.create({ id: 'foo-id', variations })
		container.add(e1)
		let experiments = Array.from(container)
		expect(experiments).to.have.length(1)
		expect(experiments[0]).to.equal(e1)
	})

	it('that collects all the targeting features from each experiment added to it', () => {
		let e1 = Experiment.create({ id: 'foo-id', variations, targeting: { page: 'buy' } })
		let e2 = Experiment.create({ id: 'bar-id', variations, targeting: { geo: 'MX' } })

		container.add(e1, e2)
		let targetingFeatures = Array.from(container.targetingFeatures)
		expect(targetingFeatures).to.have.length(2)
		expect(targetingFeatures).to.include('page')
		expect(targetingFeatures).to.include('geo')
	})

	it('so one can check if experiment is a part of it', () => {
		let e1 = Experiment.create({ id: 'foo-id', name: 'foo', variations, targeting: { page: 'buy' } })
		let e2 = Experiment.create({ id: 'bar-id', name: 'bar', variations, targeting: { geo: 'MX' } })
		let e3 = Experiment.create({ id: 'zoo-id', name: 'zoo', variations, targeting: { geo: 'IT' } })

		let e4 = { id: 'boo-id', name: 'boo', variations, targeting: { geo: 'US' } }

		container.add(e1, e2)
		expect(container.has(e1)).to.be.true
		expect(container.has(e2)).to.be.true
		expect(container.has(e3)).to.be.false
		expect(() => { container.has(e4) }).to.throw
	})

	it('and have a unique id', () => {
		let e1 = Experiment.create({ id: 'foo-id', name: 'foo', variations, targeting: { page: 'buy' } })
		let e2 = Experiment.create({ id: 'foo-id', name: 'bar', variations, targeting: { geo: 'MX' } })
		expect(() => {
			container.add(e1)
			container.add(e2)
		}).to.throw()
		expect(() => {
			container.add(e1, e2)
		}).to.throw()
	})

	describe('that lets a user pick an experiment that matches a targeting experssion', () => {
		it('using the pick(targeting) method', () => {

			let e1 = Experiment.create({ id: 'foo-id', variations, targeting: { geo: 'US' } })
			let e2 = Experiment.create({ id: 'bar-id', variations, targeting: { geo: 'MX' } })

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

				let e1 = Experiment.create({ id: 'foo-id', name: 'e1', variations, targeting: { geo: 'MX' } })
				let e2 = Experiment.create({ id: 'bar-id', name: 'e2', variations, targeting: { geo: 'MX' } })

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

				let e1 = Experiment.create({ id: 'foo-id', name: 'e1', variations, targeting: { geo: 'MX' } })
				let e2 = Experiment.create({ id: 'bar-id', name: 'e2', variations, targeting: { geo: 'MX' } })

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
				id: 'foo-id',
				variations: [1, 2, 3],
				targeting: { geo: 'US' }
			}, {
				name: 'e2',
				id: 'bar-id',
				variations: [1, 2, 3],
				targeting: { geo: 'US' }
			}]

			let container = ExperimentContainer.create({ experiments })

			let json = container.toJSON()

			expect(json).to.have.deep.property('experiments', [{
				object: {
					name: 'e1',
					id: 'foo-id',
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
					id: 'bar-id',
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
				id: 'foo-id',
				variations: [1, 2, 3],
				targeting: { geo: 'US' }
			}, {
				name: 'e2',
				id: 'bar-id',
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
