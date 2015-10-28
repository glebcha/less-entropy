class Logger {
	constructor(names) {
		const defaults = {
			info: 'Dude',
			warn: 'Scatman'
		};
		let namesObj = names || defaults;

		this.infoName = namesObj.info;
		this.warnName = namesObj.warn;
	}

	info(string = 'ORLY, ') {
		console.info(string, this.infoName);
	}

	warn(string = 'Thats a ') {
		console.warn(string, this.warnName);
	}
}

export default Logger