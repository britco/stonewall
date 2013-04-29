###
 Stonewall default validation rules
 @author Paul Dufour
 @company Brit + Co
###

Stonewall.Rules =
	required: (field, value, isRequired) ->
		if not isRequired
			# Not required, pass on to next rule
			return true
		else
			# Otherwise, return if value exists
			if typeof value is 'string'
				return (value? and value.length)
			else if typeof value is 'number'
				(value? and String(value).length)
			else
				return (value?)

	minLength: (field, value='', requiredLength) ->
		if value.length < requiredLength
			return false
		else
			return true

	maxLength: (field, value='', requiredLength) ->
		if value.length > requiredLength
			return false
		else
			return true

	rangeLength: (field, value='', lengthRange) ->
		if value.length < lengthRange[0]
			return false
		else if value.length > lengthRange[1]
			return false
		else
			return true

	length: (field, value='', requiredLength) ->
		if value.length is requiredLength
			return true
		else
			return false

	equalTo: (field, value, equalToField) ->
		otherFieldValue = @attributes[equalToField]

		if value isnt otherFieldValue
			return false
		else
			return true

	pattern: (field, value, pattern) ->
		defaultPatterns =
			number: /^([0-9]+)$/
			email: /^(.+)@(.+){2,}\.(.+){2,}$/

		if pattern not instanceof RegExp
			if !defaultPatterns[pattern]
				throw new Error "Validator pattern not found: #{pattern}"

			re = defaultPatterns[pattern]
		else
			re = pattern

		return re.test(value)

	fn: (field, value, fn, tailing...) ->
		if @resource[fn]?
			return @resource[fn].call @, value, field, tailing...