const debug = require('./debug')('Targeting')
const matchers = require('./targetingMatchers')
const equal = require('deep-equal')

const _expression = Symbol('_expression')

class Targeting {
	constructor(expression) {
		this[_expression] = objectToMap(expression)

		// replace verbatim values with specific(val) matcher
		for (let [key, matcher] of this[_expression]) {
			if (typeof(matcher) !== 'function') {
				this[_expression].set(key, matchers.isExactly(matcher)) // matcher is a value
			}
		}
	}

	match(targeting) {
		debug('match() %o', targeting)

		for (let [key, matcher] of this[_expression]) {
			let targetingValue = targeting[key]
			
			if (!targetingValue) {
				continue
			}
			
			debug('testing if %s match %s(%s) => %s', targetingValue, matcher.name, matcher.value, matcher(targetingValue))

			if (!matcher(targetingValue)) {
				return false
			}
		}

		return true
	}

	has(key, matcher) {
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

	static create(experssion) {
		return new Targeting(experssion)
	}

	static default() {
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