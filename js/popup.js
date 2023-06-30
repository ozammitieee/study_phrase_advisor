var STUDY_GROUP_DICTIONARY = [];

/* Keep a hash for last searches,
    to prevent from UI flickering every update. */
var LAST_SEARCHES_HASH = "";

/* Push notification hash */
var PUSH_NOTIFICATIONS = "";

/* Validate a response, if the response is not good
    it will display the message */
function validate_response(response, default_error_message) {
    if (response == null || !response.success) {
        display_message(default_error_message, true);
        return false;
    }
    return true;
}

/* Check if server is alive */
function heartbeat_callback(response){
    if(!validate_response(response)){
        alert("The server is not currently listening to connections.\nPlease try again later.");
        window.close();
    }else{
        $('#not_connected').hide();
        $("#connected").show();

        /* Assign navigation click events */
        $("#btn_registration").click(function () { toggle_tabs("#div_registration"); });
        $("#btn_suggestions").click(function () { toggle_tabs("#div_suggestions"); });
        $("#btn_activity").click(function () { toggle_tabs("#div_activity"); });
        $("#btn_notifications").click(function () { toggle_tabs("#div_notifications"); });
        $("#btn_logout").click(function () { logout(logout_callback); });
        $("#btn_refresh").click(function () { refresh(refresh_callback); });

        /* Get registration from local storage */
        var registration = get_registration();

        /* Check if the registration is already connected */
        if (registration == null) {
            $("#btn_logout").hide();
            $("#btn_suggestions").hide();
            $("#btn_activity").hide();
            $("#btn_notifications").hide();
            $("#btn_registration").show();

            /* Populate the study group drop down list */
            all_study_groups(all_study_groups_callback);
            $("#sel_study_groups").change(function () { updateDescription(); });

            /* Create new registration button */
            $("#btn_new_registration").click(function () { register(register_callback, $("#sel_study_groups").val(), $("#inp_user_name").val()); });

            /* Connect with registration code */
            $("#btn_connect").click(function () { connect_login(connect_login_callback, $("#inp_registration_code").val()); });

            toggle_tabs("#div_registration");
        } else {
            /* Log in */
            connect_login(connect_login_callback, registration.registration_code);
        }
    }
}

$(document).ready(function () {
    heartbeat(heartbeat_callback);
});

/* Function to hide all tabs and show
    only the selected tab */
function toggle_tabs(tab_show) {
    $(".tabcontent").hide();
    $(tab_show).show();
}

/* Method to show and hide error and information messages */
function display_message(message, error = false) {
    if (error) {
        $("#div_error").show();
        $("#div_success").hide();
        $("#i_error").text(" " + message);
    } else {
        $("#div_error").hide();
        $("#div_success").show();
        $("#i_success").text(" " + message);
    }
}

/* Function to update the description when a new study group
    is selected */
function updateDescription() {
    var value = $("#sel_study_groups").val();
    $("#p_study_group_description").text(STUDY_GROUP_DICTIONARY[value]);
}


/* Function to get all registrations and
    and populate a global dictionary */
function all_study_groups_callback(response) {
    if (!validate_response(response, "Cannot get study groups")) {
        return;
    }

    $('#sel_study_groups').empty()
    for (row in response.data) {
        // Update dropdown
        $("#sel_study_groups").append($('<option>', {
            text: response.data[row]['name'],
            value: response.data[row]['code']
        }));
        // Update dictionary
        STUDY_GROUP_DICTIONARY[response.data[row]['code']] = response.data[row]['description'];
    }
    updateDescription();
}

/* Create a new registration callback. */
function register_callback(response) {
    if (!validate_response(response, "Cannot create registration")) {
        return;
    }
    display_message("Created registration.");
    $("#inp_registration_code").val(response.data);
}

/* Connect registration */
function connect_login_callback(response) {
    if (!validate_response(response, "Cannot connect using the provided registration")) {
        return;
    }
    save_registration(response.data);
    connected();
}

/* Logout call */
function logout_callback(response) {
    clear_registration();
    location.reload();
}

/* Based on the domain name, determine
    the search enine icon to use. */
function search_engine_icon(domain) {
    if (domain.includes("google")) {
        return "google.png";
    } else if (domain.includes("stackoverflow")) {
        return "stackoverflow.png";
    } else if (domain.includes("wikipedia")) {
        return "wikipedia.png";
    } else {
        return "search.png";
    }
}

/* This functionality will resets the results.
    Used to set defaults when starting up or waiting to load. */
