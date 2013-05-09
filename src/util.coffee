###
 Stonewall general use functions
 @author Paul Dufour
 @company Brit + Co
###

Stonewall.Util = util =
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
		return Stonewall.util.getLastModelAndPath(first_step, spl[1..].join('.'))