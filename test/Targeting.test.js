'use strict'

const { expect } = require('chai')
const { Targeting, matchers } = require('../index')

describe('Targeting',  () => {

	describe('match', () => {

		describe('one condition - without matcher', () => {
			let targeting = new Targeting({ geo: 'US' })
			it('visitor is targeted', () => {
				expect(targeting.match({ geo: 'US' })).to.be.true
			})
		})

		describe('one condition', () => {
			let targeting = new Targeting({ geo: matchers.specific('US') })
			let usVisitor = { geo: 'US' }
			let ilVisitor = { geo: 'IL' }

			it('visitor is targeted', () => {
				expect(targeting.match(usVisitor)).to.be.true
			})

			it('visitor is not targeted', () => {
				expect(targeting.match(ilVisitor)).to.be.false
			})
		})

		describe('all conditions', () => {
			let targeting = new Targeting({ geo: matchers.specific('US'), page: matchers.specific('buy') })
			console.log(targeting.sortedKey)
			let usVisitor = { geo: 'US' , page: 'buy'}
			let ilVisitor = { geo: 'IL' , page: 'buy'}

			it('visitor is targeted', () => {
				expect(targeting.match(usVisitor)).to.be.true
			})

			it('visitor is not targeted', () => {
				expect(targeting.match(ilVisitor)).to.be.false
			})
		})
	})
})
