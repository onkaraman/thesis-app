var tf_table_cols = null;
var tf_table_rows = null;
var current_page = 1;
var all_pages = null;
var items_per_page = 12;
var selected_col_rm_name = null;
var edit_rm_id = null;


// Helpers
function apply_single_col_rm(obj) {
    let if_conditions = JSON.parse(obj.if_conditions);
    let then_cases = JSON.parse(obj.then_cases);

    show_col_rm_ui_modal();
    $("#col-rm-ui-modal #edit-mode").text("bearbeiten");
    $("#select-col-button .sel-name").text(obj.col_subject_name);
    $("#select-col-button .sel-name").attr("id", obj.col_subject_id);

    $("#col-when-value").val(if_conditions[Object.keys(if_conditions)[0]]);
    $("#col-then-value").val(then_cases[Object.keys(then_cases)[0]]);

    if (Object.keys(if_conditions)[0] === "when_is") {
        $("#when-is").addClass("btn-selected");
    } else {
        $("#when-contains").addClass("btn-selected");
    }

    if (Object.keys(then_cases)[0] === "then_apply") {
        $("#then-apply").addClass("btn-selected");
    } else {
        $("#then-replace").addClass("btn-selected");
    }
}

function apply_single_row_rm(obj) {
    let if_conditions = JSON.parse(obj.if_conditions);
    let then_cases = JSON.parse(obj.then_cases);

    show_row_rm_ui_modal();
    $("#row-rm-ui-modal #edit-mode").text("bearbeiten");
    $("#row-rm-ui-modal .save-button").addClass("edit");

    for (let and_bracket = 0; and_bracket < if_conditions.length; and_bracket += 1) {
        for (let i = 0; i < if_conditions[and_bracket].length; i += 1) {
            add_when_row();
            let item = if_conditions[and_bracket][i];

            let last_added = $($("#when-rows-container").children()[$("#when-rows-container").children().length - 1]);
            last_added.find(".pick-col-button .sel-name").text(item["ffc_name"]);
            last_added.find(".pick-col-button .sel-name").attr("id", item["id"]);
            last_added.find(".pick-when-condition .sel-name").text(item["condition"]);
            last_added.find(".when-value").val(item["value"]);
        }
        if (and_bracket < if_conditions.length - 1) add_or_sep();
    }

    for (let i = 0; i < then_cases.length; i += 1) {
        add_then_container();
        let item = then_cases[i];
        let last_added = $($("#then-container").children()[$("#then-container").children().length - 1]);
        last_added.find(".pick-col-button .sel-name").text(item["ffc_name"]);
        last_added.find(".pick-col-button .sel-name").attr("id", item["id"]);
        last_added.find(".pick-then-condition .sel-name").text(item["action"]);
        last_added.find(".then-value").val(item["value"]);

        if (item["action"] === "REPLACE") {
            last_added.find(".with-value").show();
            last_added.find(".with-value").val(item["value_replace"]);
        }
    }

    if (obj["dynamic"]) {
        $("#row-rm-ui-modal .dyncol-value").show();
        $("#row-rm-ui-modal .dyncol-value").val($(".cols-dropdown-container .sel-name").text());
        $(".cols-dropdown-container .sel-name").text($(".dropdown-item[id='-1']").text());
    }
}

// Requests
function request_tf_preview() {
    start_loading_animation();
    $.ajax({
        url: "/api/tf/preview_table",
        data: {},
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                render_table_heads(json.headers);
                render_table_body(json.headers, json.rows);
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            alert(data.responseText);
        }
    });
}

function request_tf_preview_with_rm() {
    console.log("calling");
    start_loading_animation();
    $.ajax({
        url: "/api/tf/rm_preview_table",
        data: {},
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                render_table_heads(json.headers);
                render_table_body(json.headers, json.rows);
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            alert(data.responseText);
        }
    });
}

