module.exports = (grunt) ->
	# Package
	# =======
	pkg = require './package.json'

	# Configuration
	# =============
	grunt.initConfig
		pkg: pkg
		coffee:
			compile:
				options:
					join: true
					expand: true
				files:
					'<%= pkg.distDirectory %>/<%= pkg.name %>-<%= pkg.version %>.js': [
						'src/index.coffee'
						'src/messages.coffee'
						'src/rules.coffee'
						'src/ruleset.coffee'
						'src/base.coffee'
						'src/plugins/rivets.coffee'
						'src/setup.coffee'
					]
		watch:
			coffee:
				files: ['src/*.coffee', 'src/**/*.coffee']
				tasks: ['coffee:compile']


	# Dependencies
	# ============
	for name of pkg.devDependencies when name.substring(0, 6) is 'grunt-'
		grunt.loadNpmTasks name

	# Tasks
	# =====
	grunt.registerTask 'build', ['coffee:compile']
