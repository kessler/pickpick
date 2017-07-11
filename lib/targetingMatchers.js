'use strict'

// TODO refactor to a class(es)?

// class Matcher {
// 	constructor(name, value) {
// 		this._name = name
// 		this._value = value
// 	}

// 	get name() {
// 		return this._name
// 	}

// 	get value() {
// 		return this._value
// 	}

// 	match(val) {
// 		throw new Error('must implement')
// 	}
// }

// class AllMatcher extends Matcher {
// 	constructor(name, value) {
// 		super(name, 'all')
// 	}

// 	match(value) {
// 		return true
// 	}
// }

// class SpecificMatcher extends Matcher {
// 	constructor(name, value) {
// 		super(name, value)
// 	}

// 	match(value) {
// 		return value === this._value
// 	}
// }

// class IncludesMatcher extends Matcher {
// 	constructor(name, value) {
// 		super(name, value)
// 	}

// 	match(value) {
// 		return this._value.includes(value)
// 	}
// }

module.exports.isAny = () => {
	let f = function any (candidate) {
		return true
	}

	f.value = 'any'
	
	return f
}

module.exports.isExactly = (val) => {
	let f = function isExactly (candidate) {
		return candidate === val
	}

	f.value = val
	
	return f
}

// can't just use "isIn" :(
module.exports.isIn = (val) => {
	let f = function isIn(candidate) {
		return val.includes(candidate)
	}

	f.value = val
	
	return f
}
