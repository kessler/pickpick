const { Variation } = require('../index')
const { expect } = require('chai')

describe('Variation is a combination of a value (name object sadly) and a weight', () => {
	it('assigns an automatic weight of 1 if none is specified', () => {
		let variation = Variation.create({ object: 5 })
		expect(variation.weight).to.equal(1)
	})

	it('does not allow setting a weight that is not a number', () => {
		let variation = Variation.create({ object: 5 })
		expect(() => {
			variation.weight = '123'
		}).to.throw('weight must be a number')
	})

	it('does not allow setting a weight that is not an integer', () => {
		let variation = Variation.create({ object: 5 })
		expect(() => {
			variation.weight = 0.5
		}).to.throw('weight must be an integer')
	})

	it('does not allow setting a weight lower than one', () => {
		let variation = Variation.create({ object: 5 })
		expect(() => {
			variation.weight = 0
		}).to.throw('weight must be greater than 0')
	})
})
