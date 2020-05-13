var bartAPIKey = 'MPKS-MV5G-YZUU-VV8V';

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

function updateBART(){
  updateDepartures();
  updateAdvisories();
}

function updateDepartures(){
  var station = $.getUrlVar('station')
    , url = 'https://api.bart.gov/api/etd.aspx'
    , bart = [];

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

function updateAdvisories(){
  var station = $.getUrlVar('station')
    , url = 'https://api.bart.gov/api/bsa.aspx';

  $.ajax({
    url: url,
    data: {
      cmd: 'bsa',
      orig: station,
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $('#advisories').empty();
      $(result).find('bsa').each(function(i, data){
        //Process advisories
       $('<div>')
        .addClass('advisory')
        .text($(data).find('description').text())
        .appendTo('#advisories');
      });
    }
  });
};


function setupForm(){
  var url = 'https://api.bart.gov/api/stn.aspx';

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

$(function(){

  //Get background image
  var imageCount = 32;
  $('#background').append("<img src='images/backgrounds/" + Math.ceil(Math.random()*imageCount) + ".jpg'>")
  
  //Detect settings
  if($.getUrlVar('station')){
    var station = $.getUrlVar('station');
    
    //Set this as a localstorage option for next time
    if(Modernizr.localstorage) {
      localStorage.setItem("station", station);
    }
    
    $('#infoContainer').show();
    $('#setupFormContainer').hide();
  
    updateBART();
    setInterval(updateBART, 15000);
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
