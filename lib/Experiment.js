const debug = require('./debug')('Experiment')
const loadbalance = require('loadbalance')
const Variation = require('./Variation')
const Targeting = require('./Targeting')
const { isString } = require('util')

const _name = Symbol('_name')
const _variations = Symbol('_variations')
const _engine = Symbol('_engine')
const _targeting = Symbol('_targeting')
const _id = Symbol('_id')
const _userData = Symbol('_userData')

/**
 *    An A/B test experiment contains one or more [variations](@Variation) and a definition of [targeting](@Targeting).
 *
 *    Experiments are serializable and can be created using classes from this engine or object literals. For example:
 *
 *    ```js
 *    const { Experiment } = require('pickpick')
 *
 *    const e1 = Experiment.create({
 *    	name: 'my experiment',
 *    	id: 'foo',
 *    	variations: [
 *    		{ object: 1, weight: 1 },
 *    		{ object: 2, weight: 1 },
 *    		{ object: 3, weight: 1 }
 *    	],
 *    	targeting: '_.geo === "US"'
 *    })
 *    ```
 */
class Experiment {
	constructor({
		name,
		id,
		variations = [],
		targeting = Targeting.default(),
		userData
	}) {
		if (!id) {
			throw new Error('experiment id is mandatory')
		}

		if (!(targeting instanceof Targeting)) {
			if (!isString(targeting)) {
				throw new Error(
					'targeting parameter can only be an instance of Targeting or a string (targeting expression)'
				)
			}

			targeting = Targeting.create(targeting)
		}

		for (let i = 0; i < variations.length; i++) {
			if (!(variations[i] instanceof Variation)) {
				throw new Error(`invalid variation at index ${i}`)
			}
		}

		this[_name] = name
		this[_variations] = variations
		this[_targeting] = targeting
		this[_id] = id
		this[_userData] = userData
		this._initEngine()
	}

	/**
	 *    randomly select one variation from the Variations set
	 *    @return {Variant} the value contained within the selected variation
	 */
	pick() {
		return this[_engine].pick()
	}

	/**
	 *    check if this experiment matches the input targeting
	 *
	 *    @param  {Object} targeting
	 *    @return {Boolean}
	 */
	match(targeting) {
		return this[_targeting].match(targeting)
	}

	/**
	 *    add another variation to this experiment
	 *    @param {Variation|Object} variation
	 */
	add(variation) {
		if (variation instanceof Experiment) {
			throw new Error('cannot add an experiment to another experiment')
		}

		if (!(variation instanceof Variation)) {
			variation = Variation.create({ object: variation })
		}

		this[_variations].push(variation)
		this._initEngine()
	}

	get targeting() {
		return this[_targeting]
	}

	get name() {
		return this[_name]
	}

	get id() {
		return this[_id]
	}

	get userData() {
		return this[_userData]
	}

	/**
	 *    iterate over the variations contained in this experiment
	 */
	[Symbol.iterator]() {
		return this[_variations][Symbol.iterator]()
	}

	toJSON() {
		let variations = []

		for (let variation of this[_variations]) {
			variations.push(variation.toJSON())
		}

		return {
			id: this[_id],
			name: this[_name],
			targeting: this[_targeting].toJSON(),
			variations
		}
	}

	toString(tabs) {
		tabs = tabs || ''
		let desc = `${tabs}Experiment (\n`
		desc += `${tabs}\tName: ${this[_name]}\n`
		desc += `${tabs}\tId: ${this[_id]}\n`
		desc += `${tabs}\t${this[_targeting].toString()}\n`
		desc += `${tabs}\tVariations:\n`
		this[_variations].forEach((variation, index) => {
			let isBase = '' //index === 0 ? '<== base variation' : ''
			desc += `${tabs}\t\t#${index} ${variation.toString(
				`${tabs}\t\t`
			)} ${isBase}\n`
		})

		desc += `${tabs})`
		return desc
	}

	_initEngine() {
		this[_engine] = loadbalance.roundRobin(this[_variations])
	}

	static create({
		name = 'FooExperiment',
		id,
		variations = [],
		targeting,
		userData
	}) {
		if (variations.length === 0) {
			throw new Error('cannot create an experiment without variations')
		}

		variations = [].concat(variations) // don't use the source argument, shallow copy it instead
		for (let i = 0; i < variations.length; i++) {
			let variation = variations[i]

			if (!(variation instanceof Variation)) {
				variations[i] = variation = Variation.create(variation)
			}
		}

		return new Experiment({ name, id, variations, targeting, userData })
	}
}

module.exports = Experiment
