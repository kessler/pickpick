const { Experiment, ExperimentContainer } = require('./index')

// first create the experiments:

let e1 = Experiment.create({
	name: 'buy page button color experiment',
	id: '953d6fe0',
	variations: [
		{ object: '#ff0000', weight: 4 },
		{ object: '#ff0000', weight: 1 },
		{ object: '#00ff00', weight: 1 }
	],
	targeting: '_.page in ["buy", "index"]'
})

let e2 = Experiment.create({
	name: 'buy page price experiment',
	id: 'a40f09ac',
	variations: [{ object: 25 }, { object: 35 }, { object: 45 }],
	targeting: '_.page !== "home" && _.page !=="about"'
})

let e3 = Experiment.create({
	name: 'index text experiment',
	id: 'ac49ef42',
	variations: [{ object: 'hi' }, { object: 'hello' }, { object: 'welcome' }],
	targeting: '_.page === "index"'
})

// now create a container:
let experiments = [e1, e2, e3]
let container = ExperimentContainer.create({ experiments })

// simulate a visitor that needs a determination about which variation of which experiment he gets:
let visitor = { page: 'index' }
for (let i = 0; i < 10; i++) {
	let experiment = container.pick(visitor)

	if (!experiment) {
		// no experiment that targets this user
		// handle this with defaults
		console.log('default goes here')
	} else {
		console.log(
			`selected experiment '${experiment.name}' for '${JSON.stringify(
				visitor
			)}'`
		)
		let variation = experiment.pick()
		console.log(`selected variation is ${variation}`)
	}
}
