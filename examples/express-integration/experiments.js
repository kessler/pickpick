const { Experiment, ExperimentContainer } = require('../index')

// first create the experiments:

let e1 = Experiment.create({
	name: 'buy page button color experiment',
	id: '953d6fe0',
	variations: [
		{ object: { color: '#000000', text: 'Hello World!' }, weight: 1 },
		{ object: { color: '#ff0000', text: 'Hi World' }, weight: 2 },
		{ object: { color: '#ffff00', text: 'Yo Everyone!' }, weight: 1 },
		{ object: { color: '#00ff00', text: 'Shalom!' }, weight: 1 }
	],
	targeting: '_.path in ["/", "about"]'
})

// let e2 = Experiment.create({
// 	name: 'buy page price experiment',
// 	id: 'a40f09ac',
// 	variations: [
// 		{ object: 25 },
// 		{ object: 35 },
// 		{ object: 45 }
// 	],
// 	targeting: '_.page !== "home" && _.page !=="about"'
// })

// let e3 = Experiment.create({
// 	name: 'index text experiment',
// 	id: 'ac49ef42',
// 	variations: [
// 		{ object: 'hi' },
// 		{ object: 'hello' },
// 		{ object: 'welcome' }
// 	],
// 	targeting: '_.page === "index"'
// })

// now create a container:
let experiments = [e1]
let container = ExperimentContainer.create({ experiments })

module.exports = container
