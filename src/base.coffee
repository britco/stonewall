###
 Stonewall base class
 @author Paul Dufour
 @company Brit + Co
###

Stonewall.Core = _.extend Stonewall,
	###
	 Flatten a group of attributes
	 into a list like

	 	first.second.last: value
	 	billing_address.name: 2

	 object: The object to flatten
	 bucket: Where the result of the flattening goes
	 leading: Leading path. This is used internally.
	###
	flatten: (obj, bucket, leading='') ->
		if(Backbone?.Model? and obj instanceof Backbone.Model)
			obj = obj['attributes']

		bucket = bucket || {}

		leading = leading + '.' if leading != ''

		for k, v of obj
			if v? and typeof v is "object" and not (v instanceof Date or v instanceof RegExp)
				Stonewall.flatten(v, bucket, leading + k)
			else
				# obj[foo.bar] = 8 takes precedence over obj = { 'foo': 'bar': 2 }
				if not leading or ((leading + k) not of bucket) or bucket[leading + k] is `undefined`
					bucket[leading + k] = v

		return bucket


	###
	 Validate a group of attributes against a Stonewall 'ruleset'
	 @options:
		resource: The resource being validate. Useful for auto-populating rules.
		attributes: The attributes you want to validate
		ignore: List of attrs. in options.attributes that shouldn't be validated.
		rules: The rules to validate the attrs. against
		intersect: If intersect is on, only validate the attributes provided
		success: Callback for when validation completes with no errors
		error: Callback for when validate completes with errors
	###
	validate: (options) ->
		attrs = Stonewall.flatten(options.attributes)

		ruleset = _.clone((new Stonewall.Ruleset(options.rules)).rules)

		success = $.proxy(options.success, @) || Function.prototype
		error = $.proxy(options.error, @) || Function.prototype

		binder = @binder
		binding = @

		# Form the context that will be used for rule functions
		ctx =
			resource: options.resource
			attributes: _.clone(attrs, true)
			rules: rules

		# Remove attrs that should be ignored
		if options.ignore
			for ignoreField in options.ignore
				delete attrs[ignoreField]

		# If intersection is provided, only validate the attrs. provided
		intersection = options.intersection || false

		if intersection
			for field, rules of ruleset
				if !_.has(attrs, field)
					delete ruleset[field]

		success_messages = {}

		# Get first available success message, and use that when all rules
		# validate
		for _field,_rules of ruleset
			for _rule in _rules
				if _rule.success_msg?
					success_messages[_field] = _rule.success_msg

		# No rules present?
		return success() if !_.size(ruleset)

		# Callback for when all the rules have been validated.
		# The only reason for having a callback like this
		# is to allow for async ruleset calls
		rulesetComplete = ->
			if _.size(errors) > 0
				# Remove errors if another error has precedence, i.e.:
				# required has precedence over minLength, which
				# has priority over maxLength, etc...
				_.each(errors, (errors, field) ->
					if errors.required?
						if _.has(errors, 'minLength')
							delete errors.minLength

						if _.has(errors, 'maxLength')
							delete errors.maxLength
				)

				error(errors)
			else
				success(success_messages)

		# Mark the whole ruleset complete when
		# all the fields have been validated
		fieldResolved = _.after(_.keys(ruleset).length, rulesetComplete)

		# Loop through the object's ruleset
		# rules, and after all fields are
		# validated, return the response to the
		# success / error callback
		errors = {}

		# Loop through each field
		_.each ruleset, (rules, field) ->
			value = attrs[field]

			# Mark the field as completed when all rules have been validated
			ruleResolved = _.after(_.keys(rules).length, fieldResolved)

			# If required is false, and the field value is empty, then the
			# validation should move onto the next field
			if _.isEmpty(value)
				rulenames = _.pluck(rules, 'name')

				if 'required' in rulenames
					ruledata = _.last(_.where(rules, name: 'required'))

					if ruledata.data is false
						fieldResolved()

						# Skip to the next field
						return true

			# Loop through each rule
			_.every rules, (rule) ->
				# Method for adding an error to the final errors object
				addError = (err, rule) ->
					if !errors[field]?
						errors[field] = {}

					errors[field][rule] = err

				args = [field, value, rule.data]

				if !rule.fn?
					ruleResolved()
				else
					# Get the result of the ruleset for this field & rule
					result = rule.fn.call(ctx, args...)

					# Resolve the results of functions. Since these
					# could take a while to resolve, they can't
					# be handled like other rules. This functionality
					# allows you to do async ruleset.
					if(rule.name is 'fn') and (result?.promise? and $.isFunction(result.promise))
						onSucccess = ->
							ruleResolved()

						onFail = ->
							addError(rule.msg, rule.name)
							ruleResolved()

						result
							.success (resp) ->
								if typeof resp is 'object'
									if _.has(resp, 'success')
										if resp.success is false
											return onFail()
								return onSucccess()
							.fail ->
								return onFail()
					else
						if !result
							# Rule failed (in a non-async operation)
							# This means: mark the whole field as resolved
							# And continue to the next field
							addError(rule.msg, rule.name)

							fieldResolved()

							return false
						else
							ruleResolved()

				# Go to the next rule
				return true

			# Go to the next field
			return true

		return this

	###
	 Validate a single attribute against a Stonewall 'ruleset'
	 @options:
		resource: The resource being validate. If resource is provided, resource.validation will be used as the rules.
		attribute: The attribute name. Needed so the relevant rules can be looked up.
		attributes: All attributes present (don't use for validation, just for reference)
		value: The value of the attribute
		rules: The rules to validate the attributes against.
		success: Callback for when validation completes with no errors
		error: Callback for when validate completes with errors
	###
	validateAttribute: (options) ->
		attr = options.attribute
		attrs = {}
		attrs[attr] = options.value

		# You can pass in 'attributes' as reference, but attr: value
		# is the only data used in validation. So since that is the
		# case, if attributes is provided, add all but options.attr
		# to the ignore list.
		ignore = []

		if options.attributes
			ignore = _.keys(_.omit(options.attributes, [options.attribute]))

			# Add in the current value
			options.attributes[attr] = options.value

			attrs = options.attributes

		# Create a new Stonewall ruleset
		options.rules = options.resource.validation if options.resource?.validation?

		delete options.rules if _.isArray options.rules and !options.rules.length

		rules = options.rules

		# Send call to validate method
		Stonewall.validate.call(@, _.extend options,
			resource: options.resource
			ignore: ignore
			rules: rules
			attributes: attrs
			intersection: true
			error: _.wrap(options.error, (fn, args...) =>
				# Return only the relevant errors
				if args.length >= 0
					if _.has(args[0], attr)
						args[0] = args[0][attr]

				# Call super fn
				fn.call(@, args...)
			),
			success: _.wrap(options.success, (fn, args...) =>
				# Return only the relevant success message
				if args.length >= 0
					if _.has(args[0], attr)
						args[0] = args[0][attr]
					else
						args[0] = `void 0`

				# Call super fn
				fn.call(@, args...)
			)
		)

	# General-use activate method. Used for
	# activating plugins and such.
	activate: (type, name) ->
		return if not type

		# Normalization
		name = name.replace(/\s$|^\s/, '')

		if type is 'plugin'
			if Stonewall.Plugins.hasOwnProperty(name)
				Stonewall.Plugins[name].activate()

		return false

	###
	 General-use configure method
	 @type Type of configuration option
	 @obj Part of Stonewall you wish to configure
	 @options New options you are setting
	###
	configure: (type='plugin', obj, options) ->
		return if not obj or not options

		# Normalization
		obj = obj.replace(/\s$|^\s/, '')

		# If object is a plugin, then extend the plugin object
		# with the new properties
		if type is 'plugin'
			source = Stonewall.Plugins.Rivets
			source.options = _.extend source.options, options

		return (if source then source else false)