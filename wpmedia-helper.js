/* global _, wp */
( function() {
	var helper = window.WPMediaHelper = window.WPMediaHelper || {};

	// =========================
	// ! Utilities
	// =========================

	_.extend( helper, {
		/**
		 * Setup a new media manager workflow, attaches events, and sets the trigger event.
		 *
		 * @since 1.0.0
		 *
		 * @param object attibutes The attributes for the frame workflow.
		 * @param object options   The options passed to the hook function.
		 * @param bool   notrigger Don't setup the trigger event, just return the frame.
		 *
		 * @return MediaFrame The new media manager workflow.
		 */
		setupFrame: function( attributes, options, notrigger ) {
			var frame = wp.media( attributes );

			// Setup any events that are present in Options
			if ( typeof options.events === 'object' ) {
				_.each( options.events, function( callback, event ) {
					// Bind the callback to the event, and pass the helper
					// as the context, so that the utilities can be accessed
					frame.on( e, event, helper );
				} );
			}

			return frame;
		},

		/**
		 * Load the media manager with the provided attachment IDs.
		 *
		 * @since 1.0.0
		 *
		 * @param string|array|int ids   A comma-separate list, array of, or single id.
		 * @param MediaFrame	   frame The frame workflow.
		 */
		loadAttachments: function( ids, frame ) {
			if ( typeof ids === 'string' ) {
				ids = ids.split( /[,\s]+/ );
			} else if ( typeof ids !== 'object' ) {
				ids = [ ids ];
			}

			var selection = frame.state().get( 'selection' ).reset( [] ),
				attachment;

			_.each( ids, function( id ) {
				attachment = wp.media.attachment( id ).fetch();

				if ( attachment ) {
					selection.add( attachment );
				}
			} );
		},

		/**
		 * Retrive the selected attachments from the frame.
		 *
		 * @since 1.0.0
		 *
		 * @param MediaFrame frame The frame workflow.
		 *
		 * @return Attachments The attachments collection.
		 */
		getAttachments: function( frame ) {
			if ( frame.options.state === 'gallery-edit' ) {
				return frame.states.get( 'gallery-edit' ).get( 'library' );
			}

			return frame.state().get( 'selection' );
		},

		/**
		 * Retrive the selected (first) attachment from the frame.
		 *
		 * @since 1.0.0
		 *
		 * @param MediaFrame frame The frame workflow.
		 *
		 * @return Attachment The attachment model.
		 */
		getAttachment: function( frame ) {
			return helper.getAttachments( frame ).first();
		},
	} );

	// =========================
	// ! Workflow Setups
	// =========================

	_.extend( helper, {
		/**
		 * Hook into the media manager frame for selecting and inserting an image.
		 *
		 * @since 1.0.0
		 *
		 * @param object options    A list of options.
		 * @param bool   notrigger  Skip the trigger click event setup.
		 *
		 * @return MediaFrame The new frame workflow.
		 */
		insert: function( options, notrigger ) {
			var defaults = {
				title:    'Insert Media',
				choose:   'Insert Selected Media',
				multiple: false,
				trigger:  '.qs-button'
			};

			options = _.extend( {}, defaults, options );

			return this.init( {
				title:    options.title,
				choose:   options.choose,
				multiple: options.multiple,
				library:  {
					type:  options.media
				},
				button:   {
					text:  options.choose,
					close: true
				}
			}, options, notrigger );
		},

		/**
		 * Hook into the media manager for editing galleries.
		 *
		 * @since 1.0.0
		 *
		 * @param object options A list of options.
		 * @param bool   notrigger  Skip the trigger click event setup, return frame.
		 *
		 * @return MediaFrame The new frame workflow.
		 */
		gallery: function( options, notrigger ) {
			var defaults = {
				title:   'Edit Gallery',
				trigger: '.qs-button'
			};

			options = _.extend( {}, defaults, options );

			var gallery, attachments, selection;

			if ( options.gallery ) {
				// If gallery was not a comma separated string, make it one
				if ( typeof options.gallery !== 'string' ) {
					options.gallery = options.gallery.join( ',' );
				}

				// Generate and parse shortcode
				gallery = wp.shortcode.next( 'gallery', '[gallery ids="' + options.gallery + '"]' );
				gallery = gallery.shortcode;

				// Get the attachments from the gallery shortcode
				attachments = wp.media.gallery.attachments( gallery );
				selection = new wp.media.model.Selection( attachments.models, {
					props:    attachments.props.toJSON(),
					multiple: true
				} );

				selection.gallery = attachments.gallery;

				// Fetch the query's attachments, and then break ties from the query to allow for sorting.
				selection.more().done( function() {
					selection.props.set( { query: false } );
					selection.unmirror();
					selection.props.unset( 'orderby' );
				} );
			}

			return this.init( {
				state:     'gallery-edit',
				frame:     'post',
				title:     options.title,
				multiple:  true,
				editing:   true,
				selection: selection
			}, options, notrigger );
		}
	} );
} )();
