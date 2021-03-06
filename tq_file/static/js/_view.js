var tq_table_cols = null;
var tq_table_rows = null;
var current_page = 1;
var all_pages = null;
var items_per_page = 10;

var _ns = $("#namespace").attr("ns");

function request_tq_table_data(id) {
    start_loading_animation();

    $.ajax({
        data: {"id": id},
        url: "/api/tq/view",
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                render_table_heads(json.table_data["cols"]);
                render_table_body(json.table_data["cols"], json.table_data["rows"]);

                if (json.has_been_flattened) $("#flattened").show();
                else $("#flattened").hide();

                $("#view-tq-container").show();
                $("#loading-content-container").hide();
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function request_rename_tq(new_name) {
    let name_display = $("#name-display");
    let tq_rename = $("#tq-rename");

    start_loading_animation();
    $.ajax({
        url: "/api/tq/rename",
        data: {
            "id": $("#tq-id").attr("pk"),
            "name": new_name
        },
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.success) {
                $("#name-display h1").text(new_name);
                name_display.show();
                tq_rename.hide();
                request_load_tqs();
            }
        },
        error: function (data, exception) {
            stop_loading_animation();
            alert(data.responseText);
        }
    });
}

function request_delete_tq() {
    start_loading_animation();

    $.ajax({
        url: "/api/tq/delete",
        data: {
            "id": $("#tq-id").attr("pk")
        },
        success: function (data) {
            stop_loading_animation();

            let json = JSON.parse(data);
            if (json.success) {
                hide_simple_modal();
                request_template_include("/include/project/new", {});
                request_load_tqs();
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function request_select_column(col_name, jquery_obj) {
    start_loading_animation();
    $.ajax({
        url: "/api/tq/select_col",
        data: {
            "tq_id": $("#tq-id").attr("pk"),
            "col_name": col_name
        },
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            if (json.added) {
                jquery_obj.find(".tf-check").css("opacity", "1");
            } else {
                jquery_obj.find(".tf-check").css("opacity", "0");
            }

            request_check_export_visibility();
        },
        error: function (data, exception) {
            stop_loading_animation();
            alert(data.responseText);
        }
    });
}

function request_select_all_columns() {
    start_loading_animation();
    let id = $("#tq-id").attr("pk");

    $.ajax({
        url: "/api/tq/select_all_col",
        data: {
            "tq_id": id,
        },
        success: function (data) {
            stop_loading_animation();
            let json = JSON.parse(data);

            request_check_export_visibility();
            request_template_include("/include/tq/view", {"id": id});
        },
        error: function (data, exception) {
            stop_loading_animation();
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
        if (i.ef_added) opacity = 1;

        head_tr.append('<th scope="col"><div class="th-width"> '
            + i.name +
            '&nbsp;<i class="fas fa-check tf-check" style="opacity: '+ opacity +'"></i></div></th>');
    });
}

function render_table_body(cols, rows) {
    tq_table_rows = rows;
    tq_table_cols = cols;
    update_pagination();
}

function update_pagination() {
    $("#table-body").empty();

    let page_l = $("#page-l");
    let page_r = $("#page-r");

    all_pages = Math.ceil(tq_table_rows.length / items_per_page);
    let offset = (current_page - 1) * items_per_page;
    if (current_page === 1) offset = 0;

    for (let i in tq_table_rows.slice(offset)) {
        i = parseInt(i, 10);
        if (i >= items_per_page) break;

        add_to_table(tq_table_cols, tq_table_rows.slice(offset)[i], (i + offset + 1));
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

function register_events() {
    let name_container = $("#name-container");
    let name_display = $("#name-display");
    let tq_rename = $("#tq-rename");

    if (name_container.click(function (e) {
        name_display.hide();
        tq_rename.val($("#name-display h1").text());
        tq_rename.show();
        tq_rename.focus();
    })) ;

    tq_rename.keyup(function (e) {
        if (e.key === "Escape") {
            tq_rename.hide();
            name_display.show();
        } else if (e.key === "Enter") {
            request_rename_tq(tq_rename.val());
        }
    });

    $("#quick-links #take-all").click(function (e) {
        request_select_all_columns();
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

    $("#remove-tq-button").click(function (e) {
        show_simple_modal("Teilquelle löschen",
            "Möchten Sie wirklich diese TQ löschen?", request_delete_tq);
    });

}


var main = function () {
    $(document).off('.' + _ns);

    let id = $("#tq-id").attr("pk");
    request_tq_table_data(id);
    register_events();
};

$(document).ready(main);

$(document).on("mouseenter." + _ns, "td", function () {
    let t = parseInt($(this).index()) + 1;

    let th_nth = $('#tq-table th:nth-child(' + t + ')');
    let td_nth = $('#tq-table td:nth-child(' + t + ')');

    th_nth.css('background-color', '#dadada');
    th_nth.css('border-top-left-radius', '4px');
    th_nth.css('border-top-right-radius', '4px');

    td_nth.css('background-color', '#e7e7e7');
    td_nth.css('cursor', 'pointer');
});

$(document).on("click." + _ns, "td", function () {
    let t = parseInt($(this).index()) + 1;

    let th_nth = $('#tq-table th:nth-child(' + t + ')');
    let th_name = th_nth[0].textContent.trim();

    request_select_column(th_name, th_nth);
});

$(document).on("mouseleave." + _ns, "td", function () {
    let t = parseInt($(this).index()) + 1;
    let td_nth = $('#tq-table td:nth-child(' + t + ')');
    let th_nth = $('#tq-table th:nth-child(' + t + ')');

    //th_nth.find(".tf-check").css("opacity", "0");
    th_nth.css('background-color', '');
    th_nth.css('border-top-left-radius', '');
    th_nth.css('border-top-right-radius', '');

    td_nth.css('background-color', '');
    td_nth.css('cursor', '');
});

//# sourceURL=/static/js/_view.js