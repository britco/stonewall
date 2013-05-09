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
		@form = $(el).parents("form")

		@keydownListener = $(el).on "keydown.#{@id}", $.proxy(@binder.onKeydown, @)

		@currentListener = $(el).on "change.#{@id}", $.proxy(@binder.onChange, @)

		@submitListener = $(el).parents("form").on("submit.#{@id}", $.proxy(@binder.onSubmit, @))

		@dataSubmitListener = $(el).parents("form").find('a[data-submit="true"]').on("click.#{@id}", $.proxy(@binder.onSubmit, @))

	# Remove bindings
	unbind: ->
		$(el).off "change.#{@id}", @currentListener

		$(el).off "keydown.#{@id}", @keydownListener

		$(el).parents('form').off "submit.#{@id}", @submitListener

		$(el).parents("form").find('a[data-submit="true"]').on "click.#{@id}", @dataSubmitListener

		@state = 'valid'

		$(el).hideError()

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

	# Validate the whole form before submitting
	onSubmit: (e) ->
		# If there are remaining inputs that are invalid, kill the submit
		if @state isnt 'valid'
			# Trigger change on all the inputs
			$(@form).find('input:not(:file), select, textarea').trigger('change')

			e.stopImmediatePropagation()

			return false