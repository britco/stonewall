module.exports = (grunt) ->
	# Package
	# =======
	pkg = require './package.json'

	modules = [
		'src/index.coffee'
		'src/messages.coffee'
		'src/rules.coffee'
		'src/ruleset.coffee'
		'src/base.coffee'
		'src/plugins/rivets.coffee'
		'src/setup.coffee'
	]

	# Configuration
	# =============
	grunt.initConfig
		pkg: pkg
		coffee:
			compile:
				options:
					join: true
					expand: true
					bare: false
				files:
					'<%= pkg.distDirectory %>/<%= pkg.name %>-latest.js': modules

		uglify:
			coffee:
				options:
					mangle: false
					compress: false
					beautify: true
					wrap: 'globals'
					preserveComments: 'some'
					banner: '''
					/*!
					 * Stonewall
					 * @author Paul Dufour
					 * @company Brit + Co
					 */

					 '''

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
	grunt.registerTask 'after:build', ->

	grunt.registerTask 'build', ->
		# Build for release
		files = grunt.config('coffee.compile.files')

		for filename, filevalues of files
			break

		grunt.config.set 'coffee.compile.options.bare', true

		grunt.config.set 'uglify.coffee.files', {
			'<%= pkg.distDirectory %>/<%= pkg.name %>-<%= pkg.version %>.js': '<%= pkg.distDirectory %>/<%= pkg.name %>-latest.js'
		}

		grunt.task.run 'coffee:compile', 'uglify:coffee', 'after:build'