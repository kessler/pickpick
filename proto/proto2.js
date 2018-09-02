const loadbalance = require('loadbalance')
const Targeting = require('./lib/Targeting')
const Variation = require('./lib/Variation')
const Trie = require('digital-tree')
const Experiment = require('./lib/Experiment')
const { isExactly, isIn, isAny } = require('./lib/matchers')

class Container {
	constructor(_seed) {
		this._experiments = []
		this._seed = _seed
	}

	add(experiment) {
		this._experiments.push(experiment)
	}

	getVariation(targeting) {
		let experiment = this.getExperiment(targeting)

		if (experiment) {
			return experiment.pick(targeting)
		}
	}

	getExperiment(targeting) {
		let candidates = []

		for (let experiment of this._experiments) {
			if (experiment.match(targeting)) {
				candidates.push(experiment)
			}
		}

		if (candidates.length === 0) {
			return null
		}

		// seed is for testing purposes
		let engine = loadbalance.random(candidates, this._seed)

		return engine.pick()
	}
}

class Counter {
	constructor() {
		this._data = new Map()
	}

	count(something) {
		let count = this._data.get(something)

		if (!count) {
			count = 0
		}

		this._data.set(something, ++count)
	}

	get(something) {
		return this._data.get(something)
	}

	toString() {
		let spaceSize = 40
		let result = `value${spaces(spaceSize - 5)}count\n`
		let keys = Array.from(this._data.keys()).sort()

		for (let val of keys) {
			let text = typeof val === 'object' ? JSON.stringify(val) : val
			let len = spaceSize - (text.length || 1)
			let count = this._data.get(val)
			result += `${text}${spaces(len)}${count}\n`
		}

		return result
	}
}

function run() {
	let size = 100

	let e1 = Experiment.create({
		variations: [5, 6],
		targeting: Targeting.create({
			page: 'buy',
			geo: isIn(['US', 'MX', 'IL'])
		})
	})

	let e2 = Experiment.create({
		variations: [3, 4],
		targeting: Targeting.create({ geo: 'US', page: 'buy' })
	})

	let e3 = Experiment.create({
		variations: [1, 2],
		targeting: Targeting.create({ geo: 'MX', page: 'buy' })
	})

	let traffic = loadbalance.roundRobin([
		{ geo: 'US', page: 'buy' },
		{ geo: 'MX', page: 'buy' },
		{ geo: 'IL', page: 'buy' },
		{ geo: 'IL', page: 'about' },
		{ page: 'index' }
	])

	let container = new Container(1)
	//container.add(e1)
	container.add(e2)
	container.add(e3)

	let variationCounter = new Counter()
	let visitorCounter = new Counter()
	let experimentsCounter = new Counter()

	for (let i = 0; i < size; i++) {
		let visitor = traffic.pick()

		let experiment = container.getExperiment(visitor)
		if (!experiment) {
			experimentsCounter.count('default')
			variation = 'default'
		} else {
			experimentsCounter.count(experiment)
			variation = experiment.pick(visitor)
		}

		if (variation === null || variation === undefined) {
			throw new Error('should not happen')
		}

		variationCounter.count(variation)
		visitorCounter.count(visitor)
	}

	console.log(visitorCounter.toString())
	console.log(variationCounter.toString())
	console.log(experimentsCounter.toString())

	console.log('done')
}

run()

function spaces(size) {
	let r = ''
	for (let i = 0; i < size; i++) {
		r += ' '
	}
	return r
}
