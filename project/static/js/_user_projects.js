// UX
function add_tq_ui(item) {
    $("#tqs-container").append(
        '<div class="panel-button panel-button-accented">' +
            '<i class="far fa-clone panel-icon"></i>' +
            '<p>' + item.name + '</p>' +
        '</div>'
    );
}


// Requests
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
                request_tqs();
            }

            request_template_include("/include/project/new");
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function request_tqs() {
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

var main = function () {
    request_tqs();

    let click_area = $(".project-item .click-area");

    if (click_area.mouseover(function (e) {
        let subject = $(e.currentTarget.parentElement);
        subject.css("background-color", "#d0d0d0");
        subject.css("border-bottom-color", "#0096b3");
    })) ;

    if (click_area.mouseleave(function (e) {
        let prev_background_color = "#e6e6e6";
        let prev_border_bottom_color = "#00677F";

        let subject = $(e.currentTarget.parentElement);
        subject.css("background-color", prev_background_color);
        subject.css("border-bottom-color", prev_border_bottom_color);
    })) ;

    if (click_area.click(function (e) {
        let id = $(e.currentTarget.parentElement).attr("id");
        request_load_project(id);
    })) ;


};

$(document).ready(main);