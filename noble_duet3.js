var noble = require('noble')
var async = require('async')
var readline = require('readline')

var myAddress = 'c45f59140d72';
var myName = null;

var serviceUuid = '6e400001b5a3f393e0a9e50e24dcca9e';
var writeUuid = '6e400002b5a3f393e0a9e50e24dcca9e';
var NotifyUuid = '6e400003b5a3f393e0a9e50e24dcca9e';

var writeChar = null;
var NotifyChar = null;

const writeBuf = new Buffer([0xff, 0x12, 0x00, 0xee]);


var input = readline.createInterface(process.stdin, process.stdout);


/*
*  Start scanning
*/
noble.on('stateChange', function(state) {
	if(state=='poweredOn') {
		noble.startScanning();
	}else{
		noble.stopScanning();
	}
});


/*
*  If discovered peripheral is same with myAddress, stop scanning and connect
*/
noble.on('discover', function(peripheral) {
	if(peripheral.id === myAddress || peripheral.address === myAddress) {
		noble.stopScanning();

		var advertisement = peripheral.advertisement;
		myName = advertisement.localName;

		console.log('[SUCCESS]found peripheral with ID ' + peripheral.id);
		console.log('[NAME]' + myName);

		peripheral.connect(function(err) {
			if(!err) {
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
                                }
                            })
                            if (writeChar && NotifyChar) {
                                communicate();  // start communicate
                            }
                        })
                    })
                })
            } else {
			console.log("[FAIL]not connected");
			prcess.exit(0);
	    }
			peripheral.on('disconnect',function() {
				console.log("[END]disconnected");
				process.exit(0);
			});
		})		
	}
	
});


function communicate() {
	input.question("[PRESS]any key if you want to get notification ", function(key) {	
		writeChar.write(writeBuf, true, function(err) {
			if(!err) {
				console.log("[SUCCESS]send 'ff120000' to " + myName);

				NotifyChar.notify(true);
				console.log("notification read!");
				NotifyChar.on('read', function(data, notification) {
					if(notification) {
						console.log("\n[COMMAND]command value : " + data);
					} 
				});
			} else {
				console.log("[FAIL]send buff array to " + myName);
			}
		});
	})	
}

	



















