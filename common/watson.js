/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
var request = require('request');
//require('request-debug')(request)
var Q = require('q');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
var NodeGeocoder = require('node-geocoder');
var config = require('../config');

module.exports = function() {
  console.log('Watson-Discovry exports');
  var watson_natural_language_understanding = new NaturalLanguageUnderstandingV1(config.langUnderstandingOptions);
  var watson_discovery = new DiscoveryV1(config.discoveryOptions);
  var geocoder = NodeGeocoder(config.geocoderOptions);

  var paramsTmplt = {
    'text': '',
    'features': {
      'entities': {
        'limit': 2 //assume only 2 citys
      }
    }
  }

  var respTmplt = {
    'content': {
      'status': undefined,
      'error': undefined,
      'message': undefined
    }
  }

  var query = function(url, auth) {
    console.log('query', url);
    var def = Q.defer();
    var opt = {
      'method': 'GET',
      'uri': url
    };
    if (auth) {
      opt['auth'] = {
        'user': auth.username,
        'pass': auth.password,
        'sendImmediately': false
      }
    }
    request(opt, function(err, resp, body) {
      if (err) {
        console.log('query err: ', json);
        def.reject(err);
        return;
      }
      var json = undefined;
      try {
        json = JSON.parse(body);
      } catch (e) {
        console.log('Can not parse the query body', e, url, body)
        json = body; //plain text data
      }
      //console.log('query json: ', json);
      def.resolve(json);
    });
    return def.promise;
  };

  var buildResp = function(resp) {
    return Object.assign({}, respTmplt, {
      'content': resp
    });
  }

  var validateInputs = function(searchtext, time) {
    console.log('validateInputs', searchtext, time);
    if (!searchtext || !time) {
      return buildResp({
        'status': 406,
        'error': 'Error: Invalid input searchtext and/or input date'
      });
    }

    if (isNaN(time.getTime())) {
      return buildResp({
        'status': 406,
        'error': 'Error: Invalid input date'
      });
    }

    return undefined;
  }

  /**************************************************************************************
   * Find Flight by query findflight service on IWS
   * For example
   * 'http://common1.idevcloud.com:10076/web/services/findflight/Houston/Newark/08032017'
   *************************************************************************************/
  var findFlight = function(cities, date) {
    console.log('findFlight', cities.length, date);
    var url = config.findFlightService +
      '/' + cities[0] +
      '/' + cities[1] +
      '/' + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2) + date.getFullYear();
    return query(url).then(function(resp) {
      return resp;
    }, function(err) {
      return err;
    });
  };

  /***************************************************************
   * Based on the geo-coordinate, get the weather data from WeatherCompany service
   * For example,
   * https://<username>:<password>@twcservice.mybluemix.net:443/api/weather/v1/geocode/45.42/75.69/forecast/hourly/48hour.json
   ***************************************************************/
  var findGeo = function(cities) {
    console.log('findGeo', cities.length);
    var def = Q.defer();
    geocoder.geocode(cities[1], function(err, resp) {
      if (err) {
        def.reject(err);
      } else if (!resp || resp.length === 0) {
        def.reject('No response content');
      } else {
        def.resolve(resp[0]);
      }
    });
    return def.promise;
  };

  var findWeather = function(coordinate) {
    console.log('findWeather', coordinate);
    var bmw = config.bluemixWeather;
    var url = bmw.url + '/v1/geocode' + '/' + coordinate.latitude + '/' + coordinate.longitude + '/forecast/daily/3day.json';
    return query(url, bmw).then(function(resp) {
      return resp;
    }, function(err) {
      return err;
    });
  };

  var findWeatherOfCity = function(cities) {
    return findGeo(cities).then(function(coordinate) {
      return findWeather(coordinate);
    });
  };

  var langAnalyze = function(searchtext) {
    console.log('langAnalyze', searchtext);
    var parameters = Object.assign({}, paramsTmplt, {
      'text': searchtext
    });
    console.log('langAnalyze', parameters);
    var def = Q.defer();
    watson_natural_language_understanding.analyze(parameters, function(err, resp) {
      console.log('langAnalyze natural_language_understanding analyze', err, resp);
      if (err) {
        def.reject(err);
      } else {
        def.resolve(resp);
      }
    });
    return def.promise;
  };

  /*************************************************************************
   * Using Watson discouvery service, find top news for the destination city
   * @type DiscoveryV1
   *************************************************************************/
  var discovery = function(cities) {
    var environment_id = 'system';
    var collection_id = 'news';
    var query_string = 'Top news in ' + cities[1];
    var opt = {
      environment_id,
      collection_id,
      count: 5,
      return: 'title, url, host, text, main_image_url',
      query: query_string,
      aggregations: [
        'nested(enriched_title.entities).filter(enriched_title.entities.type:Company).term(enriched_title.entities.text)',
        'nested(enriched_title.entities).filter(enriched_title.entities.type:Person).term(enriched_title.entities.text)',
        'term(enriched_title.concepts.text)',
        'term(host).term(enriched_text.sentiment.document.label)',
        'term(enriched_text.sentiment.document.label)',
        'min(enriched_text.sentiment.document.score)',
        'max(enriched_text.sentiment.document.score)',
        'filter(enriched_title.entities.type::Company).term(enriched_title.entities.text).timeslice(crawl_date,1day).term(enriched_text.sentiment.document.label)'
      ]
    };
    var def = Q.defer();
    watson_discovery.query(opt, function(err, resp) {
      if (err) {
        def.reject(err);
      } else {
        def.resolve(resp);
      }
    });
    return def.promise;
  };

  var perform = function(searchtext, time) {
    var vali = validateInputs(searchtext, time);
    if (vali) {
      return Q.fcall(function() {
        return vali;
      });
    }
    return langAnalyze(searchtext).then(function(resp) {
      if (resp.entities.length !== 2) {
        return buildResp({
          'status': 400,
          'message': resp
        });
      }
      // get cities
      var cities = [];
      for (var i = 0; i < resp.entities.length; i++) {
        var entity = resp.entities[i];
        if (entity.type === 'Location') {
          var city = entity.text.toLowerCase();
          city = city.charAt(0).toUpperCase() + city.slice(1);
          cities.push(city);
        }
      }
      // resp object
      var ret = {
        status: 200,
        fromCity: cities[0],
        toCity: cities[1],
        date: time,
        flights: undefined,
        weatherRaw: undefined,
        weather: undefined,
        discovery: undefined
      };

      var promises = [
        findFlight(cities, time),
        findWeatherOfCity(cities),
        discovery(cities)
      ];
      return Q.all(promises).then(function(results) {
        ret.flights = results[0];
        ret.weather = results[1];
        ret.discovery = results[2];
        return ret;
      }, function(err) {
        return buildResp({
          'status': 406,
          'error': err
        });
      });
    }, function(err) {
      return buildResp({
        'status': 406,
        'error': err
      });
    });
  };

  return {
    'query': perform
  }
};
