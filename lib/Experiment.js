'use strict'

const debug = require('./debug')('Experiment')
const loadbalance = require('loadbalance')
const Variation = require('./Variation')
const Targeting = require('./Targeting')

const _name = Symbol('_name')
const _variations = Symbol('_variations')
const _engine = Symbol('_engine')
const _targeting = Symbol('_targeting')
const _id = Symbol('_id')

class Experiment {
	constructor({ name, id, variations = [], targeting = Targeting.default() }) {
		if (!id) throw new Error('experiment id is mandatory')
		if (!(targeting instanceof Targeting)) {
			if (typeof (targeting) !== 'object') {
				throw new Error('targeting parameter can only be a simple expression object (e.g. { a: \'b\' }) or an instance of targeting')
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
		this._initEngine()
	}

	pick() {
		return this[_engine].pick()
	}

	match(targeting) {
		return this[_targeting].match(targeting)
	}

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

	[Symbol.iterator] () {
		return this[_variations][Symbol.iterator]()
	}

	/**
	 *	merge two experiments into one, this will pull
	 *	the input experiment's variation into this one
	 *
	 *	merging does not affect the weights of the variations
	 *	if E1 has ( Wv1 = 1, Wv2 = 2) and E2 has (Wv3 = 1, Wv4 = 9)
	 *	then after E2.merge(E1) E2 variation array will look like this:
	 *	( Wv1 = 1, Wv2 = 2, Wv3 = 1, Wv4 = 9)
	 *
	 */
	merge(experiment) {
		if (!(experiment instanceof Experiment)) {
			throw new Error('cannot add an experiment to another experiment')
		}

		this._merge(experiment)
		this._initEngine()
	}

	_merge(experiment) {
		this[_variations] = this[_variations].concat(experiment[_variations])
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
				desc += `${tabs}\t\t#${index} ${variation.toString(`${tabs}\t\t`)} ${isBase}\n`
			})


		desc += `${tabs})`
		return desc
	}

	_initEngine() {
		this[_engine] = loadbalance.roundRobin(this[_variations])
	}

	static create({ name = 'FooExperiment', id, variations = [], targeting }) {
		if (variations.length === 0) {
			throw new Error('cannot create an experiment without variations')
		}

		variations = [].concat(variations) // don't use the source argument, shallow copy it instead
		for (let i = 0; i < variations.length; i++) {
			let variation = variations[i]

			if (!(variation instanceof Variation)) {
				variations[i] = variation = Variation.create({ object: variation })
			}
		}

		return new Experiment({ name, id, variations, targeting })
	}
}

module.exports = Experiment
