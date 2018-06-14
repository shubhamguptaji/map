var map, marker;
var markers = [];
var type = ['Hotel', 'Hospital', 'Library'];
var infowindow, bounds, geocoder, last;
var count = 0;

// function to display error message if google map is not loaded
function error() {
	alert("Google Maps cannot be loaded!!!!!!!!");
}

// show and hide the search bar
$(function() {
	$('#toggle').click(function() {
		$('.floating-panel').toggle();
	});
});

// function to getplaces at the specified location using the foursquare API
function getPlaces(location, type) {
	var foursquare_client_id = 'WX1F1S0PHLZB5KI5E2OJIH50AOHVZIIXBP0A3N4NX4WIPMYQ';
	var foursquare_client_secret = 'D2Z04G3N4XVWDQJ2O5G5S0SNQCOG15HLDYGDG1IMAMBYJPL4';
	for(var i = 0; i < type.length; i++) {
		var foursquare_url = "https://api.foursquare.com/v2/venues/explore?limit=5&range=5000&ll="+location.lat+","+location.lng+"&client_id="+foursquare_client_id+"&client_secret="+foursquare_client_secret+"&v=20180522&query="+type[i];
		$.ajax({
			url: foursquare_url,
			method: 'GET',
			dataType: 'json',
			data: {'place': type[i]},
			success: function(result) {	
				createMarkers(result);
			}
		}).fail(function() {
			alert("Foursquare API was not able to find the places. Sorry :(");
		});
	}
}

// function to load the map
function initMap() {
	var defaultLocation =  {
			lat:  51.508530, lng: -0.076132
		};
	map = new google.maps.Map(document.getElementById('map'), {
		center: defaultLocation,
		zoom: 13
	});
	var placeAutocomplete = new google.maps.places.Autocomplete(document.getElementById('search-bar-text'));
	infowindow = new google.maps.InfoWindow();
	geocoder = new google.maps.Geocoder();
	getPlaces(defaultLocation, type);

}

// this function creates markers at the specified locations
function createMarkers(locations) {
	var places = locations.response.groups[0].items;
	for(var i = 0; i < places.length; i++) {
		var pos = {
			lat: places[i].venue.location.lat,
			lng: places[i].venue.location.lng
		};
		var address = places[i].venue.location.address;
		marker = new google.maps.Marker({
			position: pos,
			title: places[i].venue.name,
			address: address,
			animation: google.maps.Animation.DROP,
			category: places[i].venue.categories[0].name,
			id: markers.length
		});

		markers.push(marker);

		marker.addListener('click', function() {
			populateInfoWindow(this, infowindow);
		});
		marker.addListener('click',function(){toggleBounce(this);});
	}
	if (count == type.length - 1) {
		model.fillMarkersList();
		showAllMarkers(markers);
	}
	if (count == type.length) count = 1;
	count++;
	
}
// this function shows all the markers
function showAllMarkers(markers) {
	bounds = new google.maps.LatLngBounds();
	for(var i = 0;i < markers.length; i++) {
		markers[i].setMap(map);
		bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
}

// animates the marker
function toggleBounce(marker) {
	if (last) last.setAnimation(null);
	if (marker.getAnimation() !== null) {
		marker.setAnimation(null);
	} else {
		marker.setAnimation(google.maps.Animation.BOUNCE);
	}
	last = marker;
}

// this function adds content to the marker
function populateInfoWindow(marker, infowindow) {
	if (infowindow.marker != marker) {
		infowindow.marker = marker;
		infowindow.addListener('closeclick', function() {
			infowindow.setMarker = null;
		});
		infowindow.setContent('<div> <b>Title:</b>' + marker.title + '</div><div> <b>Address:</b>' + marker.address + '</div><div><b>Type:</b>' + marker.category + '</div>');
		infowindow.open(map, marker);
		
	}
}

// this function finds the location searched by the user and then creates markers and displays them
function findlocation(address) {
	for(var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	markers=[];
	if (address === '') {
		alert("You must enter address first!!!!!!!");
	} else {
		geocoder.geocode({
			'address': address,
		}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				var loc = results[0].geometry.location.toString();
				var locarray = loc.split('(')[1].split(',');
				var latitude = parseFloat(locarray[0]);
				var longitude = parseFloat(locarray[1].split(')')[0]);
				var searchedLocation = {
					lat: latitude,
					lng: longitude
				};
				map.setCenter(searchedLocation);
				map.setZoom(15);
				getPlaces(searchedLocation,type);
			} else {
				alert('Geocode was not successful!');
			}

		});
	}
}

// knockout model to store marker data
var markerData = function(data) {
	this.id = ko.observable(data.id);
	this.title = ko.observable(data.title);
	this.category = ko.observable(data.category);
}
// knockout viewmodel to load the content on the page
var viewModel = function() {
	var self = this;
	self.defaultLoc = ko.observable("London");
	self.categories = ko.observableArray(['Hotel', 'Hospital' , 'Library']);
	self.markersList = ko.observableArray([]);
	selectedCategory = ko.observable();
//  set the locations enter by the user
	self.start = function() {
		findlocation(self.defaultLoc());
	};
	// fills the markers list
	self.fillMarkersList = function(marker) {
		self.markersList([]);
		for(var i = 0; i < markers.length; i++) {
			self.markersList.push(new markerData(markers[i]));
		}
	};
	// bounce the markers
	self.animateMarker = function(a) {
		for(var i = 0; i < markers.length; i++) {
			if(a.id() === markers[i].id) {
				for(var j = 0; j < markers.length; j++) {
					markers[j].setAnimation(null);
				}
				markers[i].setAnimation(google.maps.Animation.BOUNCE);
				populateInfoWindow(markers[i], infowindow);
				break;	
			}
		}
	};
	// filters the markers according to there category
	self.filterMarkers = function() {
		self.markersList([]);
		for(var i = 0; i < markers.length; i++) {
			if (markers[i].category == selectedCategory() || selectedCategory() == undefined) {
				markers[i].setVisible(true);
				self.markersList.push(new markerData(markers[i]));
			}
			else {
				markers[i].setVisible(false);
			}
		}
	};
}

model = new viewModel();
ko.applyBindings(model);
