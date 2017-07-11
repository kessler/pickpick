'use strict'

const debug = require('./debug')('Experiment')
const loadbalance = require('loadbalance')
const Variation = require('./Variation')
const Targeting = require('./Targeting')

const _name = Symbol('_name')
const _variations = Symbol('_variations')
const _engine = Symbol('_engine')
const _targeting = Symbol('_targeting')

class Experiment {
	constructor({ name, variations = [], targeting = Targeting.default() }) {
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
		this[_variations] = variations // dont use the source argument, shallow copy it
		this[_targeting] = targeting
		this._initEngine()
	}

	pick() {
		return this[_engine].pick()
	}

	match(targeting) {
		return this[_targeting].match(targeting)
	}

	get targeting() {
		return this[_targeting]
	}

	[Symbol.iterator] () {
		return this[_variations][Symbol.iterator]()
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

	join(experiment) {
		if (!(experiment instanceof Experiment)) {
			throw new Error('cannot add an experiment to another experiment')
		}

		this._join(experiment)
		this._initEngine()
	}

	_join(experiment) {
		this[_variations] = this[_variations].concat(experiment[_variations])
	}

	toString(tabs) {
			tabs = tabs || ''
			let desc = `${tabs}Experiment (\n`
			desc += `${tabs}\tName: ${this[_name]}\n`
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

	static create({ name = 'FooExperiment', variations = [], targeting }) {
		variations = [].concat(variations) // don't use the source argument, shallow copy it instead
		for (let i = 0; i < variations.length; i++) {
			let variation = variations[i]

			if (!(variation instanceof Variation)) {
				variations[i] = variation = Variation.create({ object: variation })
			}
		}

		return new Experiment({ name, variations, targeting })
	}
}

module.exports = Experiment
