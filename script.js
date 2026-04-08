const client = mqtt.connect(
"wss://8aba4d703c304d2b9abd3f4bfa8b21f8.s1.eu.hivemq.cloud:8884/mqtt",
{
username:"ikbalarisandi",
password:"Percobaan1"
});

client.on("connect", function () {
console.log("MQTT Connected");
client.subscribe("esp32/dht11");
});

client.on("message", function (topic, message) {

let data = JSON.parse(message.toString());

document.getElementById("suhu").innerHTML = data.suhu;
document.getElementById("hum").innerHTML = data.hum;

});