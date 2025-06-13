from django.urls import path
from . import views

urlpatterns = [
    # Cart URLs
    path('cart/', views.get_cart, name='get_cart'),
    path('cart/add/', views.add_to_cart, name='add_to_cart'),
    path('cart/item/<int:item_id>/update/', views.update_cart_item, name='update_cart_item'),
    path('cart/item/<int:item_id>/remove/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/clear/', views.clear_cart, name='clear_cart'),
    
    # Order URLs
    path('create/', views.create_order, name='create_order'),
    path('buyer/', views.buyer_orders, name='buyer_orders'),
    path('seller/', views.seller_orders, name='seller_orders'),
    path('<int:pk>/', views.order_detail, name='order_detail'),
    path('<int:pk>/status/', views.update_order_status, name='update_order_status'),
]