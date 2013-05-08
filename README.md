Stonewall
=========

An asynchronous validation framework with tight integration to Backbone and Rivets.

## Introduction

Stonewall is a simple Javascript validation framework. The goal of the framework is to provide a validation library that doesn't get in your way. But at the same time, Stonewall provides features that many validation frameworks are missing. For instance, Stonewall includes asynchronous validation by default, no plugins required. This means you can have validation rules like 'check if username is registered already.' Stonewall is in its infancy, so there may be bugs, but everything is thoroughly tested, and the framework is already being used in production on a number of sites.

## Download

[Stonewall-0.1.0.js](https://raw.github.com/britco/stonewall/master/dist/Stonewall-0.1.0.js)

## Dependencies
* [Underscore](http://underscorejs.org/)
* [jQuery](http://jquery.com/)

## Docs
* [Methods](https://github.com/britco/stonewall/blob/master/docs/methods.md)

## Basic Setup

This information should help you get up and going with Stonewall. First download the source code, and include in your page.

	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
	<script type="text/javascript" src="lib/underscore.js"></script>
	<script type="text/javascript" src="lib/Stonewall-0.1.0.js"></script>

### Setting up rules

Rulesets are easy to create. Simply create an object with the properties as the attribute names, and the values as the rules / options. For example:
	
	rules = {
		'username': {
			'required': true,
			'maxLength': 5
		}
	};

There is also the array syntax. Use this if you want to specify a custom error message for a rule, like so:

	rules = [
		username: [
			{
				minLength: 4
				msg: 'username is not long enough.'
			}
		]
	]

### Validating the rules

After you have the rules, you can validate data against the rules by calling [Stonewall.validate](docs/methods.md#stonewallvalidateoptions). Pass in the attributes & rules, and also callbacks for when the validation is complete.
	
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
	};

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
	
## Validated nested properties

Validated nested properties is trivial with Stonewall. Say you have an object like:

	obj = {
		billing_info': {
			cvc: 13
		}
	}
	
When this data is validated, it will be flattened to the following:

	obj = {
		'billing_info.cvc' : 13
	}

That makes it super easy to set up validation on the cvc property.

	rules = {
		'billing_info.cvc': {
			required: true
		}
	}

## Setup with Backbone & Rivets

Stonewall works really well with a Rivets & Backbone setup. If you want to use Stonewall in this setup, first set up some rules on a Backbone model's **validation** property:

	UserModel = Backbone.Model.extend({
		validation: {
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
		}
	});

Then, set up the Rivets binding like you normally would.

Backbone View:

	...
	@rivets = rivets.bind $(@container), { user: @model }
	...

Template:

	...
	<input type="text" name="first_name" data-value="user.first_name">
	...

That's all you have to do. Stonewall will modify the Rivets `value` binding to validate the property on change, and if it passes, proceed to set the value.

And **also**, full validation will occur when a form is submitted. This means, if you have the following:

	<form id="register">
		<input id="username" type="text" name="username" data-value="user.username">
		<input id="email" type="text" name="email" data-value="user.email">
	</form>

When #register is submitted, Stonewall.validate will be called for #username and #email.
	
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

Use this rule to validate data against a custom function. The function accepts the arguments (value, field). If you return true from the function, the rule passes, otherwise it doesn't.

Alternatively, you can return a deffered object. If the function returns a deffered object, the return status of the deffered object will be used as the passing status of the data. So for the above example, if 'user/exists' throws a 200, the rule will pass, but if it throws a 500, it will fail.


	resource = {
		'validateUnique': function(value, field) {
			return $.ajax({
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
		error: function(e) {
			console.log('Validation failed, errors:', e);
		}
	});
