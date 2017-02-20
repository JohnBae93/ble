/*
 * Created on 16/02/17.
 * 	you should insert 
 *          bleacon.name = peripheral.advertisement.localNmae
 *	    bleacon.addr = peripheral.id
 *          bleacon.peripheral = peripheral
 *	to bleacon.js
 */
var Bleacon = require('bleacon');
var noble = require('noble');
var readline = require('readline')

var myName = 'DUET2';

var serviceUuid = '6e400001b5a3f393e0a9e50e24dcca9e';
var writeUuid = '6e400002b5a3f393e0a9e50e24dcca9e';
var NotifyUuid = '6e400003b5a3f393e0a9e50e24dcca9e';

var writeChar = null;
var NotifyChar = null;

var numOfData = null;

var writeBuf_DataNum = new Buffer([0xff, 0x12, 0x00, 0x00]);
var writeBuf_DataVal = new Buffer([0xff, 0x0d, 0x02, 0x00, 0x00, 0x00]);

function checkSum(arr) {
	var len = arr.length;
	var sum = 0x00;
	for (var i = 0; i < len - 1; i++) {
		sum += arr[i];
	}
	var checksum = 0xffff - sum;
	checksum = checksum & 0x00ff;
	arr[len - 1] = checksum;
	return arr;
}

var input = readline.createInterface(process.stdin, process.stdout);

Bleacon.startScanning();

Bleacon.on('discover', function(bleacon) {
	var addr = bleacon.addr;
	var uuid = bleacon.uuid;
	var major = bleacon.major;
	var minor = bleacon.minor;
	var heart = Math.floor(minor / 256);
	var fall = minor % 256;
	var measuredPower = bleacon.measuredPower;
	var rssi = bleacon.rssi;
	var accuracy = bleacon.accuracy;
	var proximity = bleacon.proximity;
	var name = bleacon.name;
	var peripheral = bleacon.peripheral;
	
	console.log("[ADVERTISEMENT]");
	
	console.log("Mac add : " + addr );
	console.log("name : " + name);	
	console.log("uuid : " + uuid);	
	console.log("major : " + major);	
	console.log("heart : " + heart);
	console.log("fall : " + fall);		
	console.log("measuredPower : " + measuredPower);	
	console.log("rssi : " + rssi);	
	console.log("accuracy : " + accuracy);
	console.log("proximity : " + proximity);

	if(heart > 10 && name == myName) {
		noble.stopScanning();
		connect(peripheral);
	}
});

function connect(peripheral){
	peripheral.connect(function (err) {
		if (!err) {
			console.log("[SUCCESS]connected");

			peripheral.discoverServices([serviceUuid], function (err, services) {
				services.forEach(function (service) {
					console.log('[SUCCESS]found service:', service.uuid);

					service.discoverCharacteristics([], function (err, characteristics) {
						characteristics.forEach(function (characteristic) {
							if (characteristic.uuid == writeUuid) {
								writeChar = characteristic;
								console.log('[SUCCESS]found writeCharacteristic:', characteristic.uuid);
							}

							if (characteristic.uuid == NotifyUuid) {
								NotifyChar = characteristic;
								console.log('[SUCCESS]found NotifyCcharacteristic:', characteristic.uuid);
								NotifyChar.notify(true);
							}
						})

						if (writeChar && NotifyChar) {
							NotifyChar.on('data', onNotification);
							getDataNum();
						}
					})
				})
			})
		} else {
			console.log("[FAIL]not connected");
			prcess.exit(0);
		}
		peripheral.on('disconnect', function () {
			console.log("[END]disconnected");
			process.exit(0);
		});
	})
}


/*
 *   Write command to get number of Data
 */
function getDataNum() {
	input.question("[PRESS]any key if you want to get num of data ", function (key) {

		writeBuf_DataNum = checkSum(writeBuf_DataNum);

		writeChar.write(writeBuf_DataNum, true, function (err) {
			if (!err) {
				console.log("[SUCCESS]send command to get notify");
			} else {
				console.log("[FAIL]send command to " + myName);
			}
		});
	});
}


/*
 *   Write command to get values of Data
 */
function getDataVal(start_first, start_second) {
	input.question("[PRESS]any key if you want to get values of data ", function (key) {

		writeBuf_DataVal[3] = start_first;
		writeBuf_DataVal[4] = start_second;
		writeBuf_DataVal = checkSum(writeBuf_DataVal);

		writeChar.write(writeBuf_DataVal, true, function (err) {
			if (!err) {
				console.log("[SUCCESS]send command to get notify");
			} else {
				console.log("[FAIL]send command to " + myName);
			}
		});
	})
}

function onNotification(data, notification) {
	if (notification) {
		console.log("\n[Notify]Notification data : ");
		console.log("Start Delimiter : " + data.readUInt8(0));
		console.log("Packet Type : " + data.readUInt8(1));
		console.log("Length Bythes : " + data.readUInt8(2));

		if(data.readUInt8(1) == 18) {
			console.log("Data Count : " + data.readUInt16BE(3));
			console.log("Check sum : " + data.readUInt8(5));

			numOfData = data.readUInt16BE(3);

			getDataVal(0x00, 0x00);
		}
		else if (data.readUInt8(1) == 13) {
			console.log("Start index: " + data.readUInt16BE(3).toString());

			var start = data.readUInt16BE(3);
			var i;

			for (i = 0; i < data.readUInt8(2) - 2; i++) {
				console.log((i + start + 1) + " th data : " + data.readUInt8(i + 5));
			}
			console.log("Check sum : " + data.readUInt8(i + 5));

			// set next start index
			start = start + i;
			var start_first = Math.floor(start/256);
			var start_second = start%256;

			if(numOfData <= start) {
				console.log("[END]program");
				process.exit(0);
			}
			else
				getDataVal(start_first, start_second);
		}
	}
}
