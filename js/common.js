var API_URL = "http://zammit001.ddns.net/eduapi/";
//API_URL = "http://192.168.1.110/eduapi/";
var USE_MOCK_DATA = true;

var REGISTRATION_DATA = "REGISTRATION_DATA";
var PAUSE = "PAUSE";

const LS = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) ? {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
} : {
    getAllItems: async () => {
        var data = {};
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            try {
                data[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                data[key] = localStorage.getItem(key);
            }
        }
        return data;
    },
    getItem: async key => {
        var value = localStorage.getItem(key);
        if (value == null) {
            return undefined;
        }
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },
    setItem: async (key, val) => {
        localStorage.setItem(key, JSON.stringify(val));
    },
    removeItems: async keys => {
        keys.forEach(function (key) {
            localStorage.removeItem(key);
        });
    },
};

function mock_delay(callback, payload) {
    setTimeout(function () {
        callback(payload);
    }, 120);
}

function build_mock_computed_results() {
    var base_hash = "mock_hash_2026";
    var last_visited_url_id = "mock_visit_001";
    var focus_keyphrase = "machine learning optimization";

    return {
        success: true,
        hash: base_hash,
        data: [
            {
                result_type: "LAST_SEARCHES",
                result_hash: base_hash,
                last_visited_url_id: last_visited_url_id,
                result_data: [
                    { keyphrase: focus_keyphrase, domain: "www.google.com" },
                    { keyphrase: "gradient descent intuition", domain: "www.google.com" },
                    { keyphrase: "adam optimizer convergence", domain: "www.stackoverflow.com" },
                    { keyphrase: "stochastic optimization", domain: "en.wikipedia.org" }
                ]
            },
            {
                result_type: "EXTRACTED_KEYPHRASES",
                result_hash: base_hash,
                last_visited_url_id: last_visited_url_id,
                last_keyphrase_searched: focus_keyphrase,
                result_data: [
                    { keyphrase: "convex optimization", weight: 0.98 },
                    { keyphrase: "learning rate schedule", weight: 0.92 },
                    { keyphrase: "momentum term", weight: 0.86 }
                ]
            },
            {
                result_type: "SIMILAR_STUDY_GROUP",
                result_hash: base_hash,
                last_visited_url_id: last_visited_url_id,
                last_keyphrase_searched: focus_keyphrase,
                result_data: [
                    {
                        target: "numerical methods",
                        description: "Related to iterative solvers and convergence analysis.",
                        similarity: 0.91
                    },
                    {
                        target: "probability and statistics",
                        description: "Supports loss functions, inference, and uncertainty estimation.",
                        similarity: 0.83
                    }
                ]
            },
            {
                result_type: "SIMILARITY_RESULT",
                result_hash: base_hash,
                last_visited_url_id: last_visited_url_id,
                last_keyphrase_searched: focus_keyphrase,
                result_data: [
                    {
                        sim: 0.93,
                        searched_keyphrases: [
                            "quasi-newton methods",
                            "hessian approximation"
                        ]
                    },
                    {
                        sim: 0.79,
                        searched_keyphrases: [
                            "early stopping techniques",
                            "regularization tuning"
                        ]
                    }
                ]
            },
            {
                result_type: "SUGGESTED_RESOURCES",
                result_hash: base_hash,
                last_visited_url_id: last_visited_url_id,
                last_keyphrase_searched: focus_keyphrase,
                result_data: [
                    {
                        sim: 0.95,
                        title: "Optimization for Machine Learning",
                        author: "Sra, Nowozin, Wright",
                        keywords: "gradient descent;newton method;convex analysis"
                    },
                    {
                        sim: 0.88,
                        title: "Adaptive Subgradient Methods",
                        author: "Duchi et al.",
                        keywords: "adagrad;adaptive learning;online learning"
                    }
                ]
            },
            {
                result_type: "NEXT_BEST_ACTION",
                result_hash: base_hash,
                last_visited_url_id: last_visited_url_id,
                last_keyphrase_searched: focus_keyphrase,
                result_data: [
                    {
                        probability: 92,
                        searched_keyphrases: ["nesterov acceleration"],
                        text: ""
                    },
                    {
                        probability: 78,
                        searched_keyphrases: ["line search wolfe conditions"],
                        text: ""
                    },
                    {
                        probability: 64,
                        searched_keyphrases: [],
                        text: "https://scholar.google.com/scholar?q=optimization+machine+learning+survey"
                    }
                ]
            }
        ]
    };
}


/* Enumeration used to keep
    track of call backs */
const callbacks = {
	LAST_SEARCHES: "PLUGIN_LAST_SEARCHES",
    EXTRACTED_KEYPHRASES: "PLUGIN_EXTRACTED_KEYPHRASES",
    SIMILAR_KEYPHRASES: "PLUGIN_SIMILAR_KEYPHRASES",
    SIMILAR_STUDY_GROUP_KEYPHRASES: "SIMILAR_STUDY_GROUP_KEYPHRASES",
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


/* Save registration in cache storage */
function save_registration(data){
    LS.setItem(REGISTRATION_DATA, JSON.stringify(data));
}

/* Get the registration from cache storage */
async function get_registration(){
    var data = await LS.getItem(REGISTRATION_DATA);
    if(data != undefined){
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
    if (USE_MOCK_DATA) {
        mock_delay(callback, { success: true, data: "mock heartbeat" });
        return;
    }

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
    if (USE_MOCK_DATA) {
        mock_delay(callback, {
            success: true,
            data: [
                {
                    code: "SG-ML-01",
                    name: "Machine Learning",
                    description: "Covers supervised learning, optimization, and model evaluation."
                },
                {
                    code: "SG-DM-02",
                    name: "Data Mining",
                    description: "Focuses on clustering, pattern discovery, and data preparation techniques."
                },
                {
                    code: "SG-IR-03",
                    name: "Information Retrieval",
                    description: "Search, ranking, and relevance feedback fundamentals."
                }
            ]
        });
        return;
    }

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
    if (USE_MOCK_DATA) {
        mock_delay(callback, {
            success: true,
            hash: "mock_notifications_v1",
            data: [
                {
                    id: 101,
                    action: "SEND_KEYPHRASE",
                    message: JSON.stringify([
                        "batch normalization",
                        "dropout regularization",
                        "loss landscape"
                    ])
                },
                {
                    id: 102,
                    action: "MAINTENANCE",
                    message: JSON.stringify("Demo environment: this is simulated data for documentation screenshots.")
                }
            ]
        });
        return;
    }

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
    if (USE_MOCK_DATA) {
        var code = "MOCK-REG-2026";
        if (study_group != undefined && study_group != null && study_group != "") {
            code = "MOCK-" + study_group.replace(/[^A-Za-z0-9]/g, "") + "-2026";
        }
        mock_delay(callback, { success: true, data: code });
        return;
    }

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
    if (USE_MOCK_DATA) {
        mock_delay(callback, {
            success: true,
            data: {
                registration_code: registration_code || "MOCK-REG-2026",
                user_name: "Documentation Demo"
            }
        });
        return;
    }

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
    if (USE_MOCK_DATA) {
        mock_delay(callback, { success: true });
        return;
    }

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
    if (USE_MOCK_DATA) {
        mock_delay(callback, build_mock_computed_results());
        return;
    }

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
    if (USE_MOCK_DATA) {
        mock_delay(callback, { success: true, data: { id: id } });
        return;
    }

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
