const later = require('later')

class TemporalValue {

	constructor(value) {
		if (new.target === TemporalValue) {
			throw new Error('cannot instantiate')
		}

		this._value = later.schedule(value)
	}

	toJSON() {
		return this._toJSONImpl(this._value)
	}

	isValid(value) {
		throw new Error('must implement')
	}

	static cron(value) {
		return new CronTemporalValue(value)
	}

	static text(value) {
		return new TextTemporalValue(value)
	}

	static recur() {
		return later.parse.recur()
	}
}

class CronTemporalValue extends TemporalValue{
	constructor(value) {
		let cron = later.parse.cron(value)
		super(cron)
	}

	isValid(value) {
		return this[_value].isValid(value)
	}

	_toJSONImpl() {

	}
}

class TextTemporalValue extends TemporalValue {

}

class RecurTemporalValue extends TemporalValue {
	constructor() {
		super(later.parse.recur())
	}
}

module.exports = TemporalValue