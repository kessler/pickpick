'use strict'

class Counter {
	constructor(name) {
		this._name = name || 'Counter'
		this._data = new Map()
	}

	count(something) {
		let count = this._data.get(something)

		if (!count) {
			count = 0
		}

		this._data.set(something, ++count)
	}

	get(something) {
		return this._data.get(something)
	}

	toString() {
		let spaceSize = 40
		let result = `### ${this._name}\n`
		result += `value${spaces(spaceSize - 5)}count\n`
		let keys = Array.from(this._data.keys()).sort()

		for (let val of keys) {
			let text = typeof val === 'object' ? JSON.stringify(val) : val
			let len = spaceSize - (text.length || 1)
			let count = this._data.get(val)
			result += `${text}${spaces(len)}${count}\n`
		}

		return result
	}
}

function spaces(size) {
	let r = ''
	for (let i = 0; i < size; i++) {
		r += ' '
	}
	return r
}

module.exports = Counter
