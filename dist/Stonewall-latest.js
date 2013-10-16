
/*
 Stonewall
 @author Paul Dufour
 @company Brit + Co
*/


(function() {
  var Stonewall;

  window.Stonewall = Stonewall = {};

  Stonewall.Util = {};

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
 Stonewall general use functions
 @author Paul Dufour
 @company Brit + Co
*/


(function() {
  var util;

  Stonewall.Util = util = {
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
      return Stonewall.Util.getLastModelAndPath(first_step, spl.slice(1).join('.'));
    }
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
      var field, fn, fnc, tailing, value;
      field = arguments[0], value = arguments[1], fn = arguments[2], tailing = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
      if (typeof fn === 'function') {
        fnc = fn;
      } else if (this.resource[fn] != null) {
        fnc = this.resource[fn];
      }
      if (!(fnc != null)) {
        throw new Error("No function provided for fn rule");
      }
      return fnc.call.apply(fnc, [this, value, field].concat(__slice.call(tailing)));
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
            if ((rule != null ? rule.success_msg : void 0) != null) {
              newObj.success_msg = rule.success_msg;
            }
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
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  Stonewall.Core = _.extend(Stonewall, {
    /*
    	 Flatten a group of attributes
    	 into a list like
    
    	 	first.second.last: value
    	 	billing_address.name: 2
    
    	 object: The object to flatten
    	 bucket: Where the result of the flattening goes
    	 leading: Leading path. This is used internally.
    */

    flatten: function(obj, bucket, leading) {
      var k, v;
      if (leading == null) {
        leading = '';
      }
      if (((typeof Backbone !== "undefined" && Backbone !== null ? Backbone.Model : void 0) != null) && obj instanceof Backbone.Model) {
        obj = obj['attributes'];
      }
      bucket = bucket || {};
      if (leading !== '') {
        leading = leading + '.';
      }
      for (k in obj) {
        v = obj[k];
        if ((v != null) && typeof v === "object" && !(v instanceof Date || v instanceof RegExp)) {
          Stonewall.flatten(v, bucket, leading + k);
        } else {
          if (!leading || (!((leading + k) in bucket)) || bucket[leading + k] === undefined) {
            bucket[leading + k] = v;
          }
        }
      }
      return bucket;
    },
    /*
    	 Validate a group of attributes against a Stonewall 'ruleset'
    	 @options:
    		resource: The resource being validate. Useful for auto-populating rules.
    		attributes: The attributes you want to validate
    		ignore: List of attrs. in options.attributes that shouldn't be validated.
    		rules: The rules to validate the attrs. against
    		intersect: If intersect is on, only validate the attributes provided
    		success: Callback for when validation completes with no errors
    		error: Callback for when validate completes with errors
    */

    validate: function(options) {
      var attrs, binder, binding, ctx, error, errors, field, fieldResolved, ignoreField, intersection, rules, ruleset, rulesetComplete, success, success_messages, _field, _i, _j, _len, _len1, _ref, _rule, _rules;
      attrs = Stonewall.flatten(options.attributes);
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
      success_messages = {};
      for (_field in ruleset) {
        _rules = ruleset[_field];
        for (_j = 0, _len1 = _rules.length; _j < _len1; _j++) {
          _rule = _rules[_j];
          if (_rule.success_msg != null) {
            success_messages[_field] = _rule.success_msg;
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
          return success(success_messages);
        }
      };
      fieldResolved = _.after(_.keys(ruleset).length, rulesetComplete);
      errors = {};
      _.each(ruleset, function(rules, field) {
        var ruleResolved, ruledata, rulenames, value;
        value = attrs[field];
        ruleResolved = _.after(_.keys(rules).length, fieldResolved);
        if (_.isEmpty(value)) {
          rulenames = _.pluck(rules, 'name');
          if (__indexOf.call(rulenames, 'required') >= 0) {
            ruledata = _.last(_.where(rules, {
              name: 'required'
            }));
            if (ruledata.data === false) {
              fieldResolved();
              return true;
            }
          }
        }
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
    	 @options:
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
        }),
        success: _.wrap(options.success, function() {
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
    },
    /*
    	 General-use configure method
    	 @type Type of configuration option
    	 @obj Part of Stonewall you wish to configure
    	 @options New options you are setting
    */

    configure: function(type, obj, options) {
      var source;
      if (type == null) {
        type = 'plugin';
      }
      if (!obj || !options) {
        return;
      }
      obj = obj.replace(/\s$|^\s/, '');
      if (type === 'plugin') {
        source = Stonewall.Plugins.Rivets;
        source.options = _.extend(source.options, options);
      }
      return (source ? source : false);
    }
  });

}).call(this);


/*
 Stonewall rivets integration
 @author Paul Dufour
 @company Brit + Co
*/


(function() {
  var plugin, view,
    __slice = [].slice;

  Stonewall.Plugins.Rivets = plugin = {
    options: {
      showError: function(options) {
        if (options == null) {
          options = {};
        }
        if (!(options.message != null)) {
          return false;
        }
        return $(this).addClass('error').removeClass('valid').attr('data-error', options.message || '').nextAll('.msg').each(function() {
          $(this).removeClass('valid');
          $(this).addClass('error');
          $(this).text(options.message);
          return $(this).fadeIn();
        });
      },
      hideError: function(options) {
        return $(this).removeClass('error').addClass('valid').removeAttr('data-error').nextAll('.msg').each(function() {
          $(this).removeClass('error');
          $(this).addClass('valid');
          return $(this).text(options.message);
        });
      }
    },
    status: {
      'initial-keydown': true
    },
    activate: function() {
      _.extend(rivets.binders.value, this);
      $.fn.showError = function() {
        var _ref;
        return (_ref = plugin.options.showError).call.apply(_ref, [this].concat(__slice.call(arguments)));
      };
      return $.fn.hideError = function() {
        var _ref;
        return (_ref = plugin.options.hideError).call.apply(_ref, [this].concat(__slice.call(arguments)));
      };
    },
    bind: function(el) {
      var key, model, _ref,
        _this = this;
      _ref = Stonewall.Util.getLastModelAndPath(this.model, this.keypath), model = _ref[0], key = _ref[1];
      this._stonewall = true;
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
      this.keydownListener = $(el).on("keydown." + this.id, $.proxy(this.binder.onKeydown, this));
      this.currentListener = $(el).on("change." + this.id, $.proxy(this.binder.onChange, this));
      return _.defer(function() {
        var forms, onSubmit;
        _this.forms = forms = $(el).parents("form");
        onSubmit = $.proxy(_this.binder.onSubmit, _this);
        _this.submitListener = forms.on("submit." + _this.id, onSubmit);
        return _this.dataSubmitListener = forms.find('a[data-submit="true"]').on("click." + _this.id, onSubmit);
      });
    },
    unbind: function() {
      $(this.el).off("change." + this.id, this.currentListener);
      $(this.el).off("keydown." + this.id, this.keydownListener);
      $(this.el).parents('form').off("submit." + this.id, this.submitListener);
      $(this.el).parents("form").find('a[data-submit="true"]').on("click." + this.id, this.dataSubmitListener);
      this.state = 'valid';
      return $(this.el).hideError();
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
          success: function(message) {
            this.state = 'valid';
            $(this.el).hideError({
              message: message
            });
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
      if (plugin.status['silent-change'] !== true) {
        $(this.el).attr('data-previous-value', $(this.el).val());
        return plugin.validateElement.call(this);
      }
    },
    onKeydown: function(e) {
      var code, previous_value, value;
      code = e.keyCode || e.which;
      value = $(this.el).val();
      previous_value = $(this.el).attr('data-previous-value');
      if (code === 9) {
        if (plugin.status['initial-keydown'] === true) {
          $(this.el).attr('data-previous-value', value);
          plugin.status['initial-keydown'] = false;
          plugin.status['silent-change'] = true;
          plugin.validateElement.call(this);
          plugin.status['silent-change'] = false;
        }
      }
    },
    onSubmit: function(e) {
      if (this.state !== 'valid') {
        this.forms.find('input:not(:file), select, textarea').trigger('change');
        e.stopImmediatePropagation();
        return false;
      }
    }
  };

  rivets.bind = _.wrap(rivets.bind, function() {
    var args, fn, thisview;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    thisview = fn.apply(null, args);
    return thisview = _.extend(thisview, view);
  });

  view = {
    isValid: function() {
      var binding, child, _i, _j, _len, _len1, _ref, _ref1;
      if (!(this.bindings != null)) {
        return true;
      }
      _ref = this.bindings;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        if (!view._isValid.call(this, binding)) {
          return false;
        }
        if ((binding.iterated != null) && binding.iterated.length) {
          _ref1 = binding.iterated;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            child = _ref1[_j];
            if (!view.isValid.call(child)) {
              return false;
            }
          }
        }
      }
      return true;
    },
    _isValid: function(binding) {
      if (!(binding._stonewall != null)) {
        return true;
      }
      if (binding.state === 'invalid') {
        return false;
      } else {
        return true;
      }
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
