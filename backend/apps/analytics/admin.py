from django.contrib import admin

from .models import ProductEvent


@admin.register(ProductEvent)
class ProductEventAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "client_id", "source", "created_at")
    list_filter = ("name", "source", "created_at")
    search_fields = ("user__username", "user__email", "client_id")
    readonly_fields = ("created_at",)

