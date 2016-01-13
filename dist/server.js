
//calling packages
var express = require('express');    //call express
var app = express();                 //define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var url = 'mongodb://127.0.0.1/placesServer';

var mongoose = require('mongoose');
mongoose.connect(url);//('mongodb://node:node@novus.modulusmongo.net:27017/Iganiq8o'); // connect to our database


var port = process.env.PORT || 8100;   //set our port



var TouristPlace = require('./models/touristPlace');

var router = express.Router();          //get an instance of the express router

//middleware to use for all requests

router.use(function(req,res,next){
	console.log('Something is happening.');
	next();  //add next() to indicate to our application that it should 
	          //continue to the other routes. This is important because our application would stop at this middleware without it.
});


//test route(accessed at GET http://localhost:8080/api)

router.get('/',function(req,res){
	res.json({message : 'hooray! welcome to our api'});

});

router.post('/places',function(req,res){
	var place = new TouristPlace();
	place.name = req.body.name;
	place.lat = req.body.lat;
	place.lng = req.body.lng;
	place.city = req.body.city;

  	place.save(function(err){
  		if(err){
  			console.log('error:' + error);
  			res.send(err);
  		}else{
  			res.json({message:'place created'});
  		}
  		
  	});  	

});

router.get('/places',function(req,res){
  		TouristPlace.find(function(err,places){
  			if(err)
  				res.send(err);
  			res.json(places);
  		});
  	});

router.get('/places/:city',function(req,res){
	TouristPlace.find({ city: req.params.city },function(err,place){
		if(err)
			res.send(err);
		res.json(place);
	});
});

router.get('/places/:city',function(req,res){
	TouristPlace.find({ city: req.params.city },function(err,place){
		if(err)
			res.send(err);
		if(place.lat)

		res.json(place);
	});
});

router.put('/places/:place_id',function(req,res){
	TouristPlace.findById(req.params.place_id,function(err,place){
		if(err)
			res.send(err)
		place.name = req.body.name;

		place.save(function(err){
			if(err)
				res.send(err);
			res.json({message: 'Place updated'});
		});
	});
});

router.delete('/places/:place_id',function(req,res){
	TouristPlace.remove({
		_id:req.params.place_id
	},function(err,place){
		if(err)
			res.send(err);
		res.json({message:'place with ' + req.params.place_id + 'is deleted'});
	});
});

router.delete('/deleteall',function(req,res){
	TouristPlace.remove({},function(err,place){
		if(err)
			res.send(err);
		res.json({message:'all places deleted'});
	});
});




// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api

app.use('/api',router);

//Start the server----

app.listen(port);
console.log('Magic happens on port' + port);

