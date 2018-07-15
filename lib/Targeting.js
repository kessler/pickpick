const debug = require('./debug')('Targeting')
const equal = require('deep-equal')
const { isNullOrUndefined, isString } = require('util')
const compile = require('pickpick-targeting-compiler')
const _expression = Symbol('_expression')
const _isMatch = Symbol('_isMatch')
const _features = Symbol('_features')

class Targeting {
	constructor(expression) {
		this[_expression] = expression
		let { isMatch, features } = compile(expression)
		this[_isMatch] = isMatch
		this[_features] = features
	}

	match(inputTargeting) {
		debug('match() %o', inputTargeting)

		if (isNullOrUndefined(inputTargeting)) {
			throw new TypeError('inputTargeting cannot be null or undefined')
		}

		return this[_isMatch](inputTargeting)
	}

	get expression() {
		return this[_expression]
	}

	[Symbol.iterator]() {
		return this[_features][Symbol.iterator]()
	}

	has(feature) {
		return this[_features].has(feature)
	}

	toJSON() {
		return this[_expression]
	}

	toString() {
		return `Targeting ( ${this[_expression]} )`
	}

	static create(experssion) {
		return new Targeting(experssion)
	}

	static
	default () {
		return defaultTargeting
	}
}

const defaultTargeting = Targeting.create('true')

module.exports = Targeting