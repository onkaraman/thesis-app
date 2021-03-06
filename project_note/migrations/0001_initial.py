# Generated by Django 2.2.4 on 2019-10-16 08:55

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('project', '0003_project_archived'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectNote',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('creation_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('archived', models.BooleanField(default=False)),
                ('name', models.CharField(max_length=50)),
                ('content', models.TextField(max_length=500)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='project.Project')),
            ],
        ),
    ]
