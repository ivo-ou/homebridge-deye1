"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeyeDehumidifierAccessory = void 0;
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class DeyeDehumidifierAccessory {
    constructor(platform, accessory, info) {
        this.platform = platform;
        this.accessory = accessory;
        this.info = info;
        this.deviceStates = {
            Active: this.platform.Characteristic.Active.ACTIVE,
            FanSpeed: 1,
            CurrentHumidifierDehumidifierState: this.platform.Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING,
            sleepMode: this.platform.Characteristic.deviceMode == 6,
            dryCloMode: this.platform.Characteristic.deviceMode == 1,
            cleanMode: this.platform.Characteristic.deviceMode == 2,
            autoMode: this.platform.Characteristic.deviceMode == 3,
            TargetHumidifierDehumidifierState: this.platform.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER,
            CurrentRelativeHumidity: 60,
            RelativeHumidityDehumidifierThreshold: 60,
            WaterLevel: 0,
            LockPhysicalControls: 0,
        };
        this.fanTimer = null;
        this.deviceTimer = 120;
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Deye Technology')
            .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.deviceId.toUpperCase());
        // get the HumidifierDehumidifier service if it exists, otherwise create a new HumidifierDehumidifier service
        this.service = this.accessory.getService(this.platform.Service.HumidifierDehumidifier)
            || this.accessory.addService(this.platform.Service.HumidifierDehumidifier);
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        // Service dryClothes
        if (accessory.context.device.dryClothes) {
            this.dryCloService = this.accessory.getService('Dry Clothes Mode ' + accessory.context.device.name) ||
                this.accessory.addService(this.platform.Service.Switch, 'Dry Clothes Mode ' + accessory.context.device.name, accessory.context.device.deviceId);
            this.dryCloService.getCharacteristic(this.platform.Characteristic.On)
                .onSet(this.setDryCloMode.bind(this))
                .onGet(this.getDryCloMode.bind(this));
        }
        else {
            this.dryCloService = null;
        }
        // Service Sleep Mode
        if (accessory.context.device.sleepMode) {
            this.sleepService = this.accessory.getService('Sleep Mode ' + accessory.context.device.name) ||
                this.accessory.addService(this.platform.Service.Switch, 'Sleep Mode ' + accessory.context.device.name, accessory.context.device.deviceId + 'S');
            this.sleepService.getCharacteristic(this.platform.Characteristic.On)
                .onSet(this.setSleepMode.bind(this))
                .onGet(this.getSleepMode.bind(this));
        }
        else {
            this.sleepService = null;
        }
        // Service Clean Mode
        if (accessory.context.device.cleanMode) {
            this.cleanService = this.accessory.getService('Clean Mode ' + accessory.context.device.name) ||
                this.accessory.addService(this.platform.Service.Switch, 'Clean Mode ' + accessory.context.device.name, accessory.context.device.deviceId + 'C');
            this.cleanService.getCharacteristic(this.platform.Characteristic.On)
                .onSet(this.setCleanMode.bind(this))
                .onGet(this.getCleanMode.bind(this));
        }
        else {
            this.cleanService = null;
        }
        // Service Auto Mode
        if (accessory.context.device.autoMode) {
            this.autoService = this.accessory.getService('Auto Mode ' + accessory.context.device.name) ||
                this.accessory.addService(this.platform.Service.Switch, 'Auto Mode ' + accessory.context.device.name, accessory.context.device.deviceId + 'A');
            this.autoService.getCharacteristic(this.platform.Characteristic.On)
                .onSet(this.setAutoMode.bind(this))
                .onGet(this.getAutoMode.bind(this));
        }
        else {
            this.autoService = null;
        }
        // Service Current Active Status
        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.getOn.bind(this))
            .onSet(this.setOn.bind(this));
        // Service Current Relative Humidity
        this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(this.getCurrentRelativeHumidity.bind(this));
        // Service Dehumidifier RotationSpeed
        // console.log(accessory.context.device.fanControl)
        if (accessory.context.device.fanControl) {
            this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
                .setProps({
                minValue: 0,
                maxValue: 3,
                minStep: 1,
            })
                .onGet(this.getFan.bind(this))
                .onSet(this.setFan.bind(this));
        }
        // Service Target Dehumidifier State
        this.service.getCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState)
            .setProps({
            validValues: [2],
        })
            .onSet(this.setHumidifierDehumidifierState.bind(this))
            .onGet(this.getHumidifierDehumidifierState.bind(this));
        // Service Current Dehumidifier State
        this.service.getCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState)
            .setProps({
            validValues: [
                this.platform.Characteristic.CurrentHumidifierDehumidifierState.IDLE,
                this.platform.Characteristic.CurrentHumidifierDehumidifierState.INACTIVE,
                this.platform.Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING,
            ],
        })
            .onGet(this.getCurrentHumidifierDehumidifierState.bind(this));
        // Service Relative Dehumidifier Threshold
        this.service.getCharacteristic(this.platform.Characteristic.RelativeHumidityDehumidifierThreshold)
            .setProps({
            minValue: 0,
            maxValue: 100,
            minStep: 5,
        })
            .onGet(this.getRelativeHumidityDehumidifierThreshold.bind(this))
            .onSet(this.setRelativeHumidityDehumidifierThreshold.bind(this));
        // Service Water Level
        this.service.getCharacteristic(this.platform.Characteristic.WaterLevel)
            .onGet(this.getWaterLevel.bind(this));
        // Service Lock Physical Controls
        this.service.getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
            .onGet(this.getLockPhysicalControls.bind(this))
            .onSet(this.setLockPhysicalControls.bind(this));
        setInterval(() => {
            if (this.deviceTimer > 0) {
                this.deviceTimer--;
            }
            // this.platform.log.debug(`${accessory.context.device.name} ${this.deviceTimer.toString()}`);
        }, 1000);
        // this.platform.log.debug('============', info);
        const mqttClient = info.mqttClient;
        const eventer = info.eventer;
        const endPoint = info.mqttBaseInfo.endPoint;
        const productId = accessory.context.device.productId;
        const deviceId = accessory.context.device.deviceId;
        eventer.on(`${accessory.context.device.deviceId}_status`, (deviceInfo) => {
            this.platform.log.debug('Device Info ========== ' + this.accessory.context.device.name + JSON.stringify(deviceInfo));
            this.deviceStates.FanSpeed = deviceInfo.fanLevel;
            if (deviceInfo.fanStatus === '8') {
                this.deviceStates.WaterLevel = 0;
            }
            else if (deviceInfo.fanStatus === '0') {
                this.deviceStates.CurrentHumidifierDehumidifierState = this.platform.Characteristic.CurrentHumidifierDehumidifierState.IDLE;
                this.deviceStates.WaterLevel = 0;
            }
            else if (deviceInfo.fanStatus === '4') {
                this.deviceStates.WaterLevel = 100;
                this.deviceStates.CurrentHumidifierDehumidifierState = this.platform.Characteristic.CurrentHumidifierDehumidifierState.INACTIVE;
            }
            if (deviceInfo.deviceMode === 0) {
                this.deviceStates.dryCloMode = false;
                this.deviceStates.sleepMode = false;
                this.deviceStates.cleanMode = false;
                this.deviceStates.autoMode = false;
            }
            else if (deviceInfo.deviceMode === 1) {
                this.deviceStates.dryCloMode = true;
                this.deviceStates.sleepMode = false;
                this.deviceStates.cleanMode = false;
                this.deviceStates.autoMode = false;
            }
            else if (deviceInfo.deviceMode === 2) {
                this.deviceStates.dryCloMode = false;
                this.deviceStates.sleepMode = false;
                this.deviceStates.cleanMode = true;
                this.deviceStates.autoMode = false;
            }
            else if (deviceInfo.deviceMode === 3) {
                this.deviceStates.dryCloMode = false;
                this.deviceStates.sleepMode = false;
                this.deviceStates.cleanMode = false;
                this.deviceStates.autoMode = true;
            }
            else if (deviceInfo.deviceMode === 6) {
                this.deviceStates.sleepMode = true;
                this.deviceStates.dryCloMode = false;
                this.deviceStates.cleanMode = false;
                this.deviceStates.autoMode = false;
            }
            if (deviceInfo.powerStatus === '3' || deviceInfo.powerStatus === '7') {
                this.deviceStates.Active = this.platform.Characteristic.Active.ACTIVE;
            }
            else {
                this.deviceStates.Active = this.platform.Characteristic.Active.INACTIVE;
            }
            if (deviceInfo.powerStatus === '6' || deviceInfo.powerStatus === '7') {
                this.deviceStates.LockPhysicalControls = 1;
            }
            if (deviceInfo.dehumidifierStatus === '8') {
                this.deviceStates.CurrentHumidifierDehumidifierState =
                    this.platform.Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING;
            }
            else {
                this.deviceStates.CurrentHumidifierDehumidifierState = this.platform.Characteristic.CurrentHumidifierDehumidifierState.IDLE;
            }
            this.deviceStates.RelativeHumidityDehumidifierThreshold = deviceInfo.TargetDehumidifierValue;
            this.deviceStates.CurrentRelativeHumidity = deviceInfo.CurrentHumidifierValue;
            // this.deviceStates.CurrentTemperature = deviceInfo.CurrentTemperatureValue;
            this.deviceTimer = 120;
            this.service.getCharacteristic(this.platform.Characteristic.Active)
                .updateValue(this.deviceStates.Active);
            this.service.getCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState)
                .updateValue(this.deviceStates.CurrentHumidifierDehumidifierState);
            this.service.getCharacteristic(this.platform.Characteristic.RelativeHumidityDehumidifierThreshold)
                .updateValue(this.deviceStates.RelativeHumidityDehumidifierThreshold);
            this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
                .updateValue(this.deviceStates.CurrentRelativeHumidity);
            this.service.getCharacteristic(this.platform.Characteristic.WaterLevel)
                .updateValue(this.deviceStates.WaterLevel);
            if (accessory.context.device.fanControl) {
                this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
                    .updateValue(this.deviceStates.FanSpeed);
            }
            if (accessory.context.device.dryClothes && this.dryCloService) {
                this.dryCloService.updateCharacteristic(this.platform.Characteristic.On, this.deviceStates.dryCloMode);
            }
            if (accessory.context.device.sleepMode && this.sleepService) {
                this.sleepService.updateCharacteristic(this.platform.Characteristic.On, this.deviceStates.sleepMode);
            }
            if (accessory.context.device.cleanMode && this.cleanService) {
                this.cleanService.updateCharacteristic(this.platform.Characteristic.On, this.deviceStates.cleanMode);
            }
            if (accessory.context.device.autoMode && this.autoService) {
                this.autoService.updateCharacteristic(this.platform.Characteristic.On, this.deviceStates.autoMode);
            }
        });
        mqttClient.subscribe(`${endPoint}/${productId}/${deviceId}/status/hex`);
        this.commandTopic = `${endPoint}/${productId}/${deviceId}/command/hex`;
        this.mqttClient = mqttClient;
        mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
        setInterval(() => {
            mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            this.platform.log.debug(`Getting ${accessory.context.device.name} Status...`);
        }, 60000);
    }
    getDeviceStates() {
        let devicePower;
        let deviceFan;
        if (this.deviceStates.Active === 1) {
            devicePower = 0b0011;
        }
        else {
            devicePower = 0b0010;
        }
        if (this.deviceStates.LockPhysicalControls === 1) {
            devicePower = devicePower ^ 0b0100;
        }
        if (this.deviceStates.FanSpeed === 1) {
            deviceFan = 0b00010000;
        }
        else if (this.deviceStates.FanSpeed === 2) {
            deviceFan = 0b00100000;
        }
        else if (this.deviceStates.FanSpeed === 3) {
            deviceFan = 0b00110000;
        }
        if (this.deviceStates.dryCloMode) {
            deviceFan = deviceFan ^ 0b00000001;
        }
        else if (this.deviceStates.cleanMode) {
            deviceFan = deviceFan ^ 0b00000010;
        }
        else if (this.deviceStates.autoMode) {
            deviceFan = deviceFan ^ 0b00000011;
        }
        else if (this.deviceStates.sleepMode) {
            deviceFan = deviceFan ^ 0b00000110;
        }
        const buffer = Buffer.from([0x08, 0x02, devicePower, deviceFan,
            this.deviceStates.RelativeHumidityDehumidifierThreshold, 0, 0, 0, 0, 0]);
        this.platform.log.debug('Device Control Code ' + buffer.toString('hex'));
        return buffer;
    }
    async getDryCloMode() {
        if (this.deviceTimer > 0) {
            const CurrentdryCloMode = this.deviceStates.dryCloMode;
            this.platform.log.debug('Get Characteristic Active ->', CurrentdryCloMode);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            return CurrentdryCloMode;
        }
        else {
            const CurrentdryCloMode = this.deviceStates.dryCloMode;
            this.platform.log.debug('Get Characteristic Active ->', CurrentdryCloMode);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            // this.platform.log.info(
            //   `Pull Device Info Timeout. Name: ${this.accessory.context.device.name} DeviceId: ${this.accessory.context.device.deviceId}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async setDryCloMode(value) {
        this.deviceStates.dryCloMode = value;
        if( value ) {
            this.deviceStates.sleepMode = false;
            this.deviceStates.cleanMode = false;
            this.deviceStates.autoMode = false;
        }
        this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
        this.dryCloService.updateCharacteristic(this.platform.Characteristic.On, value);
        this.platform.log.debug('Set Characteristic dryCloMode -> ', value);
    }
    async getSleepMode() {
        if (this.deviceTimer > 0) {
            const CurrentSleepMode = this.deviceStates.sleepMode;
            this.platform.log.debug('Get Characteristic Active ->', CurrentSleepMode);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            return CurrentSleepMode;
        }
        else {
            const CurrentSleepMode = this.deviceStates.Active;
            this.platform.log.debug('Get Characteristic Active ->', CurrentSleepMode);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            // this.platform.log.info(
            //   `Pull Device Info Timeout. Name: ${this.accessory.context.device.name} DeviceId: ${this.accessory.context.device.deviceId}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async setSleepMode(value) {
        this.deviceStates.sleepMode = value;
        if( value ) {
            this.deviceStates.dryCloMode = false;
            this.deviceStates.cleanMode = false;
            this.deviceStates.autoMode = false;
        }
        this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
        this.sleepService.updateCharacteristic(this.platform.Characteristic.On, value);
        this.platform.log.debug('Set Characteristic sleepMode -> ', value);
    }
    async getCleanMode() {
        if (this.deviceTimer > 0) {
            const CurrentCleanMode = this.deviceStates.cleanMode;
            this.platform.log.debug('Get Characteristic Active ->', CurrentCleanMode);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            return CurrentCleanMode;
        }
        else {
            const CurrentCleanMode = this.deviceStates.cleanMode;
            this.platform.log.debug('Get Characteristic Active ->', CurrentCleanMode);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            // this.platform.log.info(
            //   `Pull Device Info Timeout. Name: ${this.accessory.context.device.name} DeviceId: ${this.accessory.context.device.deviceId}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async setCleanMode(value) {
        this.deviceStates.cleanMode = value;
        if( value ) {
            this.deviceStates.sleepMode = false;
            this.deviceStates.dryCloMode = false;
            this.deviceStates.autoMode = false;
        }
        this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
        this.cleanService.updateCharacteristic(this.platform.Characteristic.On, value);
        this.platform.log.debug('Set Characteristic cleanMode -> ', value);
    }
    async getAutoMode() {
        if (this.deviceTimer > 0) {
            const CurrentAutoMode = this.deviceStates.autoMode;
            this.platform.log.debug('Get Characteristic Active ->', CurrentAutoMode);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            return CurrentAutoMode;
        }
        else {
            const CurrentAutoMode = this.deviceStates.autoMode;
            this.platform.log.debug('Get Characteristic Active ->', CurrentAutoMode);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            // this.platform.log.info(
            //   `Pull Device Info Timeout. Name: ${this.accessory.context.device.name} DeviceId: ${this.accessory.context.device.deviceId}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async setAutoMode(value) {
        this.deviceStates.autoMode = value;
        if( value ) {
            this.deviceStates.sleepMode = false;
            this.deviceStates.cleanMode = false;
            this.deviceStates.dryCloMode = false;
        }
        this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
        this.autoService.updateCharacteristic(this.platform.Characteristic.On, value);
        this.platform.log.debug('Set Characteristic autoMode -> ', value);
    }
    async setOn(value) {
        if (value !== this.deviceStates.Active) {
            this.deviceStates.Active = value;
            this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
            this.platform.log.debug('Set Characteristic Active ->', value);
        }
        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .updateValue(this.deviceStates.Active);
    }
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    async getOn() {
        if (this.deviceTimer > 0) {
            const isOn = this.deviceStates.Active;
            this.platform.log.debug('Get Characteristic Active ->', isOn);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            return isOn;
        }
        else {
            const isOn = this.deviceStates.Active;
            this.platform.log.debug('Get Characteristic Active ->', isOn);
            this.mqttClient.publish(this.commandTopic, Buffer.from([0, 1]));
            this.platform.log.info(`Pull Device Info Timeout. Name: ${this.accessory.context.device.name} DeviceId: ${this.accessory.context.device.deviceId}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async getFan() {
        const isFabOn = this.deviceStates.FanSpeed;
        this.platform.log.debug('Get Characteristic Fan ->', isFabOn);
        return isFabOn;
    }
    async setFan(value) {
        if (this.fanTimer) {
            clearTimeout(this.fanTimer);
        }
        this.fanTimer = setTimeout(() => {
            this.deviceStates.FanSpeed = value;
            this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
            this.platform.log.debug('Set Characteristic Fan ->', value);
        }, 500);
        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .updateValue(this.deviceStates.FanSpeed);
    }
    async setHumidifierDehumidifierState(value) {
        this.deviceStates.TargetHumidifierDehumidifierState = value;
        this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
        this.service.getCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState)
            .updateValue(this.deviceStates.TargetHumidifierDehumidifierState);
        this.platform.log.debug('Set Characteristic HumidifierDehumidifierState -> ', value);
    }
    async getHumidifierDehumidifierState() {
        const HumidifierDehumidifierState = this.deviceStates.TargetHumidifierDehumidifierState;
        this.platform.log.debug('Get Characteristic HumidifierDehumidifierState -> ', HumidifierDehumidifierState);
        return HumidifierDehumidifierState;
    }
    async getCurrentHumidifierDehumidifierState() {
        const currentValue = this.deviceStates.CurrentHumidifierDehumidifierState;
        return currentValue;
    }
    async getCurrentRelativeHumidity() {
        const CurrentRelativeHumidity = this.deviceStates.CurrentRelativeHumidity;
        return CurrentRelativeHumidity;
    }
    async getRelativeHumidityDehumidifierThreshold() {
        const RelativeHumidityDehumidifierThreshold = this.deviceStates.RelativeHumidityDehumidifierThreshold;
        return RelativeHumidityDehumidifierThreshold;
    }
    async setRelativeHumidityDehumidifierThreshold(value) {
        if (value >= 25 && value <= 80) {
            this.deviceStates.RelativeHumidityDehumidifierThreshold = value;
        }
        else if (value < 25) {
            this.deviceStates.RelativeHumidityDehumidifierThreshold = 25;
        }
        else if (value > 80) {
            this.deviceStates.RelativeHumidityDehumidifierThreshold = 80;
        }
        this.service.getCharacteristic(this.platform.Characteristic.RelativeHumidityDehumidifierThreshold)
            .updateValue(this.deviceStates.RelativeHumidityDehumidifierThreshold);
        this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
        this.platform.log.debug('Set Characteristic RelativeHumidityDehumidifierThreshold -> ', value);
    }
    async getWaterLevel() {
        const WaterLevel = this.deviceStates.WaterLevel;
        this.platform.log.debug('Get Characteristic WaterLevel -> ', WaterLevel);
        return WaterLevel;
    }
    async getLockPhysicalControls() {
        const LockPhysicalControls = this.deviceStates.LockPhysicalControls;
        return LockPhysicalControls;
    }
    async setLockPhysicalControls(value) {
        this.deviceStates.LockPhysicalControls = value;
        this.mqttClient.publish(this.commandTopic, this.getDeviceStates());
        this.service.getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
            .updateValue(this.deviceStates.LockPhysicalControls);
        this.platform.log.debug('Set Characteristic LockPhysicalControls -> ', value);
    }
}
exports.DeyeDehumidifierAccessory = DeyeDehumidifierAccessory;
//# sourceMappingURL=dehumidifier.js.map
