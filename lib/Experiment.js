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
		if (!(targeting instanceof Targeting)) throw new Error('invalid targeting')

		for (let i = 0; i < variations.length; i++) {
			if (!(variations[i] instanceof Variation)) throw new Error(`invalid variation at index ${i}`)
		}

		this[_name] = name
		this[_variations] = variations
		this[_engine] = loadbalance.roundRobin(variations)
		this[_targeting] = targeting
	}

	pick(targeting) {
		debug('pick()')

		if (this[_targeting].match(targeting)) {
			let variation = this[_engine].pick()

			if (variation instanceof Experiment) {
				variation = variation.pick(targeting)
			}

			return variation
		}

		return this[_engine].pick()
	}

	toString(tabs) {
			tabs = tabs || ''
			let desc = `${tabs}Experiment (\n`
			desc += `${tabs}\tName: ${this[_name]}\n`
			desc += `${tabs}\t${this[_targeting].toString()}\n`

			if (this[_variations].length > 0) {
				desc += `${tabs}\tVariations:\n`
				this[_variations].forEach((variation, index) => {
							let isBase = '' //index === 0 ? '<== base variation' : ''
							desc += `${tabs}\t\t#${index} ${variation.toString(`${tabs}\t\t`)} ${isBase}\n`
			})
		}

		desc += `${tabs})`
		return desc
	}

	static create({ name = 'FooExperiment', variations = [], targeting }) {

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
