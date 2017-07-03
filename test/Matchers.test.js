'use strict'

const { expect } = require('chai')
const { matchers } = require('../index')

describe('Matchers',  () => {

	describe('all', () => {
		let matcher = matchers.all()

		it('match', () => {
			expect(matcher({geo: 'US'})).to.be.true
			expect(matcher({geo: 'IL'})).to.be.true
		})
	})

	describe('specific',() => {
		let matcher = matchers.specific(3)

		it('return true', () => {
			expect(matcher(3)).to.be.true
		})

		it('return false', () => {
			expect(matcher(2)).to.be.false
		})

	})

	describe('included', () => {
		let matcher = matchers.includes([1,2,3])

		it('return true', () => {
			expect(matcher(1)).to.be.true
		})

		it('return false', () => {
			expect(matcher(4)).to.be.false
		})

	})
})
