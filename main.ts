DHT20.initializeDht(DigitalPin.P2, DigitalPin.P1)
basic.forever(function () {
    basic.showLeds(`
        # # # # #
        . # . # .
        . . # . .
        . # . # .
        # # # # #
        `)
    DHT20.readDht()
    basic.clearScreen()
    basic.showString("" + Math.round(DHT20.getTemp()) + "C")
    basic.pause(200)
    basic.showString("" + Math.round(DHT20.getHumidity()) + "%")
    basic.pause(200)
})
