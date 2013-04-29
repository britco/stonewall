Stonewall
=========

A simple async. validation framework with tight integration to Backbone and Rivets.

## Introduction

Stonewall is a simple Javascript validation framework. The goal of the framework is to provide a simple framework that doesn't get in your way. But at the same time, Stonewall provides features that many validation frameworks are missing. For instance, Stonewall includes asynchronous validation by default, no plugins required. This means you can have validation rules like 'check if username is registered already.' Stonewall is in its infancy, so there may be bugs, but everything is thoroughly tested, and the framework is already being used in production in a couple of sites.

## Download

[Stonewall-0.1.0.js](https://raw.github.com/britco/stonewall/master/dist/Stonewall-0.1.0.js)

## Dependencies
* [Underscore](http://underscorejs.org/)
* [jQuery](http://jquery.com/)

## Setup

This information should help you get up and going with Stonewall. First download the source code, and include in your page. Then, setup a..

## Example
  
	data = {
		'first_name': '',
		'last_name': '2',
		'street_line1': '1',
		'street_line2': '240000 St',
		'zipcode': 1311114
	};

	rules = {
		'first_name': {
			'required': true
		},
		'street_line1': {
			'required': true,
			'maxLength': 5,
		},
		'street_line2': {
			'required': true,
			'maxLength': 10,
		},
		'zipcode': {
			'required': true,
			'length': 5,
			'pattern': 'number'
		}
	}

	Stonewall.validate(
	{
		attributes: data,
		rules: rules,
		success: function() {
			console.log('Success! No errors.');
		},
		error: function(errs) {
			console.log('Validation failed, errors:', errs);
		}
	});
