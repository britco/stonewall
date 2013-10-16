###
 Stonewall ruleset related functions
 @author Paul Dufour
 @company Brit + Co
###

Stonewall.Ruleset = class Ruleset
	rules: {}

	# Construct a new rulset object
	# from a group of rules
	constructor: (rules) ->
		return rules if rules instanceof Ruleset

		@rules = Ruleset.expand(rules)

		return @

	# Get the expanded validation ruleset from
	# an object of rules. After conversion,
	# the validation will look like
	#  billing_address: [
	# 	 name: minLength
	# 	 rule: <minLengthFN>
	# 	 data: 1
	# 	 msg: <min length error>
	#  ]
	@expand: (object) ->
		return {} if !object

		object = _.clone(object, true)

		validation = {}

		for field, rules of object
			# Loop over each field
			msg = null
			options = null
			data = null
			rule_name = null
			validation[field] = []
			newObj = {}

			if !_.isArray rules
				if rules.msg?
					msg = rules.msg
					delete rules.msg

				for rule, options of rules
					newObj = {}

					newObj['data'] = options

					newObj['fn'] = Stonewall.Rules[rule]

					newObj['name'] = rule

					if msg?
						newObj['msg'] = msg
					else
						if !_.has(newObj, 'msg')
							newObj['msg'] = Stonewall.Messages.errors[rule]

					validation[field].push newObj
			else
				for rule in rules
					rule_name = _.first(_.filter(_.keys(rule), (value) -> (value isnt 'msg')))

					if !_.has(rule, 'msg')
						rule['msg'] = Stonewall.Messages.errors[rule_name]

					newObj =
						fn: Stonewall.Rules[rule_name]
						name: rule_name
						msg: rule.msg
						data: rule[rule_name]

					if rule?.success_msg?
						newObj.success_msg = rule.success_msg

					validation[field].push newObj

		return _.clone(validation, true)