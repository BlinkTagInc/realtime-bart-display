var map;
var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';
var simpleGeoAPIKey = 'BPSeehMRSqd9cFU5DWTUSctk9Xb5cnU3';

$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});

function getWeather(){
  
  var station = $.getUrlVar('station');
  //Get Lat/Lon from BART API first to look up weather
  var url = 'http://api.bart.gov/api/stn.aspx';

  var bart = [];

  //Request Departures
  $.ajax({
    url: url,
    data: {
      cmd: 'stninfo',
      orig: station,
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      //Get weather from SimpleGeo
       var client = new simplegeo.ContextClient(simpleGeoAPIKey);

       client.getContext($(result).find('gtfs_latitude').text(), $(result).find('gtfs_longitude').text(), function(err, context) {
         if (err) {
           console.log(err);
         } else {
           $('.weather').html('<div class="temp"><strong>' + context.weather.temperature.replace("F", "&deg;") + '</strong></div>' +
             '<div class="condition"><strong>' + context.weather.conditions + '</strong></div>' +
             '<div class="precipitation">Precipitation: <strong>' + context.weather.forecast.today.precipitation + '</strong></div>' +
             '<div class="range">Range: <strong>' + context.weather.forecast.today.temperature.min.replace("F", "&deg;F") + 
             ' - ' + context.weather.forecast.today.temperature.max.replace("F", "&deg;F") + '</strong></div>');
         }
       });
    }
  });
}

function getBART(){
  var station = $.getUrlVar('station');
  var url = 'http://api.bart.gov/api/etd.aspx';
  
  var bart = [];

  //Request Departures
  $.ajax({
    url: url,
    data: {
      cmd: 'etd',
      orig: station,
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      //Page title
      $('.pageTitle h1').html($(result).find('name').text());
      
      $('#bartNorth .departures').html('');
      $('#bartSouth .departures').html('');
      
      $(result).find('etd').each(function(i, data){
        //Process directions
        departure = addDirection(data);
        if(departure){
          bart.push(departure);
        }
      });
      
      //Sort departures
      bart.sort(bartSortHandler);
      
      $.each(bart, function(i, departure){
        if(departure.direction == 'North'){
          $('#bartNorth .departures').append(departure.div);
        } else {
          $('#bartSouth .departures').append(departure.div);
        }
      });
    }
  });
  
  function addDirection(data){
    var departure = {};
    
    departure.destination = $(data).find('destination').text();
    
    switch(departure.destination){
      case 'Dublin/Pleasanton':
        var color = '#00aeef';
        break;
      case 'Pittsburg/Bay Point':
        var color = '#ffe800';
        break;
      case 'Concord':
        var color = '#ffe800';
        break;
      case 'North Concord':
        var color = '#ffe800';
        break;
      case 'Richmond':
        var color = '#ed1c24';
        break;
      case 'Fremont':
        var color = '#4db848';
        break;
      case 'Daly City':
        var color = '#00aeef';
        break;
      case 'SFO/Millbrae':
        var color = '#ffe800';
        break;
      case 'SF Airport':
        var color = '#ffe800';
        break;
      case 'Millbrae':
        var color = '#ed1c24';
        break;
      default:
        var color = '#a8a9a9';
    }
    
    departure.div = '<div class="departure">';
    departure.div += '<div class="colorbox" style="background:' + color + '"></div>';
    departure.div += '<div class="destination">' + departure.destination + '</div>';
    
    departure.times = [];
    
    $(data).find('estimate').each(function(j, data){
      //Only add times where minutes are less than 100
      if($(data).find('minutes').text() < 100){
        //Convert "Arrived" to "Arr"
        var minutes = ($(data).find('minutes').text() == 'Arrived') ? "0" : $(data).find('minutes').text();
        
        departure.times.push(minutes);
        
        departure.direction = $(data).find('direction').text();
        
        departure.div += '<span class="time">' + minutes + '</span>';
      }
    });
    departure.div += '</div>';
    
    //Check if first time is less than 40 minutes away. If not, discard entire destination
    if(departure.times[0] < 40){
      return departure;
    } else {
      return false;
    }
  }
  
  function bartSortHandler(a, b){
    return (a.times[0] - b.times[0]);
  }
}

function setupForm(){
  var url = 'http://api.bart.gov/api/stn.aspx';

  //Request list of BART stations
  $.ajax({
    url: url,
    data: {
      cmd: 'stns',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $(result).find('station').each(function(i, data){
        $('#stationSelect').append('<option value="' + $(data).find('abbr').text() + '">' + $(data).find('name').text() + '</option>');
      });
      
      //Retreive station from localstorage
      if(Modernizr.localstorage) {
        if(localStorage.getItem("station")){
          $('#stationSelect').val(localStorage.getItem("station"));
        }
      }
      
      $('#stationSelect').show();
    }
  });
}

function rotateBackground(){
  var imageCount = 32;
  $('#background img').attr('src','images/backgrounds/' + Math.ceil(Math.random()*imageCount) + '.jpg');
}

google.setOnLoadCallback(function(){
  
  //Detect settings
  if($.getUrlVar('station')){
    var station = $.getUrlVar('station');
    
    //Set this as a localstorage option for next time
    if(Modernizr.localstorage) {
      localStorage.setItem("station", station);
    }
    
    $('#infoContainer').show();
    $('#setupFormContainer').hide();
  
    //Do transit directions
    //Get BART
    getBART();
    setInterval(getBART, 15000);
  
    getWeather();
    setInterval(getWeather, 1200000);
    
  } else {
    //No parameters sent
    setupForm();
    
  }
  
  //Click handler for toggling background images
  $('#toggleImages').click(function(){
    if($('#background img').is(':visible')){
      $('#toggleImages').html('Show Images');
      $('#background img').fadeOut();
      $('.photoCredit').fadeOut();
      if(Modernizr.localstorage) {
        localStorage.setItem("backgroundImage",false);
      }
    } else {
      $('#toggleImages').html('Hide Images');
      $('#background img').fadeIn();
      $('.photoCredit').fadeIn();
      if(Modernizr.localstorage) {
        localStorage.setItem("backgroundImage",true);
      }
    }
    return false;
  });
  
  //Detect if backgroundImage preference is set
  if(Modernizr.localstorage) {
    if(localStorage.getItem("backgroundImage") === "false"){
      $('#toggleImages').click();
    }
  }
  
  //Background rotator
  setInterval(rotateBackground, 300000);
  
});