const { isNullOrUndefined } = require('util')
const _object = Symbol('_object')
const _weight = Symbol('_weight')
const _missingObjectErrorCode = Symbol('_missing_object_error_code')

/**
 *    A variation attaches weight to a piece of data. Variations are used in Experiments and ExperimentContainers
 */
class Variation {
	/**
	 *    @param  {Variant} options.object the variation data
	 *    @param  {Number} options.weight
	 *
	 */
	constructor({ object, weight = 1 }) {
		if (isNullOrUndefined(object)) {
			let error = new TypeError(
				'cannot create variation without an object'
			)
			error.code = _missingObjectErrorCode
			throw error
		}

		this[_object] = object

		// use the setter instead of directly setting the field
		this.weight = weight
	}

	get object() {
		return this[_object]
	}

	get weight() {
		return this[_weight]
	}

	set weight(value) {
		if (typeof value !== 'number') {
			throw new Error('weight must be a number')
		}

		if (value % 1 !== 0) {
			throw new Error('weight must be an integer')
		}

		if (value < 1) {
			throw new Error('weight must be greater than 0')
		}

		this[_weight] = value
	}

	toJSON() {
		let result = { weight: this[_weight] }
		let object = this[_object]

		// TODO this is a little lame
		// maybe there is I can think of a nicer way to do this...
		if (typeof object.toJSON === 'function') {
			object = object.toJSON()
		}

		result.object = object
		return result
	}

	toString(tabs) {
		tabs = tabs || ''
		let stringifiedObject
		let object = this[_object]

		// so we don't require Experiment here
		// this is weak but ok
		if (typeof object.pick === 'function') {
			stringifiedObject = '\n'
			stringifiedObject += object.toString(`${tabs}\t`)
		} else {
			stringifiedObject = JSON.stringify(object)
		}

		return `Variation ( object: ${stringifiedObject}, weight: ${
			this[_weight]
		} )`
	}

	static create({ object, weight }) {
		return new Variation({ object, weight })
	}

	static objectIterator(variations) {
		// this is a weak test
		if (!Array.isArray(variations)) {
			throw new Error('must provide an array of Variation instances')
		}

		return new ObjectIterator(variations)
	}

	static get missingObjectErrorCode() {
		return _missingObjectErrorCode
	}
}

// wraps an iterator of an array of variations
// replacing the Variation instance with the
// object which is the "value" of the variation
class ObjectIterator {
	constructor(variations) {
		this._iterator = variations[Symbol.iterator]()
	}

	next() {
		let item = this._iterator.next()

		if (item.value) {
			item.value = item.value.object
		}

		return item
	}
}

module.exports = Variation
