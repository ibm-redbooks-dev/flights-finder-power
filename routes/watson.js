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

var express = require('express');
var WatsonDiscovery = require('../common/watson')();
var router = express.Router();

var _query = function(searchtext, date, res) {
    WatsonDiscovery.query(searchtext, date).then(function(resp){
  	  res.json(resp);
    }, function(err){
    	console.log('err', err)
  	  res.json(err);
    });
};
/* GET users listing. */
router.get('/:searchtext/:date', function(req, res, next) {
  var input = req.params.searchtext || 'Flight from Houston to Chicago';
  var date = new Date(req.params.date || '2017-12-20');
  _query(input, date, res);
});
router.get('/', function(req, res, next) {
  var input = req.query.searchtext || 'Flight from Houston to Chicago';
  var date = new Date(req.query.date || '2017-12-20');
  _query(input, date, res);
});
router.post('/', function(req, res, next) {
    var input = req.body.searchtext || 'Flight from Houston to Chicago';
    var date = new Date(req.body.date || '2017-12-20');
    _query(input, date, res);
});

module.exports = router;
