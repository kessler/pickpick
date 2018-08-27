const { expect } = require('chai')
const { ExperimentContainer, Experiment, Variation } = require('../index')
const Counter = require('./util/Counter')

describe('ExperimentContainer is a container for experiments', () => {
	let container, variations

	describe('that can be added to the container using add()', () => {
		it('and an instance of Experiment', () => {
			let e1 = Experiment.create({ id: 'foo-id', variations })
			container.add(e1)
			let experiments = Array.from(container)
			expect(experiments).to.have.length(1)
			expect(experiments[0]).to.deep.equal(e1)
		})

		it("and an instance of Variation containing an experiment instance as it's object", () => {
			let e1 = Experiment.create({ id: 'foo-id', variations })
			let v1 = Variation.create({ object: e1, weight: 2 })
			container.add(v1)
			let experiments = Array.from(container)
			expect(experiments).to.have.length(1)
			expect(experiments[0]).to.deep.equal(e1)
		})

		// TODO this test is terrible
		it("and an instance of Variation containing an experiment object literal as it's object", () => {
			let e1 = { id: 'foo-id', variations }
			let v1 = Variation.create({ object: e1, weight: 2 })
			container.add(v1)

			let experiments = Array.from(container)
			expect(experiments).to.have.length(1)

			expect(experiments[0].id).to.equal(e1.id)
			let actualVariations = Array.from(experiments[0])
			expect(actualVariations).to.have.length(3)

			expect(actualVariations[0].weight).to.deep.equal(1)
			expect(actualVariations[0].object).to.deep.equal(1)
			expect(actualVariations[1].weight).to.deep.equal(1)
			expect(actualVariations[1].object).to.deep.equal(2)
			expect(actualVariations[2].weight).to.deep.equal(1)
			expect(actualVariations[2].object).to.deep.equal(3)
		})
	})

	it('that collects all the targeting features from each experiment added to it', () => {
		let e1 = Experiment.create({
			id: 'foo-id',
			variations,
			targeting: '_.page === "buy"'
		})
		let e2 = Experiment.create({
			id: 'bar-id',
			variations,
			targeting: '_.geo === "MX"'
		})

		container.add(e1, e2)
		let targetingFeatures = Array.from(container.targetingFeatures)
		expect(targetingFeatures).to.have.length(2)
		expect(targetingFeatures).to.include('page')
		expect(targetingFeatures).to.include('geo')
	})

	describe('so one can check if experiment is a part of it', () => {
		let e1, e2, e3, e4, e5, e6
		it('by experiment instance', () => {
			expect(container.has(e1)).to.be.true
			expect(container.has(e2)).to.be.true
			expect(container.has(e3)).to.be.true
			expect(container.has(e4)).to.be.true
			expect(container.has(e5)).to.be.false
			expect(() => {
				container.has(e6)
			}).to.throw
		})

		it('by experiment id', () => {
			expect(container.hasId('foo-id')).to.be.true
			expect(container.hasId('bar-id')).to.be.true
			expect(container.hasId('roo-id')).to.be.true
			expect(container.hasId('goo-id')).to.be.true
			expect(container.hasId('zoo-id')).to.be.false
			expect(container.hasId('boo')).to.be.false
			expect(container.hasId()).to.be.false
		})

		beforeEach(() => {
			e1 = Experiment.create({
				id: 'foo-id',
				name: 'foo',
				variations: [{ object: 1 }, { object: 2 }, { object: 3 }],
				targeting: '_.page === "buy"'
			})

			e2 = Experiment.create({
				id: 'bar-id',
				name: 'bar',
				variations: [{ object: 1 }, { object: 2 }, { object: 3 }],
				targeting: '_.geo ==="MX"'
			})

			container.add(e1, e2)

			e3 = Experiment.create({
				id: 'roo-id',
				name: 'roo',
				variations: [{ object: 1 }, { object: 2 }, { object: 3 }],
				targeting: '_.geo ==="FR"'
			})

			e4 = Experiment.create({
				id: 'goo-id',
				name: 'goo',
				variations: [{ object: 1 }, { object: 2 }, { object: 3 }],
				targeting: '_.geo ==="BR"'
			})

			container.add(
				Variation.create({ object: e3, weight: 20 }),
				Variation.create({ object: e4, weight: 80 })
			)

			e5 = Experiment.create({
				id: 'zoo-id',
				name: 'zoo',
				variations: [{ object: 1 }, { object: 2 }, { object: 3 }],
				targeting: '_.geo ==="IT"'
			})

			e6 = {
				id: 'boo-id',
				name: 'boo',
				variations: [{ object: 1 }, { object: 2 }, { object: 3 }],
				targeting: '_.geo ==="US"'
			}
		})
	})

	it('and have a unique id', () => {
		let e1 = Experiment.create({
			id: 'foo-id',
			name: 'foo',
			variations,
			targeting: '_.page ==="buy"'
		})
		let e2 = Experiment.create({
			id: 'foo-id',
			name: 'bar',
			variations,
			targeting: '_.geo ==="MX"'
		})
		expect(() => {
			container.add(e1)
			container.add(e2)
		}).to.throw()
		expect(() => {
			container.add(e1, e2)
		}).to.throw()
		expect(() => {
			container.add(
				Variation.create({ object: e1, weight: 20 }),
				Variation.create({ object: e2, weight: 80 })
			)
		}).to.throw()
	})

	describe('that lets a user pick an experiment that matches a targeting experssion', () => {
		it('using the pick(targeting) method', () => {
			let e1 = Experiment.create({
				id: 'foo-id',
				variations,
				targeting: '_.geo ==="US"'
			})
			let e2 = Experiment.create({
				id: 'bar-id',
				variations,
				targeting: '_.geo ==="MX"'
			})

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
				let e1 = Experiment.create({
					id: 'foo-id',
					name: 'e1',
					variations,
					targeting: '_.geo ==="MX"'
				})
				let e2 = Experiment.create({
					id: 'bar-id',
					name: 'e2',
					variations,
					targeting: '_.geo ==="MX"'
				})

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
				let e1 = Experiment.create({
					id: 'foo-id',
					name: 'e1',
					variations,
					targeting: '_.geo ==="MX"'
				})
				let e2 = Experiment.create({
					id: 'bar-id',
					name: 'e2',
					variations,
					targeting: '_.geo ==="MX"'
				})

				container.add(
					Variation.create({ object: e1, weight: 20 }),
					Variation.create({ object: e2, weight: 80 })
				)

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
			let experiments = [
				{
					object: {
						name: 'e1',
						id: 'foo-id',
						variations: [
							{ object: 1 },
							{ object: 2 },
							{ object: 3 }
						],
						targeting: '_.geo ==="US"'
					}
				},
				{
					object: {
						name: 'e2',
						id: 'bar-id',
						variations: [
							{ object: 1 },
							{ object: 2 },
							{ object: 3 }
						],
						targeting: '_.geo ==="US"'
					}
				}
			]

			let container = ExperimentContainer.create({ experiments })

			let json = container.toJSON()

			expect(json).to.have.deep.property('experiments', [
				{
					object: {
						name: 'e1',
						id: 'foo-id',
						variations: [
							{ object: 1, weight: 1 },
							{ object: 2, weight: 1 },
							{ object: 3, weight: 1 }
						],
						targeting: '_.geo ==="US"'
					},
					weight: 1
				},
				{
					object: {
						name: 'e2',
						id: 'bar-id',
						variations: [
							{ object: 1, weight: 1 },
							{ object: 2, weight: 1 },
							{ object: 3, weight: 1 }
						],
						targeting: '_.geo ==="US"'
					},
					weight: 1
				}
			])

			expect(JSON.stringify(json)).to.deep.equal(
				JSON.stringify(container)
			)
		})

		it('deserializes from json', () => {
			let experiments = [
				{
					object: {
						name: 'e1',
						id: 'foo-id',
						variations: [
							{ object: 1 },
							{ object: 2 },
							{ object: 3 }
						],
						targeting: '_.geo ==="US"'
					}
				},
				{
					object: {
						name: 'e2',
						id: 'bar-id',
						variations: [
							{ object: 1 },
							{ object: 2 },
							{ object: 3 }
						],
						targeting: '_.geo ==="US"'
					}
				}
			]

			let container = ExperimentContainer.create({ experiments })
			let json = JSON.parse(JSON.stringify(container))
			let deserializedContainer = ExperimentContainer.create(json)
			expect(container).to.deep.equal(deserializedContainer)
		})
	})

	beforeEach(() => {
		container = ExperimentContainer.create({}) // seed is used for testing purposes only
		variations = [{ object: 1 }, { object: 2 }, { object: 3 }]
	})
})
