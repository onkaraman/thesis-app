# Generated by Django 2.2.4 on 2019-10-22 07:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('final_fusion', '0003_auto_20190909_1448'),
    ]

    operations = [
        migrations.AddField(
            model_name='finalfusion',
            name='ignore_duplicates',
            field=models.BooleanField(default=False),
        ),
    ]