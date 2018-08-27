const { expect } = require('chai')
const { Targeting, matchers } = require('../index')

describe('Targeting is a logical expression designed to help target relevant experiments', () => {
	it('to create an instance, specify an expression using the create() static factory', () => {
		expect(() => {
			let targeting = Targeting.create('_.geo === "US"')
		}).not.to.throw
	})

	it('exposes features an iterator', () => {
		let targeting = Targeting.create(
			'_.geo === "foo" && _.page in ["bar", "index"]'
		)
		let features = Array.from(targeting)
		expect(features).to.eql(['geo', 'page'])
	})

	it('can be queried for features using has()', () => {
		let targeting = Targeting.create('_.geo === "US" && _.page === "index"')

		expect(targeting.has('geo')).to.be.true
		expect(targeting.has('page')).to.be.true
	})

	describe('the match() method accepts an input and test it', () => {
		it('throws an error if input is null or undefined', () => {
			expect(() => {
				Targeting.default().match(null)
			}).to.throw('inputTargeting cannot be null or undefined')

			expect(() => {
				Targeting.default().match()
			}).to.throw('inputTargeting cannot be null or undefined')
		})

		it('the default targeting matches everything', () => {
			let targeting = Targeting.default()

			expect(targeting.match({})).to.be.true
			expect(targeting.match(false)).to.be.true
			expect(targeting.match(true)).to.be.true
			expect(targeting.match(() => {})).to.be.true
			expect(targeting.match('1ajsdhs')).to.be.true
			expect(targeting.match({ bla: 'bla' })).to.be.true
		})

		it('against each feature specified in the targeting expression', () => {
			let targeting = Targeting.create('_.f1 === "f1" && _.f2 in [1, 2]')
			expect(targeting.match({ f1: 'f1', f2: 1 })).to.be.true
			expect(targeting.match({ f1: 'f1', f2: 2 })).to.be.true
		})

		it('features in the input that containing unmatched values will fail the whole match()', () => {
			let targeting = Targeting.create('_.f1 === "f1" && _.f2 in [1, 2]')
			expect(targeting.match({ f1: 'f1', f2: 3 })).to.be.false
		})

		it('only features in the targeting are tested, other features are ignored', () => {
			let targeting = Targeting.create('_.f1 === "f1" && _.f2 in [1, 2]')
			expect(targeting.match({ f1: 'f1', f2: 1, b: '1' })).to.be.true
		})

		it('all the features in the targeting must exist in the input', () => {
			let targeting = Targeting.create('_.f1 === "f1" && _.f2 in [1, 2]')
			expect(targeting.match({ f1: 'f1' })).to.be.false
		})

		it('unrelated inputs fail the match()', () => {
			let targeting = Targeting.create('_.f1 === "f1" && _.f2 in [1, 2]')

			expect(targeting.match({})).to.be.false
			expect(targeting.match('assdd')).to.be.false
			expect(targeting.match(true)).to.be.false
			expect(targeting.match({ f1: 'f1' })).to.be.false
		})
	})
})
