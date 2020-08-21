YUI.add('moodle-quizaccess_wifiresilience-autosave', function (Y, NAME) {

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Auto-save functionality for during quiz attempts.
 *
 * @module moodle-quizaccess_wifiresilience-autosave
 */

/**
 * Auto-save functionality for during quiz attempts.
 *
 * @class M.quizaccess_wifiresilience.autosave
 */

M.quizaccess_wifiresilience = M.quizaccess_wifiresilience || {};
M.quizaccess_wifiresilience.autosave = {
    /**
     * The amount of time (in milliseconds) to wait between TinyMCE detections.
     *
     * @property TINYMCE_DETECTION_DELAY
     * @type Number
     * @default 500
     * @private
     */
    TINYMCE_DETECTION_DELAY: 1000,

    /**
     * The number of times to try redetecting TinyMCE.
     *
     * @property TINYMCE_DETECTION_REPEATS
     * @type Number
     * @default 20
     * @private
     */
    TINYMCE_DETECTION_REPEATS: 10,

    /**
     * The delay (in milliseconds) between checking hidden input fields.
     *
     * @property WATCH_HIDDEN_DELAY
     * @type Number
     * @default 1000
     * @private
     */
    WATCH_HIDDEN_DELAY: 1000,

    /**
     * Time-out used whe ajax requests. Defaults to 30 seconds.
     *
     * @property SAVE_TIMEOUT
     * @static
     * @type Number
     * @default 30000
     * @private
     */
    SAVE_TIMEOUT: 30000,
    /**
     * Time-out used whe ajax requests for full server submission.
     * Defaults to 120 seconds - we might have Huge Drawing DataURI
     *
     * @property SAVE_TIMEOUT_FULL_SUBMISSION
     * @static
     * @type Number
     * @default 120000
     * @private
     */
    SAVE_TIMEOUT_FULL_SUBMISSION:  120000,

    /**
     * The selectors used throughout this class.
     *
     * @property SELECTORS
     * @private
     * @type Object
     * @static
     */
    SELECTORS: {
        QUIZ_FORM:             '#responseform',
        VALUE_CHANGE_ELEMENTS: 'input, textarea, [contenteditable="true"]',
        CHANGE_ELEMENTS:       'input, select',
        CONNECTION_ELEMENTS:   '#quizaccess_wifiresilience_hidden_cxn_status',
        CHANGE_DRAGS:           'li.matchdrag',
        HIDDEN_INPUTS:         'input[type=hidden]',
        NAV_BUTTON:            '#quiznavbutton',                       // Must have slot appended.
        QUESTION_CONTAINER:    '#q',                      // Was #q for <= 3.6.
        STATE_HOLDER:          ' .state',
        SUMMARY_ROW:           '.quizsummaryofattempt tr.quizsummary', // Must have slot appended.
        STATE_COLUMN:          ' .c1',
        ATTEMPT_ID_INPUT:      'input[name=attempt]',
        FINISH_ATTEMPT_INPUT:  'input[name=finishattempt]',
        SUBMIT_BUTTON:         '#wifi_exam_submission_finish',
        FORM:                  'form',
        SAVING_NOTICE:         '#quiz-saving',
        LAST_SAVED_MESSAGE:    '#quiz-last-saved-message',
        LAST_SAVED_TIME:       '#quiz-last-saved',
        SAVE_FAILED_NOTICE:    '#mod_quiz_navblock .quiz-save-failed',
        LIVE_STATUS_AREA:      '#quiz-server-status'
    },
    // SUBMIT_BUTTON:         'input[type=submit]',
    /**
     * The script which handles the autosaves.
     *
     * @property AUTOSAVE_HANDLER
     * @type String
     * @default M.cfg.wwwroot + '/mod/quiz/accessrule/wifiresilience/sync.php'
     * @private
     */
    AUTOSAVE_HANDLER: M.cfg.wwwroot + '/mod/quiz/accessrule/wifiresilience/sync.php',

    EXAM_TIME_HANDLER: M.cfg.wwwroot + '/mod/quiz/accessrule/wifiresilience/gettime.php',


    /**
     * Prefix for the localStorage key.
     *
     * @property LOCAL_STORAGE_KEY_PREFIX
     * @type String
     * @default 'accessrule_offlinemode-responses-'
     * @private
     */
    LOCAL_STORAGE_KEY_PREFIX: 'ETHz-exams-responses-',

    /**
     * The script which handles the autosaves.
     *
     * @property RELOGIN_HANDLER
     * @type String
     * @default M.cfg.wwwroot + '/mod/quiz/accessrule/wifiresilience/relogin.php'
     * @private
     */
    RELOGIN_SCRIPT: M.cfg.wwwroot + '/mod/quiz/accessrule/wifiresilience/relogin.php',

    /**
     * The delay (in milliseconds) between a change being made, and it being auto-saved.
     *
     * @property delay
     * @type Number
     * @default 60000 , 60 Seconds (Original: 120000 - 120 seconds - 2 mins)
     * @private
     */
    delay: 20000,

    /**
     * The total_offline_time (in seconds) for the device.
     *
     * @property total_offline_time
     * @type Number
     * @default 0
     * @private
     */
    total_offline_time: 0,
    real_offline_time: 0,
    last_disconnection_time: 0,
    last_real_disconnection_time: 0,
    keyname: null,
    courseid: null,
    cmid: null,
    cid: null,
    userid: null,
    attemptid: null,
    display_tech_errors: 0,
    display_nav_details: 0,
    disconnection_events: [],
    /**
     * The final_submission_time (in unix seconds) for the device.
     *
     * @property final_submission_time
     * @type Number
     * @default 0
     * @private
     */
    final_submission_time: 0,
    /**
     * A Node reference to the form we are monitoring.
     *
     * @property form
     * @type Node
     * @default null
     */
    form: null,

    connected: null,
    livewatch: null,
    serviceworker_supported: null,

    // When last offline has happened.
    offline_happened_on: 0,

    // When last REAL offline has happened.
    real_offline_happened_on: 0,
    /**
     * Whether the form has been modified since the last save started.
     *
     * @property dirty
     * @type boolean
     * @default false
     */
    dirty: false,

    /**
     * Timer object for the delay between form modifaction and the save starting.
     *
     * @property delay_timer
     * @type Object
     * @default null
     * @private
     */
    delay_timer: null,
    usageid: null,

    /**
     * Y.io transaction for the save ajax request.
     *
     * @property save_transaction
     * @type object
     * @default null
     * @private
     */
    save_transaction: null,

    /**
     * Time when we last tried to do a save.
     *
     * @property lastSuccessfulSave
     * @type Date
     * @default null
     * @private
     */
    save_start_time: null,

    /**
     * Failed saves count.
     *
     * @property lastSuccessfulSave
     * @type Date
     * @default null
     * @private
     */
    last_successful_save: null,
    last_successful_server_save_timestamp: 0,

    /**
     * Properly bound key change handler.
     *
     * @property editor_change_handler
     * @type EventHandle
     * @default null
     * @private
     */
    editor_change_handler: null,

    /**
     * Record of the value of all the hidden fields, last time they were checked.
     *
     * @property hidden_field_values
     * @type Object
     * @default {}
     */
    hidden_field_values: {},

    /**
     * The key used to store the results of this attempt in local storage.
     *
     * @property local_storage_key
     * @type String
     * @default null
     * @private
     */
    local_storage_key: null,
    sync_string_errors: '',

    /**
     * A copy of the data in local storage.
     *
     * @property locally_stored_data
     * @type Object
     * @private
     */
    locally_stored_data: {
        last_change: 0,
        last_save: 0,
        final_submission_time: 0,
        userid: null,
        real_offline_time: 0,
        total_offline_time: 0,
        cid: null,
        cmid: null,
        attemptid: null,
        responses: ''
    },

    /**
     * Initialise the autosave code.
     *
     * @method init
     * @param {Number} delay the delay, in seconds, between a change being detected, and
     * a save happening.
     */
    init: function(delay, keyname, courseid, cmid, display_tech_errors, display_nav_details, usageid) {
        this.form = Y.one(this.SELECTORS.QUIZ_FORM);
        if (!this.form) {
            Y.log('No response form found. Why did you try to set up autosave?', 'debug', '[ETHz-SW] Sync');
            return;
        }

        quizaccess_wifiresilience_progress_step = 5;
        $("#quizaccess_wifiresilience_result").html(M.util.get_string('loadingstep5', 'quizaccess_wifiresilience'));

        this.connected = true; //intially
        this.livewatch = true; //intially
        this.total_offline_time = 0;
        this.real_offline_time = 0;
        this.display_tech_errors = display_tech_errors;
        this.display_nav_details = display_nav_details;
        this.sync_string_errors = '';


        this.attemptid = Y.one(this.SELECTORS.ATTEMPT_ID_INPUT).get('value');
        this.usageid = usageid;
        // try to get real offline time from SessionStorage for people who
        // are refreshing the attempt.
        if(typeof(Storage) !== "undefined") {
          if (sessionStorage.getItem('real-offline-time-'+this.attemptid)) {
            this.real_offline_time = Number(sessionStorage.getItem('real-offline-time-'+this.attemptid));
          }
        }
        this.last_disconnection_time = 0;
        this.last_real_disconnection_time = 0;
        M.quizaccess_wifiresilience.autosave.offline_happened_on = 0;
        M.quizaccess_wifiresilience.autosave.real_offline_happened_on = 0;

        M.core_question_engine.init_form(Y, this.SELECTORS.QUIZ_FORM);
        Y.on('submit', M.mod_quiz.timer.stop, this.SELECTORS.QUIZ_FORM);
        // I don't know why it is window.onbeforeunload, not Y.on(...). I copied
        // this from formchangechecker and am not brave enough to change it.
        window.onbeforeunload = Y.bind(this.warn_if_unsaved_data, this);

        this.delay = delay * 1000;
        /*
        this.local_storage_key = this.LOCAL_STORAGE_KEY_PREFIX +
        Y.one(this.SELECTORS.ATTEMPT_ID_INPUT).get('value');
        */
        this.local_storage_key = keyname;
        this.courseid = courseid;
        this.cmid = cmid;
        this.userid = Y.one('#quiz-userid').get('value');



        // ACHTUNG!!! This is a Promise (IndexedDB uses only promises).
        // It will return undefined intially, so will fallback into localStorage.
        // We will still save a copy in IndexedDB just in case and for future use.
        storeddata =  M.quizaccess_wifiresilience.localforage.get_status_records();

        this.form.delegate('valuechange', this.value_changed, this.SELECTORS.VALUE_CHANGE_ELEMENTS, this);
        this.form.delegate('change',      this.value_changed, this.SELECTORS.CHANGE_ELEMENTS,       this);

        //var submitAndFinishButton = Y.one(this.SELECTORS.FINISH_ATTEMPT_INPUT).next(this.SELECTORS.SUBMIT_BUTTON);
        var submitAndFinishButton = Y.one(this.SELECTORS.SUBMIT_BUTTON);

      //  var submitAndFinishButton = Y.one("#submit_finish_btnss");
        submitAndFinishButton.detach('click');
        submitAndFinishButton.on('click', this.submit_and_finish_clicked, this);

        //Special Case for qtype ddmatch
        Y.DD.DDM.on("drag:drophit", this.value_changed_drag,    this);
        Y.DD.DDM.on("drag:dropmiss", this.value_changed_drag,      this);

        this.create_status_messages();
        // Start watching other things.
        this.init_tinymce(this.TINYMCE_DETECTION_REPEATS);

        this.save_hidden_field_values();
        this.watch_hidden_fields();

        // optimise responsiveness of textareas
        $("textarea").attr("autocomplete", false);
        $("textarea").attr("autocorrect", false);
        $("textarea").attr("autocapitalize", false);
        $("textarea").attr("spellcheck", false);

        //create a new custom event, to be fired
        //when the connection has changed.
/*
        var onExamGoneOffline = new Y.CustomEvent("ExamGoneOffline", this);
        onExamGoneOffline.subscribe(this.process_offline_situation);
*/


        //fire the custom event, passing
        //the new dimensions in as an argument;
        //our subscribers will be able to use this
        //information:
    //    Y.addListener('offline', "click", onExamGoneOffline);
      //  Y.fire('onExamGoneOffline',{connectionstatus: connected});


    //  });

        /*
        // Create Custom Event ExamTimeStopper
        $(this.SELECTORS.QUIZ_FORM).on('ExamTimeStopper', function (evt) {

              if(M.quizaccess_wifiresilience.autosave.connected){
                //calculate the time we got connected.
              //   M.quizaccess_wifiresilience.autosave.endtime = M.mod_quiz.timer.endtime + M.quizaccess_wifiresilience.autosave.offline_happened_on;
              var total_seconds_missing = 0;
              if(M.quizaccess_wifiresilience.autosave.offline_happened_on != 0){
                total_seconds_missing = Math.floor((new Date().getTime() - M.quizaccess_wifiresilience.autosave.offline_happened_on)/1000); // Getting ms
                M.mod_quiz.timer.endtime += total_seconds_missing;
              }

              //  M.quizaccess_wifiresilience.autosave.total_offline_time += fx;
                 console.error('total missing seconds which got compensated: ['+ total_seconds_missing +'] Seconds');

                // Reset seconds of offline
                  M.quizaccess_wifiresilience.autosave.offline_happened_on = 0;
                  // Update end time
                  M.mod_quiz.timer.update(evt);

              } else {
                  //Log the time it happened.
                  M.mod_quiz.timer.stop(evt);
                  M.quizaccess_wifiresilience.autosave.offline_happened_on = new Date().getTime();
                //  console.error('Offline Counter happened: '+M.quizaccess_wifiresilience.autosave.offline_happened_on);

              }
              return true;
        });
        */

        if ('serviceWorker' in navigator) {
          this.serviceworker_supported = 1;
        } else{
          this.serviceworker_supported = 0;
        }

        // try to get questions status in localstorage
        M.quizaccess_wifiresilience.localforage.try_to_get_question_states();

      //  var quizaccess_wifiresilience_progress = $(".quizaccess_wifiresilience_progress .quizaccess_wifiresilience_bar");
        quizaccess_wifiresilience_progress.animate({
          width: examviewportmaxwidth * 5 / 10 + "px"
        });
        //this.get_live_exam_time();

    },

    try_to_use_locally_saved_responses: function() {

      var prefill = this.locally_stored_data.responses;
      var alreadyusedparams = [];
//console.error(prefill);
      var hashParams = prefill.split('&'); // substr(1) to remove the `#`
      var reloaded_form_str = 'Loading (From localStorage)\n';
      for(var i = 0; i < hashParams.length; i++){
          var p = hashParams[i].split('=');

          var name = decodeURIComponent(p[0]);
          var val = decodeURIComponent(p[1]);

          if(name == 'sesskey'){ // Not interested!.
              continue;
          }

          var $el = $('[name="'+name+'"]');

          // Fallback to the ID when the name is not present (in the case of content editable).
          if($el.length == 0 ) {
            $el = $('[id="'+name+'"]');
          }

          if($el.length > 1 && alreadyusedparams.indexOf(name) > -1){

             var $eltemp = $('[name="'+name+'"]')[1];
             // Fallback to the ID when the name is not present (in the case of content editable).
             if($eltemp.length == 0 ) {
               $eltemp = $('[id="'+name+'"]')[1];
             }
             $el = $($eltemp);
             var type = $el.attr('type')
             console.log("DUPLICATE FIELD: More than one element hold same name/id. Now we are selecting: ", $el);
          } else {
            var type = $el.attr('type');
          }
          alreadyusedparams.push(name);

          // get all targets and all origins

          if(name.indexOf('_sub') !== -1){
          // check if they actually have ultarget
            if($('ul[name^="'+name+'"]').length){
              if($('ul[name^="'+name+'"]').attr( "id" ) && $('ul[name^="'+name+'"]').attr( "id" ).length){
                var elementid = $('ul[name^="'+name+'"]').attr( "id" );
                var fullsepid = elementid.replace('ultarget','');
                var fullsepids = fullsepid.split('_');
                var qid = fullsepids[0];
                var stemid = fullsepids[1];
                var target_value = $('#ulorigin'+qid).find("[data-id='" + val + "']");

                if(target_value && target_value.length){
                  var target_value_html = target_value.html();
                  if(target_value_html && target_value_html != 'undefined'){
                    $('#'+elementid).find(".placeholder").addClass('hidden');
                    $('#'+elementid).append('<li data-id="'+val+'" class="matchdrag yui3-dd-draggable prepicked-by-ethz-quiz yui3-dd-dragging copy" style="cursor: move;">'+target_value_html+'</li>');
                  }
                }
              }

            }
          }
/*
          if(name.indexOf('qtype_sc_changed_value') !== -1){

                  var distractorid = $el.attr('id');
                  splitdistractor = distractorid.split('_');
                  var code = 'require(["qtype_sc/question_behaviour"], function(amd) {amd.wifi_init('+escape(splitdistractor[4])+');});';
                eval(code);
              //Martin. debug
          } */

      //    reloaded_form_str += name + ':' + val + ' (' + type + ')\n';
          // || '#' + e.target.getAttribute('id');
        //  console.error(name + ':' + val + ' (' + type + ') , $('[id="'+name+'"]'));
      //   console.error(type, val, $el);
          switch(type){
              case 'checkbox':

                  var $el = $("input[type='checkbox'][name='"+name+"']");
                  // Fallback to the ID when the name is not present (in the case of content editable).
                  if($el.length == 0 ) {
                    var $el = $("input[type='checkbox'][id='"+name+"']");
                  }
                  if(val == 0){
                      $el.prop('checked', false).change();

                  } else {
                    $el.attr('checked', 'checked').change();

                  }


                // Special case for SC distractor event click.
                var checkboxid = $el.attr( "id" );
                if(checkboxid && checkboxid != 'undefined'){
                  if(checkboxid.indexOf('_distractor') !== -1){
                    // How stupid?
                     $el.trigger('click');
                     $el.trigger('change');
                     $el.trigger('click');
                     $el.val(1);

                    //$('[name="'+name+'"]').val(1);
                  }
/*
                  else {
                    // if checked, most likely it should be 1.
                    if($el.val() == 0){
                      $el.val(1);
                  }

                }
*/
                }

                  break;
              case 'radio':
                  $el.filter('[value="'+val+'"]').attr('checked', 'checked').change();
                //  $el.trigger('click');
                $el.filter('[value="'+val+'"]').trigger('click');
                $el.trigger('change');
              //  $el.trigger('click');
                /*$el.trigger('change');
                $el.trigger('click');*/
                  break;
              default:

                  if($el.is("textarea")){
                      $el.text(val).change();

                      var currentattrid = $el.attr('id');
                      if(currentattrid.indexOf('qtype_drawing_textarea_id_') !== -1){
                        var qidarr = currentattrid.split('_');
                        var qid = qidarr[4];

                        // reload iframe
                        var iframedr = '#qtype_drawing_editor_'+qid;
                        $(iframedr).attr('src', $(iframedr).attr('src'));
                  } else {
                    $el.val(val).change();
                  }
            } else {

              if($el.is("select")){
              //  $el.val(val).attr('selected','selected');
                //$el.val(val).prop('selected', true);
              //  var eli = 'menu'+name;
                $("[name='"+name+"'] option[value='"+val+"']").attr('selected','selected');
//menu

            //    console.error("XTYYYYY", name, val, $("[name='"+name+"'] option[value='"+val+"']"));
              }

              if(type != 'undefined'){
                var $el = $("input[type='"+type+"'][name='"+name+"']");
                // Fallback to the ID when the name is not present (in the case of content editable).
                if($el.length == 0 ) {
                  var $el = $("input[type='"+type+"'][id='"+name+"']");
                }
              }
              $el.val(val).change();
            }

          }


      }
      Y.log('[LOCALSTORAGE]: Exam Reloaded before Saving. '+reloaded_form_str, 'debug', '[ETHz-SW] Sync');
    },

    save_hidden_field_values: function() {
        this.form.all(this.SELECTORS.HIDDEN_INPUTS).each(function(hidden) {
            var name  = hidden.get('name');
            if (!name) {
                return;
            }
            this.hidden_field_values[name] = hidden.get('value');
        }, this);
    },

    watch_hidden_fields: function() {
        this.detect_hidden_field_changes();
        Y.later(this.WATCH_HIDDEN_DELAY, this, this.watch_hidden_fields);
    },

    detect_hidden_field_changes: function() {
        this.form.all(this.SELECTORS.HIDDEN_INPUTS).each(function(hidden) {
            var name  = hidden.get('name'),
                value = hidden.get('value');
            if (!name || name === 'sesskey') {
                return;
            }
            if (!(name in this.hidden_field_values) || value !== this.hidden_field_values[name]) {
                this.hidden_field_values[name] = value;
                this.value_changed({target: hidden});
            }
        }, this);
    },

    /**
     * Initialise watching of TinyMCE specifically.
     *
     * Because TinyMCE might load slowly, and after us, we need to keep
     * trying, until we detect TinyMCE is there, or enough time has passed.
     * This is based on the TINYMCE_DETECTION_DELAY and
     * TINYMCE_DETECTION_REPEATS properties.
     *
     *
     * @method init_tinymce
     * @param {Number} repeatcount The number of attempts made so far.
     */
    init_tinymce: function(repeatcount) {
        if (typeof tinyMCE === 'undefined') {
            if (repeatcount > 0) {
                Y.later(this.TINYMCE_DETECTION_DELAY, this, this.init_tinymce, [repeatcount - 1]);
            } else {
                Y.log('Gave up looking for old dirty TinyMCE.', 'debug', '[ETHz-SW] Sync');
            }
            return;
        }

        Y.log('Found TinyMCE.', 'debug', '[ETHz-SW] Sync');
        this.editor_change_handler = Y.bind(this.editor_changed, this);
        tinyMCE.onAddEditor.add(Y.bind(this.init_tinymce_editor, this));
    },

    /**
     * Initialise watching of a specific TinyMCE editor.
     *
     * @method init_tinymce_editor
     * @param {EventFacade} e
     * @param {Object} editor The TinyMCE editor object
     */
    init_tinymce_editor: function(e, editor) {
        Y.log('Found TinyMCE editor ' + editor.id + '.', 'debug', '[ETHz-SW] Sync');
        editor.onChange.add(this.editor_change_handler);
        editor.onRedo.add(this.editor_change_handler);
        editor.onUndo.add(this.editor_change_handler);
        editor.onKeyDown.add(this.editor_change_handler);
    },
    value_changed_drag: function(e) {
      Y.log('Detected a value change in DRAG question.', 'debug', '[ETHz-SW] Sync');
      this.start_save_timer_if_necessary();
      this.mark_question_changed_if_necessary(name);
    },

    connection_changed: function(e) {
      Y.log('Detected change in Connection Status to '+this.connected, 'debug', '[ETHz-SW] Timer');

      //calculate the time we got connected.
      var total_seconds_missing = 0;
      if(this.offline_happened_on != 0) {
          total_seconds_missing = Math.floor((new Date().getTime() - this.offline_happened_on)/1000); // Getting ms
          this.total_offline_time += total_seconds_missing;
          this.disconnection_events.push(total_seconds_missing);
          this.last_disconnection_time = total_seconds_missing;
          this.offline_happened_on = 0;
          this.last_disconnection_time = 0;
      }

      if(this.connected){
        // Reset seconds of offline
          this.offline_happened_on = 0;
          // Update end time
          // Because its not real, then dont stop the timer.
          // M.mod_quiz.timer.update(e);

          this.last_disconnection_time = 0;
          if(total_seconds_missing != 0){
            Y.log('Total disconnection seconds (will not be compensated because the user is able to continue the exam): ['+ total_seconds_missing +'] Seconds', 'debug', '[ETHz-SW] Timer');
          }

      } else {
          //Log the time it happened. Because its not real, then dont stop the timer.
          //  M.mod_quiz.timer.stop(e);
          this.offline_happened_on = new Date().getTime();

      }

    },

    real_connection_icon_status: function(status) {

      Y.log('Is Exam Server up and running?! '+status, 'debug', '[ETHz-SW] Server Status');

      var el = document.querySelector('#quizaccess_wifiresilience_connection');
      // verify actual internet is offline first!
      var cxn_hidden = document.querySelector('#quizaccess_wifiresilience_hidden_cxn_status');
      if(cxn_hidden.value == 0){ // actual network is down
        status = false;
        Y.log('Device is not connected to internet - Ignore Server Status and mark it as offline: '+status, 'debug', '[ETHz-SW] Server Status');
      }
      if (status) {
        if (el.classList) {
          el.classList.add('connected');
          el.classList.remove('disconnected');
        } else {
          el.addClass('connected');
          el.removeClass('disconnected');
        }
      } else {
        if (el.classList) {
          el.classList.remove('connected');
          el.classList.add('disconnected');
        } else {
          el.removeClass('connected');
          el.addClass('disconnected');
        }
      }
    },
    livewatch_connection_changed: function(e) {
      Y.log('Detected Livewatch: '+this.livewatch, 'debug', '[ETHz-SW] Timer');

      if(this.livewatch){
        //calculate the time we got connected.
        var total_real_seconds_missing = 0;

        if(this.real_offline_happened_on != 0){
            total_real_seconds_missing = Math.floor((new Date().getTime() - this.real_offline_happened_on)/1000); // Getting ms
            this.real_offline_time += total_real_seconds_missing;
            this.last_real_disconnection_time = total_real_seconds_missing;
        }

        // Reset seconds of offline
          this.real_offline_happened_on = 0;
          // Update end time
          M.mod_quiz.timer.update(e);

          this.last_real_disconnection_time = 0;
          this.real_connection_icon_status(true);

          Y.log('Total REAL missing seconds which got compensated:['+ total_real_seconds_missing +'] Seconds', 'debug', '[ETHz-SW] Timer');

      } else {
          //Log the time it happened.
          M.mod_quiz.timer.stop(e);
          this.real_offline_happened_on = new Date().getTime();
          this.real_connection_icon_status(false);

      }

    },
    value_changed: function(e) {
        var name = e.target.getAttribute('name');

        if (name === 'thispage' || name === 'scrollpos' || (name && name.match(/_:flagged$/))) {
            return; // Not interesting.
        }

        // for connection, go to connection_changed
        if(name === 'quizaccess_wifiresilience_cxn_status'){
          this.connection_changed(e);
          return;
        }
        // for livewatch connection, go to connection_changed
        if(name === 'quizaccess_wifiresilience_livewatch_status'){
          this.livewatch_connection_changed(e);
          return;
        }

        // Fallback to the ID when the name is not present (in the case of content editable).
        name = name || '#' + e.target.getAttribute('id');
        Y.log('Detected a value change in element ' + name + '.', 'debug', '[ETHz-SW] Sync');
        this.start_save_timer_if_necessary();
        this.mark_question_changed_if_necessary(name);
    },

    editor_changed: function(editor) {
        Y.log('Detected a value change in editor ' + editor.id + '.', 'debug', '[ETHz-SW] Sync');
        this.start_save_timer_if_necessary();
        this.mark_question_changed_if_necessary(editor.id);
    },

    mark_question_changed_if_necessary: function(elementname) {
        var slot = this.get_slot_from_id(elementname);
        if (slot) {
            this.set_question_state_string(slot, M.util.get_string('answerchanged', 'quizaccess_wifiresilience'));
            this.set_question_state_class(slot, 'answersaved');

            // OK, this should trigger change in indexedDB in case of offline reload.
            M.quizaccess_wifiresilience.localforage.update_question_state_class(slot, 'answersaved');
            M.quizaccess_wifiresilience.localforage.update_question_state_string(slot, M.util.get_string('answerchanged', 'quizaccess_wifiresilience'));
        }
    },

    get_slot_from_id: function(elementname) {
        var matches = elementname.match(/^#?q\d+:(\d+)_.*$/);
        if (matches) {
            return matches[1];
        }
        return undefined;
    },

    set_question_state_string: function(slot, newstate) {
        Y.log('State of question ' + slot + ' changed to ' + newstate + '.',
                'debug', '[ETHz-SW] Sync');
        // If 3.6 or less
        if(Y.one(this.SELECTORS.QUESTION_CONTAINER + slot)){
           Y.one(this.SELECTORS.QUESTION_CONTAINER + slot + this.SELECTORS.STATE_HOLDER).setHTML(Y.Escape.html(newstate));
        } else {
          Y.one('div[id="question-' + this.usageid + '-' + slot + '"]' + this.SELECTORS.STATE_HOLDER).setHTML(Y.Escape.html(newstate));
        }
        var summaryRow = Y.one(this.SELECTORS.SUMMARY_ROW + slot + this.SELECTORS.STATE_COLUMN);
        if (summaryRow) {
            summaryRow.setHTML(Y.Escape.html(newstate));
        }
        Y.one(this.SELECTORS.NAV_BUTTON + slot).set('title', Y.Escape.html(newstate));
    },

    update_question_state_strings: function(statestrings) {
        Y.Object.each(statestrings, function(state, slot) {
            this.set_question_state_string(slot, state);
        }, this);
    },

    set_question_state_class: function(slot, newstate) {
        Y.log('State of question ' + slot + ' changed to ' + newstate + '.',
                'debug', '[ETHz-SW] Sync');
        var navButton = Y.one(this.SELECTORS.NAV_BUTTON + slot);
        navButton.set('className', navButton.get('className').replace(
                /^qnbutton \w+\b/, 'qnbutton ' + Y.Escape.html(newstate)));
    },

    update_question_state_classes: function(stateclasses) {
        Y.Object.each(stateclasses, function(state, slot) {
            this.set_question_state_class(slot, state);
        }, this);
    },

    start_save_timer_if_necessary: function() {
        this.dirty = true;

        this.locally_stored_data.last_change = new Date();
        this.locally_stored_data.responses = Y.IO.stringify(this.form); // Original

        var stringified_data = Y.JSON.stringify(this.locally_stored_data);
        // IndexedDB or WebSQL
        M.quizaccess_wifiresilience.localforage.save_status_records(stringified_data);

        // SLOW!! Localstorage
         //SLOW!! localStorage.setItem(this.local_storage_key, stringified_data);
        // Localforage record saving. Encrypted..
      //SLOW!!  M.quizaccess_wifiresilience.localforage.save_attempt_records(this.locally_stored_data);

        this.exam_localstorage_saving_status_str();

        if (this.delay_timer || this.save_transaction) {
          //  Y.log('Syncing with Server is not necessary. Delaying Sync: '+this.delay +' milliseconds.', 'debug', '[ETHz-SW] Sync');
            // Already counting down or saving.
            return;
        }
        Y.log('Changes worth syncing? Yes.. Flag Syncing to run after: '+this.delay+' milliseconds.', 'debug', '[ETHz-SW] Sync');

        this.start_save_timer();
    },

    start_save_timer: function() {
        this.cancel_delay();
        this.delay_timer = Y.later(this.delay, this, this.save_changes);
    },

    cancel_delay: function() {
        if (this.delay_timer && this.delay_timer !== true) {
            this.delay_timer.cancel();
        }
        this.delay_timer = null;
    },
   get_live_exam_time: function() {
      Y.log('Trying to get Exam End Time in case of changes', 'debug', '[ETHz-SW] Sync');
    },
    exam_time_done: function(transactionid, response) {
      Y.log('Exam End Time checks on server: SUCCESS. Exam End Time: ' + timeresult.duedate, 'debug', '[ETHz-SW] Sync');
    },
    exam_time_failed: function(transactionid, response) {
      Y.log('Exam End Time checks on server: FAILED. ' + response.responseText, 'debug', '[ETHz-SW] Sync');
      // Do not do anything, stay on original attemp end time :-)
    },
    save_changes: function() {
        this.cancel_delay();
        this.dirty = false;

        // Save form elements - make sure to re-read the form!
        this.locally_stored_data.responses = Y.IO.stringify(this.form);
        var stringified_data = Y.JSON.stringify(this.locally_stored_data);
        M.quizaccess_wifiresilience.localforage.save_status_records(stringified_data);
        Y.log('Saving Exam Elements Status in indexedDB.', 'debug', '[ETHz-SW] Sync');
        // Save the encrypted file too?
        M.quizaccess_wifiresilience.localforage.save_attempt_records_encrypted();
        Y.log('Saving Exam Encrypted Emergency File in indexedDB.', 'debug', '[ETHz-SW] Sync');

        if (this.is_time_nearly_over()) {
            Y.log('No more saving, time is nearly over.', 'debug', '[ETHz-SW] Sync');
            this.stop_autosaving();
            return;
        }

        Y.log('Start Syncing with Exam Server.', 'debug', '[ETHz-SW] Sync');
        if (typeof tinyMCE !== 'undefined') {
            tinyMCE.triggerSave();
        }
        this.save_transaction = Y.io(this.AUTOSAVE_HANDLER, {
            method:  'POST',
            form:    {id: this.form},
            on:      {
                success: this.save_done,
                failure: this.save_failed
            },
            context: this,
            timeout: this.SAVE_TIMEOUT,
            sync: false
        });
      this.save_start_time = new Date(); //AMRO WATTACH moved to save_done
      if(this.display_nav_details == 1){
        Y.one(this.SELECTORS.SAVING_NOTICE).setStyle('display', 'block');
      }
    },

    save_done: function(transactionid, response) {
        var result;
        try {
            result = Y.JSON.parse(response.responseText);
        } catch (e) {
            this.save_failed(transactionid, response);
            return;
        }
        if (result.result === 'lostsession') {
            Y.log('Session loss detected. Re-Login required', 'debug', '[ETHz-SW] Sync');
            this.save_transaction = null;
            this.dirty = true;
            this.try_to_restore_session();
            return;
        }

        if (result.result !== 'OK') {
            if(result.error){
              var sync_errors =  result.error + ' (Code: '+ result.errorcode+') Info: ' + result.debuginfo;
              this.sync_string_errors = result.error;
              Y.log('Error: ' + sync_errors, 'debug', '[ETHz-SW] Sync');
            }
            this.save_failed(transactionid, response);
            return;
        }
        this.sync_string_errors = '';

      //  this.save_start_time = new Date(); //AMRO

        this.last_successful_server_save_timestamp = new Date();

        this.save_transaction = null;

        // is there a change happened to quiz end time? if so, then compensate it
        var original_end_time = Y.one('#original_end_time').get('value');
        if(!isNaN(result.timerstartvalue) && M.mod_quiz.timer.endtime && original_end_time != result.timelimit) {
        //  M.mod_quiz.timer.endtime = result.timerstartvalue;
          var addexloadingtime = 0;
          if(exam_extra_page_load_time && exam_extra_page_load_time != 'undefined'){
            addexloadingtime = exam_extra_page_load_time;
          }
            Y.log('Page load comepnsation autosave (exam end): ' + addexloadingtime, 'debug', '[ETHz-SW] Sync');
          //  alert("old ssend time: "+result.timerstartvalue +' --- '+ addexloadingtime);
            var t = new Date().getTime();
        //    var t = d.getTime();
            M.mod_quiz.timer.endtime = exam_extra_page_load_time + t + result.timerstartvalue * 1000;
          //M.pageloadstarttime.getTime()


          // Save it in localstorage in case of page reload while offline!
          /*
          if(typeof(Storage) !== "undefined") {
            sessionStorage.setItem('ethz-new-secondsleft-'+this.attemptid, result.timerstartvalue);
          }
          */
          Y.log('Exam End Time checks on server: SUCCESS. Exam End Time: ' + result.timerstartvalue, 'debug', '[ETHz-SW] Sync');
        }else{
          Y.log('Exam End Time checks on server: Original Exam End Time: ' + original_end_time + ' & Last Server Check End Time: ' + result.timelimit +'. No Need to Compensate or Update Quiz Timer.' , 'debug', '[ETHz-SW] Sync');
        }
        this.real_connection_icon_status(true);


        this.update_status_for_successful_save();


        this.update_question_state_classes(result.questionstates);
        this.update_question_state_strings(result.questionstatestrs);

        Y.log('[SUCCESSFUL] Full Sync to server completed.', 'debug', '[ETHz-SW] Sync');

        this.real_connection_icon_status(true);

        // save questions status in localstorage
        M.quizaccess_wifiresilience.localforage.save_question_state_classes(result.questionstates);
        M.quizaccess_wifiresilience.localforage.save_question_state_strings(result.questionstatestrs);
        //Y.log('Questions Status Classes & Strings Saved in localstorage.', 'debug', '[ETHz-SW] Sync');

        if (this.dirty) {
            Y.log('Dirty after syncing. Need to re-sync again.', 'debug', '[ETHz-SW] Sync');
            this.start_save_timer();
        }

    },

    save_failed: function() {
        this.real_connection_icon_status(false);
        Y.log('Syncing with Exam Server: failed. Plan B: Local Storage.', 'debug', '[ETHz-SW] Sync');
        this.save_transaction = null;
        this.update_status_for_failed_save();

        this.save_start_time = null;

        // We want to retry soon.
        this.dirty = true;
        this.start_save_timer();
    },

    is_time_nearly_over: function() {
        calculated_delay = new Date().getTime() + 2 * this.delay;
        time_nearly_over =  M.mod_quiz.timer && M.mod_quiz.timer.endtime &&
                calculated_delay > M.mod_quiz.timer.endtime;
    },

    stop_autosaving: function() {
        this.cancel_delay();
        this.delay_timer = true;
        if (this.save_transaction) {
            this.save_transaction.abort();
        }
    },

    /**
     * A beforeunload handler, to warn if the user tries to quit with unsaved data.
     *
     * @param {EventFacade} e The triggering event
     */
    warn_if_unsaved_data: function(e) {

        // For timer on reload when offline.
        var sessionstorage_attempt_key = 'ethz-secondsleft-'+this.attemptid;
        if (!navigator.onLine) {
            var secondsleft = Math.floor((M.mod_quiz.timer.endtime - new Date().getTime())/1000);
            sessionStorage.setItem(sessionstorage_attempt_key, secondsleft);
        } else {
            sessionStorage.removeItem(sessionstorage_attempt_key);
        }

        if (!this.dirty && !this.save_transaction) {
            return;
        }

        // How about we try to save again (to server) just in case and with no delay
        //this.start_save_timer();
        this.save_changes();

        // OK, what if Service Worker is disabled or not active? Say SEB < 2.2
        // Then download a copy of last answers..
        if(this.serviceworker_supported == 0){
          // now do that sourceforge style automatic download..
          var data = {responses: Y.IO.stringify(M.quizaccess_wifiresilience.download.form)};
          if (M.quizaccess_wifiresilience.download.publicKey) {
              data = M.quizaccess_wifiresilience.download.encryptResponses(data);
          }
          var blob = new Blob([Y.JSON.stringify(data)], {type: "octet/stream"});
          var url = window.URL.createObjectURL(blob);
          $("#mod_quiz_navblock").append('<iframe id="wifi_unload_download_iframe" width="1" height="1" frameborder="0" src="'+url+'"></iframe>');
        }
        // try to set real offline time from SessionStorage for people who
        // are refreshing the attempt.
        if(typeof(Storage) !== "undefined") {
      //    sessionStorage.removeItem('ethz-offline-'+this.attemptid);
          sessionStorage.setItem('ethz-offline-'+this.attemptid, this.real_offline_time);

          // now insert in session storage for refresh in service worker :)

      //    sessionStorage.setItem('real-offline-time-'+this.attemptid, this.real_offline_time);
      //    sessionStorage.removeItem('ethz-offline-lastpage-'+this.attemptid);
          sessionStorage.setItem('ethz-offline-lastpage-'+this.attemptid, M.quizaccess_wifiresilience.navigation.currentpage);

        }
        // Now Show a warning.
        e.returnValue = M.util.get_string('changesmadereallygoaway', 'quizaccess_wifiresilience');
        return e.returnValue;
    },

    /**
     * Handle a click on the submit and finish button. That is, show a confirm dialogue.
     *
     * @param {EventFacade} e The triggering event, if there is one.
     */
    submit_and_finish_clicked: function(e) {
        e.halt(true);

        var confirmationDialogue = new M.core.confirm({
            id: 'submit-confirmation',
            width: '300px',
            center: true,
            modal: true,
            visible: false,
            draggable: false,
            title: M.util.get_string('confirmation', 'admin'),
            noLabel: M.util.get_string('cancel', 'moodle'),
            yesLabel: M.util.get_string('submitallandfinish', 'quiz'),
            question: M.util.get_string('confirmclose', 'quiz')
        });

        // The dialogue was submitted with a positive value indication.
        confirmationDialogue.on('complete-yes', this.submit_and_finish, this);
        confirmationDialogue.render().show();
    },

    /**
     * Handle the submit and finish button in the confirm dialogue being pressed.
     *
     * @param {EventFacade} e The triggering event, if there is one.
     */
    submit_and_finish: function(e) {//console.error(e);
        //  e.halt(); not recognised if called via Jquery in module.js
        e.preventDefault();
        e.stopPropagation();

        // Preserve time for submission
        // To Do.. substract total offline time (qtype fileresponse, complie code etc)
        if (this.final_submission_time == 0){
          this.final_submission_time = Math.round(new Date().getTime()/1000) - this.real_offline_time;
        }

        this.stop_autosaving();

      //  var submitButton = Y.one('input[name=finishattempt]').previous('input[type=submit]');
        var submitButton = Y.one(this.SELECTORS.SUBMIT_BUTTON);
        this.get_submit_progress(submitButton.ancestor('.controls')).show();
        submitButton.ancestor('.singlebutton').hide();
        var failureMessage = this.get_submit_failed_message(submitButton.ancestor('.controls'));
        submitButton.ancestor('.controls').removeClass('quiz-save-failed');
        failureMessage.header.hide();
        failureMessage.message.hide();
        this.form.append('<input name="finishattempt" value="1">');
        this.form.append('<input type="hidden" name="final_submission_time" value="'+this.final_submission_time+'">');

        Y.log('Trying to do final submission to the server.. Brace! Brace! Brace! :-)', 'debug', '[ETHz-SW] Sync');
        if (typeof tinyMCE !== 'undefined') {
            tinyMCE.triggerSave();
        }
        this.save_transaction = Y.io(this.AUTOSAVE_HANDLER, {
            method:  'POST',
            form:    {id: this.form},
            on:      {
                success: this.submit_done,
                failure: this.submit_failed
            },
            context: this,
            timeout: this.SAVE_TIMEOUT_FULL_SUBMISSION,
            sync: false
        });
        this.save_start_time = new Date();
    },

    submit_done: function(transactionid, response) {
        var result;
        try {
            result = Y.JSON.parse(response.responseText);
        } catch (e) {
            Y.log('Final Submission Failure Reason (Transaction: '+transactionid+'): ' + response.responseText, 'debug', '[ETHz-SW] Sync');
            this.submit_failed(transactionid, response);
            return;
        }

        if (result.result !== 'OK') {
            this.submit_failed(transactionid, response);
            return;
        }
        this.real_connection_icon_status(true);
        Y.log('Final Submit Successful, Retard! Retard! Retard! [Redirecting out of Exam..]', 'debug', '[ETHz-SW] Sync');
        this.save_transaction = null;
        this.dirty = false;
        // Try to delete the local data records via promises :)

        Y.log('Deleting local records after successful exam..', 'debug', '[ETHz-SW] Sync');
        M.quizaccess_wifiresilience.localforage.delete_records_after_successful_submission();

        // go to Exam Review URL.
        window.location.replace(result.reviewurl);
    },

    submit_failed: function(transactionid = null, response = null) {
        this.real_connection_icon_status(false);
        Y.log('Final Submit failed. Emergency! Emergency! Emergency! [Offering to Download Responses..]', 'debug', '[ETHz-SW] Sync');
        this.save_transaction = null;

        // Re-display the submit button.
        this.form.one(this.SELECTORS.FINISH_ATTEMPT_INPUT).remove();
        var submitButton = Y.one(this.SELECTORS.SUBMIT_BUTTON);
        //var submitButton = Y.one(this.SELECTORS.FINISH_ATTEMPT_INPUT).previous('input[type=submit]');
        var submitProgress = this.get_submit_progress(submitButton.ancestor('.controls'));
        submitButton.ancestor('.singlebutton').show();
        submitProgress.hide();


        // And show the failure message.
          var failureMessage = this.get_submit_failed_message(submitButton.ancestor('.controls'));
          submitButton.ancestor('.controls').addClass('quiz-save-failed');
          failureMessage.header.show();
          failureMessage.message.show();

        this.update_status_for_failed_save();

        //change the label of submit again to "try again"

      //  var submitAndFinishButton = Y.one(this.SELECTORS.FINISH_ATTEMPT_INPUT).previous(this.SELECTORS.SUBMIT_BUTTON);
        var submitAndFinishButton = Y.one(this.SELECTORS.SUBMIT_BUTTON);
        submitAndFinishButton.set('value',M.util.get_string('submitallandfinishtryagain', 'quizaccess_wifiresilience'));

        function response_is_json_string(str) {
          try {
            JSON.parse(str);
          } catch (e) {
            return false;
          }
          return true;
        }

        if(response){
          //  error_results = Y.JSON.parse(response.responseText);
            if(response_is_json_string(response.responseText)){ // Moodle validation issues
              error_results = Y.JSON.parse(response.responseText);
              nice_merror_message =  error_results.error + ' (' + error_results.errorcode + ')';
              Y.log(nice_merror_message, 'debug', '[ETHz-SW] Sync');
            } else { // Server issues
              nice_merror_message = "Server Connection Error.";
              Y.log(response, 'debug', '[ETHz-SW] Sync');
            }
        }
        if($("#wifi_debug_exam_error_details")){
          $("#wifi_debug_exam_error_details").html('');
        }
        var d = new Date();
        var whenhappened = d.toUTCString();

        if(this.display_tech_errors == 1){
          $(".submit-failed-message").append("<div id=\"wifi_debug_exam_error_details\"><hr><font color='red'>" + whenhappened + ": " + nice_merror_message + "</font></div>");
        }
        // now do that sourceforge style automatic download..
        var data = {responses: Y.IO.stringify(M.quizaccess_wifiresilience.download.form)};
        if (M.quizaccess_wifiresilience.download.publicKey) {
            data = M.quizaccess_wifiresilience.download.encryptResponses(data);
        }
        var blob = new Blob([Y.JSON.stringify(data)], {type: "octet/stream"});
        var url = window.URL.createObjectURL(blob);
        $(".submit-failed-message").append('<iframe id="wifi_automatic_download_iframe" width="1" height="1" frameborder="0" src="'+url+'"></iframe>');

        /*
        // show that in the overlay
        $("#quizaccess_wifiresilience_text").hide(); // Hide Loading.
        $(".quizaccess_wifiresilience_progress").hide(); // Hide Progress Bar.
        $("#quizaccess_wifiresilience_result").show(); // Hide result div.
        $("#quizaccess_wifiresilience_overlay").show(); // Show overlay div.
        $(".controls.quiz-save-failed").parent().clone(true,true).appendTo("#quizaccess_wifiresilience_result");
        */
    },

    get_submit_progress: function(controlsDiv) {
        var submitProgress = controlsDiv.one('.submit-progress');
        if (submitProgress) {
            // Already created. Return it.
            return submitProgress;
        }

        // Needs to be created.
        submitProgress = controlsDiv.appendChild('<div class="submit-progress">');
        M.util.add_spinner(Y, submitProgress).show();
        submitProgress.append(M.util.get_string('submitting', 'quizaccess_wifiresilience'));
        return submitProgress;
    },

    get_submit_failed_message: function(controlsDiv) {
        var failedHeader = controlsDiv.one('.submit-failed-header');
        if (failedHeader) {
            // Already created. Return it.
            return {header: failedHeader, message: controlsDiv.one('.submit-failed-message')};
        }

        // Needs to be created.
        controlsDiv.insert('<div class="submit-failed-header">', 0);
        failedHeader = controlsDiv.one('.submit-failed-header');
        failedHeader.append('<h4>' + M.util.get_string('submitfailed', 'quizaccess_wifiresilience') + '</h4>');
        failedHeader.append('<p>' + M.util.get_string('submitfailedmessage', 'quizaccess_wifiresilience') + '</p>');

        var downloadLink = '<a href="#" class="response-download-link btn button" style="margin-top:40px;">' +
                M.util.get_string('savetheresponses', 'quizaccess_wifiresilience') + '</a>';
        var failedMessage = controlsDiv.appendChild('<div class="submit-failed-message">');
        failedMessage.append('<p>' + M.util.get_string('submitfaileddownloadmessage', 'quizaccess_wifiresilience', downloadLink) + '</p>');

        return {header: failedHeader, message: failedMessage};
    },

    create_status_messages: function() {
        var downloadLink = '<p>' + '<a href="#" class="response-download-link btn btn-warning btn-xs">' +
                M.util.get_string('savetheresponses', 'quizaccess_wifiresilience') + '</a>' + '</p>';
        var last_saved_msg_str = '';
        var saving_dots_str = '';
        if(this.display_nav_details == 1){
          last_saved_msg_str = M.util.get_string('lastsaved', 'quizaccess_wifiresilience','<span id="quiz-last-saved"></span>');
          saving_dots_str = M.util.get_string('savingdots', 'quizaccess_wifiresilience');
        }
        Y.one('#mod_quiz_navblock .content').append('<div id="quiz-save-status">' +
                '<div id="quiz-last-saved-message">' + last_saved_msg_str + '</div>' +
                '<div id="quiz-saving">' + saving_dots_str + '</div>' +
'               <div class="quiz-save-failed" style="display:none!important"></div>' +
                '</div>');
                //'<div class="quiz-save-failed alert-info center">' + M.util.get_string('savefailed', 'quizaccess_wifiresilience') + downloadLink + '</div>' +

        this.save_start_time = new Date();
        this.update_status_for_successful_save();
        this.save_start_time = null;
    },

    exam_saving_time_pad: function(number) {
        return number < 10 ? '0' + number : number;
    },
    exam_localstorage_saving_status_str: function() {

      var latest_localstorage_timing = new Date(this.locally_stored_data.last_change);
      if(this.display_nav_details == 1){

        Y.one(this.SELECTORS.LAST_SAVED_TIME).setHTML(this.exam_saving_time_pad(this.last_successful_save.getHours()) +
                ':' + this.exam_saving_time_pad(this.last_successful_save.getMinutes()) + ':' + this.exam_saving_time_pad(this.last_successful_save.getSeconds()) +
                '<br>Local Storage: ' + this.exam_saving_time_pad(latest_localstorage_timing.getHours()) +
                ':' + this.exam_saving_time_pad(latest_localstorage_timing.getMinutes()) + ':' + this.exam_saving_time_pad(latest_localstorage_timing.getSeconds()));
      }
    },

    update_status_for_successful_save: function() {
        function pad(number) {
            return number < 10 ? '0' + number : number;
        }
        wifi_current_time = Date();
        this.last_successful_save = new Date(wifi_current_time);
        this.last_successful_server_save_timestamp = new Date(wifi_current_time);
        //Y.log(this.last_successful_save +' |||| '+this.locally_stored_data.last_change);

        //var latest_localstorage_timing = new Date(this.locally_stored_data.last_change);
        /*
        Y.one(this.SELECTORS.LAST_SAVED_TIME).setHTML(this.exam_saving_time_pad(this.last_successful_save.getHours()) +
                ':' + this.exam_saving_time_pad(this.last_successful_save.getMinutes()) + ':' + this.exam_saving_time_pad(this.last_successful_save.getSeconds()) +
                '<br>Local Storage: ' + this.exam_saving_time_pad(latest_localstorage_timing.getHours()) +
                ':' + this.exam_saving_time_pad(latest_localstorage_timing.getMinutes()) + ':' + this.exam_saving_time_pad(latest_localstorage_timing.getSeconds()));
        */
        this.exam_localstorage_saving_status_str();

        Y.one(this.SELECTORS.SAVING_NOTICE).setStyle('display', 'none');
        Y.one(this.SELECTORS.SAVING_NOTICE).setHTML(M.util.get_string('savingdots', 'quizaccess_wifiresilience'));
        Y.one(this.SELECTORS.SAVE_FAILED_NOTICE).hide();

      //  Y.one(this.SELECTORS.LIVE_STATUS_AREA).setStyle('background-color', '#00CC00'); // Online color

        this.locally_stored_data.last_save = this.last_successful_server_save_timestamp;//this.save_start_time;

        var stringified_data = Y.JSON.stringify(this.locally_stored_data);
        // IndexedDB or WebSQL
        M.quizaccess_wifiresilience.localforage.save_status_records(stringified_data);

        //SLOW!! localStorage.setItem(this.local_storage_key, stringified_data);
        this.save_start_time = null;

    },

    update_status_for_failed_save: function() {
      if(this.display_nav_details == 1){
        Y.one(this.SELECTORS.LAST_SAVED_MESSAGE).setHTML(
                M.util.get_string('lastsavedtotheserver', 'quizaccess_wifiresilience',
                Y.one(this.SELECTORS.LAST_SAVED_TIME).get('outerHTML')));
        Y.one(this.SELECTORS.SAVING_NOTICE).setStyle('display', 'none');

        Y.one(this.SELECTORS.SAVING_NOTICE).setHTML(M.util.get_string('savingtryagaindots', 'quizaccess_wifiresilience')+'<div></div>');
        Y.one(this.SELECTORS.SAVE_FAILED_NOTICE).show();
      }
      //  Y.one(this.SELECTORS.LIVE_STATUS_AREA).setStyle('background-color', '#FF0000');
    },

    try_to_restore_session: function() {
        this.loginDialogue = new M.core.notification.info({
            id:        'quiz-relogin-dialogue',
            width:     '70%',
            center:    true,
            modal:     true,
            visible:   false,
            draggable: false
        });

        this.loginDialogue.setStdModContent(Y.WidgetStdMod.HEADER,
                '<h1 id="moodle-quiz-relogin-dialogue-header-text">' + M.util.get_string('logindialogueheader', 'quizaccess_wifiresilience') + '</h1>', Y.WidgetStdMod.REPLACE);
        this.loginDialogue.setStdModContent(Y.WidgetStdMod.BODY,
                '<iframe src="' + this.RELOGIN_SCRIPT + '?userid=' +
                Y.one('#quiz-userid').get('value') + '">', Y.WidgetStdMod.REPLACE);

        // The dialogue was submitted with a positive value indication.
        this.loginDialogue.render().show();
    },

    restore_session_complete: function(sesskey) {
        Y.all('input[name=sesskey]').set('value', sesskey);
        if (this.loginDialogue) {
            this.loginDialogue.hide().destroy();
            this.loginDialogue = null;
        }
        this.save_changes();
    }
};


}, '@VERSION@', {
    "requires": [
        "base",
        "node",
        "event",
        "event-valuechange",
        "node-event-delegate",
        "io-form",
        "json",
        "core_question_engine",
        "mod_quiz",
        'dd-delegate', 'dd-drop-plugin', 'dd-proxy', 'dd-constrain', 'selector-css3'
    ]
});
