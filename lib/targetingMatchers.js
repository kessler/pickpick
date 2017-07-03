'use strict'

module.exports.all = () => {
	return function all(candidate) {
		return true
	}
}

module.exports.specific = (val) => {
	return function specific(candidate) {
		return candidate === val
	}
}

module.exports.includes = (val) => {
	return function includes(candidate) {
		return val.includes(candidate)
	}
}
