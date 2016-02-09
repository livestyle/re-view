'use strict';

export default class Dimention {
	constructor(value, unit='px') {
		if (typeof value === 'string') {
			let m = value.match(/^(\d+(?:\.\d*)?)(.*)$/);
			if (!m) {
				throw new Error('Invalid number format: ' + value);
			}
			value = parseFloat(m[1]);
			unit = m[2] || unit;
		} else if (value instanceof Dimention) {
			[value, unit] = [value.value, value.unit];
		}

		this.value = value;
		this.unit = unit;
	}

	copy(value=this.value, unit=this.unit) {
		return new Dimention(value, unit);
	}

	equals(d) {
		return this.value === d.value && this.unit === d.unit;
	}

	valueOf(scale=1) {
		return Math.round(this.value * scale) + this.unit;
	}
};
