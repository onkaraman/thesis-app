import json
from django.db import models
from django.utils import timezone
from final_fusion.models import FinalFusion


class RuleModule(models.Model):
    """
    RuleModule
    """
    creation_date = models.DateTimeField(default=timezone.now)
    archived = models.BooleanField(default=False)
    name = models.CharField(max_length=100)
    final_fusion = models.ForeignKey(FinalFusion, on_delete=models.CASCADE)

    rule_type = models.CharField(max_length=10)
    col_subject = models.CharField(max_length=200, null=True)
    if_conditions = models.CharField(max_length=1000)
    then_cases = models.CharField(max_length=1000)

    def depending_dynamic_columns(self):
        """
        depending_dynamic_columns
        """
        ret = []
        if not self.archived:
            for td in json.loads(self.then_cases):
                if "dyn_col" in td:
                    ret.append(td["dyn_col"])
        return ret

    def is_valid(self):
        """
        is_valid
        """
        from final_fusion_column.models import FinalFusionColumn

        if self.rule_type == "col":
            col_pk = json.loads(self.col_subject)[0]
            return len(FinalFusionColumn.objects.filter(pk=col_pk, archived=False)) == 1

        elif self.rule_type == "row":
            for cond in json.loads(self.if_conditions):
                for c in cond:
                    if len(FinalFusionColumn.objects.filter(pk=c["id"], archived=False)) == 0:
                        return False
            return True

    def __str__(self):
        return "#%d: (%s) Rule: %s" % (self.pk, self.rule_type, self.name)
