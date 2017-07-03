'use strict'

const Experiment = require('./Experiment')
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
			throw new Error('Weights must be integers')
		}

		if (value < 1) {
			throw new Error('Weights must be a positive number')
		}

		this[_weight] = value
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
}

module.exports = Variation