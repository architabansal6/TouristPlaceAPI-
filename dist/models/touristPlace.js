var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var placeSchema = new Schema({
	name: String,
	lat:String,
	lng:String,
	city:String
});

module.exports = mongoose.model('TouristPlace',placeSchema);
