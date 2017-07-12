'use strict'

const { isString, isBoolean, isNumber } = require('util')

// TODO refactor to a class(es)?
let _name = Symbol('_name')
let _value = Symbol('_value')

class Matcher {
	constructor(name, value) {
		this[_name] = name
		this[_value] = value
	}

	get name() {
		return this[_name]
	}

	get value() {
		return this[_value]
	}

	match(val) {
		throw new Error('must implement')
	}
}

class IsAnyMatcher extends Matcher {
	constructor() {
		super('any')
	}

	match(value) {
		return true
	}
}

class IsExactlyMatcher extends Matcher {
	constructor(value) {
		super('isExactly', value)
	}

	match(value) {
		return value === this[_value]
	}
}

class IsInMatcher extends Matcher {
	constructor(value) {
		super('isIn', value)
	}

	match(value) {
		return this[_value].includes(value)
	}
}

const any = new IsAnyMatcher()

module.exports.isAny = () => {
	return any
}

module.exports.isExactly = (val) => {
	return new IsExactlyMatcher(val)
}

// can't just use "in" :(
module.exports.isIn = (val) => {
	return new IsInMatcher(val)
}

module.exports.valueOf = (val) => {
	if (val === '*') {
		return any
	}

	if (Array.isArray(val)) {
		return new IsInMatcher(val)
	}

	if (isString(val) || isBoolean(val) || isNumber(val)) {
		return new IsExactlyMatcher(val)
	}

	throw new Error(`unsupported type: ${typeof(val)}`)
}

module.exports.Matcher = Matcher
module.exports.IsAnyMatcher = IsAnyMatcher
module.exports.IsExactlyMatcher = IsExactlyMatcher
module.exports.IsInMatcher = IsInMatcher