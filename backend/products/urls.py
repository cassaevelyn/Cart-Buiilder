from django.urls import path
from . import views

urlpatterns = [
    path('', views.product_list, name='product_list'),
    path('<int:pk>/', views.product_detail, name='product_detail'),
    path('seller/', views.seller_products, name='seller_products'),
    path('create/', views.create_product, name='create_product'),
    path('<int:pk>/update/', views.update_product, name='update_product'),
    path('<int:pk>/delete/', views.delete_product, name='delete_product'),
]