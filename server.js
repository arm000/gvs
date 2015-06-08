#!/usr/bin/env node --harmony
/***
 * Excerpted from "Node.js the Right Way",
 * published by The Pragmatic Bookshelf.
 * Copyrights apply to this code. It may not be used to create training material, 
 * courses, books, articles, and the like. Contact us if you are in doubt.
 * We make no guarantees that this code is fit for any purpose. 
 * Visit http://www.pragmaticprogrammer.com/titles/jwnode for more book information.
***/
'use strict';
const
    express = require('express'),
    app = express(),
    request = require('request');

// create "middleware"
app.use(express.logger('dev'));

const config = {
    couch: 'http://localhost:5984/tintin/',
    tintin: 'http://tintin/ajax?response=json&searchopt=and&query=buildbrain-'
};

app.listen(3000, function(){
    console.log("ready captain.");
});

app.get('/tintin/:changeid', function(req, res) {
//    console.log('got a request for change id: ' + req.params.changeid);
    console.log('redirecting request to: ' + config.couch + req.params.changeid);
    console.log({
	    key: JSON.stringify(req.query.q),
	    reduce: false,
	    include_docs: true
    });

    request({
	method: 'GET',
	url: config.couch + req.params.changeid,
//	qs: {
//	    key: JSON.stringify(req.query.q),
//	    reduce: false,
//	    include_docs: true
//	}
    }, function(err, couchRes, body) {
      
	// couldn't connect to CouchDB
	if (err) {
	    res.json(502, { error: "couldn't connect to couchdb", reason: err.code });
	    return;
	}
      
	// not found in database
	if (couchRes.statusCode == 404) {
	    console.log('got a 404, redirecting to the real tintin');
	    // redirect to the real tintin
	    request({
		method: 'GET',
		url: config.tintin + req.params.changeid,
	    }, function(err, tintinRes, body) {
		if (err) {
		    res.json(502, { error: "couldn't connect to tintin", reason: err.code });
		    return;
		}
		if (tintinRes.statusCode !== 200) {
		    console.log('tintin returned status ' + tintinRes.statusCode);
		    res.json(tintinRes.statusCode, JSON.parse(body));
		    return;
		}
		console.log('got response from tintin, adding to db');
		request({
		    method: 'PUT',
		    url: config.couch + req.params.changeid,
		    json: JSON.parse(body)
		}, function(err, tintinputRes, body) {
		    if (err) {
			res.json(502, { error: "couldn't connect to tintin on put", reason: err.code});
			return;
		    }
		});
		res.json(200, JSON.parse(body));
		return;
	    });
	    return;
	}
		   

	// CouchDB couldn't process our request
	if (couchRes.statusCode !== 200) {
	    console.log('couch returned status ' + couchRes.statusCode);
	    res.json(couchRes.statusCode, JSON.parse(body));
	    return;
	}

//	console.log('got something from tintin');
//	console.log(body);

	// send back simplified documents we got from CouchDB
	let change = {};
	let changes = JSON.parse(body);
	console.log('got this many responses: ' + changes.iTotalRecords);
	if (changes.iTotalRecords != 1) {
	    res.json(502, { error: "too many responses", reason: changes.iTotalRecords });
	    return;
	}
	    
	changes.aaData.forEach(function(elem) {
	    //			change[elem.doc._id] = elem.doc.title;
//	    console.log('this change is:');
//	    console.log(elem);
	    change = elem;
	});
	res.json(200, change);
    });
});

//   d3.json(cors("http://tintin/ajax?response=json&searchopt=and&query=buildbrain-"+tchange.change_id),
