var GData, map, pointarray, heatmap; 
var directionsArray = [];
var directionsService = new google.maps.DirectionsService();
var geocoder;
var directionsRenderer = null;
var maxmag = 5;

function initialize()
{
	geocoder = new google.maps.Geocoder();

	var mapOpt = {
			center:new google.maps.LatLng(40.728917, -73.990694),
			zoom:12,
			mapTypeId:google.maps.MapTypeId.ROADMAP
		};

	map = new google.maps.Map(document.getElementById("googleMap"), mapOpt);

	// Grab Json File
	$.getJSON('/nyc-crime-map-data-master/violent.geojson', function(response) {
		GData = response; // GData stands for GeoJson Data... 
		len = GData.features.length; 
		MapData = [];

		// Extract Coordinates from features and push it on an Array. 
		for(i = 0; i < len; i++)
		{
			var LatLong = new google.maps.LatLng(GData.features[i].geometry.coordinates[1], GData.features[i].geometry.coordinates[0]);
	  		var magnitude = GData.features[i].properties.MAG;
			if (magnitude > maxmag)
			{
				magnitude = maxmag;
			}
			magnitude = magnitude * 1000
			var wloc = {
				location: LatLong,
				weight: magnitude
			};
			MapData.push(wloc);
		}

		var pointArray = new google.maps.MVCArray(MapData);
		heatmap = new google.maps.visualization.HeatmapLayer({
		data: pointArray,
		radius: 10
		});


	 heatmap.setMap(map);

	});

}

function calcRoute() {
	var start = document.getElementById('start_address').value;
	var end = document.getElementById('stop_address').value;
	var cRadius = document.getElementById('search_radius').value;

	var request = {
    	origin:start,
    	destination:end,
    	travelMode: google.maps.TravelMode.WALKING,
    	provideRouteAlternatives: true
	};
  
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
		
			//clear previous routes
			if (directionsArray.length >= 1)
			{
				for (var i = 0; i < directionsArray.length; i++)
				{
					directionsArray[i].setMap(null);
				}
				directionsArray = [];
			}
			
			//interpolate directions legs
			var bestIndex = rateRoutes(response, cRadius);
			
			//render non-best routes first
			for (var i = 0; i < response.routes.length; i++)
			{
				if (i != bestIndex)
				{
					directionsRenderer = new google.maps.DirectionsRenderer
					({
						polylineOptions: 
						{
							strokeColor: "red",
							strokeOpacity: 0.35
						}
					});
			  		
					directionsRenderer.setMap(map);	
					directionsRenderer.setDirections(response);
					directionsRenderer.setRouteIndex(i);
					// store routes so they can be cleared later
					directionsArray.push(directionsRenderer);					
				}
			}

			// overlay opaque best route on top
			directionsRenderer = new google.maps.DirectionsRenderer
			({
				polylineOptions: 
				{
					strokeColor: "blue",
					strokeOpacity: 1.0
				}
			});
			directionsRenderer.setMap(map);	
			directionsRenderer.setDirections(response);
			directionsRenderer.setRouteIndex(bestIndex);
			// store routes so they can be cleared later
			directionsArray.push(directionsRenderer);

    	}
	});
}

function rateRoutes(response, cRadius)
{
	//calculate best route here
	var bestIndex, bestCrimeRate;
	var routeCrimeRate, crimeRad;
	var Cpt, Cwt, Mpt;
	var start, end;


	for (var i = 0; i < response.routes.length; i++)
	{
		routeCrimeRate = 0;
		for (var j = 0; j < response.routes[i].legs.length; j++)
		{
			start = response.routes[i].legs[j].start_location;
			end = response.routes[i].legs[j].end_location;
			var interpArray = interpLatLng(start, end, 50);

			for (var k = 0; k < interpArray.length; k++)
			{
				
				for (var l = 0; l < MapData.length; l++)
				{
					// calculate distance from crime
					Cpt = MapData[l].location;
					Mpt = interpArray[k];
					crimeRad = google.maps.geometry.spherical.computeDistanceBetween(Cpt,Mpt);

					// Check if crime is within radius
					if (crimeRad < cRadius)
					{
						// add crime to total route crime
						Cwt = MapData[l].weight/1000;
						routeCrimeRate += Cwt;
					}
				}
				
				
			}
		}
		// compare current crime rate with best
		if (i == 0)
		{
			bestCrimeRate = routeCrimeRate;
			bestIndex = i;
		}
		if (routeCrimeRate < bestCrimeRate)
		{
			bestCrimeRate = routeCrimeRate;
			bestIndex = i;
		}
	}
	return bestIndex;
}

function interpLatLng(start, end, dr)
{
	var interpArray = [];
	var lat, lng;
	distance = google.maps.geometry.spherical.computeDistanceBetween(start,end);
	dt = dr/distance;
	for (var i = 0; i*dt < 1; i++)
	{
		lat = start.lat() + (i*dt * (end.lat() - start.lat()));
		lng = start.lng() + (i*dt * (end.lng() - start.lng()));
		var pointProto = new google.maps.LatLng(lat,lng);
		interpArray.push(pointProto);
	}
	return interpArray;
}

// codeAddress functions may be deleted later. Leave it here for now. 
/*
function codeAddress() {
  var address = document.getElementById('start_address').value;
  console.log(address)
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location
      });
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}
*/
google.maps.event.addDomListener(window, 'load', initialize);
