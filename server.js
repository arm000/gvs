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
    console.log('redirecting request to: ' + config.tintin + req.params.changeid);

    request({
	method: 'GET',
	url: config.tintin + req.params.changeid,
	qs: {
	    key: JSON.stringify(req.query.q),
	    reduce: false,
	    include_docs: true
	}
    }, function(err, couchRes, body) {
      
	// couldn't connect to CouchDB
	if (err) {
	    res.json(502, { error: "couldn't connect to tintin", reason: err.code });
	    return;
	}
      
	// CouchDB couldn't process our request
	if (couchRes.statusCode !== 200) {
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
	res.json(change);
    });
});

//   d3.json(cors("http://tintin/ajax?response=json&searchopt=and&query=buildbrain-"+tchange.change_id),
