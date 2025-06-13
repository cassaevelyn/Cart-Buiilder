from django.contrib import admin
from .models import Order, OrderItem, Cart, CartItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ['total_price']
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['buyer__email', 'buyer__first_name', 'buyer__last_name']
    readonly_fields = ['total_amount', 'created_at', 'updated_at']
    inlines = [OrderItemInline]

class CartItemInline(admin.TabularInline):
    model = CartItem
    readonly_fields = ['total_price']
    extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'item_count', 'total_amount', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['total_amount', 'item_count', 'created_at', 'updated_at']
    inlines = [CartItemInline]