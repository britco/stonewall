## Methods

### Stonewall.validate
Validate a group of attributes against a Stonewall 'ruleset'.

Stonewall.validate(options)

Options:
* resource: The resource being validate. Useful for auto-populating rules.
* attributes: The attributes you want to validate
* ignore: List of attrs. in options.attributes that shouldn't be validated.
* rules: The rules to validate the attrs. against
* intersect: If intersect is on, only validate the attributes provided
* success: Callback for when validation completes with no errors
* error: Callback for when validate completes with errors