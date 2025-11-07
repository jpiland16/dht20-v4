//% icon="\uf043" color=190
namespace DHT20 {
    class SoftI2C {
        scl: number
        sda: number
        delay: number
        constructor(scl: number, sda: number, delay: number = 2) {
            this.scl = scl
            this.sda = sda
            this.delay = delay
            pins.digitalWritePin(scl, 1)
            pins.digitalWritePin(this.sda, 1)
        }

        private _clock() {
            control.waitMicros(this.delay * 1e3)
            pins.digitalWritePin(this.scl, 1)
            control.waitMicros(this.delay * 1e3)
            pins.digitalWritePin(this.scl, 0)
        }

        public start() {
            pins.digitalWritePin(this.sda, 1)
            pins.digitalWritePin(this.scl, 1)
            control.waitMicros(this.delay * 1e3)
            pins.digitalWritePin(this.sda, 0)
            control.waitMicros(this.delay * 1e3)
            pins.digitalWritePin(this.scl, 0)
        }

        public stop() {
            pins.digitalWritePin(this.sda, 0)
            pins.digitalWritePin(this.scl, 1)
            control.waitMicros(this.delay * 1e3)
            pins.digitalWritePin(this.sda, 1)
            control.waitMicros(this.delay * 1e3)
        }

        public write_byte(b: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.sda, b >> 7 - i & 1)
                this._clock()
            }
            pins.digitalWritePin(this.sda, 1)
            control.waitMicros(this.delay * 1e3)
            pins.digitalWritePin(this.scl, 1)
            let ack = pins.digitalReadPin(this.sda)
            pins.digitalWritePin(this.scl, 0)
            return ack == 0
        }

        public read_byte(ack: boolean = true): number {
            let value = 0
            pins.digitalWritePin(this.sda, 1)
            for (let j = 0; j < 8; j++) {
                pins.digitalWritePin(this.scl, 1)
                control.waitMicros(this.delay * 1e3)
                value = value << 1 | pins.digitalReadPin(this.sda)
                pins.digitalWritePin(this.scl, 0)
                control.waitMicros(this.delay * 1e3)
            }
            pins.digitalWritePin(this.sda, ack ? 0 : 1)
            this._clock()
            pins.digitalWritePin(this.sda, 1)
            return value
        }

    }

    class DHT20 {
        static ADDRESS: number
        private ___ADDRESS_is_set: boolean
        private ___ADDRESS: number
        get ADDRESS(): number {
            return this.___ADDRESS_is_set ? this.___ADDRESS : DHT20.ADDRESS
        }
        set ADDRESS(value: number) {
            this.___ADDRESS_is_set = true
            this.___ADDRESS = value
        }

        i2c: SoftI2C
        public static __initDHT20() {
            DHT20.ADDRESS = 0x38
        }

        constructor(i2c: SoftI2C) {
            this.i2c = i2c
            this._init_sensor()
        }

        private _init_sensor() {
            this._write([0xBE, 0x08, 0x00])
            control.waitMicros(5e4)
        }

        private _write(data: number[]) {
            this.i2c.start()
            this.i2c.write_byte(this.ADDRESS << 1)
            for (let b of data) {
                this.i2c.write_byte(b)
            }
            this.i2c.stop()
        }

        private _read(n: number): number[] {
            let data = []
            this.i2c.start()
            this.i2c.write_byte(this.ADDRESS << 1 | 1)
            for (let k = 0; k < n; k++) {
                data.push(this.i2c.read_byte(k < n - 1))
            }
            this.i2c.stop()
            return data
        }

        public read(): number[] {
            this._write([0xAC, 0x33, 0x00])
            control.waitMicros(8e4)
            let data2 = this._read(7)
            if ((data2[0] & 0x80) != 0) {
                return [null, null]
            }

            let raw_h = data2[1] << 12 | data2[2] << 4 | data2[3] >> 4
            let raw_t = (data2[3] & 0x0F) << 16 | data2[4] << 8 | data2[5]
            let humidity = raw_h / 2 ** 20 * 100
            let temperature = raw_t / 2 ** 20 * 200 - 50
            return [humidity, temperature]
        }

    }

    export let dht_humidity: number = null;
    export let dht_temperature: number = null;

    //% block="humidity"
    export function getHumidity(): number {
        return dht_humidity
    }

    //% block="temperature"
    export function getTemp(): number {
        return dht_temperature
    }

    let sensor: DHT20 = null;

    //** Start the connection to the DHT. */
    //% block="initialize dht | using SCL pin $scl_pin and SDA pin $sda_pin"
    export function initializeDht(scl_pin: DigitalPin, sda_pin: DigitalPin) {
        DHT20.__initDHT20()


        //  --- Setup Soft I2C and Sensor ---
        let i2c = new SoftI2C(scl_pin, sda_pin)
        sensor = new DHT20(i2c)
    }

    //** Update the humidity and temperature readings from the sensor. You must use "initialize dht" first.*/
    //% block
    export function readDht() {
        [dht_humidity, dht_temperature] = sensor.read()
        if (dht_humidity !== null) {
            console.log("Humidity: " + ("" + Math.roundWithPrecision(dht_humidity, 1)) + " %, temp: " + ("" + Math.roundWithPrecision(dht_temperature, 1)) + "C")
        }

        control.waitMicros(1e6)
    }
}
