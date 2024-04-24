var API_URL = "http://zammit001.ddns.net/eduapi/";
API_URL = "http://192.168.1.110/eduapi/";

var REGISTRATION_DATA = "REGISTRATION_DATA";
var PAUSE = "PAUSE";

/* Enumeration used to keep
    track of call backs */
const callbacks = {
	LAST_SEARCHES: "PLUGIN_LAST_SEARCHES",
    EXTRACTED_KEYPHRASES: "PLUGIN_EXTRACTED_KEYPHRASES",
    SIMILAR_KEYPHRASES: "PLUGIN_SIMILAR_KEYPHRASES",
    SIMILAR_STUDY_GROUP_KEYPHRASES: "SIMILAR_STUDY_GROUP_KEYPHRASES",
    SIMILAR_LINKED_KEYPHRASES: "PLUGIN_SIMILAR_LINKED_KEYPHRASES",
    LECTURER_SUGGESTED_KEYPHRASE: "LECTURER_SUGGESTED_KEYPHRASE",
    SUGGESTED_RESOURCES: "SUGGESTED_RESOURCES",
    NEXT_BEST_ACTION: "NEXT_BEST_ACTION"
}

/* Method used to create a search URL with a call back in Google */
function google_search_url(call_back_source, call_back_function, keyphrase) {
    if(call_back_source != "")
        return "https://www.google.com/search?cbs=" + call_back_source + "&cbf=" + call_back_function + "&q=" + keyphrase;
    else
        return "https://www.google.com/search?cbf=" + call_back_function + "&q=" + keyphrase;
}

function google_scholar_url(call_back_source, call_back_function, keyphrase) {
    return "https://scholar.google.com/scholar?hl=en&cbs=" + call_back_source + "&cbf=" + call_back_function + "&q=" + keyphrase;
}

/* Clear cache storage */
function clear_registration(){
    localStorage.clear();
}

/* Save registration in cache storage */
function save_registration(data){
    localStorage.setItem(REGISTRATION_DATA, JSON.stringify(data));
}

/* Get the registration from cache storage */
function get_registration(){
    var data = localStorage.getItem(REGISTRATION_DATA);
    if(data != null){
        data = JSON.parse(data);
    }
    return data;
}

/* Create bag of words from text */
function bag_of_words(text){
    var bow = [];
    text.split(" ").forEach(element => {
        element = JSON.stringify(element);
        if(element in bow){
            bow[element] += 1;
        }else{
            bow[element] = 1;
        }
    })

    return bow;
}


/* Print JSON object to console */
function debug_print(data) {
    console.log(JSON.stringify(data, null, 2));
}

/* Print JSON object to table */
function debug_table(data) {
    console.table(data);
}

function getHeaderFromHeaders(headers, header_name) {
    for (var i = 0; i < headers.length; ++i) {
        var header = headers[i];
        if (header.name.toLowerCase() === header_name.toLowerCase()) {
            return header;
        }
    }
}

/* Get all study group API call */
function heartbeat(callback) {
    $.get(
        API_URL + "heartbeat.php",
        function (response) {
            callback(response);
        }).fail(
            function () {
                callback(null);
            }
        );
}


/* Get all study group API call */
function all_study_groups(callback) {
    $.get(
        API_URL + "study_groups.php",
        function (response) {
            callback(response);
        }).fail(
            function () {
                callback(null);
            }
        );
}

/* Get all study group API call */
function get_push_notifications(callback) {
    $.get(
        API_URL + "user/get_push_notifications.php",
        function (response) {
            callback(response);
        }).fail(
            function () {
                callback(null);
            }
        );
}

/* Create registraton API */
function register(callback, study_group, user_name) {
    $.post(API_URL + "register.php", { 'study_group': study_group, 'user_name': user_name},
        function (response) {
            callback(response);
        }
    ).fail(
        function () {
            callback(null);
        }
    );
}

/* Connect using a registration code */
function connect_login(callback, registration_code) {
    $.get(
        API_URL + "registration_login.php?registration_code=" + registration_code,
        function (response) {
            callback(response);
        }
    ).fail(
        function () {
            callback(null);
        }
    );
}

/* Log out call */
function logout(callback) {
    $.get(
        API_URL + "logout.php",
        function (response) {
            callback(response);
        }
    ).fail(
        function () {
            callback(null);
        }
    );
}


function computed_results(callback){
    $.get(
        API_URL + "user/computed_results.php",
        function (response) {
            callback(response);
        }
    ).fail(
        function () {
            callback(null);
        }
    );  
}

/* Mark a notification as read */
function read_notification(callback, id){
    $.post(API_URL + "user/read_notification.php", { 'id': id },
        function (response) {
            callback(response);
        }
    ).fail(
        function () {
            callback(null);
        }
    );
}


function select(list, key_name){
    return list.map(function (element) {
        return element[key_name];
    });
}

function distinct(list){
    return Array.from(new Set(list));
}
