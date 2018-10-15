const express = require('express')
const experiments = require('./experiments')

console.log(`targeting features: ${Array.from(experiments.targetingFeatures)}`)

const app = express()

app.use((req, res, next) => {
	let visitor = collectFeatureData(experiments, req)
	console.log(`visitor data: ${JSON.stringify(visitor)}`)
	let selectedExperiment = experiments.pick(visitor)
	if (selectedExperiment) {
		req.variation = selectedExperiment.pick()
	}

	next()
})

app.get('/', (req, res) => {
	// defaults, but in this example they will never be used
	// since our targeting covers all visitors to '/' page
	let color = 'black'
	let text = 'Hello World!'

	if (req.variation) {
		console.log(`selected variation: ${JSON.stringify(req.variation)}`)
		color = req.variation.color
		text = req.variation.text
	}

	let template = `<h1 style="color: ${color}">${text}</h1>`

	res.end(template)
})

app.listen(3000, () => {
	console.log('ready at http://localhost:3000/')
})

function collectFeatureData(container, req) {
	let visitor = {}

	// collect all the targeting features used in all the experiments from the request object
	for (let feature of container.targetingFeatures) {
		let value = req[feature]
		if (value) {
			visitor[feature] = value
		}
	}

	return visitor
}
