import json
import security.token_checker as token_checker
import dashboard.includer as dashboard_includer
from django.conf import settings
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.middleware.csrf import get_token as get_csrf_token
from tq_file.file_parsers.file_parser_json import FileParserJSON
from tq_file.file_parsers.file_parser_xml import FileParserXML
from tq_file.file_parsers.file_parser_xls_x import FileParserXLSx
from tq_file.file_parsers.file_parser_xlsb import FileParserXLSB
from final_fusion_column.models import FinalFusionColumn
from final_fusion.models import FinalFusion
from tq_file.models import TQFile
from project.models import Project
from security.args_checker import ArgsChecker
from .tq_flattener import TQFlattener


def delegate_to_parser(file_path, extension, sheet):
    """
    delegate_to_parser_
    """
    json_parser = FileParserJSON()
    xml_parser = FileParserXML()
    xls_x_parser = FileParserXLSx()
    xlsb_parser = FileParserXLSB()

    if json_parser.handles_file_type(extension):
        return json_parser.start_parse(file_path)

    if xml_parser.handles_file_type(extension):
        return xml_parser.start_parse(file_path)

    if xls_x_parser.handles_file_type(extension):
        return xls_x_parser.start_parse(file_path, sheet)

    if xlsb_parser.handles_file_type(extension):
        return xlsb_parser.start_parse(file_path, sheet)

    return False


def preparse_get_sheets(file_path, extension):
    """
    preparse_get_sheet
    """
    xls_x_parser = FileParserXLSx()
    xlsb_parser = FileParserXLSB()

    if xls_x_parser.handles_file_type(extension):
        return xls_x_parser.get_sheet_names(file_path)

    if xlsb_parser.handles_file_type(extension):
        return xlsb_parser.get_sheet_names(file_path)

    return None


def do_select_column(request):
    """
    do_select_column
    """
    added = False

    valid_user = token_checker.token_is_valid(request)
    if valid_user and "tq_id" in request.GET and ArgsChecker.is_number(request.GET["tq_id"]) \
            and "col_name" in request.GET and not ArgsChecker.str_is_malicious(request.GET["col_name"]):
        tq_id = request.GET["tq_id"]
        col_name = request.GET["col_name"]

        try:
            tq = TQFile.objects.get(pk=tq_id)
            col = tq.get_column(col_name)

            ef = FinalFusion.objects.get(project=Project.objects.get(pk=valid_user.last_opened_project_id))
            ffc_fetch = FinalFusionColumn.objects.filter(final_fusion=ef, source_tq=tq, source_column_name=col_name)

            if len(ffc_fetch) == 0:
                FinalFusionColumn.objects.create(
                    final_fusion=ef,
                    source_tq=tq,
                    source_column_name=col_name,
                    display_column_name=col_name,
                    rows_json=json.dumps(col)
                )
                added = True
            elif len(ffc_fetch) == 1:
                if not ffc_fetch[0].archived:
                    ffc_fetch[0].archived = True
                    ffc_fetch[0].save()
                    added = False
                else:
                    ffc_fetch[0].archived = False
                    ffc_fetch[0].save()
                    added = True
        except ObjectDoesNotExist:
            pass

    return HttpResponse(json.dumps({"added": added}))


def do_select_all(request):
    """
    do_select_all
    """
    success = False

    valid_user = token_checker.token_is_valid(request)
    if valid_user and "tq_id" in request.GET and ArgsChecker.is_number(request.GET["tq_id"]):
        proj = Project.objects.get(pk=valid_user.last_opened_project_id)
        ff = FinalFusion.objects.get(project=proj)

        tq = TQFile.objects.get(pk=request.GET["tq_id"], project=proj, archived=False)
        for dic in json.loads(tq.content_json):
            for col in dic.keys():
                if len(FinalFusionColumn.objects.filter(source_tq=tq,
                                                        archived=False,
                                                        source_column_name=col)) == 0:
                    FinalFusionColumn.objects.create(
                        final_fusion=ff,
                        source_tq=tq,
                        source_column_name=col,
                        display_column_name=col,
                        rows_json=json.dumps(tq.get_column(col))
                    )
            break
        success = True

    return HttpResponse(json.dumps({"success": success}))


