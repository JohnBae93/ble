//
// Created by JohnBae on 2017-02-08.
//

var noble = require('noble')
var readline = require('readline')

var myAddress = '98072d8b8493';
var myName = null;

var serviceUuid = 'fff0';
var writeUuid = 'fff3';
var commandNotiUuid = 'fff4';
var sensorNotiUuid = 'fff5';

var writeChar = null;
var commandNotiChar = null;
var sensorNotiChar = null;

var writeH = new Buffer('H');
var writeS = new Buffer('S');

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
                                if (characteristic.uuid == commandNotiUuid) {
                                    commandNotiChar = characteristic;
                                    console.log('[SUCCESS]found commandNoitiCharacteristic:', characteristic.uuid);
                                }
                                if (characteristic.uuid == sensorNotiUuid) {
                                    sensorNotiChar = characteristic;
                                    console.log('[SUCCESS]found sensorNotiCcharacteristic:', characteristic.uuid);
                                }
                            })
                            if (writeChar && commandNotiChar && sensorNotiChar) {
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
    writeChar.write(writeH, true, function(err) {
        if(!err) {
            console.log("[SUCCESS]send 'H' to " + myName);

            commandNotiChar.notify(true);
            commandNotiChar.on('data', function(data, notification) {
                if(notification) {
                    /*
                    *	If user press button in device, device send 6 to RPi and input stream is opened.
                    * 	Depending on user input, device led changes color
                    */
                    if(data.readUInt8(0) == 6) {
                        console.log("[COMMAND]%s button is pressed", myName);

                        input.question("[PRESS]0:green, 1:yellow, 2:nothing, other:nothing\n", function(key) {
                            if(key == '0' || key == '1' || key == '2') {
                                keybuff = new Buffer(key)
                                writeChar.write(keybuff, true, function (err) {
                                    console.log("[SUCCESS]write " + myName + key);
                                });
                            } else {
                                console.log("[SUCCESS]write nothing");
                            }
                        });
                    /*
                    *	Any command that device send to device
                    */
                    } else {
                        console.log("\n[COMMAND]command value : " + data);
                    }
                }
            });

            /*
            *	Notification
            */
            input.question("[PRESS]any key if " + myName + " command you 'R' ", function(key) {
                writeChar.write(writeS, true, function(err) {
                    if(!err) {
                        console.log("[SUCCESS]send 'S' to " + myName);

                        sensorNotiChar.notify(true);
                        sensorNotiChar.on('data', function(data, notification) {
                            if(notification) {
                                console.log("[NOTIFY]sensor value : " + data.readUInt8(0));
                            }
                        });
                    } else {
                        console.log("[fail]send 'S' to " + myName);
                    }
                });
            });
        } else {
            console.log("[fail]send 'H' to " + myName);
        }
    });
}
