const debug = require('debug')

module.exports = (name) => {
	return debug(`experiments-engine:${name}`)
}