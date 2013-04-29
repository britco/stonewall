###
 Stonewall rivets integration
 @author Paul Dufour
 @company Brit + Co
###

Stonewall.Plugins.Rivets = plugin =
	# Get the deepest Backbone model from a path
	# string (and also get the remaining key)
	getLastModelAndPath: (obj, path) ->
		return [false, false] if not path

		spl = path.split('.')

		parts = []

		first_step = obj.get(spl[0])

		# If first step is not a model, return
		if first_step not instanceof Backbone.Model
			if spl.length is 1
				return [obj, path]
			else
				return [obj, spl[1..].join('.')]

		# Move onto next step
		return @getLastModelAndPath(first_step, spl[1..].join('.'))

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
				success: (errors) ->
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
		if $(e.currentTarget).attr('data-silent-change') isnt 'true'
			$(@el).attr('data-previous-value', $(@el).val())

			plugin.validateElement.call(@)

	# Records 'tab in a blank input field' as a change
	onKeydown: (e) ->
		code = e.keyCode || e.which

		value = $(@el).val()

		previous_value = $(@el).attr('data-previous-value')

		initial_keydown = $(@el).attr('data-initial-keydown') || true

		if code is 9
			if initial_keydown is true
				$(@el).attr('data-previous-value', value)
					  .attr('data-initial-keydown', 'false')
					  .attr('data-silent-change', 'true')

				plugin.validateElement.call(@)

				$(@el).removeAttr('data-silent-change')

	# Validate the whole form before submitting
	onSubmit: (e) ->
		# If there are remaining inputs that are invalid, kill the submit
		if @state isnt 'valid'
			# Trigger change on all the inputs
			$(@form).find('input:not(:file), select, textarea').trigger('change')

			e.stopImmediatePropagation()

			return false

	# Setup bindings
	bind: (el) ->
		[model, key] = @binder.getLastModelAndPath(@model, @keypath)

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

		@currentListener = $(el).on "change.#{@id}", $.proxy(@binder.onChange, @)

		@keydownListener = $(el).on "keydown.#{@id}", $.proxy(@binder.onKeydown, @)

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

	activate: ->
		# Mixin the plugin code to the rivets binder
		_.extend rivets.binders.value, @

		# JQuery functions for showing and hiding error messages
		$.fn.showError = @showError

		$.fn.hideError = @hideError