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

let suhu = data.suhu;
let hum = data.hum;

document.getElementById("suhu").innerHTML = suhu.toFixed(1);
document.getElementById("hum").innerHTML = hum.toFixed(1);

// relay logic
let relayElement = document.getElementById("relay");

if(suhu >= 29.5)
{
relayElement.innerHTML = "ON";
relayElement.classList.remove("relay-off");
relayElement.classList.add("relay-on");
}
else
{
relayElement.innerHTML = "OFF";
relayElement.classList.remove("relay-on");
relayElement.classList.add("relay-off");
}

});
