/* Method used to extract HTML code from the Visited URL.
    It will try to remove script and style tags */
function extract_html(document_root) {
    var body_text = document_root.getElementsByTagName("BODY")[0].innerHTML;
    body_text = body_text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    body_text = body_text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    return body_text;
}

chrome.runtime.sendMessage({
    action: "getContent",
    data: extract_html(document),
    source: window.location.href
});
