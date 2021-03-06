function request_signup() {
    let error = $("#server-response");
    error.hide();
    start_loading_animation();

    $.ajax({
        type: 'POST',
        headers:{
            "X-CSRFToken": $("[name=csrfmiddlewaretoken]").val()
        },
        url: "/api/user/signup/",
        data: {
            "email": $("#corp-mail").val(),
            "pw1": $("#password").val(),
            "pw2": $("#password-r").val()
        },
        success: function (data) {
            stop_loading_animation();

            let json = JSON.parse(data);

            if (json.success) {
                window.location = "/";
            } else {
                error.show();
                error.text("Fehler: " + json.msg);
            }
        },
        error: function (data, exception) {
            alert(data.responseText);
        }
    });
}

function validate() {
    let error = $("#server-response");
    let email = $("#corp-mail").val();
    let pw1 = $("#password").val();
    let pw2 = $("#password-r").val();

    if (is_valid_email(email)) {
            if (pw1 === pw2 && pw1.length >= 8) {
                return true;
            }
            else {
                error.show();
                error.text("Passwörter sind nicht gleich.");
            }
        } else {
            error.show();
            error.text("Email nicht valide (muss @daimler.com) sein.");
        }
    return false;
}

var main = function () {
    hide_top_bar_controls();

    $("#signup-button").click(function (e) {
        if (validate()) request_signup();
    });
};

$(document).ready(main);
