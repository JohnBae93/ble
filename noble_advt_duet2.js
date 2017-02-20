var Bleacon = require('bleacon');
var noble = require('noble');

var uuid1 = '010001720d14595fc40a0201050609'
var uuid2 = '5fc41211079ecadc240ee5a9e093f3a3'

console.log("start scanning");

Bleacon.startScanning();

Bleacon.on('discover', function(bleacon) {
	console.log("discovered!");

	var addr = bleacon.addr;
	var uuid = bleacon.uuid;
	var major = bleacon.major;
	var minor = bleacon.minor;
	var measuredPower = bleacon.measuredPower;
	var rssi = bleacon.rssi;
	var accuracy = bleacon.accuracy;
	var proximity = bleacon.proximity;
	var name = bleacon.name;

	if(addr)
		console.log("Mac add : " + addr );

	if(name)
		console.log("name : " + name);

	if(uuid)
		console.log("uuid : " + uuid);

	if(major)
		console.log("major : " + major);

	if(minor) {
		console.log("heart : " + Math.floor(minor/256));
		console.log("fall : " + minor%256)
	}
	
	if(measuredPower)
		console.log("measuredPower : " + measuredPower);

	if(rssi)
		console.log("rssi : " + rssi);

	if(accuracy)
		console.log("accuracy : " + accuracy);

	if(proximity)
		console.log("proximity : " + proximity);
});
