const debug = require('./debug')('Targeting')
const equal = require('deep-equal')
const { isNullOrUndefined, isString } = require('util')
const compile = require('pickpick-targeting-compiler')
const _expression = Symbol('_expression')
const _isMatch = Symbol('_isMatch')
const _features = Symbol('_features')

/**
 *   Targeting
 */
class Targeting {
	/**
	 *    construct a new targeting instance
	 *
	 *    @param  {String} expression see [pickpick-targeting-compiler](https://github.com/ironSource/pickpick-targeting-compiler) for more details
	 */
	constructor(expression) {
		this[_expression] = expression
		let { isMatch, features } = compile(expression)
		this[_isMatch] = isMatch
		this[_features] = features
	}

	/**
	 *    check if the input data is matched by this targeting instance
	 *
	 *    @param  {Object} inputTargeting is normally a simple js object
	 *    @return {Boolean}
	 */
	match(inputTargeting) {
		debug('match() %o', inputTargeting)

		if (isNullOrUndefined(inputTargeting)) {
			throw new TypeError('inputTargeting cannot be null or undefined')
		}

		return this[_isMatch](inputTargeting)
	}

	/**
	 *    access this Targeting's expression
	 *    @return {String}
	 */
	get expression() {
		return this[_expression]
	}

	/**
	 *    iterate over the features that participate in the targeting
	 */
	[Symbol.iterator]() {
		return this[_features][Symbol.iterator]()
	}

	/**
	 *    check if a feature is part of this targeting instance
	 *    @param  {String}  feature a name of a feature, e.g `geo`
	 *    @return {Boolean}
	 */
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

	static default() {
		return defaultTargeting
	}
}

const defaultTargeting = Targeting.create('true')

module.exports = Targeting
