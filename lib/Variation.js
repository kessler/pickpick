'use strict'

const _object = Symbol('_object')
const _weight = Symbol('_weight')

class Variation {
	constructor({ object, weight = 1 }) {
		this[_object] = object
		this.weight = weight
	}

	get object() {
		return this[_object]
	}

	get weight() {
		return this[_weight]
	}

	set weight(value) {
		if (typeof(value) !== 'number') {
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
		return {
			object: this[_object],
			weight: this[_weight]
		}
	}

	toString(tabs) {
		tabs = tabs || ''
		let stringifiedObject
		let object = this[_object]

		// so we don't require Experiment here
		// this is weak but ok
		if (typeof (object.pick) === 'function') {
			stringifiedObject = '\n'
			stringifiedObject += object.toString(`${tabs}\t`)
		} else {
			stringifiedObject = JSON.stringify(object)
		}

		return `Variation ( object: ${stringifiedObject}, weight: ${this[_weight]} )`
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
}


/**
 *	wraps an iterator of an array of variations
 *	replacing the Variation instance with the
 *	object which is the "value" of the variation
 *
 */
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