function defaults(display_text = "Loading...", startup = false) {
    /* If startup, refresh the last searches */
    if (startup) {
        $("#td_lastsearch_call").text(display_text);
    }

    $("#td_lastsearched").text(display_text);
    $("#td_similar_keyphrases").text(display_text);
    $("#td_similar_linked_keyphrases").text(display_text);
    $("#td_similar_study_group_keyphrases").text(display_text);
}


function display_last_searches(data){
    /* Fill the last searches table */
    data.result_data.slice(0, 10).forEach(element => {
        
        /* Create a URL with a callback */
        var url = google_search_url(data.last_visited_url_id, callbacks.LAST_SEARCHES, element.keyphrase);
        url = "<a target='_blank' href='" + url + "'>" + element.keyphrase.substring(0, 100) + "</a>";

        /* Assign an image to a domain */
        var domain_image = "images/" + search_engine_icon(element.domain);

        /* Add row in table */
        $('#tbody_lastsearches').append("<tr>" +
            "<td width='5%'><img width=20px' src='" + domain_image + "'/></td>" +
            "<td>" + url + "</td></tr>");
    });
}

function display_extracted_keyphrases(data) {
    $("#td_lastsearched").text("Keyphrase: " + data.last_keyphrase_searched);

    data.result_data.slice(0, 10).forEach(element => {
        /* Create a URL with a callback */
        var url = google_search_url(data.last_visited_url_id, callbacks.EXTRACTED_KEYPHRASES, element.keyphrase);
        url = "<a target='_blank' href='" + url + "'>" + element.keyphrase + "</a>";
        
        /* Calculate weight */
        var weight = (100 / data.result_data[0].weight) * element.weight;

        /* Add row in table */
        $('#tbody_extracted_keyphrases').append("<tr>" +
            "<td width='5%'>" + get_star_image(weight) + "</td>" +
            "<td>" + url + "</td></tr>");
    });

}


function display_similar_study_group_keyphrases(data) {
    $("#td_similar_study_group_keyphrases").text("Keyphrase: " + data.last_keyphrase_searched);
    data.result_data.slice(0, 10).forEach(element => {
        /* Create a URL with a callback */
        var url = google_search_url(data.last_visited_url_id, callbacks.SIMILAR_STUDY_GROUP_KEYPHRASES, element.target);
        url = "<a target='_blank' href='" + url + "'><b>" + element.target + "</b></a>";

        /* Get similarity */
        var weight = Math.round(element['similarity'] * 100, 0)

        $('#tbody_similar_study_group_keyphrases').append("<tr>" +
            "<td width='5%'>" + get_star_image(weight) + "</td>" +
            "<td>" + url + " " + element['description'] + "</td></tr>");
    });

}

/* Get similar keyphrases callback*/
function display_similarity_result(data) {


    $("#td_similar_keyphrases").text("Keyphrase: " + data.last_keyphrase_searched);
    data.result_data.forEach(element => {

    /* Determine weight */
    var weight = element['sim'] * 100;
    debug_print(weight)

        element['searched_keyphrases'].forEach(search => {
            /* Create a URL with a callback */
            var url = google_search_url(data.last_visited_url_id, callbacks.SIMILAR_KEYPHRASES, search);
            url = "<a target='_blank' href='" + url + "'>" + search + "</a>";

            $('#tbody_similar_keyphrases').append("<tr>" +
                "<td width='5%'>" + get_star_image(weight) + "</td>" +
                "<td>" + url + "</td></tr>");
        });
    });

}

