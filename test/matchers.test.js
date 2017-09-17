const { expect } = require('chai')
const { matchers } = require('../index')

describe('Matchers are a bunch of stateful operators', () => {
	it('isExactly() returns true if the tested value matches the initial value exactly (===)', () => {
		expect(matchers.isExactly('US').match('US')).to.be.true
		expect(matchers.isExactly('MX').match('US')).to.be.false

		let obj1 = {}
		expect(matchers.isExactly(obj1).match(obj1)).to.be.true
		expect(matchers.isExactly(obj1).match({})).to.be.false
	})

	it('isNot() returns true if the tested value does not match the initial value exactly (===)', () => {
		expect(matchers.isNot('US').match('US')).to.be.false
		expect(matchers.isNot('MX').match('US')).to.be.true

		let obj1 = {}
		expect(matchers.isNot(obj1).match(obj1)).to.be.false
		expect(matchers.isNot(obj1).match({})).to.be.true
	})

	it('isAny() returns true for any tested value', () => {
		expect(matchers.isAny().match('1')).to.be.true
		expect(matchers.isAny().match(false)).to.be.true
		expect(matchers.isAny().match()).to.be.true
		expect(matchers.isAny().match(null)).to.be.true
		expect(matchers.isAny().match(undefined)).to.be.true
		expect(matchers.isAny().match([])).to.be.true
		expect(matchers.isAny().match({})).to.be.true
	})

	it('isIn returns true if the tested value is included in the array of initial values', () => {
		expect(matchers.isIn([1, 2, 3]).match(1)).to.be.true
		expect(matchers.isIn([1, 2, 3]).match(4)).to.be.false
	})

	it('and returns true if tested value matches all conditions (expressed as matchers) in the initial value', () => {
		expect(matchers.and('US', 'MX').match('US')).to.be.false // this will forever be false

		expect(matchers.and('!US', '!MX').match('IL')).to.be.true
		expect(matchers.and('!US', '!MX').match('US')).to.be.false

		expect(matchers.and('!US', ['IL', 'MX']).match('IL')).to.be.true
		expect(matchers.and('!US', ['IL', 'MX']).match('GB')).to.be.false

		expect(matchers.and('!US', '!IL', '!MX').match('GB')).to.be.true
		expect(matchers.and('!US', '!IL', '!MX').match('MX')).to.be.false

		expect(matchers.and('!US', 'MX').match('MX')).to.be.true // should never do this, it's exactly like isExactly(mx)
		expect(matchers.and('!US', 'MX').match('IL')).to.be.false
	})

	describe('valueOf() takes a string and returns an appropriate matcher for it', () => {
		it('returns an isAny matcher for \'*\'', () => {
			let matcher = matchers.valueOf('*')
			expect(matcher).to.be.instanceOf(matchers.IsAnyMatcher)
		})

		describe('returns an isIn matcher', () => {
			it('for any array', () => {
				let matcher = matchers.valueOf([])
				expect(matcher).to.be.instanceOf(matchers.IsInMatcher)
			})

			it('that only matches the values inside the array argument', () => {
				let matcher = matchers.valueOf([1, 2])
				expect(matcher.match(1)).to.be.true
				expect(matcher.match(2)).to.be.true
				expect(matcher.match(3)).to.be.false
			})
		})

		describe('returns an isExactly matcher', () => {
			it('for any string that is not \'*\'', () => {
				let matcher = matchers.valueOf('asdfasdf')
				expect(matcher).to.be.instanceOf(matchers.IsExactlyMatcher)
			})

			it('that only matches the string value argument', () => {
				let matcher = matchers.valueOf('asdfasdf')
				expect(matcher.match('asdfasdf')).to.be.true
				expect(matcher.match('foobar')).to.be.false
			})

			it('for any number', () => {
				let matcher = matchers.valueOf(1234)
				expect(matcher).to.be.instanceOf(matchers.IsExactlyMatcher)
			})

			it('that only matches the numeric value argument', () => {
				let matcher = matchers.valueOf(1234)
				expect(matcher.match(1234)).to.be.true
				expect(matcher.match(234)).to.be.false
			})

			it('for any boolean', () => {
				let matcher = matchers.valueOf(false)
				expect(matcher).to.be.instanceOf(matchers.IsExactlyMatcher)

				matcher = matchers.valueOf(true)
				expect(matcher).to.be.instanceOf(matchers.IsExactlyMatcher)
			})

			it('that only matches the boolean value argument', () => {
				let matcher = matchers.valueOf(false)
				expect(matcher.match(false)).to.be.true
				expect(matcher.match(true)).to.be.false

				matcher = matchers.valueOf(true)
				expect(matcher.match(true)).to.be.true
				expect(matcher.match(false)).to.be.false
			})
		})

		it('throws an error for anything else', () => {
			test({})
			test(undefined)
			test(null)
			test(function () {})
			test(() => {})

			function test(something) {
				expect(() => {
					matchers.valueOf(something)
				}).to.throw(`unsupported type: ${typeof(something)}`)
			}
		})
	})
})
