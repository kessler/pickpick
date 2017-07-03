const debug = require('./debug')('Targeting')
const matchers = require('./targetingMatchers')

const _expression = Symbol('_expression')

class Targeting {
	constructor(expression) {
		this[_expression] = objectToMap(expression)

		// replace verbatim values with specific(val) matcher
		for (let [key, matcher] of this[_expression]) {
			if (typeof(matcher) !== 'function') {
				this[_expression].set(key, matchers.specific(matcher))
			}
		}		
	}

	match(targeting) {
		debug('match() %o', targeting)

		for (let [key, matcher] of this[_expression]) {
			let targetingValue = targeting[key]
			
			debug('testing %s %s %s', targetingValue, matcher.name, matcher(targetingValue))

			if (!targetingValue) continue

			if (!matcher(targetingValue)) {
				return false
			}
		}

		return true
	}

	toString() {
		let result = 'Targeting ( '

		let count = 0
		for (let [key, value] of this[_expression].entries()) {
			if (++count > 1) {
				result += ', '
			}
			result += `${key}: ${value.name}`
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