function request_rename_tf(new_name) {
    let name_display = $("#name-display");
    let tf_rename = $("#tf-rename");

    start_loading_animation();
    $.ajax({
        url: "/api/tf/rename",
        data: {
            "name": new_name
        },
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                $("#name-display h1").text(new_name);
                $("#ef-name").text(new_name);
                name_display.show();
                tf_rename.hide();
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            alert(data.responseText);
        }
    });
}

function request_rename_col(col_id, col_name, input) {
    start_loading_animation();
    $.ajax({
        url: "/api/ffc/rename",
        data: {
            "id": col_id,
            "name": input.val()
        },
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                input.hide();
                col_name.text(input.val());
                col_name.css("display", "inline-flex");
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            alert(data.responseText);
        }
    });
}

function request_create_col_rm() {
    start_loading_animation();
    $.ajax({
        url: "/api/rm/create/col",
        data: {
            "subject_id": selected_col_rm_name.attr("id"),
            "when_is": $("#when-is").hasClass("btn-selected"),
            "when_contains": $("#when-contains").hasClass("btn-selected"),
            "when_value": $("#col-when-value").val(),
            "then_apply": $("#then-apply").hasClass("btn-selected"),
            "then_replace": $("#then-replace").hasClass("btn-selected"),
            "then_value": $("#col-then-value").val(),
        },
        success: function (data) {
            stop_loading_animation();
            $("#col-rm-ui-modal #save-button").prop("disabled", false);

            let json = JSON.parse(data);
            if (json.success) {
                hide_col_rm_ui_modal();
                request_get_all_rm();
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            $("#col-rm-ui-modal #save-button").prop("disabled", false);
            alert(data.responseText);
        }
    });
}

function request_edit_col_rm() {
    start_loading_animation();

    $.ajax({
        url: "/api/rm/edit/col",
        data: {
            "id": edit_rm_id,
            "subject_id": $("#select-col-button .sel-name").attr("id"),
            "when_is": $("#when-is").hasClass("btn-selected"),
            "when_contains": $("#when-contains").hasClass("btn-selected"),
            "when_value": $("#col-when-value").val(),
            "then_apply": $("#then-apply").hasClass("btn-selected"),
            "then_replace": $("#then-replace").hasClass("btn-selected"),
            "then_value": $("#col-then-value").val(),
        },
        success: function (data) {
            stop_loading_animation();
            $("#col-rm-ui-modal #save-button").prop("disabled", false);

            let json = JSON.parse(data);
            if (json.success) {
                hide_col_rm_ui_modal();
                request_get_all_rm();
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            $("#col-rm-ui-modal #save-button").prop("disabled", false);
            alert(data.responseText);
        }
    });
}

function get_row_when_data() {
    let when_items = $(".when-item");

    let when_data = [];
    let and_bracket = [];

    for (let i = 0; i < when_items.length; i += 1) {

        if ($(when_items[i]).hasClass("or-sep-container")) {
            when_data.push(and_bracket);
            and_bracket = [];
        } else {
            and_bracket.push({
                "id": $(when_items[i]).find(".pick-col-button .sel-name").attr("id"),
                "condition": $(when_items[i]).find(".pick-when-condition").text().trim(),
                "value": $(when_items[i]).find(".when-value").val().trim()
            });
        }
    }

    if (and_bracket.length > 0) when_data.push(and_bracket);

    return when_data;
}

function get_row_then_data() {
    let then_data = [];
    let then_items = $("#then-container");
    for (let i = 0; i < then_items.length; i += 1) {
        let obj = {
            "id": $(then_items[i]).find(".pick-col-button .sel-name").attr("id"),
            "action": $(then_items[i]).find(".pick-then-condition").text().trim(),
            "value": $(then_items[i]).find(".then-value").val().trim()
        };

        if (obj["action"] === "REPLACE") obj["value_replace"] = $(then_items[i]).find(".with-value").val().trim();
        if (parseInt(obj["id"]) === -1) obj["dyn_col"] = $(then_items[i]).find(".dyncol-value").val().trim();

        then_data.push(obj);
    }
    return then_data;
}

function request_create_row_rm() {
    start_loading_animation();

    $.ajax({
        url: "/api/rm/create/row",
        data: {
            "when_data": JSON.stringify(get_row_when_data()),
            "then_data": JSON.stringify(get_row_then_data())
        },
        success: function (data) {
            stop_loading_animation();
            $("#row-rm-ui-modal .save-button").prop("disabled", false);

            let json = JSON.parse(data);
            if (json.success) {
                hide_row_rm_ui_modal();
                request_get_all_rm();
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            $("#row-rm-ui-modal .save-button").prop("disabled", false);
            alert(data.responseText);
        }
    });
}

function request_edit_row_rm() {
    start_loading_animation();

    $.ajax({
        url: "/api/rm/edit/row",
        data: {
            "id": edit_rm_id,
            "when_data": JSON.stringify(get_row_when_data()),
            "then_data": JSON.stringify(get_row_then_data())
        },
        success: function (data) {
            stop_loading_animation();
            $("#row-rm-ui-modal .save-button").prop("disabled", false);

            let json = JSON.parse(data);
            if (json.success) {
                hide_row_rm_ui_modal();
                $("#rms-container").click();
                request_get_all_rm();
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            $("#row-rm-ui-modal .save-button").prop("disabled", false);
            alert(data.responseText);
        }
    });
}

function request_get_all_rm() {
    start_loading_animation();
    $.ajax({
        url: "/api/rm/get_all",
        success: function (data) {
            stop_loading_animation();
            $("#rm-list").empty();

            let json = JSON.parse(data);
            if (json.success) {
                JSON.parse(json.items).forEach(function (item) {
                    add_rm_col_item(item);
                });
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            alert(data.responseText);
        }
    });
}

function request_delete_rm(id) {
    start_loading_animation();

    $.ajax({
        url: "/api/rm/delete",
        data: {
            "id": id,
        },
        success: function (data) {
            stop_loading_animation();

            let json = JSON.parse(data);

            if (json.success) {
                hide_simple_modal();
                request_get_all_rm();
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function request_get_single(id) {
    start_loading_animation();

    $.ajax({
        url: "/api/rm/get_single",
        data: {
            "id": id,
        },
        success: function (data) {
            stop_loading_animation();

            let json = JSON.parse(data);

            if (json.success) {
                let obj = JSON.parse(json.obj);

                if (obj.type === "col") {
                    apply_single_col_rm(obj);
                } else if (obj.type === "row") {
                    apply_single_row_rm(obj);
                }
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

// UX
function render_table_heads(cols) {
    let head_tr = $("#head-tr");
    head_tr.empty();

    cols.forEach(function (i) {
        let opacity = 0;
        head_tr.append('' +
            '<th scope="col" id="' + i.id + '">' +
            '<div class="th-width">' +
            '<div class="col-name-container"><p>' + i.name + '</p><i class="fas fa-pen"></i></div>' +
            '<input type="text" class="form-control col-rename-input">' +
            '</div>' +
            '</th>');
    });
}

function render_table_body(cols, rows) {
    tf_table_cols = cols;
    tf_table_rows = rows;
    update_pagination();
}

function update_pagination() {
    $("#table-body").empty();

    let page_l = $("#page-l");
    let page_r = $("#page-r");

    all_pages = Math.ceil(tf_table_rows.length / items_per_page);
    let offset = (current_page - 1) * items_per_page;
    if (current_page === 1) offset = 0;

    for (let i in tf_table_rows.slice(offset)) {
        i = parseInt(i, 10);
        if (i >= items_per_page) break;

        add_to_table(tf_table_cols, tf_table_rows.slice(offset)[i], (i + offset + 1));
    }

    $("#current-page").text(current_page + "/" + all_pages);

    page_l.attr("disabled", false);
    page_r.attr("disabled", false);

    if (current_page >= all_pages) page_r.attr("disabled", true);
    if (current_page === 1) page_l.attr("disabled", true);
}

function add_to_table(cols, row, index) {
    let to_append = '<tr>';

    let i;
    for (i = 0; i < cols.length; i += 1) {
        if (cols[i].name === "#") {
            to_append += '<td>' + index + '</td>';
        } else {
            to_append += '<td>' + row[cols[i].name] + '</td>';
        }
    }

    to_append += '</tr>';
    $("#table-body").append(to_append);
}

function show_col_rm_ui_modal() {
    last_scroll_y = $(window).scrollTop();
    $("html, body").animate({scrollTop: 0}, "slow");

    let modal = $("#col-rm-ui-modal");
    let spanner = $("#spanner");

    let columns = $("#head-tr").find(".col-name-container p");

    $(".col-rm-dropdown").empty();
    for (let i = 0; i < columns.length; i += 1) {
        let name = $(columns[i])[0].innerText;
        let id = $($(columns[i])[0].parentElement.parentElement.parentElement).attr("id");

        $(".col-rm-dropdown").append("<a class='dropdown-item' href='#' id='" + id + "'>" + name + "</a>");
    }

    spanner.fadeIn(200);
    modal.fadeIn(200);
}

function hide_col_rm_ui_modal() {
    edit_rm_id = null;

    $("#col-rm-ui-modal").fadeOut(100);
    $("#spanner").fadeOut(100);

    $("#col-rm-ui-modal #edit-mode").text("erstellen");
    $("#when-is").removeClass("btn-selected");
    $("#when-contains").removeClass("btn-selected");
    $("#then-apply").removeClass("btn-selected");
    $("#then-replace").removeClass("btn-selected");

    $("#col-when-value").val("");
    $("#col-then-value").val("");
    $("html, body").animate({scrollTop: last_scroll_y}, "slow");
}

function show_row_rm_ui_modal() {
    last_scroll_y = $(window).scrollTop();
    $("html, body").animate({scrollTop: 0}, "slow");

    let modal = $("#row-rm-ui-modal");
    let spanner = $("#spanner");

    spanner.fadeIn(200);
    modal.fadeIn(200);
}

function hide_row_rm_ui_modal() {

    $("#row-rm-ui-modal").fadeOut(100);
    $("#spanner").fadeOut(100);

    $("#row-rm-ui-modal .save-button").removeClass("edit");
    $("#row-rm-ui-modal #edit-mode").text("erstellen");

    $("#when-rows-container").empty();
    $("#then-container").empty();
    $("html, body").animate({scrollTop: last_scroll_y}, "slow");
}

function add_when_row() {
    let html = "<div class='when-row-container when-item'>\n" +
        "<div class='dropdown'>\n" +
        "<button class='btn btn-primary dropdown-toggle pick-col-button' type='button' data-toggle='dropdown'\n" +
        "aria-haspopup='true' aria-expanded='false'>\n" +
        "<i class='fas fa-caret-down'></i><span class='sel-name'>Spalte auswählen</span>\n" +
        "</button>\n" +

        "<div class='dropdown-menu row-cols-dropdown' aria-labelledby='pick-col-button'>\n" +
        "</div>\n" +

        "</div>\n" +

        "<div class='dropdown'>\n" +
        "<button class='btn btn-primary dropdown-toggle pick-when-condition' type='button' data-toggle='dropdown'\n" +
        "aria-haspopup='true' aria-expanded='false'>\n" +
        "<i class='fas fa-caret-down'></i><span class='sel-name'>WHEN</span>\n" +
        "</button>\n" +
        "<div class='dropdown-menu when-dropdown' aria-labelledby='pick-when-condition'>\n" +
        "<a class='dropdown-item when-is' href='#'>IS</a>\n" +
        "<a class='dropdown-item when-is' href='#'>CONTAINS</a>\n" +
        "</div>\n" +
        "</div>\n" +
        "<input type='text' class='form-control when-value'>" +
        "<i class='fas fa-times delete'>" +
        "</div>";

    $("#when-rows-container").append(html);
    let last_added = $($("#when-rows-container").children()[$("#when-rows-container").children().length - 1]);

    let columns = $("#head-tr").find(".col-name-container p");

    last_added.find(".row-cols-dropdown").empty();
    for (let i = 0; i < columns.length; i += 1) {
        let name = $(columns[i])[0].innerText;
        let id = $($(columns[i])[0].parentElement.parentElement.parentElement).attr("id");

        last_added.find(".row-cols-dropdown").append("<a class='dropdown-item' href='#' id='" + id + "'>" + name + "</a>");
    }

    last_added.find(".row-cols-dropdown .dropdown-item").click(function (e) {
        $(this).parent().parent().find(".sel-name").text($(this)[0].innerText);
        $(this).parent().parent().find(".sel-name").attr("id", $(this).attr("id"));
    });

    last_added.find(".delete").click(function (e) {
        last_added.remove();
    });
}

function add_or_sep() {
    let html = "<div class='or-sep-container when-item'>" +
        "<div class='line-l'></div>" +
        "<p>oder</p>" +
        "<div class='line-r'></div>" +
        "<i class='fas fa-times delete'>" +
        "</div>";

    $("#when-rows-container").append(html);
    let last_added = $($("#when-rows-container").children()[$("#when-rows-container").children().length - 1]);
    last_added.find(".delete").click(function (e) {
        last_added.remove();
    });
}

function add_then_container() {
    let html = "<div class='add-then-container'>" +
        "<div class='cols-dropdown-container'>" +
        "<div class='dropdown'>" +
        "<button class='btn btn-primary dropdown-toggle pick-col-button' type='button' data-toggle='dropdown'" +
        "aria-haspopup='true' aria-expanded='false'>" +
        "<i class='fas fa-caret-down'></i><span class='sel-name'>Spalte auswählen</span>" +
        "</button>" +

        "<div class='dropdown-menu row-cols-dropdown' aria-labelledby='pick-col-button'>" +
        "</div>" +
        "<input type='text' class='form-control dyncol-value'>" +
        "</div>" +

        "</div>" +

        "<div class='dropdown'>" +
        "<button class='btn btn-primary dropdown-toggle pick-then-condition' type='button' data-toggle='dropdown'" +
        "aria-haspopup='true' aria-expanded='false'>" +
        "<i class='fas fa-caret-down'></i><span class='sel-name'>THEN</span>" +
        "</button>" +
        "<div class='dropdown-menu then-dropdown' aria-labelledby='pick-then-condition'>" +
        "<a class='dropdown-item then-apply' href='#'>APPLY</a>" +
        "<a class='dropdown-item then-replace' href='#'>REPLACE</a>" +
        "</div>" +
        "</div>" +
        "<div class='input-values'>" +
        "<input type='text' class='form-control then-value'>" +
        "<input type='text' class='form-control with-value'>" +
        "</div>" +
        "<i class='fas fa-times delete'>" +
        "</div>";

    $("#then-container").append(html);
    let last_added = $($("#then-container").children()[$("#then-container").children().length - 1]);

    let columns = $("#head-tr").find(".col-name-container p");

    last_added.find(".row-cols-dropdown").empty();
    for (let i = 0; i < columns.length; i += 1) {
        let name = $(columns[i])[0].innerText;
        let id = $($(columns[i])[0].parentElement.parentElement.parentElement).attr("id");

        last_added.find(".row-cols-dropdown").append("<a class='dropdown-item' href='#' id='" + id + "'>" + name + "</a>");
    }
    last_added.find(".row-cols-dropdown").append("<a class='dropdown-item' href='#' id='-1'>* Neue Spalte</a>");

    last_added.find(".row-cols-dropdown .dropdown-item").click(function (e) {
        if (parseInt($(this).attr("id")) === -1) {
            $(this).parent().parent().find(".dyncol-value").show();
        } else {
            $(this).parent().parent().find(".dyncol-value").hide();
            $(this).parent().parent().find(".sel-name").text($(this)[0].innerText);
            $(this).parent().parent().find(".sel-name").attr("id", $(this).attr("id"));
        }
    });

    last_added.find(".delete").click(function (e) {
        last_added.remove();
    });
}

function add_rm_col_item(item) {
    let type_class = "col-type";
    if (item.type === "row") {
        type_class = "row-type";
    }

    let html = "<div class='rm-col-item' id='" + item.id + "'>" +
        "<i class='far fa-trash-alt rm-delete'></i>" +
        "<div class='inline'>" +
        "<p class='type " + type_class + "'>" + item.type + "</p>" +
        "<p class='name'>" + item.name + "</p>" +
        "</div>" +
        "</div>";

    $("#rm-list").append(html);
}

// Events
function register_rename_tf_events() {
    let name_container = $("#name-container");
    let name_display = $("#name-display");
    let tf_rename = $("#tf-rename");

    if (name_container.click(function (e) {
        name_display.hide();
        tf_rename.val($("#name-display h1").text());
        tf_rename.show();
        tf_rename.focus();
    })) ;


    tf_rename.keyup(function (e) {
        if (e.key === "Escape") {
            tf_rename.hide();
            name_display.show();
        } else if (e.key === "Enter") {
            request_rename_tf(tf_rename.val());
        }
    });
}

function register_col_rm_events() {
    $("#create-new-col-rm").click(function (e) {
        show_col_rm_ui_modal();
    });

    $("#when-is").click(function (e) {
        $("#when-contains").removeClass("btn-selected");
        $(this).addClass("btn-selected");
        $("#then-apply").addClass("btn-selected");
        $("#then-replace").prop("disabled", true);
    });

    $("#when-contains").click(function (e) {
        $(this).addClass("btn-selected");
        $("#when-is").removeClass("btn-selected");
        $("#then-apply").removeClass("btn-selected");
        $("#then-replace").prop("disabled", false);
    });

    $("#then-apply").click(function (e) {
        $(this).addClass("btn-selected");
        $("#when-is").prop("disabled", false);
        $("#then-replace").removeClass("btn-selected");
    });

    $("#then-replace").click(function (e) {
        $(this).addClass("btn-selected");
        $("#when-is").prop("disabled", true);
        $("#then-apply").removeClass("btn-selected");
    });

    $("#col-rm-ui-modal .save-button").click(function (e) {
        $(this).prop("disabled", true);

        if (edit_rm_id !== null) request_edit_col_rm();
        else request_create_col_rm();
    });

    $("#col-rm-ui-modal #close").click(function (e) {
        e.preventDefault();
        hide_col_rm_ui_modal();
    });
}

function register_row_rm_events() {
    $(document).on("click." + $("#namespace").attr("ns"), "#create-new-row-rm", function (e) {
        show_row_rm_ui_modal();
    });

    $(document).on("click." + $("#namespace").attr("ns"), "#row-rm-ui-modal #close", function (e) {
        e.preventDefault();
        hide_row_rm_ui_modal();
    });

    $(document).on("click." + $("#namespace").attr("ns"), "#add-row-button", function (e) {
        add_when_row();
    });

    $(document).on("click." + $("#namespace").attr("ns"), "#add-or-sep-button", function (e) {
        add_or_sep();
    });

    $(document).on("click." + $("#namespace").attr("ns"), "#add-then-button", function (e) {
        add_then_container();
    });

    $(document).on("click." + $("#namespace").attr("ns"), "#row-rm-ui-modal .save-button", function (e) {
        $(this).prop("disabled", true);
        if ($(this).hasClass("edit")) request_edit_row_rm();
        else request_create_row_rm();
    });

}

var main = function () {
    request_tf_preview();
    request_get_all_rm();

    $("#right-panel").show("slide", {direction: "right"}, 200);

    $("#name-display h1").text($("#ef-name").text());

    $("#page-r").click(function (e) {
        e.preventDefault();

        if (current_page < all_pages) {
            current_page += 1;
            update_pagination();
        }
    });

    $("#page-l").click(function (e) {
        e.preventDefault();

        if (current_page >= 2) {
            current_page -= 1;
            update_pagination();
        }
    });

    register_rename_tf_events();
    register_col_rm_events();
    register_row_rm_events();

    $('#rm-activate-checkbox').on("change." + $("#namespace").attr("ns"), function () {
        let checked = $(this).prop('checked');

        if (checked) request_tf_preview_with_rm();
        else request_tf_preview();
    });
};

$(document).ready(main);

$(document).on("click." + $("#namespace").attr("ns"), ".col-name-container", function () {
    let col_name = $(this);
    let col_id = col_name.parent().parent().attr("id");
    col_name.css("display", "none");

    let input = $(this).parent().find(".col-rename-input");
    input.val($(this).text());
    input.show();
    input.focus();

    input.keyup(function (e) {
        if (e.key === "Escape") {
            input.hide();
            col_name.css("display", "inline-flex");
        } else if (e.key === "Enter") {
            request_rename_col(col_id, col_name, input);
        }
    });
});

$(document).on("click." + $("#namespace").attr("ns"),
    ".col-rm-dropdown .dropdown-item", function (e) {
        e.preventDefault();
        selected_col_rm_name = $(this);
        $("#select-col-button .sel-name").text($(this)[0].innerText);
    });

$(document).on("click." + $("#namespace").attr("ns"),
    ".row-cols-dropdown .dropdown-item", function (e) {
        e.preventDefault();
        $(this).parent().parent().find(".sel-name").text($(this)[0].innerText);
        $(this).parent().parent().find(".sel-name").attr("id", $(this).attr("id"));
    });

$(document).on("click." + $("#namespace").attr("ns"),
    ".when-dropdown .dropdown-item", function (e) {
        e.preventDefault();
        $(this).parent().parent().find(".sel-name").text($(this)[0].innerText);
    });

$(document).on("click." + $("#namespace").attr("ns"),
    ".then-dropdown .dropdown-item", function (e) {
        e.preventDefault();
        $(this).parent().parent().find(".sel-name").text($(this)[0].innerText);

        let dropdown = $(this).parent();
        let then_input = $(this).parent().parent().parent().find(".then-value");
        let with_input = $(this).parent().parent().parent().find(".with-value");

        if ($(this)[0].innerText === "REPLACE") {
            then_input.attr("placeholder", "Ersetze");
            with_input.attr("placeholder", "Mit");
            dropdown.css("margin-top", -48);
            with_input.show();
        } else {
            then_input.attr("placeholder", "Übernehme");
            dropdown.css("margin-top", "");
            with_input.hide();
        }
    });

$(document).on("click." + $("#namespace").attr("ns"), ".rm-col-item", function (e) {
    e.preventDefault();
    edit_rm_id = $(this).attr("id");
    request_get_single($(this).attr("id"));
});

$(document).on("click." + $("#namespace").attr("ns"), ".rm-delete", function (e) {
    e.preventDefault();
    e.stopPropagation();
    let name = $(e.currentTarget.parentElement).find(".name").text();
    let msg = "Möchten Sie wirklich <b>" + name + "</b> löschen?";
    let id = $(e.currentTarget.parentElement).attr("id");
    show_simple_modal("Regelmodul löschen", msg, request_delete_rm(id));
});

$(document).on("change." + $("#namespace").attr("ns"),
    "#rm-activate-checkbox", function (e) {
        let checked = $(this).prop('checked');
        if (checked) request_tf_preview_with_rm();
        else request_tf_preview();
    });
