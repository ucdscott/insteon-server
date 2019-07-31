'use strict'

var Insteon = require('home-controller').Insteon

var hub = new Insteon()

var express = require('express')

var app = express()

var fs = require('fs')

var _ = require('underscore')



var websocket = require('ws')

var wss = new websocket.Server({port: 9595})



var configFile = fs.readFileSync('./config.json')

var configJSON = JSON.parse(configFile)

var platformIndex = configJSON.platforms.findIndex(function(item){return item.platform =='InsteonLocal'})

var config = configJSON.platforms[platformIndex]



InsteonServer()



function InsteonServer() {

	var devices = config.devices

	var deviceIDs = []

	var deviceJSON = []



	devices.forEach(function(device){

		deviceIDs.push(device.deviceID)

	})



	devices.forEach(function(device){

		var devJSON = {name: device.name, deviceID: device.deviceID, dimmable: device.dimmable, deviceType: device.deviceType, isbutton: device.button}

		deviceJSON.push(devJSON)

	})



	var host = config.host

	var port = config.port

	var user = config.user

	var pass = config.pass

	var model = config.model

	var server_port = config.server_port || 3000



	var hubConfig = {

		host: host,

		port: port,

		user: user,

		password: pass

	}



	connectToHub()

	init()



	app.get('/light/:id/on', function(req, res) {

		var id = req.params.id.toUpperCase()

		hub.light(id).turnOn().then(function(status) {

			if (status.response) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/light/:id/off', function(req, res) {

		var id = req.params.id.toUpperCase()

		hub.light(id).turnOff().then(function(status) {

			if (status.response) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/light/:id/faston', function(req, res) {

		var id = req.params.id.toUpperCase()

		hub.light(id).turnOnFast().then(function(status) {

			if (status.response) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/light/:id/fastoff', function(req, res) {

		var id = req.params.id.toUpperCase()

		hub.light(id).turnOffFast().then(function(status) {

			if (status.response) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/light/:id/status', function(req, res) {

		var id = req.params.id

		hub.light(id).level(function(err, level) {

			res.json({

				'level': level

			})

		})

	})



	app.get('/light/:id/level/:targetLevel', function(req, res) {

		var id = req.params.id

		var targetLevel = req.params.targetLevel



		hub.light(id).level(targetLevel).then(function(status) {

			if (status.response) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/scene/:group/on', function(req, res) {

		var group = parseInt(req.params.group)

		hub.sceneOn(group).then(function(status) {

			if (status.aborted) {

				res.sendStatus(404)

			}

			if (status.completed) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/scene/:group/off', function(req, res) {

		var group = parseInt(req.params.group)

		hub.sceneOff(group).then(function(status) {

			if (status.aborted) {

				res.sendStatus(404)

			}

			if (status.completed) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/links', function(req, res) {

		hub.links(function(err, links) {

			res.json(links)

		})

	})



	app.get('/links/:id', function(req, res) {

		var id = req.params.id

		hub.links(id, function(err, links) {

			res.json(links)

		})

	})



	app.get('/info/:id', function(req, res) {

		var id = req.params.id

		hub.info(id, function(err, info) {

			res.json(info)

		})

	})



	app.get('/iolinc/:id/relay_on', function(req, res) {

		var id = req.params.id

		hub.ioLinc(id).relayOn().then(function(status) {

			if (status.response) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/iolinc/:id/relay_off', function(req, res) {

		var id = req.params.id

		hub.ioLinc(id).relayOff().then(function(status) {

			if (status.response) {

				res.sendStatus(200)



			} else {

				res.sendStatus(404)

			}

		})

	})



	app.get('/iolinc/:id/sensor_status', function(req, res) {

		var id = req.params.id

		hub.ioLinc(id).status(function(err, status) {

			res.json(status.sensor)

		})

	})



	app.get('/iolinc/:id/relay_status', function(req, res) {

		var id = req.params.id

		hub.ioLinc(id).status(function(err, status) {

			res.json(status.relay)

		})

	})



	app.listen(server_port)



	function connectToHub() {

		console.log('Model: ' + model)



		if (model == '2245') {

			console.log('Connecting to Insteon Model 2245 Hub...')

			hub.httpClient(hubConfig, function() {

				console.log('Connected to Insteon Model 2245 Hub...')

				connectedToHub = true

			})

		} else if (model == '2243') {

			console.log('Connecting to Insteon "Hub Pro" Hub...')

			connectingToHub = true

			hub.serial('/dev/ttyS4',{baudRate:19200}, function() {

				console.log('Connected to Insteon "Hub Pro" Hub...')

				connectedToHub = true



			})

		} else if (model == '2242') {

			console.log('Connecting to Insteon Model 2242 Hub...')

			hub.connect(host, function() {

				console.log('Connected to Insteon Model 2242 Hub...')

				connectedToHub = true

			})

		} else {

			console.log('Connecting to Insteon PLM...')

			hub.serial(host,{baudRate:19200}, function() {

				console.log('Connected to Insteon PLM...')

				connectedToHub = true

			})

		}

	}



	function init() {

		console.log('Initiating websocket...')

		var message



		wss.on('connection', function (ws) {

			console.log('Client connected to websocket')

			ws.isAlive = true



			ws.on('close', function(){

				console.log('Websocket closed by client')

				ws.isAlive = false

			})



			ws.send('Connected to Insteon Server')



			ws.on('message', function (message) {

				if(message == 'getDevices'){

					console.log(deviceJSON)

					if(ws.isAlive){ws.send(JSON.stringify(deviceJSON))}

				}

			})



			devices.forEach(function(device){
				

				switch (device.deviceType) {

				case 'doorsensor':

				case 'windowsensor':

				case 'contactsensor':





					device.door = hub.door(device.deviceID)



					device.door.on('opened', function(){

						console.log('Got open for ' + device.name)

						message = {name: device.name, id: device.deviceID, deviceType: device.deviceType, gatewayId: device.gatewayId, raw: device.raw, state: 'open'}

						if(ws.isAlive){ws.send(JSON.stringify(message))}

					})



					device.door.on('closed', function(){

						console.log('Got closed for ' + device.name)

						message = {name: device.name, id: device.deviceID, deviceType: device.deviceType, state: 'closed'}

						if(ws.isAlive){ws.send(JSON.stringify(message))}

					})



					break

					

					case 'leaksensor':

					device.leak = hub.leak(device.deviceID)



					device.leak.on('dry', function(){

						console.log('Got dry for ' + device.name)

						message = {name: device.name, id: device.deviceID, deviceType: device.deviceType, state: 'dry'}

						if(ws.isAlive){ws.send(JSON.stringify(message))}

					})



					device.leak.on('wet', function(){

						console.log('Got wet for ' + device.name)

						message = {name: device.name, id: device.deviceID, deviceType: device.deviceType, state: 'wet'}

						if(ws.isAlive){ws.send(JSON.stringify(message))}

					})



					break



				case 'switch':
				

					device.light = hub.light(device.deviceID)



					device.light.on('turnOn', function (group, level) {

						console.log(device.name + ' turned on')

						message = {name: device.name, id: device.deviceID, deviceType: device.deviceType, raw: device.raw, gatewayId: device.gatewayId, state: level}

						if(ws.isAlive){ws.send(JSON.stringify(message))}

					})



					device.light.on('turnOff', function () {

						console.log(device.name + ' turned off')

						message = {name: device.name, id: device.deviceID, deviceType: device.deviceType, raw: device.raw, gatewayId: device.gatewayId, state: 0}

						if(ws.isAlive){ws.send(JSON.stringify(message))}

					})



					break



				case 'lightbulb':

				case 'dimmer':
				case 'scene':

					device.light = hub.light(device.deviceID)

					device.light.level().then(function(level) {

						message = {name: device.name, id: device.deviceID, deviceType: device.deviceType, raw: device.raw, state: level, button: device.button}
						
						console.log('device info is ' + device.deviceType)	
						if(ws.isAlive){ws.send(JSON.stringify(message))}

					})

					break

				}

			})



			eventListener()



			function eventListener() {

				console.log('Insteon event listener started...')



				hub.on('command', function(data) {



					if (typeof data.standard !== 'undefined') {

						



						var info = JSON.stringify(data)
						console.log('Received info as ' + data.standard)

						var id = data.standard.id.toUpperCase()

						var command1 = data.standard.command1

						var command2 = data.standard.command2

						var messageType = data.standard.messageType
						
						var gatewayId = data.standard.gatewayId

						var raw = data.standard.raw
						console.log('data ' + data.standard)



						var isDevice = _.contains(deviceIDs, id, 0)

						var message



						if (isDevice) {

							var foundDevices = devices.filter(function(item) {
							
							

								return item.deviceID == id

							})



							console.log('Found ' + foundDevices.length + ' accessories matching ' + id)

							console.log('Hub command: ' + info)
							
							
							




							for (var i = 0, len = foundDevices.length; i < len; i++) {

								var foundDevice = foundDevices[i]
								
								console.log('Got event for ' + foundDevice.name + ' (' + foundDevice.deviceID + ')')
								



								switch (foundDevice.deviceType) {

								case 'lightbulb':

								case 'dimmer':
								
									console.log(command1 + command2)


									if (command1 == '19' || command1 == '03' || command1 == '04' || (command1 == '00' && command2 != '00') || (command1 == '06' && messageType == '1')) { //19 = status

										var level_int = parseInt(command2, 16) * (100 / 255)

										var level = Math.ceil(level_int)



										console.log('Got updated status for ' + foundDevice.name) 
										

										message = {name: foundDevice.name, button: foundDevice.keypadbtn, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: level}

										if(ws.isAlive){ws.send(JSON.stringify(message))}

									}



									if (command1 == 11) { //11 = on

										var level_int = parseInt(command2, 16)*(100/255)

										var level = Math.ceil(level_int)



										console.log('Got on event for ' + foundDevice.name)

										message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: level}
										
										
										if(ws.isAlive){ws.send(JSON.stringify(message))}

									}



									if (command1 == 12) { //fast on

										console.log('Got fast on event for ' + foundDevice.name)
							

										message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: 100}
										
										
										if(ws.isAlive){ws.send(JSON.stringify(message))}

									}



									if (command1 == 13 || command1 == 14) { //13 = off, 14= fast off

										if (command1 == 13) {

										console.log('Got off event for ' + foundDevice.name)

										} else {console.log('Got fast off event for ' + foundDevice.name)}
										
										message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: 0}
										
										
										if(ws.isAlive){ws.send(JSON.stringify(message))}

									}



									if (command1 == 18) { //stop dimming

										console.log('Got dim event for ' + foundDevice.name)

										foundDevice.light.level().then(function(level) {

											message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, state: level}

											if(ws.isAlive){ws.send(JSON.stringify(message))}

										})

									}



									break
									case 'scene':
									if (command1 == '19' || command1 == '03' || command1 == '04' || (command1 == '00' && command2 != '00') || (command1 == '06' && messageType == '1')) { //19 = status

										var level_int = parseInt(command2, 16) * (100 / 255)

										var level = Math.ceil(level_int)



										console.log('Got updated status for ' + foundDevice.name) 
										

										message = {name: foundDevice.name, button: foundDevice.keypadbtn, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: level}

										if(ws.isAlive){ws.send(JSON.stringify(message))}

									}



									if (command1 == 11) { //11 = on

										var level_int = parseInt(command2, 16)*(100/255)

										var level = Math.ceil(level_int)



										console.log('Got on event for ' + foundDevice.name)

										message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: level}
										
										
										if(ws.isAlive){ws.send(JSON.stringify(message))}

									}



									if (command1 == 12) { //fast on

										console.log('Got fast on event for ' + foundDevice.name)
							

										message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: 100}
										
										
										if(ws.isAlive){ws.send(JSON.stringify(message))}

									}
									
										
									if (command1 == 17) { //stop dimming

										console.log('Got held event for ' + foundDevice.name)

										foundDevice.light.level().then(function(level) {

											message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: level}

											if(ws.isAlive){ws.send(JSON.stringify(message))}
									})

									}

									if (command1 == 13 || command1 == 14) { //13 = off, 14= fast off

										if (command1 == 13) {

										console.log('Got off event for ' + foundDevice.name)

										} else {console.log('Got fast off event for ' + foundDevice.name)}
										
										message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: 0}
										
										
										if(ws.isAlive){ws.send(JSON.stringify(message))}

									}
									
									
								



									if (command1 == 18) { //stop dimming

										console.log('Got released event for ' + foundDevice.name)

										foundDevice.light.level().then(function(level) {

											message = {name: foundDevice.name, id: foundDevice.deviceID, deviceType: foundDevice.deviceType, gatewayId: gatewayId, raw: raw, state: level}

											if(ws.isAlive){ws.send(JSON.stringify(message))}

										})

									}
									break


								}

							}

						}

					}

				})

			}

		}

		)}

}
