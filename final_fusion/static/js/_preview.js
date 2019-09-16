var tf_table_cols = null;
var tf_table_rows = null;
var current_page = 1;
var all_pages = null;
var items_per_page = 12;
var selected_col_rm_name = null;

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
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            $("#col-rm-ui-modal #save-button").prop("disabled", false);
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
    $("html, body").animate({ scrollTop: 20 }, "slow");

    let simple_modal = $("#col-rm-ui-modal");
    let spanner = $("#spanner");

    let columns = $("#head-tr").find(".col-name-container p");

    $(".col-rm-dropdown").empty();
    for(let i=0; i<columns.length; i+=1) {
        let name = $(columns[i])[0].innerText;
        let id = $($(columns[i])[0].parentElement.parentElement.parentElement).attr("id");

        $(".col-rm-dropdown").append("<a class='dropdown-item' href='#' id='"+ id +"'>" + name + "</a>");
    }

    spanner.fadeIn(200);
    simple_modal.fadeIn(200);
}

function hide_col_rm_ui_modal() {
    $("#col-rm-ui-modal").fadeOut(100);
    $("#spanner").fadeOut(100);

    $("#when-is").removeClass("btn-selected");
    $("#when-contains").removeClass("btn-selected");
    $("#then-apply").removeClass("btn-selected");
    $("#then-replace").removeClass("btn-selected");

    $("#col-when-value").val("");
    $("#col-then-value").val("");
    $("html, body").animate({ scrollTop: last_scroll_y }, "slow");
}

var main = function () {
    request_tf_preview();
    $("#right-panel").show("slide", {direction: "right"}, 200);

    $("#name-display h1").text($("#ef-name").text());

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

    $("#col-rm-ui-modal #save-button").click(function (e) {
        $(this).prop("disabled", true);
        request_create_col_rm();
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
    "#col-rm-ui-modal #close", function (e) {
    e.preventDefault();
    hide_col_rm_ui_modal();
});

$(document).on("click." + $("#namespace").attr("ns"), ".col-rm-dropdown .dropdown-item", function (e) {
    e.preventDefault();
    selected_col_rm_name = $(this);
    $("#select-col-button #sel-name").text($(this)[0].innerText);
});

