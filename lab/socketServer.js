/* This file is part of the PennAI library.

Copyright (C) 2017 Epistasis Lab, University of Pennsylvania

PennAI is maintained by:
    - Heather Williams (hwilli@upenn.edu)
    - Weixuan Fu (weixuanf@pennmedicine.upenn.edu)
    - William La Cava (lacava@upenn.edu)
    - and many other generous open source contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

*/
var FGLAB_URL = 'http://localhost:5080'; // switch to direct db access instead 
var rp = require('request-promise'); // will be unnecessary after switch to db access

var sockets = [];

function socketServer(server) {
	var io = require('socket.io')(server);

	io.on('connection', socket => { 
		console.log('socket.io connection')
		sockets.push(socket);

		socket.on('disconnect', () => {
		  console.log('socket.io disconnect')
		  var index = sockets.indexOf(socket);
		  sockets.splice(index, 1);
		  console.log('socket.io splice')
		});
	});
}

function emitEvent(event, req) {
	console.log(`serverSocket.emitEvent('${event}', '${req}')`)
	console.log(req.params)

	switch(event) {
		case 'updateAllAiStatus':
			return rp(FGLAB_URL + "/api/datasets")
		  	.then(datasets => {
		  		datasets.forEach(dataset =>
		  			//sockets.forEach(socket => socket.emit('updateDataset', dataset))
		  			sockets.forEach(socket => socket.emit('updateAIToggle', dataset._id, dataset.ai))
		  		)
		    })
		    .catch((err) => {console.log(`Error: ${err}`)}); // Ignore failures

		case 'aiToggled':
			console.log(`=socketServer:aiToggled(${req.params.id})`)
			return sockets.forEach(socket => 
				socket.emit('updateAIToggle', JSON.stringify({ _id: req.params.id, nextAIState: req.body.ai }))
			);
		case 'recommenderStatusUpdated':
			console.log(`=socketServer:recommenderStatusUpdated(${req.body.status})`)
			return sockets.forEach(socket => 
				socket.emit('updateRecommender', JSON.stringify({recommenderStatus: req.body.status }))
			);
		case 'expStarted':
			return rp(FGLAB_URL + "/api/userexperiments/" + req.params.id)
		  	.then(experiment => {
		    	sockets.forEach(socket => socket.emit('addExperiment', experiment));

		    	rp(FGLAB_URL + "/api/userdatasets/" + JSON.parse(experiment)[0].dataset_id)
				  	.then(dataset => {
				    	sockets.forEach(socket => socket.emit('updateDataset', dataset));
				    })
				    .catch((err) => {console.log(`Error: ${err}`)}); // Ignore failures
		    })
		    .catch((err) => {console.log(`Error: ${err}`)}); // Ignore failures
		case 'expUpdated':
			return rp(FGLAB_URL + "/api/userexperiments/" + req.params.id)
		  	.then(experiment => {
		    	sockets.forEach(socket => socket.emit('updateExperiment', experiment));

		    	rp(FGLAB_URL + "/api/userdatasets/" + JSON.parse(experiment)[0].dataset_id)
				  	.then(dataset => {
				    	sockets.forEach(socket => socket.emit('updateDataset', dataset));
				    })
				    .catch((err) => {console.log(`Error: ${err}`)}); // Ignore failures
		    })
		    .catch((err) => {console.log(`Error: ${err}`)}); // Ignore failures
	}
}

module.exports = {
	socketServer: socketServer,
	emitEvent: emitEvent
};

