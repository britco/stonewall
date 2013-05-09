## Methods

### Stonewall.validate(options)
Validate a group of attributes against a group of rules.

* options:
  * resource: The resource being validate. Useful for auto-populating rules.
  * attributes: The attributes you want to validate
  * ignore: List of attrs. in options.attributes that shouldn't be validated.
  * rules: The rules to validate the attrs. against
  * intersect: If intersect is on, only validate the attributes provided
  * success: Callback for when validation completes with no errors
  * error: Callback for when validate completes with errors

### Stonewall.validateAttribute(options)
Validate an individual attribute & value against a group of rules.

* options:
  * resource: The resource being validate. If resource is provided, resource.validation will be used as the rules.
  * attribute: The attribute name. Needed so the relevant rules can be looked up.
  * attributes: All attributes present (don't use for validation, just for reference)
  * value: The value of the attribute
  * rules: The rules to validate the attributes against.
  * success: Callback for when validation completes with no errors
  * error: Callback for when validate completes with errors


### Stonewall.configure(type='plugin', obj, options)
Configure Stonewall.

* type: Type of configuration option
* obj: Part of Stonewall you wish to configure
* options: New options you are setting
