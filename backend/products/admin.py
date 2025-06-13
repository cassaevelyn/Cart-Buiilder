from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'seller', 'price', 'stock', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'seller')
    search_fields = ('name', 'description', 'seller__email', 'seller__first_name', 'seller__last_name')
    list_editable = ('is_active', 'stock')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'seller')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'stock')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )