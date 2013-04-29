
/*
 Stonewall
 @author Paul Dufour
 @company Brit + Co
*/


(function() {
  var Stonewall;

  window.Stonewall = Stonewall = {};

  Stonewall.noop = function() {};

  Stonewall.Rules = {};

  Stonewall.Messages = {};

  Stonewall.Ruleset = {};

  Stonewall.Core = {};

  Stonewall.Plugins = {
    Rivets: null
  };

}).call(this);


/*
 Stonewall validation messages
 @author Paul Dufour
 @company Brit + Co
*/


(function() {

  Stonewall.Messages = {
    errors: {
      required: 'This field is required',
      minLength: 'Error in field length',
      maxLength: 'Error in field length',
      length: 'Error in field length',
      rangeLength: 'Error in field length',
      pattern: 'Error in field pattern',
      fn: 'Error in field',
      "if": 'Error in field'
    }
  };

}).call(this);


/*
 Stonewall default validation rules
 @author Paul Dufour
 @company Brit + Co
*/


(function() {
  var __slice = [].slice;

  Stonewall.Rules = {
    required: function(field, value, isRequired) {
      if (!isRequired) {
        return true;
      } else {
        if (typeof value === 'string') {
          return (value != null) && value.length;
        } else if (typeof value === 'number') {
          return (value != null) && String(value).length;
        } else {
          return (value != null);
        }
      }
    },
    minLength: function(field, value, requiredLength) {
      if (value == null) {
        value = '';
      }
      if (value.length < requiredLength) {
        return false;
      } else {
        return true;
      }
    },
    maxLength: function(field, value, requiredLength) {
      if (value == null) {
        value = '';
      }
      if (value.length > requiredLength) {
        return false;
      } else {
        return true;
      }
    },
    rangeLength: function(field, value, lengthRange) {
      if (value == null) {
        value = '';
      }
      if (value.length < lengthRange[0]) {
        return false;
      } else if (value.length > lengthRange[1]) {
        return false;
      } else {
        return true;
      }
    },
    length: function(field, value, requiredLength) {
      if (value == null) {
        value = '';
      }
      if (value.length === requiredLength) {
        return true;
      } else {
        return false;
      }
    },
    equalTo: function(field, value, equalToField) {
      var otherFieldValue;
      otherFieldValue = this.attributes[equalToField];
      if (value !== otherFieldValue) {
        return false;
      } else {
        return true;
      }
    },
    pattern: function(field, value, pattern) {
      var defaultPatterns, re;
      defaultPatterns = {
        number: /^([0-9]+)$/,
        email: /^(.+)@(.+){2,}\.(.+){2,}$/
      };
      if (!(pattern instanceof RegExp)) {
        if (!defaultPatterns[pattern]) {
          throw new Error("Validator pattern not found: " + pattern);
        }
        re = defaultPatterns[pattern];
      } else {
        re = pattern;
      }
      return re.test(value);
    },
    fn: function() {
      var field, fn, tailing, value, _ref;
      field = arguments[0], value = arguments[1], fn = arguments[2], tailing = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
      if (this.resource[fn] != null) {
        return (_ref = this.resource[fn]).call.apply(_ref, [this, value, field].concat(__slice.call(tailing)));
      }
    }
  };

}).call(this);


/*
 Stonewall ruleset related functions
 @author Paul Dufour
 @company Brit + Co
*/


(function() {
  var Ruleset;

  Stonewall.Ruleset = Ruleset = (function() {

    Ruleset.prototype.rules = {};

    function Ruleset(rules) {
      if (rules instanceof Ruleset) {
        return rules;
      }
      this.rules = Ruleset.expand(rules);
      return this;
    }

    Ruleset.expand = function(object) {
      var data, field, msg, newObj, options, rule, rule_name, rules, validation, _i, _len;
      if (!object) {
        return {};
      }
      object = _.clone(object, true);
      validation = {};
      for (field in object) {
        rules = object[field];
        msg = null;
        options = null;
        data = null;
        rule_name = null;
        validation[field] = [];
        newObj = {};
        if (!_.isArray(rules)) {
          if (rules.msg != null) {
            msg = rules.msg;
            delete rules.msg;
          }
          for (rule in rules) {
            options = rules[rule];
            newObj = {};
            newObj['data'] = options;
            newObj['fn'] = Stonewall.Rules[rule];
            newObj['name'] = rule;
            if (msg != null) {
              newObj['msg'] = msg;
            } else {
              if (!_.has(newObj, 'msg')) {
                newObj['msg'] = Stonewall.Messages.errors[rule];
              }
            }
            validation[field].push(newObj);
          }
        } else {
          for (_i = 0, _len = rules.length; _i < _len; _i++) {
            rule = rules[_i];
            rule_name = _.first(_.filter(_.keys(rule), function(value) {
              return value !== 'msg';
            }));
            if (!_.has(rule, 'msg')) {
              rule['msg'] = Stonewall.Messages.errors[rule_name];
            }
            newObj = {
              fn: Stonewall.Rules[rule_name],
              name: rule_name,
              msg: rule.msg,
              data: rule[rule_name]
            };
            validation[field].push(newObj);
          }
        }
      }
      return _.clone(validation, true);
    };

    return Ruleset;

  })();

}).call(this);


/*
 Stonewall base class
 @author Paul Dufour
 @company Brit + Co
*/


(function() {
  var __slice = [].slice;

  Stonewall.Core = _.extend(Stonewall, {
    /*
    	 Validate a group of attributes against a Stonewall 'ruleset'
    
    	 options =
    		resource: The resource being validate. Useful for auto-populating rules.
    		attributes: The attributes you want to validate
    		ignore: List of attrs. in options.attributes that shouldn't be validated.
    		rules: The rules to validate the attrs. against
    		intersect: If intersect is on, only validate the attributes provided
    		success: Callback for when validation completes with no errors
    		error: Callback for when validate completes with errors
    */

    validate: function(options) {
      var attrs, binder, binding, ctx, error, errors, field, fieldResolved, ignoreField, intersection, rules, ruleset, rulesetComplete, success, _i, _len, _ref;
      attrs = options.attributes;
      ruleset = _.clone((new Stonewall.Ruleset(options.rules)).rules);
      success = $.proxy(options.success, this) || Function.prototype;
      error = $.proxy(options.error, this) || Function.prototype;
      binder = this.binder;
      binding = this;
      ctx = {
        resource: options.resource,
        attributes: _.clone(attrs, true),
        rules: rules
      };
      if (options.ignore) {
        _ref = options.ignore;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ignoreField = _ref[_i];
          delete attrs[ignoreField];
        }
      }
      intersection = options.intersection || false;
      if (intersection) {
        for (field in ruleset) {
          rules = ruleset[field];
          if (!_.has(attrs, field)) {
            delete ruleset[field];
          }
        }
      }
      if (!_.size(ruleset)) {
        return success();
      }
      rulesetComplete = function() {
        if (_.size(errors) > 0) {
          _.each(errors, function(errors, field) {
            if (errors.required != null) {
              if (_.has(errors, 'minLength')) {
                delete errors.minLength;
              }
              if (_.has(errors, 'maxLength')) {
                return delete errors.maxLength;
              }
            }
          });
          return error(errors);
        } else {
          return success();
        }
      };
      fieldResolved = _.after(_.keys(ruleset).length, rulesetComplete);
      errors = {};
      _.each(ruleset, function(rules, field) {
        var ruleResolved, value;
        value = attrs[field];
        ruleResolved = _.after(_.keys(rules).length, fieldResolved);
        _.every(rules, function(rule) {
          var addError, args, onFail, onSucccess, result, _ref1;
          addError = function(err, rule) {
            if (!(errors[field] != null)) {
              errors[field] = {};
            }
            return errors[field][rule] = err;
          };
          args = [field, value, rule.data];
          if (!(rule.fn != null)) {
            ruleResolved();
          } else {
            result = (_ref1 = rule.fn).call.apply(_ref1, [ctx].concat(__slice.call(args)));
            if ((rule.name === 'fn') && (((result != null ? result.promise : void 0) != null) && $.isFunction(result.promise))) {
              onSucccess = function() {
                return ruleResolved();
              };
              onFail = function() {
                addError(rule.msg, rule.name);
                return ruleResolved();
              };
              result.success(function(resp) {
                if (typeof resp === 'object') {
                  if (_.has(resp, 'success')) {
                    if (resp.success === false) {
                      return onFail();
                    }
                  }
                }
                return onSucccess();
              }).fail(function() {
                return onFail();
              });
            } else {
              if (!result) {
                addError(rule.msg, rule.name);
                fieldResolved();
                return false;
              } else {
                ruleResolved();
              }
            }
          }
          return true;
        });
        return true;
      });
      return this;
    },
    /*
    	 Validate a single attribute against a Stonewall 'ruleset'
    
    	 options =
    		resource: The resource being validate. If resource is provided, resource.validation will be used as the rules.
    		attribute: The attribute name. Needed so the relevant rules can be looked up.
    		attributes: All attributes present (don't use for validation, just for reference)
    		value: The value of the attribute
    		rules: The rules to validate the attributes against.
    		success: Callback for when validation completes with no errors
    		error: Callback for when validate completes with errors
    */

    validateAttribute: function(options) {
      var attr, attrs, ignore, rules, _ref,
        _this = this;
      attr = options.attribute;
      attrs = {};
      attrs[attr] = options.value;
      ignore = [];
      if (options.attributes) {
        ignore = _.keys(_.omit(options.attributes, [options.attribute]));
        options.attributes[attr] = options.value;
        attrs = options.attributes;
      }
      if (((_ref = options.resource) != null ? _ref.validation : void 0) != null) {
        options.rules = options.resource.validation;
      }
      if (_.isArray(options.rules && !options.rules.length)) {
        delete options.rules;
      }
      rules = options.rules;
      return Stonewall.validate.call(this, _.extend(options, {
        resource: options.resource,
        ignore: ignore,
        rules: rules,
        attributes: attrs,
        intersection: true,
        error: _.wrap(options.error, function() {
          var args, fn;
          fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (args.length >= 0) {
            if (_.has(args[0], attr)) {
              args[0] = args[0][attr];
            }
          }
          return fn.call.apply(fn, [_this].concat(__slice.call(args)));
        })
      }));
    },
    activate: function(type, name) {
      if (!type) {
        return;
      }
      name = name.replace(/\s$|^\s/, '');
      if (type === 'plugin') {
        if (Stonewall.Plugins.hasOwnProperty(name)) {
          Stonewall.Plugins[name].activate();
        }
      }
      return false;
    }
  });

}).call(this);


/*
 Stonewall rivets integration
 @author Paul Dufour
 @company Brit + Co
*/


(function() {
  var plugin;

  Stonewall.Plugins.Rivets = plugin = {
    getLastModelAndPath: function(obj, path) {
      var first_step, parts, spl;
      if (!path) {
        return [false, false];
      }
      spl = path.split('.');
      parts = [];
      first_step = obj.get(spl[0]);
      if (!(first_step instanceof Backbone.Model)) {
        if (spl.length === 1) {
          return [obj, path];
        } else {
          return [obj, spl.slice(1).join('.')];
        }
      }
      return this.getLastModelAndPath(first_step, spl.slice(1).join('.'));
    },
    getAttributes: function() {
      var binding, data, _i, _len, _ref;
      data = {};
      _ref = this.view.bindings;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        data[binding.keypath] = $(binding.el).val();
      }
      return data;
    },
    validateElement: function() {
      var self,
        _this = this;
      self = this;
      this.state = 'processing';
      return _.defer(function() {
        return Stonewall.validateAttribute.call(_this, {
          resource: _this._model,
          attribute: _this._key,
          attributes: plugin.getAttributes.call(_this),
          value: $(_this.el).val(),
          success: function(errors) {
            this.state = 'valid';
            $(this.el).hideError();
            return this.publish();
          },
          error: function(errors) {
            this.state = 'invalid';
            return $(this.el).showError({
              message: _.first(_.values(errors))
            });
          }
        });
      });
    },
    onChange: function(e, options) {
      if ($(e.currentTarget).attr('data-silent-change') !== 'true') {
        $(this.el).attr('data-previous-value', $(this.el).val());
        return plugin.validateElement.call(this);
      }
    },
    onKeydown: function(e) {
      var code, initial_keydown, previous_value, value;
      code = e.keyCode || e.which;
      value = $(this.el).val();
      previous_value = $(this.el).attr('data-previous-value');
      initial_keydown = $(this.el).attr('data-initial-keydown') || true;
      if (code === 9) {
        if (initial_keydown === true) {
          $(this.el).attr('data-previous-value', value).attr('data-initial-keydown', 'false').attr('data-silent-change', 'true');
          plugin.validateElement.call(this);
          return $(this.el).removeAttr('data-silent-change');
        }
      }
    },
    onSubmit: function(e) {
      if (this.state !== 'valid') {
        $(this.form).find('input:not(:file), select, textarea').trigger('change');
        e.stopImmediatePropagation();
        return false;
      }
    },
    bind: function(el) {
      var key, model, _ref;
      _ref = this.binder.getLastModelAndPath(this.model, this.keypath), model = _ref[0], key = _ref[1];
      this._model = model;
      this._key = key;
      this.id = _.uniqueId('sw_pg_rivets');
      this.state = 'processing';
      Stonewall.validateAttribute.call(this, {
        resource: model,
        attribute: key,
        attributes: plugin.getAttributes.call(this),
        value: model.get(key),
        success: function(errors) {
          return this.state = 'valid';
        },
        error: function(errors) {
          return this.state = 'invalid';
        }
      });
      $(this.el).attr('data-previous-value', this.model.get(this.keypath));
      this.form = $(el).parents("form");
      this.currentListener = $(el).on("change." + this.id, $.proxy(this.binder.onChange, this));
      this.keydownListener = $(el).on("keydown." + this.id, $.proxy(this.binder.onKeydown, this));
      this.submitListener = $(el).parents("form").on("submit." + this.id, $.proxy(this.binder.onSubmit, this));
      return this.dataSubmitListener = $(el).parents("form").find('a[data-submit="true"]').on("click." + this.id, $.proxy(this.binder.onSubmit, this));
    },
    unbind: function() {
      $(el).off("change." + this.id, this.currentListener);
      $(el).off("keydown." + this.id, this.keydownListener);
      $(el).parents('form').off("submit." + this.id, this.submitListener);
      $(el).parents("form").find('a[data-submit="true"]').on("click." + this.id, this.dataSubmitListener);
      this.state = 'valid';
      return $(el).hideError();
    },
    showError: function(options) {
      if (options == null) {
        options = {};
      }
      if (!(options.message != null)) {
        return false;
      }
      return $(this).addClass('error').removeClass('valid').attr('data-error', options.message || '').nextAll('.msg:not(.valid)').each(function() {
        $(this).text(options.message);
        return $(this).fadeIn();
      });
    },
    hideError: function() {
      return $(this).removeClass('error').addClass('valid').removeAttr('data-error').nextAll('.msg:not(.valid)').each(function() {
        $(this).fadeOut(20);
        return $(this).text('');
      });
    },
    activate: function() {
      _.extend(rivets.binders.value, this);
      $.fn.showError = this.showError;
      return $.fn.hideError = this.hideError;
    }
  };

}).call(this);


/*
 Stonewall setup file
 @author Paul Dufour
 @company Brit + Co
*/


(function() {

  if (typeof rivets !== "undefined" && rivets !== null) {
    Stonewall.activate('plugin', 'Rivets');
  }

}).call(this);
