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

## Basic Setup

This information should help you get up and going with Stonewall. First download the source code, and include in your page. Then, setup a..

## Example
  
	data = {
		'first_name': '',
		'last_name': '2',
		'street_line1': '1',
		'zipcode': 1311114
	};

	rules = {
		'street_line1': {
			'required': true,
			'maxLength': 5,
		}
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

## Setup with Backbone & Rivets

Stonewall works really well with a Rivets & Backbone setup. If you want to use Stonewall in this setup, first set up rules on the Backbone model:
	UserModel = Backbone.Model.extend({
		email: [
			{
				required: true,
				msg: 'required'
			},
			{
				pattern: 'email',
				msg: 'invalid format'
			}
		]

		username: [
			{
				required: true
				msg: 'required'
			},
			{
				minLength: 4
				msg: 'must be at least 4 characters'
			},
			{
				pattern: /^[.\w-]+$/
				msg: 'invalid format'
			}
		]
	});

Then, set up the rivets binding:

In the view:
	
	@rivets = rivets.bind $(@container), { user: @model }

In the template:

	<input type="text" name="first_name" data-value="user.first_name">

Then, Stonewall will tie into the rivets `value` binding, and validate an attribute whenever it changes.
	
## Built in rules

### required
Specifies if a value is required or not.

	rules = {
		'first_name': {
			'required': true
		}
	}

### minLength

Value must meet the mininum length to pass.
	
	rules = {
		'name': {
			'minLength': 3
		}
	}

### maxLength

Value cannot exceed this length.
	
	rules = {
		'name': {
			'maxLength': 10
		}
	}

### rangeLength

Value must be in between this length.
	
	rules = {
		'username': {
			rangeLength: [6, 20]
		}

### length

Must be exactly this length.
	
	rules = {
		'address': {
			length: 12
		}

## equalTo

Value must equal this other value.
	
	rules = {
		'password_confirm': {
			equalTo: 'password'
		}

## pattern

Value must match this pattern. You can use a built in pattern, your specify your own.
	
	rules = {
		'username': {
			pattern: /^[.\w-]+$/
		}
	}

The built in patterns are:
* number: `/^([0-9]+)$/`
* email: `/^(.+)@(.+){2,}\.(.+){2,}$/`


## fn

Use this rule to validate data against a custom function.

	resource = {
		'validateUnique': function(value, field) {
			$.ajax({
				type: 'POST',
				url: 'user/exists',
				data: value,
				dataType: 'json',
				contentType: 'application/json'
			});
		}
	};
	
	rules = {
		'username': {
			fn: 'validateUnique'
		}
	};
	
	data = {
		'username': 'test'
	};
	
	Stonewall.validate({
		resource: resource,
		attributes: data,
		rules: rules,
		success: function() {
			console.log('Success! No errors.');
		},
		error: function() {
			console.log('Validation failed, errors:', arguments[0]);
		}
	});

The function accepts the arguments (value, field. If you return true from the function, the rule passes, otherwise it doesn't. Or you can return a deffered object. This is where Stonewall really shines.

If the function returns a deffered object, the return status of the deffered object will be used as the passing status of the data. So for the above example, if 'user/exists' throws a 200, the rule will pass, but if it throws a 500, it will fail.