function computed_results_callback(response) {
    
    if (!validate_response(response, "Cannot get last searches")) {
        return;
    }

    /* If the hash changed, update the user interface */
    if (LAST_SEARCHES_HASH == response.hash) {
        return;
    }

    var current = new Date();
    $("#td_lastsearch_call").text("Last updated: " + current.toLocaleTimeString());

    LAST_SEARCHES_HASH = response.hash;
    
    /* Clear all results */
    $("#tbody_lastsearches").empty();
    $("#tbody_similar_keyphrases").empty();
    $("#tbody_similar_study_group_keyphrases").empty();
    $("#tbody_extracted_keyphrases").empty();

    /* Get last search hash */
    var last_search = response.data.find(e => e.result_type == "LAST_SEARCHES");
    var last_search_hash = last_search.result_hash;
    var last_search_domain_is_google = last_search.result_data[0].domain.includes("google");
    var updated_results = 0;
    var total_results = 0;

    /* Result hashes */
    response.data.forEach(result=>{
        switch(result.result_type) {
            case "LAST_SEARCHES":
                last_keyphrase_hash = result.result_hash;
                updated_results ++;
                total_results ++;
                display_last_searches(result);
                break;
            case "EXTRACTED_KEYPHRASES":
                total_results ++;
                if(result.result_hash == last_search_hash){
                    updated_results ++;
                    display_extracted_keyphrases(result);
                }
                break;
            case "SIMILAR_STUDY_GROUP":
                total_results ++;
                if(result.result_hash == last_search_hash){
                    updated_results ++;
                    display_similar_study_group_keyphrases(result);
                }    
                break;
            case "SIMILARITY_RESULT":
                total_results ++;
                if(result.result_hash == last_search_hash){
                    updated_results ++;
                    display_similarity_result(result);
                }    
                break;
            default:
                debug_print(result);
        }
    });

    if(last_search_domain_is_google){
        var updated_progress = (updated_results / total_results) * 100;

        if(updated_progress == 100)
            $("#i_status").text("Results are ready to view");
        else
            $("#i_status").text("Progress is at " + updated_progress + "%");
    }else{
        $("#i_status").text("The last keyphrase was not searched in Google. Click the keyphrase to process.");
    }
}


/* Connected functionality: Once the registration is connected,
    display results related to the registration. */
function connected() {
    toggle_tabs("#div_suggestions");
    $("#btn_logout").show();
    $("#btn_suggestions").show();
    $("#btn_activity").show();
    $("#btn_notifications").show();
    $("#btn_registration").hide();

    $("#i_connectedas").text(get_registration().registration_code);

    defaults("Loading...", true);

    /* Fetch last searched keyphrases on an interval */
    setInterval(function () { computed_results(computed_results_callback, 3); }, 1000);

    /* Push notifications */
    setInterval(function () { get_push_notifications(get_push_notifications_callback); }, 1000)

}

/* Get push notifications and display them to the user */
function get_push_notifications_callback(response) {
    if (!validate_response(response, "Cannot get push notifications")) {
        return;
    }

    if (response.hash == PUSH_NOTIFICATIONS) {
        return;
    }
    PUSH_NOTIFICATIONS = response.hash;

    /* Display different color tab to notify the user that
       there are messages */
    if(response.data.length > 0){
        $("#btn_notifications").removeClass("tablink");
        $("#btn_notifications").addClass("notification");
    }else{
        $("#btn_notifications").removeClass("notification");
        $("#btn_notifications").addClass("tablink");
    } 

    $("#tbody_notifications").empty();

    response.data.forEach(element => {
        if (element.action == "SEND_KEYPHRASE") {
            /* If the notification is a keyphrase */
            $("#tbody_notifications").append("<tr style='background-color: #009879; color: white'>" +
                "<th style='text-align:left'>Message: Lecturer Keyphrases</th>" +
                "<th><input id='message_" + element.id + "' type='button' value='Delete'/></th></tr>");

            JSON.parse(element.message).forEach(text => {
                var url = google_search_url("", callbacks.LECTURER_SUGGESTED_KEYPHRASE, text);
                            url = "<a target='_blank' href='" + url + "'>" + text + "</a>";


                $("#tbody_notifications").append("<tr><td colspan='2'>" + url + "</td></tr>");
            });

            $("#message_" + element.id).click(function () {
                read_notification(read_notification_callback, element.id);
            });
        }else{
            /* If it is not a keyphrase its a maintenance notification */
            $("#tbody_notifications").append("<tr style='background-color: #eb1677; color: white'>" +
                "<th style='text-align:left'>Message: Maintenance Notification</th>" +
                "<th><input id='message_" + element.id + "' type='button' value='Delete'/></th></tr>");
            $("#tbody_notifications").append("<tr><td colspan='2'>" + JSON.parse(element.message) + "</td></tr>");
            
            $("#message_" + element.id).click(function () {
                read_notification(read_notification_callback, element.id);
            });
        }
    });
}

/* Mark a notification as read */
function read_notification_callback(response){
    if (!validate_response(response, "Cannot mark notification as read.")) {
        return;
    }
}

/* Get the star image */
function get_star_image(percentage) {
    var image = "";
    if (percentage <= 33) { image = "empty"; }
    else if (percentage <= 66) { image = "half"; }
    else { image = "full"; }
    return "<img src='images/" + image + "_star.png' width='40px'/>"
}