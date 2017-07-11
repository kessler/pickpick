'use strict'

const Experiment = module.exports.Experiment = require('./lib/Experiment')
module.exports.Targeting = require('./lib/Targeting')
module.exports.Variation = require('./lib/Variation')
module.exports.matchers = require('./lib/targetingMatchers')
module.exports.createExperiment = Experiment.create
module.exports.ExperimentContainer = require('./lib/ExperimentContainer')
