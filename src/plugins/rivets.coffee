###
 Stonewall rivets integration
 @author Paul Dufour
 @company Brit + Co
###

Stonewall.Plugins.Rivets = plugin =
	options:
		# Show a validation error for an element
		showError: (options={}) ->
			if !options.message?
				return false

			$(@).addClass('error')
			    .removeClass('valid')
			    .attr('data-error', options.message || '')
			    .nextAll('.msg:not(.valid)').each ->
					$(@).text(options.message)
					$(@).fadeIn()

		# Hide all validation errors
		hideError: ->
			$(@).removeClass('error')
			    .addClass('valid')
			    .removeAttr('data-error')
			    .nextAll('.msg:not(.valid)').each ->
			    	$(@).fadeOut(20)
			    	$(@).text('')

	status:
		'initial-keydown': true

	activate: ->
		# Mixin the plugin code to the rivets binder
		_.extend rivets.binders.value, @

		# Wrapped jQuery functions for showing and hiding error messages
		$.fn.showError = -> plugin.options.showError.call(@, arguments...)

		$.fn.hideError = -> plugin.options.hideError.call(@, arguments...)

	# Setup bindings
	bind: (el) ->
		[model, key] = Stonewall.Util.getLastModelAndPath(@model, @keypath)

		# Identify the binding
		@_stonewall = true

		# Cache the results
		@_model = model
		@_key = key

		@id = _.uniqueId('sw_pg_rivets')

		@state = 'processing'

		# Silently validate on first bind
		Stonewall.validateAttribute.call @,
			resource: model
			attribute: key
			attributes: plugin.getAttributes.call(@)
			value: model.get(key)
			success: (errors) ->
				@state = 'valid'
			error: (errors) ->
				@state = 'invalid'

		# Set current value
		$(@el).attr('data-previous-value', @model.get(@keypath))

		# Setup listeners
		@keydownListener = $(el).on "keydown.#{@id}", $.proxy(@binder.onKeydown, @)

		@currentListener = $(el).on "change.#{@id}", $.proxy(@binder.onChange, @)

		# Note: _.defer is here so the form binding won't take place until the
		# element has been inserted in the body (it is possible for the el to
		# not be ineserted yet if there is a data-each binding present).
		_.defer =>
			@forms = forms = $(el).parents("form")
			onSubmit = $.proxy(@binder.onSubmit, @)

			@submitListener = forms.on("submit.#{@id}", onSubmit)
			@dataSubmitListener = forms.find('a[data-submit="true"]').on("click.#{@id}", onSubmit)

	# Remove bindings
	unbind: ->
		$(@el).off "change.#{@id}", @currentListener

		$(@el).off "keydown.#{@id}", @keydownListener

		$(@el).parents('form').off "submit.#{@id}", @submitListener

		$(@el).parents("form").find('a[data-submit="true"]').on "click.#{@id}", @dataSubmitListener

		@state = 'valid'

		$(@el).hideError()

	# Get a flattened object consisting attrs. and values
	# of all rivets bindings present in the view
	getAttributes: ->
		data = {}

		for binding in @view.bindings
			data[binding.keypath] = $(binding.el).val()

		return data

	# Validate an element
	validateElement: ->
		self = @
		@state = 'processing'

		# Wait for processing to complete, then run the validation
		_.defer =>
			Stonewall.validateAttribute.call @,
				resource: @_model
				attribute: @_key
				attributes: plugin.getAttributes.call(@)
				value: $(@el).val()
				success: ->
					@state = 'valid'

					$(@el).hideError()

					@publish()
				error: (errors) ->
					@state = 'invalid'

					$(@el).showError message: _.first _.values errors

	# Whenever a value is changed, run it through
	# the validators, and then if everything passes
	# publish the value to the object
	onChange: (e, options) ->
		if plugin.status['silent-change'] isnt true
			$(@el).attr('data-previous-value', $(@el).val())

			plugin.validateElement.call(@)

	# Records 'first tab in an input field (blank or not)' as a change
	# Block change events
	onKeydown: (e) ->
		code = e.keyCode || e.which

		value = $(@el).val()

		previous_value = $(@el).attr('data-previous-value')

		if code is 9
			if plugin.status['initial-keydown'] is true
				$(@el).attr('data-previous-value', value)

				plugin.status['initial-keydown'] = false

				plugin.status['silent-change'] = true

				plugin.validateElement.call @

				plugin.status['silent-change'] = false

		return

	# Validate the whole form before submitting
	onSubmit: (e) ->
		# If there are remaining inputs that are invalid, kill the submit
		if @state isnt 'valid'
			# Trigger change on all the inputs
			@forms.find('input:not(:file), select, textarea').trigger('change')

			e.stopImmediatePropagation()

			return false

# Extensions to Rivets.View
rivets.bind = _.wrap rivets.bind, (fn, args...) ->
	thisview = fn(args...)

	thisview = _.extend(thisview, view)

view =
	# Method to check if an entire Rivets view is valid. Loops through all the
	# bindings (inputs, etc..) and checks if they are valid. If any binding is
	# valid, return false to parent function.
	#
	# This function allows you to do complex functions, like check if the
	# first three inputs are valid, before showing the next three. Should be
	# called within the context of a Rivets view.
	isValid: ->
		# Loop through all bindings
		return true if not @bindings?

		for binding in @bindings
			return false if not view._isValid.call(@, binding)

			if binding.iterated? and binding.iterated.length
				for child in binding.iterated
					return false if not view.isValid.call(child)

		return true

	# Private function for checking if a binding is valid. Basically checks
	# the 'state' value. This function is primarily used in context of the
	# isValid function.
	_isValid: (binding) ->
		return true if not binding._stonewall?

		if binding.state is 'invalid'
			return false
		else
			return true