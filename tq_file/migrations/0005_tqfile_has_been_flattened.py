# Generated by Django 2.2.4 on 2019-10-10 11:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tq_file', '0004_tqfile_archived'),
    ]

    operations = [
        migrations.AddField(
            model_name='tqfile',
            name='has_been_flattened',
            field=models.BooleanField(default=False),
        ),
    ]
