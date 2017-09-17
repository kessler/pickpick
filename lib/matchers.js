const { inspect, isString, isBoolean, isNumber } = require('util')

// TODO refactor to a class(es)?
let _name = Symbol('_name')
let _value = Symbol('_value')

function valueOf(val) {
	if (val instanceof Matcher) {
		return val
	}

	if (val === '*') {
		return any
	}

	if (Array.isArray(val)) {
		return new IsInMatcher(val)
	}

	if (isString(val)) {
		if (val[0] === '!') {
			return new IsNotMatcher(val.substr(1))
		}

		return new IsExactlyMatcher(val)
	}

	if (isBoolean(val) || isNumber(val)) {
		return new IsExactlyMatcher(val)
	}

	throw new Error(`unsupported type: ${typeof(val)} for value: ${inspect(val)}`)
}

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

	toJSON() {
		return this.value
	}
}

class IsAnyMatcher extends Matcher {
	constructor() {
		super('any')
	}

	match(value) {
		return true
	}

	toJSON() {
		return '*'
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

class IsNotMatcher extends Matcher {
	constructor(value) {
		super('isNot', value)
	}

	match(value) {
		return this[_value] !== value
	}
}

class AndMatcher extends Matcher {
	constructor(...value) {
		
		if (value.length === 0) {
			throw new Error('AndMatcher cannot accept empty arrays')
		}

		let matchValues = []

		for (let matcher of value) {
			if (!(matcher instanceof Matcher)) {
				matchValues.push(valueOf(matcher))
			}
		}

		super('and', matchValues)
	}

	match(value) {
		let result = true
		
		for (let matcher of this[_value]) {
			result = result && matcher.match(value)
		}

		return result
	}
}

const any = new IsAnyMatcher()

module.exports.isAny = () => {
	return any
}

module.exports.isExactly = (val) => {
	return new IsExactlyMatcher(val)
}

module.exports.isNot = (val) => {
	return new IsNotMatcher(val)
}

// can't just use "in" :(
module.exports.isIn = (val) => {
	return new IsInMatcher(val)
}

module.exports.and = (...val) => {
	return new AndMatcher(...val)
}

// TODO need to escape * and !
module.exports.valueOf = valueOf

module.exports.Matcher = Matcher
module.exports.IsAnyMatcher = IsAnyMatcher
module.exports.IsExactlyMatcher = IsExactlyMatcher
module.exports.IsInMatcher = IsInMatcher
