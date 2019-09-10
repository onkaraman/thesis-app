import json
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string


def get_static_path(filename):
    if "." in filename:
        extension = filename.split(".")[1]
        return settings.STATIC_URL + "%s/%s" % (extension, filename)
    else:
        raise Exception("Filename needs to be defined with extension")


def get_as_json(template_url, template_context=None, different_css=None, different_js=None):
    """
    get_as_json
    """
    if ".html" not in template_url:
        raise Exception("Template URL doesn't seem legit")
    else:
        t_spl = template_url.split("/")
        template_name = t_spl[len(t_spl)-1]

        if template_name.startswith("_"):
            css_path = get_static_path(template_name.replace("html", "css"))
            if different_css:
                css_path = get_static_path(different_css)

            js_path = get_static_path(template_name.replace("html", "js"))
            if different_js:
                js_path = get_static_path(different_js)

            if not template_context:
                template_context = {}
            template_context["namespace"] = template_name.split(".")[0]

            return HttpResponse(json.dumps(
                {
                    "html": str(render_to_string(template_url, template_context)),
                    "css": css_path,
                    "namespace": template_context["namespace"],
                    "js": js_path,
                }))

        else:
            raise Exception("Include template must start with an _underscore")