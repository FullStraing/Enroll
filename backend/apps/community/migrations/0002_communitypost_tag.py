from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("community", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="communitypost",
            name="tag",
            field=models.CharField(
                blank=True,
                choices=[
                    ("essay", "Essay"),
                    ("visa", "Visa"),
                    ("financial_aid", "Financial Aid"),
                    ("documents", "Documents"),
                    ("deadlines", "Deadlines"),
                ],
                default="",
                max_length=30,
            ),
        ),
    ]
