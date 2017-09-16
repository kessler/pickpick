const { expressMiddleware, ExperimentContainer, Experiment } = require('../index')
const { expect } = require('chai')

describe('expressMiddleware can be used to run an experminets container inside an express application', () => {
	// TODO split this test
	it('collects feature data from the request object, picks and experiment and a variation and ' +
		'places them back in the request object under the pickpick property', () => {

			let e1Variations = [{ price: 1 }, { price: 2 }]
			let e1 = Experiment.create({
				name: 'e1',
				id: 'foo-id',
				variations: e1Variations,
				targeting: { geo: 'US', url: '/buy' }
			})

			let e2Variations = [{ buttonColor: 1, buttonTextColor: 2 }]
			let e2 = Experiment.create({
				name: 'e2',
				id: 'bar-id',
				variations: e2Variations,
				targeting: { geo: '*', url: '/index' }
			})

			let container = ExperimentContainer.create({})
			container.add(e1, e2)

			let middleware = expressMiddleware(container)

			// first visitor - should get an experiment
			let req = { geo: 'US', url: '/buy'}

			middleware(req, null, noop)

			expect(req).to.have.property('pickpick')
			expect(req.pickpick).to.have.property('variation')
			expect(e1Variations).to.deep.include(req.pickpick.variation)
			expect(req.pickpick).to.have.property('experiment')
			expect(req.pickpick.experiment.name).to.equal('e1')

			// second visitor - should get an experiment
			req = { geo: 'MX', url: '/index'}

			middleware(req, null, noop)

			expect(req).to.have.property('pickpick')
			expect(req.pickpick).to.have.property('variation')
			expect(e2Variations).to.deep.include(req.pickpick.variation)
			expect(req.pickpick).to.have.property('experiment')
			expect(req.pickpick.experiment.name).to.equal('e2')

			// third visitor - should NOT get an experiment
			req = { geo: 'MX', url: '/boy'}

			middleware(req, null, noop)

			expect(req).to.not.have.property('pickpick')
		})

	function noop() {}
})
