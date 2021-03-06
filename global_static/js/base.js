var anim_loop = false;
let next_anim_color = "#00aad2";
let next_anim = true;

// jQuery
jQuery.extend({
    //https://stackoverflow.com/questions/690781/debugging-scripts-added-via-jquery-getscript-function
    getScript: function (url, callback) {
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.src = url;

        // Handle Script loading
        {
            var done = false;
            // Attach handlers for all browsers
            script.onload = script.onreadystatechange = function () {
                if (!done && (!this.readyState ||
                    this.readyState == "loaded" || this.readyState == "complete")) {
                    done = true;
                    if (callback) callback();
                    // Handle memory leak in IE
                    script.onload = script.onreadystatechange = null;
                }
            };
        }
        head.appendChild(script);
        // We handle everything using the script element injection
        return undefined;
    },
});

function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }
    return params;
}

let $_GET = getQueryParams(document.location.search);

// Helpers
function is_valid_email(emailAddress) {
    var pattern = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
}

// Requests
function request_template_include(url, data_dict) {
    start_loading_animation();

    $.ajax({
        url: url,
        data: data_dict,
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);
            let html = json.html.replace(new RegExp("\>[\s]+\<", "g"), "><");

            // Apply css
            $("head link#dynamic-css").attr("href", json.css);

            $("#center-panel").empty();
            $("#center-panel").html(html);
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function request_view_tq(id) {
    request_template_include("/include/tq/view", {"id": id});
}

function request_load_tqs() {
    start_loading_animation();

    $.ajax({
        url: "/api/tq/load",
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                $("#tqs-container").empty();
                json.tqs.forEach(function (item) {
                    add_tq_ui(item);
                });
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function request_start_new_project() {
    start_loading_animation();
    $.ajax({
        url: "/api/project/new",
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                $("#project-name p").text(json.name);
                show_new_project_ui();
            }

            request_template_include("/include/project/new");
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function request_rename_project(new_name) {
    let name_rename = $("#project-rename");
    let project_name_p = $("#project-name p");

    start_loading_animation();
    $.ajax({
        url: "/api/project/rename",
        data: {
            "name": new_name
        },
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                project_name_p.text(new_name);
                project_name_p.show();
                name_rename.hide();
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            alert(data.responseText);
        }
    });
}

function request_autoload_project() {
    start_loading_animation();
    $.ajax({
        data: {},
        url: "/api/project/autoload",
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                request_load_project(json.id);
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}


function request_load_project(id) {
    start_loading_animation();
    $.ajax({
        data: {
            "id": id
        },
        url: "/api/project/load",
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                $("#project-name p").text(json.name);
                show_new_project_ui();
                reset_left_panel();

                request_load_tqs();
                request_check_export_visibility();

                request_template_include("/include/project/new");
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function request_check_export_visibility() {
    start_loading_animation();

    $.ajax({
        url: "/api/ff/export_visible",
        data: {},
        success: function (data) {
            stop_loading_animation();

            let json = JSON.parse(data);

            if (json.visible) {
                $("#endfusion-button").show();
                $("#rms-container .panel-button").text(json.tf_name);
                $("#rms-container .panel-button").show();
            } else {
                $("#endfusion-button").hide();
                $("#rms-container .panel-button").hide();
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

// UX
function animate_loading() {
    $("#top-bar").animate({
        outlineColor: next_anim_color
    }, 600, function () {
        if (!next_anim) {
            next_anim_color = "#5097ab";
            next_anim = true;
        } else {
            next_anim_color = "#d6d6d6";
            next_anim = false;
        }
        if (anim_loop) animate_loading();
        else $("#top-bar").css("outline-color", "#d6d6d6");
    });
}

function start_loading_animation() {
    $("#top-bar").animate({
        "outline-width": "2px"
    }, 300, function () {
        anim_loop = true;
        animate_loading();
    });
}

function stop_loading_animation() {
    $("#top-bar").animate({
        "outline-width": "1px"
    }, 300, function () {
        anim_loop = false;
    });
}

function hide_top_bar_controls() {
    $("#left-panel").hide();
    $("#right-panel").hide();
    $("#project-name").hide();
    $(".top-button").hide();
    $("#left-panel-hamburger").css("opacity", "0");
}

function show_simple_modal(title, msg, yes_callback) {
    $("#simple-modal #title").text(title);
    $("#simple-modal #msg").html(msg);

    last_scroll_y = $(window).scrollTop();

    let simple_modal = $("#simple-modal");
    let spanner = $("#spanner");

    $(simple_modal[0].getElementsByClassName("modal-yes-button")).click(function (e) {
        yes_callback();
    });

    $("html, body").animate({ scrollTop: 0 }, "slow");

    spanner.fadeIn(200);
    simple_modal.fadeIn(200);
}

function hide_simple_modal() {
    $("#simple-modal").fadeOut(100);
    $("#spanner").fadeOut(100);
    $("html, body").animate({ scrollTop: last_scroll_y }, "slow");
}

function add_tq_ui(item) {
    $("#tqs-container").append(
        '<div class="panel-button accented tq-item" id="' + item.id + '">' +
            '<i class="far fa-clone panel-icon"></i>' +
            '<p>' + item.name + '</p>' +
        '</div>'
    );
}


function fit_modals() {
    let modals = [];
    modals.push($("#simple-modal"));
    modals.push($("#col-rm-ui-modal"));
    modals.push($("#script-rm-ui-modal"));
    modals.push($("#open-rm-modal"));

    modals.forEach(function (m) {
        m.css("margin-left", ($(document).width() / 2) - m.outerWidth() / 2);
    });
}

function resize_panels() {
    let doc_width = $(document).width();

    let lp_width = $("#left-panel").width();
    let rp_width = $("#right-panel").width();
    if ($("#right-panel").css("display") === "none") rp_width = 0;

    let c_width = doc_width - lp_width - rp_width;

    $("#tf-table-container").css("width", c_width-80);
    $("#structure-changes-container").css("width", c_width-80);

    $("#left-panel").css("height", $(window).height());
    $("#right-panel").css("height", $(window).height());

    let notes_box = $("#new-projects-container #notes-box");

    if (doc_width < 1200) {
        notes_box.css("margin-left", 0);
        notes_box.css("margin-top", 20);
        notes_box.css("float", "none");
        notes_box.css("display", "inline-grid");
    }
    if (doc_width > 1050) {
        notes_box.css("margin-left", 50);
        notes_box.css("margin-top", 10);
    }

    if (doc_width > 1550) {
        notes_box.css("display", "block");

        notes_box.css("margin-left", 110);
        notes_box.css("float", "left");
    }
}

function reset_left_panel() {
    $("#tqs-container").empty();
    $("#rms-container .panel-button").css("display", "none");
    $("#endfusion-button").hide();
    resize_panels();
}

function left_panel_toggle() {
    if ($("#left-panel").width() > 100) {
        $("#left-panel").css("width", "56px");
        $(".panel-button p").hide();
        $(".panel-header").hide();

        $("#rms-container .panel-button").css("font-size", 7);
        $("#rms-container .panel-button").css("color", "#184b88");

        $("#footer").hide();
    } else if ($("#left-panel").width() < 100) {
        $("#left-panel").css("width", "220px");
        $(".panel-button p").show();
        $(".panel-header").show();

        $("#rms-container .panel-button").css("font-size", "");
        $("#rms-container .panel-button").css("color", "");

        $("#footer").show();
    }
}


function show_new_project_ui() {
    reset_left_panel();
    request_check_export_visibility();

    $("#left-panel").show("slide", {direction: "left"}, 300);
    $("#project-name").show();
    $("#left-panel-hamburger").css("opacity", "1");
}

function start_new_project() {
    request_start_new_project();
}


function register_left_panel_events() {
    $("#logo").click(function (e) {
        window.location = "/";
    });

    $("#left-panel-hamburger").click(function (e) {
        left_panel_toggle();
    });
}

function register_top_button_events() {
    let project_rename = $("#project-rename");
    let project_name_p = $("#project-name p");


    $("#new-project").click(function (e) {
        start_new_project();
    });

    $("#project-name").click(function (e) {
        project_name_p.hide();
        project_rename.val(project_name_p.text());
        project_rename.show();
        project_rename.focus();
    });

    project_rename.keyup(function (e) {
        if (e.key === "Escape") {
            project_rename.hide();
            project_name_p.show();
        } else if (e.key === "Enter") {
            request_rename_project(project_rename.val());
        }
    });

    $("#user-icon").click(function (e) {
        hide_edit_controls();
        request_template_include("/include/user/settings", {});
    });

    $("#load-project").click(function (e) {
        hide_edit_controls();
        request_template_include("/include/project/user_projects", {})
    });
}


var main = function () {
    fit_modals();
    register_left_panel_events();
    register_top_button_events();

    request_check_export_visibility();
    request_autoload_project();

    $(window).resize(function () {
        fit_modals();
        resize_panels();
    });

    reset_left_panel();


    $("#add-tq").click(function (e) {
        $("#right-panel").hide();
        request_template_include("/include/tq/import", {})
    });

    $("#rms-container").click(function (e) {
        request_template_include("/include/tf/preview", {})
    });

    $("#endfusion-button").click(function (e) {
        $("#right-panel").hide();
        request_template_include("/include/ff/export", {});
    });

};

$(document).ready(main);

$(document).on("click", ".tq-item", function (e) {
    e.preventDefault();
    let id = $(e.currentTarget).attr("id");
    $("#right-panel").hide();
    request_view_tq(id);
});

$(document).on("click", "#simple-modal #no", function (e) {
    e.preventDefault();
    hide_simple_modal();
});

$(document).on("click", "#simple-modal #close", function (e) {
    e.preventDefault();
    hide_simple_modal();
});
