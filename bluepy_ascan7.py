from bluepy.btle import *
import bluetooth, time
import sys

class ScanDelegate(DefaultDelegate):
    def __init__(self):
        DefaultDelegate.__init__(self)

    def handleDiscovery(self, dev, isNewDev, isNewData):
        if isNewDev:
            print"Discovered device", dev.addr
        elif isNewData:
            print"Received new data from", dev.addr

class MyDelegate(DefaultDelegate):
    def __init__(self):
        DefaultDelegate.__init__(self)
        
    def handleNotification(self, cHandle, data):
        print("notiy with data : {}".format(data))

num = 1
ch_write = None
ch_command = None
ch_sensor = None
readData = None
name = "ASCAN7"
addr = ""


'''
    [1] Scan bluetooth device and connect with proper name
'''
print("[Scan devices...]")
scanner = Scanner().withDelegate(ScanDelegate())

try: 
    for i in range(0, num):
        devices = scanner.scan()

        for dev in devices:
            for (adtype, desc, value) in dev.getScanData():
                if "Name" in desc:
                    if value == name:
                        print "Device %s (%s), RSSI = %d dB,"%(dev.addr, dev.addrType, dev.rssi),
                        print "Name = %s"%(value)

                        addr = dev.addr
                        peripheral = Peripheral(addr)
                        peripheral.withDelegate(MyDelegate())
                        print("[Success Connecting with {}]".format(value))

                        print("[Scan serivces in {}...]".format(value))
                        for service in peripheral.getServices():
                            if "fff0" in str(service.uuid):
                                print(service.uuid)
                                print("[Scan characteristics in 'fff0'...]")
                                
                                for characteristic in service.getCharacteristics():
                                    print(characteristic.uuid)
                                    print(characteristic.propertiesToString(),
                                          characteristic.getHandle(),
                                          characteristic.supportsRead())
                                    if "fff3" in str(characteristic.uuid):
                                        ch_write = characteristic
                                        
                                    if "fff4" in str(characteristic.uuid):
                                        ch_command = characteristic

                                    if "fff5" in str(characteristic.uuid):
                                        ch_sensor = characteristic
            if len(addr) > 1:
                print("[Success Finding {}]".format(name))
                break


    '''
        [2] Write and get notification with the connected device
    '''                            
    if ch_write and ch_command and ch_sensor:                            
        print("Catched write char_uuid : {}".format(ch_write.uuid))
        print("Catched command char_uuid : {}".format(ch_command.uuid))
        print("Catched seonsor value char_uuid : {}".format(ch_sensor.uuid))
        
        h = raw_input("Press H to start : ")
        ch_write.write(h)

        s = raw_input("If light is blue, input S: ")
        ch_write.write(s)
        
        while True:
            if  peripheral.waitForNotifications(10.0):
                print("notification")
                continue
            print("Waiting..")
    
    a = raw_input("[End] Press any key to exit : ")
except KeyboardInterrupt:
    print("Exit because of keyboard interrupt")