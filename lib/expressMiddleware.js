'use strict'

/**
 *	a middleware the collects visitor data and query the container for an appropriate variation
 *	of an experiment
 *
 *	the middleware will place its results in req.pickpick
 *
 */
module.exports = (container) => {

	// the container collects all the targeting features from all the experiments it contains
	// those are used to extract targeting data from the request in collectFeatuireData()
	let targetingFeatures = Array.from(container.targetingFeatures)

	return (req, res, next) => {
		let visitor = collectFeatureData(req)
		let experiment = container.pick(visitor)
		if (experiment) {
			req.pickpick = {
				experiment,
				variation: experiment.pick()
			}
		}
		next()
	}

	function collectFeatureData(req) {
		let visitor = {}

		for (let feature of targetingFeatures) {
			let value = req[feature]
			if (value) {
				visitor[feature] = value
			}
		}

		return visitor
	}
}