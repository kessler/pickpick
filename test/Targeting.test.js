'use strict'

const { expect } = require('chai')
const { Targeting, matchers } = require('../index')

describe('Targeting represents a mapping between features and stateful operators (Matchers)', () => {
	it('to create a targeting, specify an expression of features and matchers in the constructor', () => {
		expect(() => {
			let targeting = Targeting.create({
				geo: matchers.isExactly('US')
			})
		}).not.to.throw
	})

	it('that experssion can use all the short forms used in expressing matchers (matchers.valueOf(...))', () => {
		let targeting = Targeting.create({
			geo: '*',
			page: 'buy',
			language: ['en', 'he']
		})

		expect(targeting.match({
			geo: 'il',
			page: 'buy',
			language: 'en'
		})).to.be.true

		expect(targeting.match({
			geo: 'il',
			page: 'index',
			language: 'en'
		})).to.be.false
	})

	it('exposes features and matchers via an iterator', () => {
		let targeting = Targeting.create({
			geo: 'foo',
			page: ['bar', 'index']
		})

		let expression = {}
		let count = 0
		for (let [feature, matcher] of targeting) {
			expression[feature] = matcher
			count++
		}

		expect(count).to.eql(2)

		expect(expression).to.have.property('geo')
		expect(expression.geo).to.have.property('name', 'isExactly')
		expect(expression.geo).to.have.property('value', 'foo')

		expect(expression).to.have.property('page')
		expect(expression.page).to.have.property('name', 'isIn')
		expect(expression.page).to.have.deep.property('value', ['bar', 'index'])
	})

	it('can be queried for features/matchers combinations using has()', () => {
		let targeting = Targeting.create({
			geo: 'foo',
			page: '*'
		})

		expect(targeting.has('geo', 'foo')).to.be.true
		expect(targeting.has('geo', matchers.isExactly('foo'))).to.be.true
		expect(targeting.has('geo', 'bar')).to.be.false

		expect(targeting.has('page', '*')).to.be.true
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

		it('against each feature specified in the targeting expression provided in the constructor', () => {
			let targeting = Targeting.create({
				f1: matchers.isExactly('f1'),
				f2: matchers.isIn([1, 2])
			})

			expect(targeting.match({ f1: 'f1', f2: 1 })).to.be.true
			expect(targeting.match({ f1: 'f1', f2: 2 })).to.be.true
		})

		it('features in the input that containing unmatched values will fail the whole match()', () => {
			let targeting = Targeting.create({
				f1: matchers.isExactly('f1'),
				f2: matchers.isIn([1, 2])
			})

			expect(targeting.match({ f1: 'f1', f2: 3 })).to.be.false
		})

		it('only features in the targeting are tested, other features are ignored', () => {
			let targeting = Targeting.create({
				f1: matchers.isExactly('f1'),
				f2: matchers.isIn([1, 2])
			})

			expect(targeting.match({ f1: 'f1', f2: 1, b: '1' })).to.be.true
		})

		it('all the features in the targeting must exist in the input', () => {
			let targeting = Targeting.create({
				f1: matchers.isExactly('f1'),
				f2: matchers.isIn([1, 2])
			})

			expect(targeting.match({ f1: 'f1' })).to.be.false
		})

		it('unrelated inputs fail the match()', () => {
			let targeting = Targeting.create({
				f1: matchers.isExactly('f1'),
				f2: matchers.isIn([1, 2])
			})

			expect(targeting.match({})).to.be.false
			expect(targeting.match('assdd')).to.be.false
			expect(targeting.match(true)).to.be.false
			expect(targeting.match({ f1: 'f1' })).to.be.false
		})
	})
})
