YUI.add("moodle-quizaccess_wifiresilience-initialiserule",(function(Y,NAME){M.quizaccess_wifiresilience=M.quizaccess_wifiresilience||{},M.quizaccess_wifiresilience.initialiserule={SELECTORS:{RESETSW:"#quizaccess_wifiresilience_reset_sw",UPDATESW:"#quizaccess_wifiresilience_update_sw",STOPSW:"#quizaccess_wifiresilience_stop_sw",SYNCSW:"#quizaccess_wifiresilience_sync_sw",TECHINFO:"#wifiresilience_tech_pre_checks_div"},init:function(serviceworkerparams,displayadminmsgs,showtechprechecks){function wifiresilience_formatbytes(a,b){if(0==a)return"0 Bytes";var c=1e3,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]}if(wifiresilience_tech_info=M.util.get_string("rule1start","quizaccess_wifiresilience"),"serviceWorker"in navigator){var exam_sw_name="accessrule/wifiresilience/serviceworker.php"+serviceworkerparams;wifiresilience_tech_info=M.util.get_string("rule1success","quizaccess_wifiresilience"),navigator.serviceWorker.register(exam_sw_name).then((function(registration){registration.update();var swelement=document.querySelector("#sw_kind");registration.installing?(ExamServiceWorker=registration.installing,void 0!==swelement&&null!=swelement&&(swelement.textContent=M.util.get_string("rule1statusinstalling","quizaccess_wifiresilience"))):registration.waiting?(ExamServiceWorker=registration.waiting,void 0!==swelement&&null!=swelement&&(swelement.textContent=M.util.get_string("rule1statuswaiting","quizaccess_wifiresilience"))):registration.active&&(ExamServiceWorker=registration.active,void 0!==swelement&&null!=swelement&&(swelement.textContent=M.util.get_string("rule1statusactive","quizaccess_wifiresilience"))),1==displayadminmsgs&&(document.querySelector("#quizaccess_wifiresilience_reset_sw").addEventListener("click",(function(){navigator.serviceWorker.getRegistrations().then((function(registrations){if(registrations){for(let registration of registrations)registration.unregister().then((function(boolean){boolean&&console.log("[Wifiresilience-SW] Service-Worker Reset successful: ",registration.scope)}));window.location.reload()}else alert(M.util.get_string("ruleswnotregisteredreset","quizaccess_wifiresilience"))}))})),document.querySelector("#quizaccess_wifiresilience_update_sw").addEventListener("click",(function(){navigator.serviceWorker.getRegistrations().then((function(registrations){if(registrations)for(let registration of registrations)registration.update().then((function(boolean){boolean&&console.log("[Wifiresilience-SW] Service-Worker Update successful: ",registration.scope)}));else alert(M.util.get_string("ruleswnotregisteredupdate","quizaccess_wifiresilience"))}))})),document.querySelector("#quizaccess_wifiresilience_stop_sw").addEventListener("click",(function(){navigator.serviceWorker.getRegistrations().then((function(registrations){if(registrations)for(let registration of registrations)registration.unregister().then((function(boolean){boolean&&console.log("[Wifiresilience-SW] Service-Worker STOP successful: ",registration.scope)}));else alert(M.util.get_string("ruleswnotregisteredstop","quizaccess_wifiresilience"))}))})),document.querySelector("#quizaccess_wifiresilience_sync_sw").addEventListener("click",(function(){registration.sync?registration.sync.register("upload-responses").then(()=>{alert(M.util.get_string("rulebgsyncsuccess","quizaccess_wifiresilience")),console.log("[Wifiresilience-SW] Sync Test upload-responses registered. Firing upload-responses.")}).catch((function(error){alert(M.util.get_string("rulebgsyncfail","quizaccess_wifiresilience")),console.log("[Wifiresilience-SW] Sync: Unable to register upload-responses.")})):alert(M.util.get_string("rulebgsyncsupported","quizaccess_wifiresilience"))}))),ExamServiceWorker.addEventListener("statechange",(function(e){var swelement=document.querySelector("#sw_kind");void 0!==swelement&&null!=swelement&&(swelement.textContent="(Status: "+e.target.state+")"),"activated"==e.target.state&&(console.log("[Wifiresilience-SW] Background Sync: Service Worker is just now in Active Mode. Now we can subscribe for Background Sync"),"SyncManager"in window&&(console.log("[Wifiresilience-SW] Background Sync: Ready to Register upload-responses event."),registration.sync.register("upload-responses").then(()=>{console.log("[Wifiresilience-SW] Background Sync: upload-responses Registered")}).catch((function(err){console.error("[Wifiresilience-SW] Background Sync: System was unable to register for a sync, this could be an OS-level restriction (or not ready yet). Maybe try to reload the page again..",err)}))))})),console.log("[Wifiresilience-SW] Wifiresilience-exams-sw.js Registration successful, scope is:",registration.scope)})).catch((function(err){wifiresilience_tech_info=M.util.get_string("rule1fail","quizaccess_wifiresilience",err),console.error("[Wifiresilience-SW] Wifiresilience-exams-sw.js Service worker registration failed, error:",err)}))}else wifiresilience_tech_info=M.util.get_string("rule1error","quizaccess_wifiresilience");window.indexedDB=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB,wifiresilience_tech_info_db=M.util.get_string("rule2start","quizaccess_wifiresilience"),window.indexedDB?wifiresilience_tech_info_db=M.util.get_string("rule2success","quizaccess_wifiresilience"):(wifiresilience_tech_info_db=M.util.get_string("rule2error","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] IndexedDB is NOT supported.")),wifiresilience_tech_info_presist_storage=M.util.get_string("rule3start","quizaccess_wifiresilience"),navigator.storage&&navigator.storage.persist&&navigator.storage.persisted().then(persistent=>{persistent?(wifiresilience_tech_info_presist_storage=M.util.get_string("rule3success","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] Storage will not be cleared except by explicit user action")):(wifiresilience_tech_info_presist_storage=M.util.get_string("rule3error","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] Storage may be cleared by the UA under storage pressure."))}),wifiresilience_tech_info_avail_quota=M.util.get_string("rule4start","quizaccess_wifiresilience"),"webkitTemporaryStorage"in navigator?navigator.webkitTemporaryStorage.queryUsageAndQuota((function(usedBytes,grantedBytes){var usedbytes=wifiresilience_formatbytes(usedBytes),grantedbytes=wifiresilience_formatbytes(grantedBytes);wifiresilience_tech_info_avail_quota=M.util.get_string("rule4success","quizaccess_wifiresilience",{usedbytes:usedbytes,grantedbytes:grantedbytes}),console.log("[Wifiresilience-SW] Browser Storage already uses ",usedbytes," of ",grantedbytes)}),(function(e){wifiresilience_tech_info_avail_quota=M.util.get_string("rule4error","quizaccess_wifiresilience"),console.log("Wifiresilience-SW] Browser Storage Calculation Error",e)})):(wifiresilience_tech_info_avail_quota=M.util.get_string("rule4fail","quizaccess_wifiresilience"),console.log("Wifiresilience-SW] webkitTemporaryStorage not supported in this browser..")),wifiresilience_tech_info_req_quota=M.util.get_string("rule5start","quizaccess_wifiresilience");var requestedBytes=1073741824;function Wifi_Quote_errorHandler(e){console.log("[Wifiresilience-SW] Request Quota of 1024MB Error: ",e)}function onInitFs(fs){console.log("[Wifiresilience-SW] onInitFs called by requestQuota: ",fs)}"webkitPersistentStorage"in navigator?navigator.webkitPersistentStorage.requestQuota(1073741824,(function(grantedBytes){window.webkitRequestFileSystem(PERSISTENT,grantedBytes,onInitFs,Wifi_Quote_errorHandler),wifiresilience_tech_info_req_quota=M.util.get_string("rule5success","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] Requesting Extra Storage Quota (1GB) is Successful.")}),(function(e){wifiresilience_tech_info_req_quota=M.util.get_string("rule4error","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] Request Quota of 1024MB Error: ",e)})):(wifiresilience_tech_info_req_quota=M.util.get_string("rule5fail","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] webkitPersistentStorage not supported in this browser..")),wifiresilience_tech_info_cacheAPI=M.util.get_string("rule6start","quizaccess_wifiresilience"),"caches"in window?(wifiresilience_tech_info_cacheAPI=M.util.get_string("rule6success","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] CacheAPI is supported in this browser..")):(wifiresilience_tech_info_cacheAPI=M.util.get_string("rule6error","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] CacheAPI is not supported in this browser..")),wifiresilience_tech_info_sync=M.util.get_string("rule7start","quizaccess_wifiresilience"),"SyncManager"in window?(wifiresilience_tech_info_sync=M.util.get_string("rule7success","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] Background Sync is supported in this browser..")):(wifiresilience_tech_info_sync=M.util.get_string("rule7error","quizaccess_wifiresilience"),console.log("[Wifiresilience-SW] Background Sync is not supported in this browser..")),Y.on("domready",(function(){displayadminmsgs&&(Y.one(this.SELECTORS.RESETSW).show(),Y.one(this.SELECTORS.UPDATESW).show(),Y.one(this.SELECTORS.STOPSW).show(),Y.one(this.SELECTORS.SYNCSW).show()),Y.one(this.SELECTORS.TECHINFO).append(wifiresilience_tech_info),Y.one(this.SELECTORS.TECHINFO).append(wifiresilience_tech_info_db),Y.one(this.SELECTORS.TECHINFO).append(wifiresilience_tech_info_presist_storage),Y.one(this.SELECTORS.TECHINFO).append(wifiresilience_tech_info_avail_quota),Y.one(this.SELECTORS.TECHINFO).append(wifiresilience_tech_info_req_quota),Y.one(this.SELECTORS.TECHINFO).append(wifiresilience_tech_info_cacheAPI),Y.one(this.SELECTORS.TECHINFO).append(wifiresilience_tech_info_sync),Y.one(this.SELECTORS.TECHINFO).append(wifiresilience_tech_info),showtechprechecks&&Y.one(this.SELECTORS.TECHINFO).show()}),this)}}}),"@VERSION@",{requires:["base","node","event","event-valuechange","node-event-delegate","io-form","json"]});