def do_upload_tq(request):
    """
    do_upload_tq
    """
    success = False
    msg = None
    data = None

    valid_user = token_checker.token_is_valid(request)
    if valid_user:
        if request.method == 'POST' and "file" in request.FILES:
            file = request.FILES["file"]
            task_id = request.GET["task_id"]

            if not ArgsChecker.str_is_malicious(task_id) and not ArgsChecker.str_is_malicious(file.name):
                filename_spl = file.name.split(".")
                extension = filename_spl[len(filename_spl) - 1]

                # Write into a file
                file_path = "%s/%s" % (settings.TQ_UPLOAD_DIR, file.name)
                with open(file_path, 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)

                if (extension == "xlsx" or extension == "xlsb") and len(request.GET["sheet_names"]) < 1 \
                        and not ArgsChecker.str_is_malicious(request.GET["sheet_names"]):
                    sheets = preparse_get_sheets(file_path, extension)
                    msg = "sheet_check"
                    if sheets:
                        data = sheets
                    else:
                        msg = "syntax"
                else:
                    sheet_names = None
                    if not ArgsChecker.str_is_malicious(request.GET["sheet_names"]):
                        sheet_names = [x for x in request.GET["sheet_names"].split(",") if len(x) > 1]

                    if len(sheet_names) > 0:
                        for sheet in sheet_names:
                            json_parsed = delegate_to_parser(file_path, extension, sheet)

                            if json_parsed:
                                TQFile.objects.create(
                                    project=valid_user.get_project(),
                                    source_file_name="%s/%s" % (file.name, sheet),
                                    display_file_name=file.name,
                                    content_json=json_parsed
                                )
                                success = True
                            else:
                                msg = "Uploaded file not supported"
                    else:
                        json_parsed = delegate_to_parser(file_path, extension, None)

                        if json_parsed and TQFlattener.keys_are_even(json_parsed):
                            json_parsed_flat = TQFlattener.flatten(json_parsed)
                            has_been_flattened = json_parsed != json_parsed_flat
                            json_parsed = json_parsed_flat

                            TQFile.objects.create(
                                project=valid_user.get_project(),
                                source_file_name=file.name,
                                display_file_name=file.name,
                                content_json=json_parsed,
                                has_been_flattened=has_been_flattened
                            )
                            success = True
                        elif json_parsed and not TQFlattener.keys_are_even(json_parsed):
                            msg = "not_even"
                        else:
                            msg = "syntax"

    else:
        msg = "User is not valid"

    return HttpResponse(json.dumps(
        {
            "success": success,
            "msg": msg,
            "data": data
        }))


def do_rename(request):
    """
    do_rename
    """
    success = False
    valid_user = token_checker.token_is_valid(request)

    if valid_user and "name" in request.GET and not ArgsChecker.str_is_malicious(request.GET["name"]) \
            and "id" in request.GET and not ArgsChecker.str_is_malicious(request.GET["id"]):

        tq = TQFile.objects.get(pk=request.GET["id"])
        tq.display_file_name = request.GET["name"]
        tq.save()
        success = True

    return HttpResponse(json.dumps({"success": success}))


def do_delete(request):
    """
    do_delete
    """
    success = False
    valid_user = token_checker.token_is_valid(request)

    if valid_user and "id" in request.GET and not ArgsChecker.str_is_malicious(request.GET["id"]):

        tq = TQFile.objects.get(pk=request.GET["id"])
        tq.archived = True
        tq.save()
        success = True

    return HttpResponse(json.dumps({"success": success}))


def render_all_tqs(request):
    """
    render_all_tqs
    """
    success = False
    tq_list = []

    valid_user = token_checker.token_is_valid(request)

    if valid_user:
        if valid_user.last_opened_project_id:
            project = Project.objects.get(pk=valid_user.last_opened_project_id)
            for tq in TQFile.objects.filter(project=project, archived=False):
                tq_list.append({
                    "id": tq.pk,
                    "name": tq.display_file_name
                })
            success = True

    return HttpResponse(json.dumps(
        {
            "success": success,
            "tqs": tq_list,
        }))


def i_render_single_tq(request):
    """
    i_render_single_tq
    """
    valid_user = token_checker.token_is_valid(request)
    if valid_user and "id" in request.GET and ArgsChecker.is_number(request.GET["id"]):
        tq = TQFile.objects.get(pk=request.GET["id"], archived=False)
        dic = {
            "id": tq.pk,
            "name": tq.display_file_name,
            "created": tq.creation_date.strftime('%d.%m.%Y')
        }
        return dashboard_includer.get_as_json("tq_file/_view.html", template_context=dic)


def render_single_tq_table(request):
    """
    i_render_single_tq_table
    """
    success = False
    table_data = None
    flattened = False

    valid_user = token_checker.token_is_valid(request)
    if valid_user and "id" in request.GET and ArgsChecker.is_number(request.GET["id"]):
        tq = TQFile.objects.get(pk=request.GET["id"])
        table_data = tq.get_as_table(valid_user)
        flattened = tq.has_been_flattened
        success = True

    return HttpResponse(json.dumps(
        {
            "success": success,
            "table_data": table_data,
            "has_been_flattened": flattened
        }))


def i_render_import(request):
    """
    i_render_import
    """
    valid_user = token_checker.token_is_valid(request)
    if valid_user:
        dic = {
            "csrf_token": get_csrf_token(request)
        }
        return dashboard_includer.get_as_json("tq_file/_import.html", template_context=dic)
