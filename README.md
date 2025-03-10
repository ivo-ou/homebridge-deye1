# Homebridge Deye T22A3

简单修改适配T22A3指令

## 相关指令

* 第5位：
  * 8-风扇运行
  * 4-水满  
  * 0-风扇停止

* 第6位：
  * 1|3-电源开
  * 5|7-电源开，童锁开
  * 4|6-电源关，童锁开
  * 0|2-电源关
  '''
   测试的时候发现，APP发送开关机状态指令是1，4，4，6；但是发送3，7，6，2同样可以
  '''

* 第8位：
  * 0-压缩机停止
  * 1-压缩机停止，负离子开
  * 8-压缩机工作  
  * 9-压缩机工作，负离子开

* 第9位：
  * 1-低风
  * 2-中风
  * 3-高风

* 第10位：
  * 0-手动模式
  * 1-干衣模式
  * 2-清新模式
  * 3-自动模式

* 第11-12位
  * 目标湿度

* 第31-32位
  * 当前温度（16进制转10进制 - 40）

* 第33-34位：
  * 当前湿度

Add the `DEYE` platform to `config.json` in the home directory within `.homebridge`.

Example configuration

```
{
    "`platforms`: [
        {
            "platform": "DEYE"
            "mqttBaseInfo": {
                "mqttHost": "yourmqtthost.com",
                "mqttPort": "1883",
                "endPoint": "b374fbd89bba44b28399d975fc82d8f5",
                "username": "b374fbd89bba44b28399d975fc82d8f5/9c2056e3f115459e9c88394217ee52fc",
                "password": "9c2056e3f115459e",
                "clientId": "app_34bc46389bc011ecb9090242ac120002"
            },
            "devices": [
                {
                    "name": "DYD-T22A3",
                    "model": "DYD-T22A3",
                    "productId": "97e85d3856c54a1ab090c8541101a050",
                    "deviceId": "5111127c8d6f4beca10861dfc5942949",
                    "fanControl": true,
                    "temperatureSensor": true,
                    "dryClothes": true,
                    "sleepMode": true,
                    "cleanMode": true,
                    "autoMode": true
                }
            ]
        }
    ]
}
```

### Platform configuration field

`platform` [Required] should be "DEYE".

### Server connection configuration field `mqttBaseInfo`

`mqttHost` [Required] The address of the MQTT server.

`mqttPort` [Required] MQTT server port.

`endPoint` [Required] MQTT endPoint.

`username` [required] MQTT username.

`password` [required] MQTT password.

`clientId` [Required] MQTT client ID.

### Device connection configuration fields `devices`

`name` [required] The name of the custom accessory.

`model` [Required] The device model. For example `DYD-D50A3`

`productId` [required] The productId you got.

`deviceId` [required] The deviceId you got.

`fanControl` [Required] Whether to enable the wind speed control function. Only supported by some models.

`temperatureSensor` [Required] Whether to enable the temperature sensor. May only be supported by some models.

**Please note: When the temperature sensor is enabled, it will merge the accessories due to Apple HomeKit policy and you may not be able to see the humidifier control interface directly.**

If this happens, tap the "Accessories" option in the Home App under Accessories and you will see information about the dehumidifier.
Alternatively, you can choose to enable DryClothes mode or Sleep mode, and then click on "Show as separate panel" in Accessories in the Home App.

`dryClothes` [Required] Whether to enable the dry mode switch. May only be supported by some models.

`sleepMode` [Required] Whether to enable the sleep mode switch. May only be supported by some models.

## Special Thanks

[@yamisenyuki](https://github.com/yamisenyuki) - Writing the code and [Deye Device Information Getter](https://github.com/yamisenyuki/Deye-Device-Information-Getter)

[HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS) and [homebridge](https://github.com/nfarina/homebridge) - for making this possible.
