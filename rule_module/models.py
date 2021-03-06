import json
from django.db import models
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from final_fusion.models import FinalFusion


class RuleModule(models.Model):
    """
    A RuleModle object encapsulates a column- or a row-rule module.
    """
    creation_date = models.DateTimeField(default=timezone.now)
    archived = models.BooleanField(default=False)
    name = models.CharField(max_length=100)
    final_fusion = models.ForeignKey(FinalFusion, on_delete=models.CASCADE)

    # COL or ROW
    rule_type = models.CharField(max_length=10)
    # COL-Case, on which column of the TF this rule module should be applied to.
    col_subject = models.CharField(max_length=200, null=True)
    if_conditions = models.CharField(max_length=1000)
    then_cases = models.CharField(max_length=1000)

    def depending_dynamic_columns(self):
        """
        Will return a list of FFC objects (their names), which were created by this rule module.
        """
        ret = []
        if not self.archived:
            for td in json.loads(self.then_cases):
                if "was_dynamic" in td and td["was_dynamic"] and "ffc_name" in td:
                    ret.append(td["ffc_name"])
        return ret

    def is_valid(self):
        """
        :return True, if FFCs, which are in the condition of this rule module, still exist
        or have the same name as in creation time.
        """
        from final_fusion_column.models import FinalFusionColumn

        if self.rule_type == "col":
            col_pk = json.loads(self.col_subject)[0]
            return len(FinalFusionColumn.objects.filter(pk=col_pk, archived=False)) == 1

        elif self.rule_type == "row":
            for cond in json.loads(self.if_conditions):
                for c in cond:
                    try:
                        ffc = FinalFusionColumn.objects.get(pk=c["id"], archived=False)
                        if c["ffc_name"] != ffc.display_column_name:
                            return False
                    except ObjectDoesNotExist:
                        return False
            return True

    def __str__(self):
        return "#%d: (%s) Rule: %s" % (self.pk, self.rule_type, self.name)
