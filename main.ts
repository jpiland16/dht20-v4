DHT20.initializeDht(DigitalPin.P2, DigitalPin.P1)
basic.forever(function () {
    DHT20.readDht()
    basic.showString("" + (DHT20.getTemp()))
    basic.pause(1000)
})
