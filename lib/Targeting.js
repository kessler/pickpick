const debug = require('./debug')('Targeting')
const matchers = require('./matchers')
const equal = require('deep-equal')
const { isNullOrUndefined } = require('util')

const _expression = Symbol('_expression')

class Targeting {
	constructor(expression) {
		this[_expression] = objectToMap(expression)
		this._parseMatchers()
	}

	match(inputTargeting) {
		debug('match() %o', inputTargeting)

		if (isNullOrUndefined(inputTargeting)) {
			throw new TypeError('inputTargeting cannot be null or undefined')
		}

		let result = true

		for (let [key, matcher] of this[_expression]) {
			let targetingValue = inputTargeting[key]

			if (debug.enabled) { // dont call match() twice if we're not in debug mode
				debug('testing if \'%s\' %s(\'%s\') => %s', targetingValue, matcher.name,
					matcher.value, matcher.match(targetingValue))
			}

			result = result && matcher.match(targetingValue)
		}

		return result
	}

	[Symbol.iterator]() {
		return this[_expression].entries()
	}

	has(key, matcher) {
		if (!(matcher instanceof matchers.Matcher)) {
			matcher = matchers.valueOf(matcher)
		}

		let ourMatcher = this[_expression].get(key)

		if (!ourMatcher) {
			return false
		}

		if (ourMatcher.name === matchers.isIn.name) {
			if (matcher.name !== matchers.isIn.name) return false

			return equal(matcher.value, ourMatcher.value)
		}

		return ourMatcher.value === matcher.value && ourMatcher.name === matcher.name
	}

	toJSON() {
		let result = {}
		for (let [key, matcher] of this[_expression]) {
			result[key] = matcher.toJSON()
		}
		return result
	}

	toString() {
		let result = 'Targeting ( '

		let count = 0
		for (let [name, matcher] of this[_expression].entries()) {
			if (++count > 1) {
				result += ', '
			}
			result += `${name}: ${matcher.name} (${matcher.value})`
		}

		result += ' )'

		return result
	}

	_parseMatchers() {
		// replace verbatim values with specific(val) matcher
		for (let [key, matcher] of this[_expression]) {
			if (!(matcher instanceof matchers.Matcher)) {
				this[_expression].set(key, matchers.valueOf(matcher))
			}
		}
	}

	static create(experssion) {
		return new Targeting(experssion)
	}

	static default () {
		return defaultTargeting
	}
}

module.exports = Targeting

const defaultTargeting = new Targeting({})

function objectToMap(obj) {
	let keys = Object.keys(obj)
	let result = new Map()

	for (let i = 0; i < keys.length; i++) {
		result.set(keys[i], obj[keys[i]])
	}

	return result
}

function targetingKeySort(a, b) {
	if (a === 'page' && b !== 'page') {
		return 1
	}

	if (a === 'geo' && b !== 'geo') {
		return 1
	}

	if (a > b) {
		return 1
	}

	if (a < b) {
		return -1
	}

	return 0
}
